import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp, Activity, Calendar, UserCheck } from "lucide-react";

interface Stats {
  totalAdherents: number;
  nouveauxMembres: number;
  groupesActifs: number;
  mpandrayTotal: number;
  repartitionGenre: { name: string; value: number }[];
  repartitionEtatCivil: { name: string; value: number }[];
  repartitionFaritra: { name: string; value: number }[];
  quartierStats: { quartier: string; count: number }[];
  sampanaStats: { sampana: string; count: number }[];
  monthlyStats: { month: string; count: number }[];
}

export default function Statistiques() {
  const [stats, setStats] = useState<Stats>({
    totalAdherents: 0,
    nouveauxMembres: 0,
    groupesActifs: 0,
    mpandrayTotal: 0,
    repartitionGenre: [],
    repartitionEtatCivil: [],
    repartitionFaritra: [],
    quartierStats: [],
    sampanaStats: [],
    monthlyStats: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      // Total adhérents
      const { count: totalAdherents } = await supabase
        .from('adherents')
        .select('*', { count: 'exact', head: true });

      // Nouveaux membres ce mois
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const { count: nouveauxMembres } = await supabase
        .from('adherents')
        .select('*', { count: 'exact', head: true })
        .gte('date_inscription', startOfMonth.toISOString().split('T')[0]);

      // Groupes actifs
      const { count: groupesActifs } = await supabase
        .from('groupes')
        .select('*', { count: 'exact', head: true });

      // Total Mpandray
      const { count: mpandrayTotal } = await supabase
        .from('adherents')
        .select('*', { count: 'exact', head: true })
        .eq('mpandray', true);

      // Répartition par genre
      const { data: genreData } = await supabase
        .from('adherents')
        .select('sexe');

      const repartitionGenre = [
        { name: 'Hommes', value: genreData?.filter(a => a.sexe === 'M').length || 0 },
        { name: 'Femmes', value: genreData?.filter(a => a.sexe === 'F').length || 0 }
      ];

      // Répartition par état civil
      const { data: etatCivilData } = await supabase
        .from('adherents')
        .select('etat_civil');

      const etatCivilCounts: { [key: string]: number } = {};
      etatCivilData?.forEach(item => {
        if (item.etat_civil) {
          etatCivilCounts[item.etat_civil] = (etatCivilCounts[item.etat_civil] || 0) + 1;
        }
      });

      const repartitionEtatCivil = Object.entries(etatCivilCounts)
        .map(([etat, count]) => ({ 
          name: etat === 'marie' ? 'Marié(e)' : etat === 'celibataire' ? 'Célibataire' : 'Veuf/Veuve', 
          value: count 
        }));

      // Répartition par faritra
      const { data: faritarData } = await supabase
        .from('adherents')
        .select('faritra');

      const faritarCounts: { [key: string]: number } = {};
      faritarData?.forEach(item => {
        if (item.faritra) {
          faritarCounts[item.faritra] = (faritarCounts[item.faritra] || 0) + 1;
        }
      });

      const repartitionFaritra = Object.entries(faritarCounts)
        .map(([faritra, count]) => ({ 
          name: faritra.charAt(0).toUpperCase() + faritra.slice(1), 
          value: count 
        }));

      // Statistiques par sampana
      const { data: sampanaData } = await supabase
        .from('adherents')
        .select(`
          sampana (nom_sampana)
        `);

      const sampanaCounts: { [key: string]: number } = {};
      sampanaData?.forEach(item => {
        if (item.sampana?.nom_sampana) {
          sampanaCounts[item.sampana.nom_sampana] = (sampanaCounts[item.sampana.nom_sampana] || 0) + 1;
        }
      });

      const sampanaStats = Object.entries(sampanaCounts)
        .map(([sampana, count]) => ({ sampana, count }))
        .sort((a, b) => b.count - a.count);

      // Statistiques par quartier
      const { data: quartierData } = await supabase
        .from('adherents')
        .select('quartier');

      const quartierCounts: { [key: string]: number } = {};
      quartierData?.forEach(item => {
        if (item.quartier) {
          quartierCounts[item.quartier] = (quartierCounts[item.quartier] || 0) + 1;
        }
      });

      const quartierStats = Object.entries(quartierCounts)
        .map(([quartier, count]) => ({ quartier, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Statistiques mensuelles
      const { data: monthlyData } = await supabase
        .from('adherents')
        .select('date_inscription');

      const monthlyCounts: { [key: string]: number } = {};
      monthlyData?.forEach(item => {
        if (item.date_inscription) {
          const monthKey = new Date(item.date_inscription).toLocaleDateString('fr-FR', { 
            year: 'numeric', 
            month: 'short' 
          });
          monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
        }
      });

      const monthlyStats = Object.entries(monthlyCounts)
        .map(([month, count]) => ({ month, count }))
        .slice(-12);

      setStats({
        totalAdherents: totalAdherents || 0,
        nouveauxMembres: nouveauxMembres || 0,
        groupesActifs: groupesActifs || 0,
        mpandrayTotal: mpandrayTotal || 0,
        repartitionGenre,
        repartitionEtatCivil,
        repartitionFaritra,
        quartierStats,
        sampanaStats,
        monthlyStats
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Statistiques</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Analyse des données de l'église et de ses membres.
        </p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Adhérents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAdherents}</div>
            <p className="text-xs text-muted-foreground">
              Membres inscrits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nouveaux ce mois</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.nouveauxMembres}</div>
            <p className="text-xs text-muted-foreground">
              Inscriptions récentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Groupes Actifs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.groupesActifs}</div>
            <p className="text-xs text-muted-foreground">
              Groupes créés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mpandray</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.mpandrayTotal}
            </div>
            <p className="text-xs text-muted-foreground">
              Membres Mpandray
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Répartition par genre */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par genre</CardTitle>
            <CardDescription>
              Distribution hommes/femmes des adhérents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.repartitionGenre}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.repartitionGenre.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top quartiers */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par quartier</CardTitle>
            <CardDescription>
              Top 10 des quartiers avec le plus d'adhérents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.quartierStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="quartier" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Évolution mensuelle */}
      {stats.monthlyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Évolution des inscriptions</CardTitle>
            <CardDescription>
              Nombre d'inscriptions par mois sur les 12 derniers mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}