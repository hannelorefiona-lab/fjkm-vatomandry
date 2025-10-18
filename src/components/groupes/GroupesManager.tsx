import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Groupe {
  id_groupe: string;
  nom_groupe: string;
  description: string;
  created_at: string;
  adherent_count?: number;
}

export function GroupesManager() {
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroupe, setEditingGroupe] = useState<Groupe | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchGroupes();
  }, []);

  const fetchGroupes = async () => {
    try {
      setLoading(true);
      
      // Fetch groups with adherent count
      const { data: groupesData, error: groupesError } = await supabase
        .from('groupes')
        .select('*')
        .order('nom_groupe');

      if (groupesError) throw groupesError;

      // Fetch adherent counts for each group
      const groupesWithCounts = await Promise.all(
        (groupesData || []).map(async (groupe) => {
          const { count } = await supabase
            .from('adherents_groupes')
            .select('*', { count: 'exact', head: true })
            .eq('id_groupe', groupe.id_groupe);

          return {
            ...groupe,
            adherent_count: count || 0
          };
        })
      );

      setGroupes(groupesWithCounts);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les groupes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const groupeData = {
        nom_groupe: formData.get('nom_groupe') as string,
        description: formData.get('description') as string || null,
      };

      if (editingGroupe) {
        // Update existing groupe
        const { error } = await supabase
          .from('groupes')
          .update(groupeData)
          .eq('id_groupe', editingGroupe.id_groupe);

        if (error) throw error;

        toast({
          title: "Groupe modifié",
          description: `${groupeData.nom_groupe} a été modifié avec succès.`,
        });
      } else {
        // Create new groupe
        const { error } = await supabase
          .from('groupes')
          .insert(groupeData);

        if (error) throw error;

        toast({
          title: "Groupe créé",
          description: `${groupeData.nom_groupe} a été créé avec succès.`,
        });
      }

      setDialogOpen(false);
      setEditingGroupe(null);
      fetchGroupes();
      if (e.currentTarget) {
        e.currentTarget.reset();
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const deleteGroupe = async (groupe: Groupe) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le groupe "${groupe.nom_groupe}" ? Cette action supprimera aussi toutes les associations avec les adhérents.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('groupes')
        .delete()
        .eq('id_groupe', groupe.id_groupe);

      if (error) throw error;

      toast({
        title: "Groupe supprimé",
        description: `${groupe.nom_groupe} a été supprimé avec succès.`,
      });

      fetchGroupes();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le groupe.",
        variant: "destructive",
      });
    }
  };

  const openDialog = (groupe?: Groupe) => {
    setEditingGroupe(groupe || null);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Gestion des Groupes</h2>
          <p className="text-muted-foreground">Gérez les groupes paroissiaux et leurs membres</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()} className="bg-gradient-primary hover:shadow-glow">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Groupe
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingGroupe ? 'Modifier le groupe' : 'Créer un nouveau groupe'}
              </DialogTitle>
              <DialogDescription>
                Remplissez les informations du groupe paroissial.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom_groupe">Nom du groupe *</Label>
                <Input
                  id="nom_groupe"
                  name="nom_groupe"
                  defaultValue={editingGroupe?.nom_groupe}
                  required
                  className="transition-smooth"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingGroupe?.description}
                  rows={3}
                  className="transition-smooth"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={formLoading} className="bg-gradient-primary">
                  {formLoading ? 'Enregistrement...' : (editingGroupe ? 'Modifier' : 'Créer')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groupes.map((groupe) => (
          <Card key={groupe.id_groupe} className="card-elegant hover-scale">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{groupe.nom_groupe}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDialog(groupe)}
                    className="hover-scale"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteGroupe(groupe)}
                    className="hover-scale text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {groupe.description && (
                <CardDescription className="text-sm line-clamp-2">
                  {groupe.description}
                </CardDescription>
              )}
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Membres</span>
                </div>
                <Badge variant="secondary" className="font-mono">
                  {groupe.adherent_count}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {groupes.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="mx-auto h-12 w-12 mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Aucun groupe créé</h3>
            <p className="text-muted-foreground mb-4">
              Commencez par créer votre premier groupe paroissial.
            </p>
            <Button onClick={() => openDialog()} className="bg-gradient-primary">
              <Plus className="mr-2 h-4 w-4" />
              Créer le premier groupe
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}