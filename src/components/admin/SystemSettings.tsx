import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Settings, Save, RefreshCw, Database, Shield, Bell, Loader2 } from "lucide-react";

interface SystemConfig {
  appName: string;
  emailNotifications: boolean;
  autoBackup: boolean;
  maxUsersPerGroup: number;
  sessionTimeout: number;
  maintenanceMode: boolean;
}

export function SystemSettings() {
  const [config, setConfig] = useState<SystemConfig>({
    appName: "FJKM Vatomandry",
    emailNotifications: true,
    autoBackup: true,
    maxUsersPerGroup: 50,
    sessionTimeout: 30,
    maintenanceMode: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value, updated_at');

      if (error) throw error;

      if (data && data.length > 0) {
        const settings: Partial<SystemConfig> = {};
        
        data.forEach(setting => {
          switch (setting.key) {
            case 'app_name':
              settings.appName = String(setting.value);
              break;
            case 'email_notifications':
              settings.emailNotifications = setting.value === true || setting.value === 'true';
              break;
            case 'auto_backup':
              settings.autoBackup = setting.value === true || setting.value === 'true';
              break;
            case 'max_users_per_group':
              settings.maxUsersPerGroup = Number(setting.value);
              break;
            case 'session_timeout':
              settings.sessionTimeout = Number(setting.value);
              break;
            case 'maintenance_mode':
              settings.maintenanceMode = setting.value === true || setting.value === 'true';
              break;
          }
        });

        setConfig(prev => ({ ...prev, ...settings }));
        
        // Récupérer la dernière date de mise à jour
        const lastUpdate = data.reduce((latest, setting) => {
          const updateDate = new Date(setting.updated_at);
          return updateDate > latest ? updateDate : latest;
        }, new Date(0));
        
        if (lastUpdate > new Date(0)) {
          setLastSaved(lastUpdate);
        }
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les paramètres.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settings = [
        { key: 'app_name', value: config.appName },
        { key: 'email_notifications', value: config.emailNotifications },
        { key: 'auto_backup', value: config.autoBackup },
        { key: 'max_users_per_group', value: config.maxUsersPerGroup },
        { key: 'session_timeout', value: config.sessionTimeout },
        { key: 'maintenance_mode', value: config.maintenanceMode },
      ];

      for (const setting of settings) {
        const { error } = await supabase
          .from('system_settings')
          .upsert({ 
            key: setting.key, 
            value: setting.value,
            updated_by: (await supabase.auth.getUser()).data.user?.id
          }, {
            onConflict: 'key'
          });

        if (error) throw error;
      }
      
      setLastSaved(new Date());
      toast({
        title: "Paramètres sauvegardés",
        description: "La configuration a été mise à jour avec succès.",
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    setConfig({
      appName: "FJKM Vatomandry",
      emailNotifications: true,
      autoBackup: true,
      maxUsersPerGroup: 50,
      sessionTimeout: 30,
      maintenanceMode: false,
    });
    toast({
      title: "Paramètres réinitialisés",
      description: "La configuration a été remise aux valeurs par défaut.",
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Settings className="h-4 w-4 md:h-5 md:w-5" />
            Configuration système
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Paramètres globaux de l'application
            {lastSaved && (
              <span className="block text-xs text-muted-foreground mt-1">
                Sauvegarde : {lastSaved.toLocaleString('fr-FR')}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
          {/* Application Settings */}
          <div className="space-y-3 md:space-y-4">
            <h4 className="text-xs md:text-sm font-medium">Application</h4>
            <div className="grid gap-2 md:gap-3">
              <div>
                <Label htmlFor="appName">Nom de l'application</Label>
                <Input
                  id="appName"
                  value={config.appName}
                  onChange={(e) => setConfig(prev => ({ ...prev, appName: e.target.value }))}
                  placeholder="Nom de votre église ou organisation"
                />
              </div>
              
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <Label htmlFor="maintenanceMode" className="text-xs md:text-sm">Mode maintenance</Label>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Désactive l'accès (sauf admins)
                  </p>
                </div>
                <Switch
                  id="maintenanceMode"
                  checked={config.maintenanceMode}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, maintenanceMode: checked }))
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Security Settings */}
          <div className="space-y-3 md:space-y-4">
            <h4 className="text-xs md:text-sm font-medium flex items-center gap-2">
              <Shield className="h-3 w-3 md:h-4 md:w-4" />
              Sécurité
            </h4>
            <div className="grid gap-2 md:gap-3">
              <div>
                <Label htmlFor="sessionTimeout">Délai d'expiration de session (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  min="5"
                  max="480"
                  value={config.sessionTimeout}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    sessionTimeout: parseInt(e.target.value) || 30 
                  }))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notification Settings */}
          <div className="space-y-3 md:space-y-4">
            <h4 className="text-xs md:text-sm font-medium flex items-center gap-2">
              <Bell className="h-3 w-3 md:h-4 md:w-4" />
              Notifications
            </h4>
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <Label htmlFor="emailNotifications" className="text-xs md:text-sm">Notifications email</Label>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Notifs pour événements importants
                </p>
              </div>
              <Switch
                id="emailNotifications"
                checked={config.emailNotifications}
                onCheckedChange={(checked) => 
                  setConfig(prev => ({ ...prev, emailNotifications: checked }))
                }
              />
            </div>
          </div>

          <Separator />

          {/* Data Management */}
          <div className="space-y-3 md:space-y-4">
            <h4 className="text-xs md:text-sm font-medium flex items-center gap-2">
              <Database className="h-3 w-3 md:h-4 md:w-4" />
              Gestion des données
            </h4>
            <div className="grid gap-2 md:gap-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <Label htmlFor="autoBackup" className="text-xs md:text-sm">Sauvegarde auto</Label>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Sauvegarde quotidienne
                  </p>
                </div>
                <Switch
                  id="autoBackup"
                  checked={config.autoBackup}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, autoBackup: checked }))
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="maxUsersPerGroup">Nombre max d'adhérents par groupe</Label>
                <Input
                  id="maxUsersPerGroup"
                  type="number"
                  min="1"
                  max="1000"
                  value={config.maxUsersPerGroup}
                  onChange={(e) => setConfig(prev => ({ 
                    ...prev, 
                    maxUsersPerGroup: parseInt(e.target.value) || 50 
                  }))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={resetToDefaults}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Réinitialiser
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}