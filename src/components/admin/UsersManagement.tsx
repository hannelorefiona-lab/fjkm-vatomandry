import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Users, Shield, Trash2, Edit, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  created_at: string;
  role: 'ADMIN' | 'RESPONSABLE' | 'MEMBRE' | 'SECRETAIRE' | 'TRESORIER';
  email?: string;
}

export function UsersManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Récupérer les profils d'abord
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, username, created_at');

      if (profilesError) throw profilesError;

      // Récupérer les rôles séparément
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combiner les données
      const rolesMap = new Map(rolesData?.map(r => [r.user_id, r.role]) || []);
      
      const formattedUsers: UserProfile[] = profilesData?.map(user => ({
        ...user,
        role: (rolesMap.get(user.user_id) || 'MEMBRE') as UserProfile['role']
      })) || [];

      setUsers(formattedUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Erreur",
        description: `Impossible de charger les utilisateurs: ${error.message || 'Erreur inconnue'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserProfile['role']) => {
    try {
      setUpdatingRole(userId);
      
      // Vérifier si le rôle existe déjà
      const { data: existingRole, error: checkError } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) throw checkError;

      let error;
      if (existingRole) {
        // Mettre à jour le rôle existant
        ({ error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId));
      } else {
        // Créer un nouveau rôle
        ({ error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole }));
      }

      if (error) throw error;

      toast({
        title: "Rôle mis à jour",
        description: `Le rôle a été changé vers ${newRole}.`,
      });

      // Mettre à jour l'état local au lieu de refetch complet
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.user_id === userId ? { ...user, role: newRole } : user
        )
      );
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: "Erreur",
        description: `Impossible de mettre à jour le rôle: ${error.message || 'Erreur inconnue'}`,
        variant: "destructive",
      });
    } finally {
      setUpdatingRole(null);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'destructive';
      case 'RESPONSABLE':
        return 'default';
      case 'SECRETAIRE':
        return 'outline';
      case 'TRESORIER':
        return 'outline';
      case 'MEMBRE':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestion des utilisateurs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-3 md:p-6">
        <CardTitle className="flex items-center gap-2 text-base md:text-xl">
          <Users className="h-4 w-4 md:h-5 md:w-5" />
          <span className="hidden sm:inline">Gestion des utilisateurs</span>
          <span className="sm:hidden">Utilisateurs</span>
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          <span className="hidden sm:inline">Gérez les comptes utilisateurs et leurs rôles. Total: {users.length} utilisateurs</span>
          <span className="sm:hidden">{users.length} utilisateurs</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 md:p-6">
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs md:text-sm">Utilisateur</TableHead>
                <TableHead className="hidden sm:table-cell text-xs md:text-sm">Rôle</TableHead>
                <TableHead className="hidden md:table-cell text-xs md:text-sm">Date</TableHead>
                <TableHead className="text-xs md:text-sm">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="text-xs md:text-sm">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs md:text-sm font-medium text-primary">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{user.username}</div>
                        <div className="text-[10px] md:text-xs text-muted-foreground sm:hidden">
                          <Badge variant={getRoleBadgeVariant(user.role)} className="text-[10px] px-1.5 py-0">
                            {user.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs md:text-sm">
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select
                        value={user.role}
                        onValueChange={(value: string) => updateUserRole(user.user_id, value as UserProfile['role'])}
                        disabled={updatingRole === user.user_id}
                      >
                        <SelectTrigger className="w-24 md:w-32 text-xs md:text-sm h-8 md:h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MEMBRE" className="text-xs md:text-sm">MEMBRE</SelectItem>
                          <SelectItem value="SECRETAIRE" className="text-xs md:text-sm">SECRÉT.</SelectItem>
                          <SelectItem value="TRESORIER" className="text-xs md:text-sm">TRÉS.</SelectItem>
                          <SelectItem value="RESPONSABLE" className="text-xs md:text-sm">RESP.</SelectItem>
                          <SelectItem value="ADMIN" className="text-xs md:text-sm">ADMIN</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}