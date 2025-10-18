import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Plus, Search, UserCheck } from 'lucide-react';
import { AddAdherentDialog } from '@/components/adherents/AddAdherentDialog';
import { AdherentsTable } from '@/components/adherents/AdherentsTable';
import { EditAdherentDialog } from '@/components/adherents/EditAdherentDialog';
import { AdherentQRScanner } from '@/components/adherents/AdherentQRScanner';
import { supabase } from '@/integrations/supabase/client';

interface Adherent {
  id_adherent: string;
  nom: string;
  prenom: string;
  sexe: string;
  date_naissance: string;
  adresse: string;
  quartier: string;
  telephone: string;
  email: string;
  fonction_eglise: string;
  date_inscription: string;
  etat_civil: string | null;
  mpandray: boolean;
  faritra: string | null;
  sampana_id: string | null;
}

const Adherents = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingAdherent, setEditingAdherent] = useState<Adherent | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [groupes, setGroupes] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    nouveaux: 0,
    hommes: 0,
    femmes: 0
  });

  useEffect(() => {
    fetchGroupes();
    fetchStats();
  }, [refreshTrigger]);

  const fetchGroupes = async () => {
    try {
      const { data } = await supabase
        .from('groupes')
        .select('*')
        .order('nom_groupe');
      
      setGroupes(data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Total adherents
      const { count: total } = await supabase
        .from('adherents')
        .select('*', { count: 'exact', head: true });

      // New this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const { count: nouveaux } = await supabase
        .from('adherents')
        .select('*', { count: 'exact', head: true })
        .gte('date_inscription', thisMonth.toISOString().split('T')[0]);

      // By gender
      const { count: hommes } = await supabase
        .from('adherents')
        .select('*', { count: 'exact', head: true })
        .eq('sexe', 'M');

      const { count: femmes } = await supabase
        .from('adherents')
        .select('*', { count: 'exact', head: true })
        .eq('sexe', 'F');

      setStats({
        total: total || 0,
        nouveaux: nouveaux || 0,
        hommes: hommes || 0,
        femmes: femmes || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleAdherentAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEditAdherent = (adherent: Adherent) => {
    setEditingAdherent(adherent);
    setEditDialogOpen(true);
  };

  const handleAdherentUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
    setEditDialogOpen(false);
    setEditingAdherent(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Adhérents</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gestion des membres de la paroisse</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <AdherentQRScanner />
          <AddAdherentDialog 
            onAdherentAdded={handleAdherentAdded}
            groupes={groupes}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card className="card-elegant hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Adhérents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Membres enregistrés
            </p>
          </CardContent>
        </Card>

        <Card className="card-elegant hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nouveaux ce mois</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.nouveaux}</div>
            <p className="text-xs text-muted-foreground">
              Nouvelles inscriptions
            </p>
          </CardContent>
        </Card>

        <Card className="card-elegant hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hommes</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hommes}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.hommes / stats.total) * 100) : 0}% du total
            </p>
          </CardContent>
        </Card>

        <Card className="card-elegant hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Femmes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.femmes}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.femmes / stats.total) * 100) : 0}% du total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Adherents Table */}
      <AdherentsTable 
        onEditAdherent={handleEditAdherent}
        refreshTrigger={refreshTrigger}
      />

      {/* Edit Dialog */}
      <EditAdherentDialog
        adherent={editingAdherent}
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingAdherent(null);
        }}
        onAdherentUpdated={handleAdherentUpdated}
        groupes={groupes}
      />
    </div>
  );
};

export default Adherents;