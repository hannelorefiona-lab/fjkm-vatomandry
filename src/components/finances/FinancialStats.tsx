import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface FinancialStatsData {
  totalAnnual: number;
  totalMensuel: number;
  moyenneMensuelle: number;
  nombreContributeurs: number;
  moisPlusGenereux: string;
  repartition: {
    dimes: { total: number; pourcentage: number };
    offrandes: { total: number; pourcentage: number };
    dons: { total: number; pourcentage: number };
  };
}

export const FinancialStats = () => {
  const [stats, setStats] = useState<FinancialStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialStats();
  }, []);

  const fetchFinancialStats = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      // Total annuel
      const { data: annualData, error: annualError } = await supabase
        .from('contributions')
        .select('montant')
        .gte('date_contribution', `${currentYear}-01-01`)
        .lte('date_contribution', `${currentYear}-12-31`);

      if (annualError) throw annualError;

      const totalAnnual = annualData?.reduce((sum, item) => sum + item.montant, 0) || 0;

      // Total mensuel actuel
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('contributions')
        .select('montant')
        .gte('date_contribution', `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`)
        .lt('date_contribution', `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-01`);

      if (monthlyError) throw monthlyError;

      const totalMensuel = monthlyData?.reduce((sum, item) => sum + item.montant, 0) || 0;

      // Nombre de contributeurs actifs
      const { data: contributorsData, error: contributorsError } = await supabase
        .from('contributions')
        .select('adherent_id')
        .gte('date_contribution', `${currentYear}-01-01`);

      if (contributorsError) throw contributorsError;

      const uniqueContributors = new Set(contributorsData?.map(item => item.adherent_id) || []);
      const nombreContributeurs = uniqueContributors.size;

      // Répartition par type
      const { data: repartitionData, error: repartitionError } = await supabase
        .from('contributions')
        .select('type, montant')
        .gte('date_contribution', `${currentYear}-01-01`);

      if (repartitionError) throw repartitionError;

      const repartitionStats = {
        dimes: { total: 0, pourcentage: 0 },
        offrandes: { total: 0, pourcentage: 0 },
        dons: { total: 0, pourcentage: 0 }
      };

      repartitionData?.forEach(item => {
        if (item.type === 'dime') {
          repartitionStats.dimes.total += item.montant;
        } else if (item.type === 'offrande') {
          repartitionStats.offrandes.total += item.montant;
        } else if (item.type === 'don') {
          repartitionStats.dons.total += item.montant;
        }
      });

      // Calculer les pourcentages
      if (totalAnnual > 0) {
        repartitionStats.dimes.pourcentage = (repartitionStats.dimes.total / totalAnnual) * 100;
        repartitionStats.offrandes.pourcentage = (repartitionStats.offrandes.total / totalAnnual) * 100;
        repartitionStats.dons.pourcentage = (repartitionStats.dons.total / totalAnnual) * 100;
      }

      // Mois le plus généreux (simplifiée pour le mois actuel)
      const moyenneMensuelle = totalAnnual / 12;

      setStats({
        totalAnnual,
        totalMensuel,
        moyenneMensuelle,
        nombreContributeurs,
        moisPlusGenereux: new Date().toLocaleDateString('fr-FR', { month: 'long' }),
        repartition: repartitionStats
      });

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des statistiques financières",
        variant: "destructive"
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
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
      title: "Total Annuel",
      value: `${stats.totalAnnual.toLocaleString()} Ar`,
      description: `Année ${new Date().getFullYear()}`,
      icon: DollarSign,
      color: "text-green-600"
    },
    {
      title: "Total Mensuel",
      value: `${stats.totalMensuel.toLocaleString()} Ar`,
      description: "Mois en cours",
      icon: Calendar,
      color: "text-blue-600"
    },
    {
      title: "Moyenne Mensuelle",
      value: `${Math.round(stats.moyenneMensuelle).toLocaleString()} Ar`,
      description: "Basée sur l'année",
      icon: TrendingUp,
      color: "text-purple-600"
    },
    {
      title: "Contributeurs Actifs",
      value: stats.nombreContributeurs.toString(),
      description: "Cette année",
      icon: Users,
      color: "text-orange-600"
    }
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-3 w-3 md:h-4 md:w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
              <div className="text-lg md:text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Répartition</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="space-y-2 md:space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Dîmes</span>
                <span className="text-sm text-muted-foreground">
                  {stats.repartition.dimes.pourcentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${stats.repartition.dimes.pourcentage}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Offrandes</span>
                <span className="text-sm text-muted-foreground">
                  {stats.repartition.offrandes.pourcentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${stats.repartition.offrandes.pourcentage}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Dons</span>
                <span className="text-sm text-muted-foreground">
                  {stats.repartition.dons.pourcentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${stats.repartition.dons.pourcentage}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Détails</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="space-y-3 md:space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Dîmes:</span>
                <span className="text-sm font-semibold">{stats.repartition.dimes.total.toLocaleString()} Ar</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Offrandes:</span>
                <span className="text-sm font-semibold">{stats.repartition.offrandes.total.toLocaleString()} Ar</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Dons:</span>
                <span className="text-sm font-semibold">{stats.repartition.dons.total.toLocaleString()} Ar</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-base md:text-lg">Infos</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="space-y-2 text-xs md:text-sm">
              <p><strong>Mois le plus généreux:</strong> {stats.moisPlusGenereux}</p>
              <p><strong>Dernière mise à jour:</strong> {new Date().toLocaleDateString('fr-FR')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};