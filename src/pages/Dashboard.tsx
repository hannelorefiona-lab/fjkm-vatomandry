/**
 * Tableau de bord principal de l'application
 * Affiche les statistiques générales et la vue d'ensemble de la paroisse
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, Calendar, Activity, MapPin, UserCheck } from 'lucide-react';
import { GroupesManager } from '@/components/groupes/GroupesManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Composant du tableau de bord
 * Affiche les statistiques, graphiques et activités récentes
 * @returns {JSX.Element} Page du tableau de bord
 */
const Dashboard = () => {
  const [stats, setStats] = useState({
    totalAdherents: 0,
    nouveauxCeMois: 0,
    groupesActifs: 0,
    hommes: 0,
    femmes: 0
  });
  const [quartierStats, setQuartierStats] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  /**
   * Récupère toutes les données nécessaires au tableau de bord
   * (statistiques, quartiers, activités récentes)
   */
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Total adherents
      const { count: totalAdherents } = await supabase
        .from('adherents')
        .select('*', { count: 'exact', head: true });

      // New this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const { count: nouveauxCeMois } = await supabase
        .from('adherents')
        .select('*', { count: 'exact', head: true })
        .gte('date_inscription', thisMonth.toISOString().split('T')[0]);

      // Active groups
      const { count: groupesActifs } = await supabase
        .from('groupes')
        .select('*', { count: 'exact', head: true });

      // By gender
      const { count: hommes } = await supabase
        .from('adherents')
        .select('*', { count: 'exact', head: true })
        .eq('sexe', 'M');

      const { count: femmes } = await supabase
        .from('adherents')
        .select('*', { count: 'exact', head: true })
        .eq('sexe', 'F');

      // Quartier statistics
      const { data: quartierData } = await supabase
        .from('adherents')
        .select('quartier')
        .not('quartier', 'is', null);

      const quartierCounts = quartierData?.reduce((acc: any, curr: any) => {
        acc[curr.quartier] = (acc[curr.quartier] || 0) + 1;
        return acc;
      }, {});

      const topQuartiers = Object.entries(quartierCounts || {})
        .sort(([,a]: any, [,b]: any) => b - a)
        .slice(0, 5)
        .map(([quartier, count]) => ({ quartier, count }));

      // Recent adherents for activity feed
      const { data: recentAdherents } = await supabase
        .from('adherents')
        .select('nom, prenom, date_inscription')
        .order('date_inscription', { ascending: false })
        .limit(3);

      setStats({
        totalAdherents: totalAdherents || 0,
        nouveauxCeMois: nouveauxCeMois || 0,
        groupesActifs: groupesActifs || 0,
        hommes: hommes || 0,
        femmes: femmes || 0
      });

      setQuartierStats(topQuartiers);
      setRecentActivities(recentAdherents || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calcule le pourcentage d'une valeur par rapport au total
   * @param {number} value - Valeur à calculer
   * @param {number} total - Total de référence
   * @returns {number} Pourcentage arrondi
   */
  const calculatePercentage = (value: number, total: number) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Tableau de Bord</h1>
        <p className="text-sm md:text-base text-muted-foreground">Vue d'ensemble de la paroisse FJKM Vatomandry</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card className="card-elegant hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Adhérents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAdherents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Membres enregistrés
            </p>
          </CardContent>
        </Card>

        <Card className="card-elegant hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nouveaux Membres</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.nouveauxCeMois}</div>
            <p className="text-xs text-muted-foreground">
              Ce mois-ci
            </p>
          </CardContent>
        </Card>

        <Card className="card-elegant hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Groupes Actifs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.groupesActifs}</div>
            <p className="text-xs text-muted-foreground">
              Ministères en activité
            </p>
          </CardContent>
        </Card>

        <Card className="card-elegant hover-scale">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Participation</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">
              Activités mensuelles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-4">
            <span className="hidden sm:inline">Vue d'ensemble</span>
            <span className="sm:hidden">Vue</span>
          </TabsTrigger>
          <TabsTrigger value="statistics" className="text-xs sm:text-sm px-2 sm:px-4">
            <span className="hidden sm:inline">Statistiques</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className="text-xs sm:text-sm px-2 sm:px-4">
            <span className="hidden sm:inline">Gestion des Groupes</span>
            <span className="sm:hidden">Groupes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>Activités Récentes</CardTitle>
                <CardDescription>
                  Dernières inscriptions dans le système
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="animate-pulse space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-4 bg-muted rounded"></div>
                    ))}
                  </div>
                ) : recentActivities.length > 0 ? (
                  recentActivities.map((adherent: any, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Nouvel adhérent ajouté</p>
                        <p className="text-xs text-muted-foreground">
                          {adherent.prenom} {adherent.nom} - {format(new Date(adherent.date_inscription), 'dd MMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune activité récente</p>
                )}
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>Répartition par Sexe</CardTitle>
                <CardDescription>
                  Distribution des adhérents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Femmes
                    </span>
                    <span className="font-mono text-sm">
                      {stats.femmes} ({calculatePercentage(stats.femmes, stats.totalAdherents)}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-gradient-primary h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${calculatePercentage(stats.femmes, stats.totalAdherents)}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Hommes
                    </span>
                    <span className="font-mono text-sm">
                      {stats.hommes} ({calculatePercentage(stats.hommes, stats.totalAdherents)}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-accent h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${calculatePercentage(stats.hommes, stats.totalAdherents)}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>Top 5 Quartiers</CardTitle>
                <CardDescription>
                  Quartiers avec le plus d'adhérents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quartierStats.map((quartier: any, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {quartier.quartier}
                      </span>
                      <span className="font-mono text-sm font-medium">
                        {quartier.count}
                      </span>
                    </div>
                  ))}
                  {quartierStats.length === 0 && (
                    <p className="text-sm text-muted-foreground">Aucune donnée de quartier disponible</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="card-elegant">
              <CardHeader>
                <CardTitle>Statistiques Mensuelles</CardTitle>
                <CardDescription>
                  Évolution des inscriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{stats.nouveauxCeMois}</div>
                    <p className="text-sm text-muted-foreground">nouvelles inscriptions ce mois</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold">{Math.round(stats.nouveauxCeMois / 30 * 7)}</div>
                      <p className="text-xs text-muted-foreground">cette semaine</p>
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{Math.round(stats.nouveauxCeMois / 30)}</div>
                      <p className="text-xs text-muted-foreground">par jour</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="groups">
          <GroupesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;