/**
 * Composant affichant un graphique en camembert des contributions financières
 * Visualise la répartition des dîmes, offrandes et dons pour l'année en cours
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Type pour les données du graphique en camembert
 * @property {string} name - Nom du type de contribution (Dîmes, Offrandes, Dons)
 * @property {number} value - Montant total en Ariary
 * @property {string} color - Couleur hexadécimale pour l'affichage
 */
interface PieData {
  name: string;
  value: number;
  color: string;
}

/**
 * Composant PieChartOnly
 * Affiche un graphique en camembert responsive des contributions par type
 * @returns {JSX.Element} Graphique en camembert avec légende
 */
export const PieChartOnly = () => {
  const [pieData, setPieData] = useState<PieData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, []);

  /**
   * Récupère et agrège les données des contributions pour l'année en cours
   * Calcule les totaux par type de contribution (dîmes, offrandes, dons)
   */
  const fetchChartData = async () => {
    try {
      const currentYear = new Date().getFullYear();
      
      // Données pour le camembert (année actuelle)
      const { data: pieDataRaw, error: pieError } = await supabase
        .from('contributions')
        .select('type, montant')
        .gte('date_contribution', `${currentYear}-01-01`);

      if (pieError) throw pieError;

      const pieStats = { dimes: 0, offrandes: 0, dons: 0 };
      pieDataRaw?.forEach(item => {
        pieStats[item.type as keyof typeof pieStats] += item.montant;
      });

      const pieArray: PieData[] = [
        { name: 'Dîmes', value: pieStats.dimes, color: '#10B981' },
        { name: 'Offrandes', value: pieStats.offrandes, color: '#3B82F6' },
        { name: 'Dons', value: pieStats.dons, color: '#8B5CF6' }
      ].filter(item => item.value > 0);

      setPieData(pieArray);

    } catch (error: any) {
      toast.error("Erreur lors du chargement du graphique");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="p-3 md:p-6">
        <CardTitle className="text-base md:text-xl">
          <span className="hidden sm:inline">Répartition par Type</span>
          <span className="sm:hidden">Répartition</span>
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          <span className="hidden sm:inline">Distribution des contributions (année en cours)</span>
          <span className="sm:hidden">Distribution (année)</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 md:p-6">
        <ChartContainer
          config={{
            dimes: { label: "Dîmes", color: "#10B981" },
            offrandes: { label: "Offrandes", color: "#3B82F6" },
            dons: { label: "Dons", color: "#8B5CF6" }
          }}
          className="h-[200px] sm:h-[250px] md:h-[300px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={60}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => {
                  // Sur mobile, afficher seulement le pourcentage
                  if (window.innerWidth < 640) {
                    return `${(percent * 100).toFixed(0)}%`;
                  }
                  return `${name} ${(percent * 100).toFixed(0)}%`;
                }}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip 
                formatter={(value: number) => [`${value.toLocaleString()} Ar`, '']}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Légende responsive */}
        <div className="mt-3 md:mt-4 flex flex-wrap gap-2 md:gap-4 justify-center">
          {pieData.map((entry, index) => (
            <div key={index} className="flex items-center gap-1.5 md:gap-2">
              <div 
                className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-[10px] md:text-xs text-muted-foreground">
                {entry.name}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};