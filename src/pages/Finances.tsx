/**
 * Page de gestion des finances de la paroisse
 * Affiche les contributions, statistiques financières et rapports
 */
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, PlusCircle, TrendingUp, Download } from "lucide-react";
import { ContributionsManager } from "@/components/finances/ContributionsManager";
import { FinancialStats } from "@/components/finances/FinancialStats";
import { FinancialCharts } from "@/components/finances/FinancialCharts";
import { TopContributors } from "@/components/finances/TopContributors";
import { PieChartOnly } from "@/components/finances/PieChartOnly";
import { FinancialReports } from "@/components/finances/FinancialReports";
import { CardGenerator } from "@/components/finances/CardGenerator";
import { useAuth } from "@/hooks/useAuth";

/**
 * Composant de la page Finances
 * Gère l'affichage des différentes vues financières selon les permissions utilisateur
 * @returns {JSX.Element} Page de gestion des finances
 */
const Finances = () => {
  const { user, canViewFinances, canManageFinances } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  if (!canViewFinances()) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Accès non autorisé</h2>
              <p className="text-muted-foreground">
                Vous n'avez pas les permissions nécessaires pour accéder à la gestion financière.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-1.5 md:gap-2">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
          Finances
        </h1>
        <p className="text-xs md:text-sm lg:text-base text-muted-foreground">
          <span className="hidden sm:inline">Gestion et suivi des contributions financières</span>
          <span className="sm:hidden">Gestion financière</span>
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto gap-1">
          <TabsTrigger 
            value="overview" 
            className="flex items-center justify-center gap-1 md:gap-2 text-[10px] sm:text-xs md:text-sm py-2 px-1 md:px-3"
          >
            <TrendingUp className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
            <span className="hidden sm:inline truncate">Vue d'ensemble</span>
            <span className="sm:hidden">Vue</span>
          </TabsTrigger>
          <TabsTrigger 
            value="contributions" 
            className="flex items-center justify-center gap-1 md:gap-2 text-[10px] sm:text-xs md:text-sm py-2 px-1 md:px-3"
          >
            <PlusCircle className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
            <span className="hidden sm:inline truncate">Contributions</span>
            <span className="sm:hidden">Contrib</span>
          </TabsTrigger>
          <TabsTrigger 
            value="statistics" 
            className="flex items-center justify-center gap-1 md:gap-2 text-[10px] sm:text-xs md:text-sm py-2 px-1 md:px-3"
          >
            <Calculator className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
            <span className="hidden sm:inline truncate">Statistiques</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
          <TabsTrigger 
            value="reports" 
            className="flex items-center justify-center gap-1 md:gap-2 text-[10px] sm:text-xs md:text-sm py-2 px-1 md:px-3"
          >
            <Download className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Rapports</span>
            <span className="sm:hidden">Rapp</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-3 md:space-y-4 lg:space-y-6 mt-3 md:mt-6">
          <FinancialStats />
          <FinancialCharts />
          <div className="grid gap-3 md:gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-2">
            <TopContributors />
            <PieChartOnly />
          </div>
        </TabsContent>

        <TabsContent value="contributions" className="space-y-3 md:space-y-4 lg:space-y-6 mt-3 md:mt-6">
          <ContributionsManager canManage={canManageFinances()} />
        </TabsContent>

        <TabsContent value="statistics" className="space-y-3 md:space-y-4 lg:space-y-6 mt-3 md:mt-6">
          <FinancialCharts detailed />
          <div className="grid gap-3 md:gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-2">
            <TopContributors />
            <PieChartOnly />
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-3 md:space-y-4 lg:space-y-6 mt-3 md:mt-6">
          <FinancialReports />
          <CardGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Finances;