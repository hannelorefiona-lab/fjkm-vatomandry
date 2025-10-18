import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Bar, BarChart, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MonthlyData {
  mois: string;
  dimes: number;
  offrandes: number;
  dons: number;
  total: number;
}

interface PieData {
  name: string;
  value: number;
  color: string;
}

interface FinancialChartsProps {
  detailed?: boolean;
}

export const FinancialCharts = ({ detailed = false }: FinancialChartsProps) => {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [pieData, setPieData] = useState<PieData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      const currentYear = new Date().getFullYear();
      
      // Données mensuelles pour les 12 derniers mois
      const { data: contributionsData, error } = await supabase
        .from('contributions')
        .select('type, montant, date_contribution')
        .gte('date_contribution', `${currentYear - 1}-${new Date().getMonth() + 1}-01`)
        .order('date_contribution');

      if (error) throw error;

      // Traitement des données mensuelles
      const monthlyStats: { [key: string]: { dimes: number; offrandes: number; dons: number; total: number } } = {};
      
      // Initialiser les 12 derniers mois
      for (let i = 0; i < 12; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
        
        monthlyStats[key] = { dimes: 0, offrandes: 0, dons: 0, total: 0 };
      }

      // Remplir avec les vraies données
      contributionsData?.forEach(item => {
        const date = new Date(item.date_contribution);
        const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        
        if (monthlyStats[key]) {
          if (item.type === 'dime') {
            monthlyStats[key].dimes += item.montant;
          } else if (item.type === 'offrande') {
            monthlyStats[key].offrandes += item.montant;
          } else if (item.type === 'don') {
            monthlyStats[key].dons += item.montant;
          }
          monthlyStats[key].total += item.montant;
        }
      });

      // Convertir en array pour les graphiques
      const monthlyArray: MonthlyData[] = Object.entries(monthlyStats)
        .map(([key, values]) => {
          const [year, month] = key.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1);
          const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
          
          return {
            mois: monthName,
            ...values
          };
        })
        .reverse()
        .slice(-12); // Garder seulement les 12 derniers mois

      setMonthlyData(monthlyArray);

      // Données pour le camembert (année actuelle)
      const { data: pieDataRaw, error: pieError } = await supabase
        .from('contributions')
        .select('type, montant')
        .gte('date_contribution', `${currentYear}-01-01`);

      if (pieError) throw pieError;

      const pieStats = { dimes: 0, offrandes: 0, dons: 0 };
      pieDataRaw?.forEach(item => {
        if (item.type === 'dime') {
          pieStats.dimes += item.montant;
        } else if (item.type === 'offrande') {
          pieStats.offrandes += item.montant;
        } else if (item.type === 'don') {
          pieStats.dons += item.montant;
        }
      });

      const pieArray: PieData[] = [
        { name: 'Dîmes', value: pieStats.dimes, color: '#10B981' },
        { name: 'Offrandes', value: pieStats.offrandes, color: '#3B82F6' },
        { name: 'Dons', value: pieStats.dons, color: '#8B5CF6' }
      ].filter(item => item.value > 0);

      setPieData(pieArray);

    } catch (error: any) {
      toast.error("Erreur lors du chargement des graphiques");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[...Array(detailed ? 3 : 2)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
                <div className="h-64 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!detailed ? (
        // Vue simple : seulement le graphique en barres
        <Card className="overflow-hidden">
          <CardHeader className="p-3 md:p-6">
            <CardTitle className="text-base md:text-xl">Contributions Mensuelles</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              <span className="hidden sm:inline">Évolution des contributions sur les 12 derniers mois</span>
              <span className="sm:hidden">12 derniers mois</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pb-4 md:pb-6">
            <ChartContainer
              config={{
                dimes: { label: "Dîmes", color: "hsl(var(--success))" },
                offrandes: { label: "Offrandes", color: "hsl(var(--primary))" },
                dons: { label: "Dons", color: "hsl(var(--accent))" }
              }}
              className="h-[250px] md:h-[300px] w-full px-3 md:px-6"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={monthlyData}
                  margin={{ top: 10, right: 5, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="mois" 
                    angle={-45}
                    textAnchor="end"
                    height={50}
                    className="text-[10px] md:text-xs"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    className="text-[10px] md:text-xs"
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    width={35}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => [`${value.toLocaleString()} Ar`, '']}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="dimes" fill="hsl(var(--success))" name="Dîmes" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="offrandes" fill="hsl(var(--primary))" name="Offrandes" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="dons" fill="hsl(var(--accent))" name="Dons" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      ) : (
        // Vue détaillée : graphique en barres et camembert côte à côte
        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          {/* Graphique en barres - Contributions mensuelles */}
          <Card className="overflow-hidden">
            <CardHeader className="p-3 md:p-6">
              <CardTitle className="text-base md:text-xl">Contributions Mensuelles</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                <span className="hidden sm:inline">Évolution des contributions sur les 12 derniers mois</span>
                <span className="sm:hidden">12 derniers mois</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 pb-6">
              <ChartContainer
                config={{
                  dimes: { label: "Dîmes", color: "hsl(var(--success))" },
                  offrandes: { label: "Offrandes", color: "hsl(var(--primary))" },
                  dons: { label: "Dons", color: "hsl(var(--accent))" }
                }}
                className="h-[300px] w-full px-6"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={monthlyData}
                    margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="mois" 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      className="text-xs"
                    />
                    <YAxis 
                      className="text-xs"
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => [`${value.toLocaleString()} Ar`, '']}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="dimes" fill="hsl(var(--success))" name="Dîmes" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="offrandes" fill="hsl(var(--primary))" name="Offrandes" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="dons" fill="hsl(var(--accent))" name="Dons" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Diagramme en camembert - Répartition */}
          <Card className="overflow-hidden">
            <CardHeader className="p-3 md:p-6">
              <CardTitle className="text-base md:text-xl">Répartition par Type</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                <span className="hidden sm:inline">Distribution des contributions (année en cours)</span>
                <span className="sm:hidden">Année en cours</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  dimes: { label: "Dîmes", color: "#10B981" },
                  offrandes: { label: "Offrandes", color: "#3B82F6" },
                  dons: { label: "Dons", color: "#8B5CF6" }
                }}
                className="h-[300px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
            </CardContent>
          </Card>
        </div>
      )}

      {detailed && (
        <Card className="overflow-hidden">
          <CardHeader className="p-3 md:p-6">
            <CardTitle className="text-base md:text-xl">Évolution Annuelle des Entrées</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              <span className="hidden sm:inline">Tendance du total mensuel des contributions</span>
              <span className="sm:hidden">Tendance mensuelle</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pb-6">
            <ChartContainer
              config={{
                total: { label: "Total", color: "hsl(var(--primary))" }
              }}
              className="h-[300px] w-full px-6"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={monthlyData}
                  margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="mois" 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    className="text-xs"
                  />
                  <YAxis 
                    className="text-xs"
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => [`${value.toLocaleString()} Ar`, 'Total']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};