/**
 * Hook personnalisé pour la gestion de l'authentification et des rôles utilisateurs
 * Fournit l'accès aux informations de l'utilisateur connecté et aux fonctions d'authentification
 */
import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Type définissant le contexte d'authentification
 * @property {User | null} user - Utilisateur connecté
 * @property {Session | null} session - Session active
 * @property {string | null} userRole - Rôle de l'utilisateur (ADMIN, RESPONSABLE, MEMBRE, etc.)
 * @property {boolean} loading - État de chargement
 * @property {Function} signIn - Fonction de connexion
 * @property {Function} signUp - Fonction d'inscription
 * @property {Function} signOut - Fonction de déconnexion
 * @property {boolean} isAdmin - Vérifie si l'utilisateur est admin
 * @property {boolean} isResponsable - Vérifie si l'utilisateur est responsable
 * @property {Function} hasRole - Vérifie si l'utilisateur a un rôle spécifique
 * @property {Function} canManageFinances - Vérifie les permissions de gestion financière
 * @property {Function} canManageAdherents - Vérifie les permissions de gestion des adhérents
 * @property {Function} canViewFinances - Vérifie les permissions de visualisation financière
 * @property {Function} canManageUsers - Vérifie les permissions de gestion des utilisateurs
 */
interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isResponsable: boolean;
  hasRole: (role: string | string[]) => boolean;
  canManageFinances: () => boolean;
  canManageAdherents: () => boolean;
  canViewFinances: () => boolean;
  canManageUsers: () => boolean;
}

/** Contexte React pour l'authentification */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider d'authentification pour l'application
 * Gère l'état de l'utilisateur, la session et les permissions
 * @param {Object} props - Props du composant
 * @param {ReactNode} props.children - Composants enfants
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const isAdmin = userRole === 'ADMIN';
  const isResponsable = userRole === 'RESPONSABLE';

  const hasRole = (role: string | string[]) => {
    if (Array.isArray(role)) {
      return role.includes(userRole || '');
    }
    return userRole === role;
  };

  const canManageFinances = () => {
    return hasRole(['ADMIN', 'TRESORIER']);
  };

  const canManageAdherents = () => {
    return hasRole(['ADMIN', 'RESPONSABLE', 'SECRETAIRE']);
  };

  const canViewFinances = () => {
    return hasRole(['ADMIN', 'TRESORIER', 'RESPONSABLE']);
  };

  const canManageUsers = () => {
    return hasRole('ADMIN');
  };

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch user role when session changes
        if (session?.user) {
          // Use setTimeout to prevent potential deadlock
          setTimeout(() => {
            if (mounted) {
              fetchUserRole(session.user.id);
            }
          }, 0);
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserRole(session.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Récupère le rôle de l'utilisateur depuis la base de données
   * @param {string} userId - ID de l'utilisateur
   */
  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      
      // Le rôle est créé automatiquement par le trigger handle_new_user
      // Si aucun rôle n'est trouvé, utiliser MEMBRE par défaut
      if (!data) {
        console.warn('No role found for user:', userId);
        setUserRole('MEMBRE');
      } else {
        setUserRole(data.role);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('MEMBRE'); // Default role
    }
  };

  /**
   * Connecte un utilisateur avec email et mot de passe
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe
   * @returns {Promise<{error?: any}>} Résultat de la connexion
   */
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur de connexion",
          description: error.message,
        });
        return { error };
      }

      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté.",
      });

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  /**
   * Inscrit un nouvel utilisateur
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe
   * @param {string} username - Nom d'utilisateur
   * @returns {Promise<{error?: any}>} Résultat de l'inscription
   */
  const signUp = async (email: string, password: string, username: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: username,
          }
        }
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur d'inscription",
          description: error.message,
        });
        return { error };
      }

      toast({
        title: "Inscription réussie",
        description: "Veuillez vérifier votre email pour confirmer votre compte.",
      });

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  /**
   * Déconnecte l'utilisateur actuel
   */
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      toast({
        title: "Déconnexion",
        description: "Vous avez été déconnecté avec succès.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors de la déconnexion.",
      });
    }
  };

  const value: AuthContextType = {
    user,
    session,
    userRole,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    isResponsable,
    hasRole,
    canManageFinances,
    canManageAdherents,
    canViewFinances,
    canManageUsers,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook pour accéder au contexte d'authentification
 * @throws {Error} Si utilisé en dehors d'un AuthProvider
 * @returns {AuthContextType} Contexte d'authentification
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}