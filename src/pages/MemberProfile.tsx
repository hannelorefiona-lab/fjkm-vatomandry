import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, CreditCard, Calendar, Mail, Phone, MapPin, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfileData {
  id_adherent: string;
  nom: string;
  prenom: string;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  quartier: string | null;
  date_naissance: string | null;
  date_inscription: string;
  fonction_eglise: string | null;
  sexe: 'M' | 'F';
}

interface Contribution {
  id: string;
  montant: number;
  type: string;
  date_contribution: string;
}

const MemberProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      // First get the profile to find the adherent_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id_adherent')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (profileData?.id_adherent) {
        // Fetch adherent data
        const { data: adherentData, error: adherentError } = await supabase
          .from('adherents')
          .select('*')
          .eq('id_adherent', profileData.id_adherent)
          .single();

        if (adherentError) throw adherentError;
        setProfile(adherentData);

        // Fetch contributions
        const { data: contributionsData, error: contributionsError } = await supabase
          .from('contributions')
          .select('*')
          .eq('adherent_id', profileData.id_adherent)
          .order('date_contribution', { ascending: false });

        if (contributionsError) throw contributionsError;
        setContributions(contributionsData || []);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateTotalContributions = () => {
    return contributions.reduce((sum, c) => sum + Number(c.montant), 0);
  };

  const getContributionsByType = () => {
    const byType: Record<string, number> = {};
    contributions.forEach(c => {
      const type = c.type.toLowerCase();
      byType[type] = (byType[type] || 0) + Number(c.montant);
    });
    return byType;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Profil non trouvé</h2>
              <p className="text-muted-foreground">
                Votre profil membre n'est pas encore associé à votre compte.
                Veuillez contacter l'administration.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl">
                {profile.prenom[0]}{profile.nom[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                {profile.prenom} {profile.nom}
              </h1>
              <p className="text-muted-foreground">
                Membre depuis {format(new Date(profile.date_inscription), 'MMMM yyyy', { locale: fr })}
              </p>
              {profile.fonction_eglise && (
                <Badge className="mt-2">{profile.fonction_eglise}</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Informations Personnelles
          </TabsTrigger>
          <TabsTrigger value="contributions" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Mes Contributions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations de Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.email}</span>
                </div>
              )}
              {profile.telephone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.telephone}</span>
                </div>
              )}
              {profile.adresse && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{profile.adresse}</span>
                </div>
              )}
              {profile.quartier && (
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Quartier: {profile.quartier}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informations Personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Genre</p>
                  <p className="font-medium">{profile.sexe === 'M' ? 'Masculin' : 'Féminin'}</p>
                </div>
                {profile.date_naissance && (
                  <div>
                    <p className="text-sm text-muted-foreground">Date de naissance</p>
                    <p className="font-medium">
                      {format(new Date(profile.date_naissance), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">ID Membre</p>
                  <p className="font-medium font-mono text-xs">{profile.id_adherent}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date d'inscription</p>
                  <p className="font-medium">
                    {format(new Date(profile.date_inscription), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contributions" className="space-y-4">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Résumé des Contributions</CardTitle>
              <CardDescription>Vue d'ensemble de vos contributions à l'église</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold">{formatCurrency(calculateTotalContributions())}</p>
                  <p className="text-sm text-muted-foreground">Total Cumulé</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold">{contributions.length}</p>
                  <p className="text-sm text-muted-foreground">Nombre de Contributions</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold">
                    {contributions.length > 0 
                      ? formatCurrency(calculateTotalContributions() / contributions.length)
                      : formatCurrency(0)
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">Moyenne</p>
                </div>
              </div>

              {/* Breakdown by Type */}
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">Répartition par Type</h4>
                <div className="space-y-2">
                  {Object.entries(getContributionsByType()).map(([type, amount]) => (
                    <div key={type} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <span className="capitalize">{type}</span>
                      <span className="font-medium">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contributions List */}
          <Card>
            <CardHeader>
              <CardTitle>Historique des Contributions</CardTitle>
              <CardDescription>Liste détaillée de toutes vos contributions</CardDescription>
            </CardHeader>
            <CardContent>
              {contributions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Aucune contribution enregistrée
                </p>
              ) : (
                <div className="space-y-2">
                  {contributions.map((contribution) => (
                    <div key={contribution.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-medium">{contribution.type}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(contribution.date_contribution), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      </div>
                      <p className="font-bold text-lg">
                        {formatCurrency(contribution.montant)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MemberProfile;