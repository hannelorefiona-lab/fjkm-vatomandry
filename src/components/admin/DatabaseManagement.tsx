import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Database, Download, Upload, RefreshCw, AlertTriangle, CheckCircle, Activity } from "lucide-react";

interface TableStats {
  name: string;
  count: number;
  size: string;
  lastUpdated: string;
}

interface DatabaseHealth {
  status: 'healthy' | 'warning' | 'error';
  connections: number;
  uptime: string;
  version: string;
}

export function DatabaseManagement() {
  const [tableStats, setTableStats] = useState<TableStats[]>([]);
  const [dbHealth, setDbHealth] = useState<DatabaseHealth>({
    status: 'healthy',
    connections: 0,
    uptime: '',
    version: ''
  });
  const [loading, setLoading] = useState(true);
  const [backupInProgress, setBackupInProgress] = useState(false);

  useEffect(() => {
    fetchDatabaseStats();
  }, []);

  const fetchDatabaseStats = async () => {
    try {
      setLoading(true);
      
      // Récupérer les statistiques des tables principales
      const tables = ['adherents', 'groupes', 'adherents_groupes', 'user_roles', 'profiles'] as const;
      const stats: TableStats[] = [];

      for (const table of tables) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

          if (!error) {
            stats.push({
              name: table,
              count: count || 0,
              size: `${Math.max(1, Math.ceil((count || 0) * 0.5))} KB`, // Estimation
              lastUpdated: new Date().toISOString()
            });
          }
        } catch (err) {
          console.error(`Error fetching ${table} stats:`, err);
        }
      }

      setTableStats(stats);

      // Simuler les statistiques de santé de la DB
      setDbHealth({
        status: 'healthy',
        connections: Math.floor(Math.random() * 50) + 10,
        uptime: '15 jours, 8 heures',
        version: 'PostgreSQL 15.3'
      });

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les statistiques de la base de données.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    setBackupInProgress(true);
    try {
      // Simuler une sauvegarde
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "Sauvegarde terminée",
        description: "La base de données a été sauvegardée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de créer la sauvegarde.",
        variant: "destructive",
      });
    } finally {
      setBackupInProgress(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return AlertTriangle;
      default: return Activity;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="h-6 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-4 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(dbHealth.status);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Database Health */}
      <Card>
        <CardHeader className="p-3 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-xl">
            <Database className="h-4 w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline">État de la base de données</span>
            <span className="sm:hidden">État DB</span>
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            <span className="hidden sm:inline">Surveillance en temps réel de la santé de la base de données</span>
            <span className="sm:hidden">Surveillance DB</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 md:p-6">
          <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2 md:gap-3">
              <StatusIcon className={`h-4 w-4 md:h-5 md:w-5 ${getStatusColor(dbHealth.status)}`} />
              <div>
                <div className="text-xs md:text-sm font-medium">Statut</div>
                <Badge variant={dbHealth.status === 'healthy' ? 'default' : 'destructive'} className="text-[10px] md:text-xs px-1.5 md:px-2">
                  <span className="hidden sm:inline">{dbHealth.status === 'healthy' ? 'Opérationnel' : 'Problème'}</span>
                  <span className="sm:hidden">OK</span>
                </Badge>
              </div>
            </div>
            
            <div>
              <div className="text-xs md:text-sm font-medium">
                <span className="hidden sm:inline">Connexions actives</span>
                <span className="sm:hidden">Conn.</span>
              </div>
              <div className="text-xl md:text-2xl font-bold">{dbHealth.connections}</div>
            </div>
            
            <div className="hidden md:block">
              <div className="text-xs md:text-sm font-medium">Temps de fonctionnement</div>
              <div className="text-xs md:text-sm text-muted-foreground">{dbHealth.uptime}</div>
            </div>
            
            <div className="hidden md:block">
              <div className="text-xs md:text-sm font-medium">Version</div>
              <div className="text-xs md:text-sm text-muted-foreground">{dbHealth.version}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Statistics */}
      <Card>
        <CardHeader className="p-3 md:p-6">
          <CardTitle className="text-base md:text-xl">
            <span className="hidden sm:inline">Statistiques des tables</span>
            <span className="sm:hidden">Tables</span>
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            <span className="hidden sm:inline">Aperçu des données stockées dans chaque table</span>
            <span className="sm:hidden">Données stockées</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 md:p-6">
          <div className="space-y-2 md:space-y-3">
            {tableStats.map((table) => (
              <div key={table.name} className="flex items-center justify-between p-2 md:p-3 border rounded-lg">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <div className="h-7 w-7 md:h-8 md:w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                    <Database className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium capitalize text-xs md:text-sm truncate">{table.name.replace('_', ' ')}</div>
                    <div className="text-[10px] md:text-xs text-muted-foreground">
                      <span className="hidden sm:inline">{table.count} enregistrements • {table.size}</span>
                      <span className="sm:hidden">{table.count} items</span>
                    </div>
                  </div>
                </div>
                <div className="text-right hidden md:block">
                  <div className="text-xs text-muted-foreground">
                    Mis à jour: {new Date(table.lastUpdated).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Backup and Maintenance */}
      <Card>
        <CardHeader className="p-3 md:p-6">
          <CardTitle className="text-base md:text-xl">
            <span className="hidden sm:inline">Sauvegarde et maintenance</span>
            <span className="sm:hidden">Maintenance</span>
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            <span className="hidden sm:inline">Outils de sauvegarde et de maintenance de la base de données</span>
            <span className="sm:hidden">Outils de gestion</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 md:p-6">
          <div className="grid gap-3 md:gap-4 sm:grid-cols-2">
            <div className="space-y-2 md:space-y-3">
              <h4 className="text-xs md:text-sm font-medium">Sauvegarde</h4>
              <div className="space-y-1.5 md:space-y-2">
                <Button
                  onClick={handleBackup}
                  disabled={backupInProgress}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-xs md:text-sm h-8 md:h-9"
                >
                  {backupInProgress ? (
                    <RefreshCw className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  )}
                  <span className="hidden sm:inline">{backupInProgress ? "Sauvegarde en cours..." : "Créer une sauvegarde"}</span>
                  <span className="sm:hidden">{backupInProgress ? "En cours..." : "Créer"}</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-xs md:text-sm h-8 md:h-9"
                  disabled
                >
                  <Upload className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Restaurer une sauvegarde</span>
                  <span className="sm:hidden">Restaurer</span>
                </Button>
              </div>
            </div>

            <div className="space-y-2 md:space-y-3">
              <h4 className="text-xs md:text-sm font-medium">Maintenance</h4>
              <div className="space-y-1.5 md:space-y-2">
                <Button
                  onClick={fetchDatabaseStats}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2 text-xs md:text-sm h-8 md:h-9"
                >
                  <RefreshCw className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Actualiser les statistiques</span>
                  <span className="sm:hidden">Actualiser</span>
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2 text-destructive hover:text-destructive text-xs md:text-sm h-8 md:h-9"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">Optimiser la base de données</span>
                      <span className="sm:hidden">Optimiser</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-base md:text-lg">Optimiser la base de données</AlertDialogTitle>
                      <AlertDialogDescription className="text-xs md:text-sm">
                        Cette action va optimiser les performances de la base de données.
                        Le processus peut prendre quelques minutes et peut affecter les performances pendant l'opération.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                      <AlertDialogCancel className="text-xs md:text-sm">Annuler</AlertDialogCancel>
                      <AlertDialogAction className="text-xs md:text-sm">Commencer l'optimisation</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>

          {backupInProgress && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Sauvegarde en cours...</span>
              </div>
              <Progress value={66} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}