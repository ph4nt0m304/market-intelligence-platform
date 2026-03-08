'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-2">Une erreur est survenue</h1>
        <p className="text-muted-foreground mb-8">
          Une erreur s'est produite lors du chargement de cette page. Réessayez ou revenez à l'accueil.
        </p>

        {error.message && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-8 text-left">
            <p className="text-sm font-mono text-destructive">{error.message}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={reset}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Réessayer
          </Button>
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full border-border">
              <Home className="w-4 h-4 mr-2" />
              Accueil
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
