import { AuthForm } from '@/components/auth-form';
import { APP_NAME } from '@/lib/branding';

export const metadata = {
  title: `Connexion - ${APP_NAME}`,
  description: `Connectez-vous a votre compte ${APP_NAME}`,
};

export default function AuthPage() {
  return <AuthForm />;
}
