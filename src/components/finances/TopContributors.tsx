import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Medal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Contributor {
  id: string;
  nom: string;
  prenom: string;
  total: number;
  contributions_count: number;
}

export const TopContributors = () => {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'month' | 'year' | 'all'>('year');

  useEffect(() => {
    fetchTopContributors();
  }, [period]);

  const fetchTopContributors = async () => {
    try {
      setLoading(true);
      
      // Date calculation based on period
      let dateFilter = new Date();
      if (period === 'month') {
        dateFilter.setMonth(dateFilter.getMonth() - 1);
      } else if (period === 'year') {
        dateFilter.setFullYear(dateFilter.getFullYear() - 1);
      } else {
        dateFilter = new Date('2000-01-01'); // All time
      }

      const { data, error } = await supabase
        .from('contributions')
        .select(`
          montant,
          adherent_id,
          adherents!inner(nom, prenom)
        `)
        .gte('date_contribution', dateFilter.toISOString().split('T')[0]);

      if (error) throw error;

      // Group by adherent and calculate totals
      const contributorMap = new Map<string, Contributor>();
      
      data?.forEach((contribution: any) => {
        const id = contribution.adherent_id;
        const existing = contributorMap.get(id);
        
        if (existing) {
          existing.total += Number(contribution.montant);
          existing.contributions_count += 1;
        } else {
          contributorMap.set(id, {
            id,
            nom: contribution.adherents.nom,
            prenom: contribution.adherents.prenom,
            total: Number(contribution.montant),
            contributions_count: 1
          });
        }
      });

      // Convert to array and sort by total
      const sortedContributors = Array.from(contributorMap.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 10); // Top 10

      setContributors(sortedContributors);
    } catch (error) {
      console.error('Error fetching top contributors:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MG', {
      style: 'currency',
      currency: 'MGA',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(amount).replace('MGA', 'Ar');
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Award className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-orange-600" />;
      default:
        return null;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 0:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case 1:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
      case 2:
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <Card>
      <CardHeader className="p-3 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base md:text-xl">
            <Trophy className="h-4 w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline">Top Contributeurs</span>
            <span className="sm:hidden">Top 10</span>
          </CardTitle>
          <div className="flex gap-1.5 md:gap-2">
            <Badge 
              variant={period === 'month' ? 'default' : 'outline'}
              className="cursor-pointer text-xs px-2 py-0.5"
              onClick={() => setPeriod('month')}
            >
              <span className="hidden sm:inline">Mois</span>
              <span className="sm:hidden">M</span>
            </Badge>
            <Badge 
              variant={period === 'year' ? 'default' : 'outline'}
              className="cursor-pointer text-xs px-2 py-0.5"
              onClick={() => setPeriod('year')}
            >
              <span className="hidden sm:inline">Année</span>
              <span className="sm:hidden">A</span>
            </Badge>
            <Badge 
              variant={period === 'all' ? 'default' : 'outline'}
              className="cursor-pointer text-xs px-2 py-0.5"
              onClick={() => setPeriod('all')}
            >
              <span className="hidden sm:inline">Tout</span>
              <span className="sm:hidden">T</span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 md:p-6">
        {loading ? (
          <div className="space-y-3 md:space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-2 md:gap-3">
                <Skeleton className="h-8 w-8 md:h-10 md:w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3 md:h-4 w-24 md:w-32 mb-1.5 md:mb-2" />
                  <Skeleton className="h-2 md:h-3 w-16 md:w-24" />
                </div>
                <Skeleton className="h-3 md:h-4 w-16 md:w-20" />
              </div>
            ))}
          </div>
        ) : contributors.length === 0 ? (
          <p className="text-center text-muted-foreground py-6 md:py-8 text-xs md:text-sm">
            Aucune contribution trouvée pour cette période
          </p>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {contributors.map((contributor, index) => (
              <div 
                key={contributor.id} 
                className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Badge className={`w-6 h-6 md:w-8 md:h-8 rounded-full p-0 flex items-center justify-center text-xs ${getRankBadge(index)}`}>
                    {getRankIcon(index) ? 
                      <span className="flex items-center justify-center">{getRankIcon(index)}</span> 
                      : (index + 1)
                    }
                  </Badge>
                  <Avatar className="h-8 w-8 md:h-10 md:w-10">
                    <AvatarFallback className="text-xs md:text-sm">
                      {contributor.prenom[0]}{contributor.nom[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs md:text-sm truncate">
                    <span className="hidden sm:inline">{contributor.prenom} {contributor.nom}</span>
                    <span className="sm:hidden">{contributor.prenom[0]}. {contributor.nom}</span>
                  </p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">
                    <span className="hidden sm:inline">{contributor.contributions_count} contribution{contributor.contributions_count > 1 ? 's' : ''}</span>
                    <span className="sm:hidden">{contributor.contributions_count} fois</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xs md:text-base">
                    <span className="hidden sm:inline">{formatCurrency(contributor.total)}</span>
                    <span className="sm:hidden">{(contributor.total / 1000).toFixed(0)}k Ar</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};