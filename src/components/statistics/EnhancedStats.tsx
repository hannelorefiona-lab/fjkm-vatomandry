import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  Activity, 
  MapPin, 
  UserCheck,
  DollarSign,
  Target,
  BarChart3,
  PieChart
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface StatsData {
  totalAdherents: number;
  nouveauxCeMois: number;
  groupesActifs: number;
  hommes: number;
  femmes: number;
  totalContributions: number;
  contributionsMois: number;
  moyenneContribution: number;
  tauxParticipation: number;
  topQuartiers: Array<{
    quartier: string;
    count: number;
    percentage: number;
  }>;
  croissanceMensuelle: number;
  objectifMensuel: number;
}

export function EnhancedStats() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnhancedStats();
  }, []);

  const fetchEnhancedStats = async () => {
    try {
      setLoading(true);
      
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      // Statistiques des adhérents
      const { count: totalAdherents } = await supabase
        .from('adherents')
        .select('*', { count: 'exact', head: true });

      const thisMonth = new Date();
      thisMonth.setDate(1);
      const { count: nouveauxCeMois } = await supabase
        .from('adherents')
        .select('*', { count: 'exact', head: true })
        .gte('date_inscription', thisMonth.toISOString().split('T')[0]);

      const { count: groupesActifs } = await supabase
        .from('groupes')
        .select('*', { count: 'exact', head: true });

      const { count: hommes } = await supabase
        .from('adherents')
        .select('*', { count: 'exact', head: true })
        .eq('sexe', 'M');

      const { count: femmes } = await supabase
        .from('adherents')
        .select('*', { count: 'exact', head: true })
        .eq('sexe', 'F');

      // Statistiques financières
      const { data: contributionsYear } = await supabase
        .from('contributions')
        .select('montant')
        .gte('date_contribution', `${currentYear}-01-01`)
        .lte('date_contribution', `${currentYear}-12-31`);

      const totalContributions = contributionsYear?.reduce((sum, item) => sum + item.montant, 0) || 0;

      const { data: contributionsMoisData } = await supabase
        .from('contributions')
        .select('montant')
        .gte('date_contribution', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('date_contribution', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

      const contributionsMois = contributionsMoisData?.reduce((sum, item) => sum + item.montant, 0) || 0;

      // Contributions du mois dernier pour calculer la croissance
      const { data: contributionsMoisDernier } = await supabase
        .from('contributions')
        .select('montant')
        .gte('date_contribution', `${lastMonthYear}-${lastMonth.toString().padStart(2, '0')}-01`)
        .lt('date_contribution', `${lastMonthYear}-${(lastMonth + 1).toString().padStart(2, '0')}-01`);

      const contributionsMoisDernierTotal = contributionsMoisDernier?.reduce((sum, item) => sum + item.montant, 0) || 0;

      // Calcul de la croissance mensuelle
      const croissanceMensuelle = contributionsMoisDernierTotal > 0 
        ? ((contributionsMois - contributionsMoisDernierTotal) / contributionsMoisDernierTotal) * 100
        : 0;

      // Moyenne des contributions
      const moyenneContribution = contributionsYear && contributionsYear.length > 0 
        ? totalContributions / contributionsYear.length 
        : 0;

      // Quartiers les plus représentés
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
        .map(([quartier, count]: any) => ({
          quartier,
          count,
          percentage: totalAdherents ? Math.round((count / totalAdherents) * 100) : 0
        }));

      // Taux de participation (adhérents actifs ce mois)
      const { data: adherentsActifs } = await supabase
        .from('contributions')
        .select('adherent_id')
        .gte('date_contribution', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`);

      const adherentsActifsUniques = new Set(adherentsActifs?.map(item => item.adherent_id) || []);
      const tauxParticipation = totalAdherents ? Math.round((adherentsActifsUniques.size / totalAdherents) * 100) : 0;

      // Objectif mensuel (simulé à 80% de plus que le mois dernier)
      const objectifMensuel = Math.round(contributionsMoisDernierTotal * 1.1);

      setStats({
        totalAdherents: totalAdherents || 0,
        nouveauxCeMois: nouveauxCeMois || 0,
        groupesActifs: groupesActifs || 0,
        hommes: hommes || 0,
        femmes: femmes || 0,
        totalContributions,
        contributionsMois,
        moyenneContribution,
        tauxParticipation,
        topQuartiers,
        croissanceMensuelle,
        objectifMensuel
      });

    } catch (error: any) {
      console.error('Error fetching enhanced stats:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques avancées",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Total Adhérents",
      value: stats.totalAdherents.toLocaleString(),
      description: "Membres enregistrés",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      progress: null
    },
    {
      title: "Nouveaux ce mois",
      value: stats.nouveauxCeMois.toString(),
      description: `Croissance: ${stats.nouveauxCeMois > 0 ? '+' : ''}${stats.nouveauxCeMois}`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      progress: null
    },
    {
      title: "Contributions Mensuelles",
      value: `${stats.contributionsMois.toLocaleString()} Ar`,
      description: `Objectif: ${stats.objectifMensuel.toLocaleString()} Ar`,
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      progress: stats.objectifMensuel > 0 ? (stats.contributionsMois / stats.objectifMensuel) * 100 : 0
    },
    {
      title: "Taux de Participation",
      value: `${stats.tauxParticipation}%`,
      description: "Adhérents contributeurs",
      icon: Target,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      progress: stats.tauxParticipation
    }
  ];

  const secondaryStats = [
    {
      title: "Moyenne par Contribution",
      value: `${Math.round(stats.moyenneContribution).toLocaleString()} Ar`,
      description: "Montant moyen",
      icon: PieChart,
      color: "text-indigo-600",
    },
    {
      title: "Groupes Actifs",
      value: stats.groupesActifs.toString(),
      description: "Ministères en activité",
      icon: Activity,
      color: "text-teal-600",
    },
    {
      title: "Répartition Hommes/Femmes",
      value: `${Math.round((stats.femmes / stats.totalAdherents) * 100)}%F`,
      description: `${stats.hommes}H / ${stats.femmes}F`,
      icon: UserCheck,
      color: "text-pink-600",
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="card-elegant hover-scale">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mb-3">
                {stat.description}
              </p>
              {stat.progress !== null && (
                <div className="space-y-1">
                  <Progress value={Math.min(stat.progress, 100)} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {stat.progress.toFixed(0)}% de l'objectif
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {secondaryStats.map((stat, index) => (
          <Card key={index} className="card-elegant">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <div className="flex-1">
                  <div className="font-semibold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Quartiers */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Répartition par Quartier
          </CardTitle>
          <CardDescription>
            Les 5 quartiers les plus représentés parmi nos adhérents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.topQuartiers.map((quartier, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                    {index + 1}
                  </Badge>
                  <span className="font-medium">{quartier.quartier}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${quartier.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {quartier.count}
                  </span>
                  <span className="text-xs text-muted-foreground w-8 text-right">
                    {quartier.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}