'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { APP_NAME } from '@/lib/branding';
import { Lock, Phone, CheckCircle, MessageSquare, ArrowLeft, TrendingUp, Bug, Copy, Check, AlertTriangle, Info } from 'lucide-react';

export function AuthForm() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingSession, setExistingSession] = useState<{ phone: string; lastUsed: string } | null>(null);
  const [step, setStep] = useState<'phone' | 'pin'>('phone');
  const [smsSent, setSmsSent] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{ code?: string; logs: string[] }>({ logs: [] });
  const [showDebug, setShowDebug] = useState(false);

  // Mark component as mounted to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    loadExistingSession();
  }, []);

  const loadExistingSession = async () => {
    try {
      // Get stored session from localStorage
      const stored = localStorage.getItem('tradeSession');
      if (stored) {
        const session = JSON.parse(stored);
        const storedPhone = session.phoneNumber;
        
        setPhoneNumber(storedPhone);
        // Use ISO date format to avoid locale-dependent hydration mismatch
        const date = new Date(session.timestamp);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        
        setExistingSession({
          phone: storedPhone,
          lastUsed: formattedDate,
        });

        // Check backend for persistent session using stored phone
        if (storedPhone) {
          const params = new URLSearchParams({ phone: storedPhone });
          await fetch(`/api/auth/session?${params}`);
          // Session exists on backend, no additional action needed
          // The existingSession state is already set from localStorage
        }
      }
    } catch (error) {
      console.error('[AuthForm] Failed to load session:', error);
    }
  };

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => ({
      ...prev,
      logs: [...prev.logs.slice(-19), `[${timestamp}] ${message}`]
    }));
  };

  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    addDebugLog(`Tentative d'envoi SMS vers: ${phoneNumber}`);

    try {
      if (!phoneNumber) {
        const err = 'Veuillez entrer votre numero de telephone';
        setError(err);
        addDebugLog(`ERREUR: ${err}`);
        setIsLoading(false);
        return;
      }

      addDebugLog('Appel API: POST /api/auth/sms');
      const response = await fetch('/api/auth/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      addDebugLog(`Reponse API: Status ${response.status}`);
      const data = await response.json();
      addDebugLog(`Donnees: ${JSON.stringify(data)}`);

      if (!response.ok || !data.success) {
        const errMsg = data.error || 'Erreur lors de l\'envoi du SMS';
        setError(errMsg);
        addDebugLog(`ERREUR: ${errMsg}`);
        setIsLoading(false);
        return;
      }

      // Store debug code if available
      if (data.debugCode) {
        setDebugInfo(prev => ({ ...prev, code: data.debugCode }));
        addDebugLog(`CODE DEBUG RECU: ${data.debugCode}`);
      } else {
        addDebugLog('Aucun code debug retourne (production mode ou SMS reel envoye)');
      }

      setSmsSent(true);
      setStep('pin');
      addDebugLog('SMS envoye avec succes, passage a l\'etape PIN');
    } catch (err) {
      const errMsg = 'Erreur de connexion. Verifiez votre connexion internet.';
      setError(errMsg);
      addDebugLog(`ERREUR RESEAU: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    addDebugLog(`Tentative de verification du code: ${pin}`);

    try {
      if (!pin) {
        const err = 'Veuillez entrer le code PIN recu par SMS';
        setError(err);
        addDebugLog(`ERREUR: ${err}`);
        setIsLoading(false);
        return;
      }

      // First verify the SMS code
      addDebugLog('Appel API: PUT /api/auth/sms (verification)');
      const verifyResponse = await fetch('/api/auth/sms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, code: pin }),
      });

      addDebugLog(`Reponse verification: Status ${verifyResponse.status}`);
      const verifyData = await verifyResponse.json();
      addDebugLog(`Donnees verification: ${JSON.stringify(verifyData)}`);

      if (!verifyResponse.ok || !verifyData.success) {
        const errMsg = verifyData.error || 'Code de verification invalide';
        setError(errMsg);
        addDebugLog(`ERREUR VERIFICATION: ${errMsg}`);
        setIsLoading(false);
        return;
      }

      addDebugLog('Code verifie avec succes!');

      // Code verified - create session
      addDebugLog('Creation de la session...');
      const sessionResponse = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          sessionId: `session_${Date.now()}`,
          accessToken: `token_${Math.random().toString(36).substr(2, 9)}`,
        }),
      });

      addDebugLog(`Reponse session: Status ${sessionResponse.status}`);
      const sessionData = await sessionResponse.json();
      addDebugLog(`Donnees session: ${JSON.stringify(sessionData)}`);

      if (!sessionResponse.ok) {
        const errMsg = sessionData.error || 'Erreur lors de la creation de session';
        setError(errMsg);
        addDebugLog(`ERREUR SESSION: ${errMsg}`);
        setIsLoading(false);
        return;
      }

      // Store session locally
      localStorage.setItem('tradeSession', JSON.stringify({
        phoneNumber,
        timestamp: new Date().toISOString(),
      }));

      addDebugLog('Session creee, redirection vers dashboard...');
      router.push('/dashboard');
    } catch (err) {
      const errMsg = 'Erreur de connexion. Verifiez votre connexion internet.';
      setError(errMsg);
      addDebugLog(`ERREUR RESEAU: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipTradeRepublic = () => {
    // Allow access to Binance data without Trade Republic connection
    localStorage.setItem('tradeSession', JSON.stringify({
      phoneNumber: 'guest',
      timestamp: new Date().toISOString(),
      guestMode: true,
    }));
    router.push('/dashboard');
  };

  const handleResumeSession = async () => {
    if (!existingSession?.phone) return;
    
    setIsLoading(true);
    try {
      // Verify session is still valid
      const params = new URLSearchParams({ phone: existingSession.phone });
      const response = await fetch(`/api/auth/session?${params}`);
      
      if (response.ok) {
        router.push('/dashboard');
      } else {
        setError('Session expiree. Veuillez vous reconnecter.');
        setExistingSession(null);
        localStorage.removeItem('tradeSession');
      }
    } catch {
      setError('Impossible de reprendre la session.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <Card className="w-full max-w-md">
        <div className="p-8 space-y-6">
          <div className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Lock className="w-6 h-6 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">{APP_NAME}</h1>
            <p className="text-sm text-muted-foreground">
              Connectez-vous a votre compte
            </p>
          </div>

          {step === 'phone' ? (
            <form onSubmit={handleSendSms} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Numero de telephone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="+49 123 456789"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isLoading || !phoneNumber}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                {isLoading ? 'Envoi en cours...' : 'Envoyer un SMS'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {smsSent && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm text-primary">
                    Un SMS a ete envoye au {phoneNumber}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Numero de telephone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    value={phoneNumber}
                    className="pl-10 bg-muted"
                    disabled={true}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Code PIN</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Entrez le code recu par SMS"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isLoading || !pin}
              >
                {isLoading ? 'Connexion en cours...' : 'Se connecter'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep('phone');
                  setPin('');
                  setError('');
                  setSmsSent(false);
                }}
                disabled={isLoading}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Modifier le numero
              </Button>
            </form>
          )}

          {isMounted && existingSession && step === 'phone' && (
            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Session trouvee</p>
                  <p className="text-xs text-muted-foreground">
                    {existingSession.phone} - Utilisee le {existingSession.lastUsed}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleResumeSession}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                Reprendre la session (sans SMS)
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Ou entrez un autre numero ci-dessus
              </p>
            </div>
          )}

          {step === 'phone' && (
            <div className="pt-4 border-t border-border space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleSkipTradeRepublic}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Continuer sans Trade Republic
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Acces aux donnees Binance uniquement (XAU, XAG, EUR)
              </p>
            </div>
          )}

          {/* Debug Toggle */}
          <div className="pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground hover:text-foreground"
              onClick={() => setShowDebug(!showDebug)}
            >
              <Bug className="w-4 h-4 mr-2" />
              {showDebug ? 'Masquer' : 'Afficher'} les logs de debug
            </Button>
          </div>
        </div>
      </Card>

      {/* Debug Panel */}
      {showDebug && (
        <Card className="w-full max-w-md mt-4 overflow-hidden">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Bug className="w-4 h-4" />
                Console Debug SMS
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDebugInfo({ logs: [] })}
              >
                Effacer
              </Button>
            </div>

            {/* Warning about demo mode */}
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-medium text-amber-500">Mode Demo</p>
                  <p className="text-muted-foreground mt-1">
                    Aucun SMS reel n'est envoye. Le systeme genere un code aleatoire 
                    stocke en memoire serveur. En production, integrez Twilio ou l'API Trade Republic.
                  </p>
                </div>
              </div>
            </div>

            {/* Debug code display */}
            {debugInfo.code && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-muted-foreground">Code de test:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-lg font-mono font-bold text-emerald-500">
                      {debugInfo.code}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        navigator.clipboard.writeText(debugInfo.code || '');
                        addDebugLog('Code copie dans le presse-papier');
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Utilisez ce code pour vous connecter (mode demo uniquement)
                </p>
              </div>
            )}

            {/* Logs */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Logs ({debugInfo.logs.length})</p>
              <div className="bg-surface-1 rounded-lg p-3 max-h-48 overflow-y-auto font-mono text-xs space-y-1">
                {debugInfo.logs.length === 0 ? (
                  <p className="text-muted-foreground italic">Aucun log. Entrez un numero et cliquez sur "Envoyer un SMS".</p>
                ) : (
                  debugInfo.logs.map((log, i) => (
                    <div 
                      key={i} 
                      className={`${
                        log.includes('ERREUR') 
                          ? 'text-red-400' 
                          : log.includes('CODE DEBUG') 
                            ? 'text-emerald-400 font-bold' 
                            : log.includes('succes')
                              ? 'text-emerald-400'
                              : 'text-muted-foreground'
                      }`}
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* API Info */}
            <div className="p-3 rounded-lg bg-muted/50 text-xs space-y-2">
              <p className="font-medium">Endpoints API:</p>
              <div className="space-y-1 text-muted-foreground font-mono">
                <p>POST /api/auth/sms - Envoyer code</p>
                <p>PUT /api/auth/sms - Verifier code</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

