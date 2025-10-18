import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  userId?: string;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  
  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    
    set((state) => ({
      notifications: [newNotification, ...state.notifications]
    }));
    
    // Show toast for immediate feedback
    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.type === 'error' ? 'destructive' : 'default',
    });
  },
  
  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      )
    }));
  },
  
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, read: true }))
    }));
  },
  
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },
  
  clearNotifications: () => {
    set({ notifications: [] });
  },
  
  unreadCount: () => {
    return get().notifications.filter(n => !n.read).length;
  }
}));

// Hook to listen for database changes and create notifications
export const useNotificationListener = () => {
  const { addNotification } = useNotificationStore();
  
  useEffect(() => {
    // Listen for new adherents
    const adherentsChannel = supabase
      .channel('adherents-changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'adherents' 
        }, 
        (payload) => {
          addNotification({
            type: 'success',
            title: 'Nouvel adhérent',
            message: `${payload.new.prenom} ${payload.new.nom} a été ajouté avec succès.`
          });
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'adherents'
        },
        (payload) => {
          addNotification({
            type: 'info',
            title: 'Adhérent modifié',
            message: `Les informations de ${payload.new.prenom} ${payload.new.nom} ont été mises à jour.`
          });
        }
      )
      .on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'adherents'
        },
        () => {
          addNotification({
            type: 'warning',
            title: 'Adhérent supprimé',
            message: 'Un adhérent a été supprimé de la base de données.'
          });
        }
      )
      .subscribe();

    // Listen for new contributions
    const contributionsChannel = supabase
      .channel('contributions-changes')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contributions'
        },
        async (payload) => {
          // Get adherent info
          const { data: adherent } = await supabase
            .from('adherents')
            .select('nom, prenom')
            .eq('id_adherent', payload.new.adherent_id)
            .single();
            
          addNotification({
            type: 'success',
            title: 'Nouvelle contribution',
            message: adherent 
              ? `Contribution de ${payload.new.montant} Ar reçue de ${adherent.prenom} ${adherent.nom}.`
              : `Nouvelle contribution de ${payload.new.montant} Ar enregistrée.`
          });
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'contributions'
        },
        async (payload) => {
          const { data: adherent } = await supabase
            .from('adherents')
            .select('nom, prenom')
            .eq('id_adherent', payload.new.adherent_id)
            .single();
            
          addNotification({
            type: 'info',
            title: 'Contribution modifiée',
            message: adherent 
              ? `Contribution de ${adherent.prenom} ${adherent.nom} modifiée.`
              : `Contribution modifiée.`
          });
        }
      )
      .on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'contributions'
        },
        () => {
          addNotification({
            type: 'warning',
            title: 'Contribution supprimée',
            message: 'Une contribution a été supprimée.'
          });
        }
      )
      .subscribe();

    // Listen for groupes changes
    const groupesChannel = supabase
      .channel('groupes-changes')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'groupes'
        },
        (payload) => {
          addNotification({
            type: 'success',
            title: 'Nouveau groupe',
            message: `Le groupe "${payload.new.nom_groupe}" a été créé.`
          });
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'groupes'
        },
        (payload) => {
          addNotification({
            type: 'info',
            title: 'Groupe modifié',
            message: `Le groupe "${payload.new.nom_groupe}" a été mis à jour.`
          });
        }
      )
      .on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'groupes'
        },
        (payload) => {
          addNotification({
            type: 'warning',
            title: 'Groupe supprimé',
            message: `Le groupe "${payload.old.nom_groupe}" a été supprimé.`
          });
        }
      )
      .subscribe();

    // Listen for system settings changes
    const settingsChannel = supabase
      .channel('settings-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_settings'
        },
        () => {
          addNotification({
            type: 'info',
            title: 'Paramètres système',
            message: 'Les paramètres du système ont été mis à jour.'
          });
        }
      )
      .subscribe();

    // Listen for user roles changes
    const userRolesChannel = supabase
      .channel('user-roles-changes')
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_roles'
        },
        () => {
          addNotification({
            type: 'info',
            title: 'Rôle utilisateur modifié',
            message: 'Un rôle d\'utilisateur a été mis à jour.'
          });
        }
      )
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_roles'
        },
        () => {
          addNotification({
            type: 'success',
            title: 'Nouveau rôle assigné',
            message: 'Un nouveau rôle a été assigné à un utilisateur.'
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(adherentsChannel);
      supabase.removeChannel(contributionsChannel);
      supabase.removeChannel(groupesChannel);
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(userRolesChannel);
    };
  }, [addNotification]);
};