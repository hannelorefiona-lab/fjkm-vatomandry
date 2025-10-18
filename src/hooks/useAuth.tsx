import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      
      // Si aucun rôle n'est trouvé, créer un rôle par défaut
      if (!data) {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'MEMBRE' });
        
        if (insertError) {
          console.error('Error creating default role:', insertError);
        }
        setUserRole('MEMBRE');
      } else {
        setUserRole(data.role);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('MEMBRE'); // Default role
    }
  };

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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}