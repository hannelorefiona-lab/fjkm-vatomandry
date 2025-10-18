/**
 * Composant de protection des routes administrateur
 * Vérifie les permissions avant d'autoriser l'accès aux pages admin
 */
import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Props du composant AdminRoute
 * @property {ReactNode} children - Contenu protégé à afficher si autorisé
 */
interface AdminRouteProps {
  children: ReactNode;
}

/**
 * Route protégée pour les administrateurs
 * Redirige vers la page d'authentification si non connecté
 * Affiche un message d'erreur si non autorisé
 * @param {AdminRouteProps} props - Props du composant
 * @returns {JSX.Element} Contenu protégé ou message d'erreur
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center text-center p-6">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Accès refusé</h2>
            <p className="text-muted-foreground mb-4">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
              Seuls les administrateurs peuvent accéder au panneau d'administration.
            </p>
            <button 
              onClick={() => window.history.back()}
              className="text-primary hover:text-primary/80 underline"
            >
              Retour à la page précédente
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}