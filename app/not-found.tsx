import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mb-8">
          <p className="text-7xl font-bold text-primary mb-2">404</p>
          <h1 className="text-3xl font-bold text-foreground">Page introuvable</h1>
        </div>

        <p className="text-muted-foreground mb-8">
          La page demandée n'existe pas ou a été déplacée.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/" className="flex-1">
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              <Home className="w-4 h-4" />
              Accueil
            </Button>
          </Link>
          <Button variant="outline" className="flex-1 border-border gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
        </div>
      </div>
    </div>
  );
}
