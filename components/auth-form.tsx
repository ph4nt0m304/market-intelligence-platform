'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { APP_NAME } from '@/lib/branding';
import { Lock, Phone, CheckCircle, MessageSquare, ArrowLeft, TrendingUp } from 'lucide-react';

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

  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!phoneNumber) {
        setError('Veuillez entrer votre numero de telephone');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/auth/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Erreur lors de l\'envoi du SMS');
        setIsLoading(false);
        return;
      }

      setSmsSent(true);
      setStep('pin');
    } catch {
      setError('Erreur de connexion. Verifiez votre connexion internet.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!pin) {
        setError('Veuillez entrer le code PIN recu par SMS');
        setIsLoading(false);
        return;
      }

      // First verify the SMS code
      const verifyResponse = await fetch('/api/auth/sms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, code: pin }),
      });

      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok || !verifyData.success) {
        setError(verifyData.error || 'Code de verification invalide');
        setIsLoading(false);
        return;
      }

      // Code verified - create session
      const sessionResponse = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          sessionId: `session_${Date.now()}`,
          accessToken: `token_${Math.random().toString(36).substr(2, 9)}`,
        }),
      });

      const sessionData = await sessionResponse.json();

      if (!sessionResponse.ok) {
        setError(sessionData.error || 'Erreur lors de la creation de session');
        setIsLoading(false);
        return;
      }

      // Store session locally
      localStorage.setItem('tradeSession', JSON.stringify({
        phoneNumber,
        timestamp: new Date().toISOString(),
      }));

      router.push('/dashboard');
    } catch {
      setError('Erreur de connexion. Verifiez votre connexion internet.');
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
        </div>
      </Card>
    </div>
  );
}

