import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, DollarSign, Users, TrendingUp, CalendarDays } from "lucide-react";
import { QRScanner } from "./QRScanner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdidyRecord {
  id: string;
  adherent_id: string;
  mois: number;
  annee: number;
  montant: number;
  paye: boolean;
  date_paiement: string | null;
  adherents?: {
    nom: string;
    prenom: string;
  };
}

interface AdidyStats {
  totalMpandray: number;
  paiements: number;
  montantTotal: number;
  tauxPaiement: number;
}

export function AdidyManager() {
  const [records, setRecords] = useState<AdidyRecord[]>([]);
  const [stats, setStats] = useState<AdidyStats>({
    totalMpandray: 0,
    paiements: 0,
    montantTotal: 0,
    tauxPaiement: 0
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [showUnpaidOnly, setShowUnpaidOnly] = useState(false);
  const [minAmount, setMinAmount] = useState(0);
  const [advancePaymentEnabled, setAdvancePaymentEnabled] = useState<{[key: string]: boolean}>({});
  const [advancePaymentAmount, setAdvancePaymentAmount] = useState<{[key: string]: number}>({});
  const [editingMontant, setEditingMontant] = useState<{[key: string]: number}>({});
  const [calendarData, setCalendarData] = useState<AdidyRecord[]>([]);
  const [selectedAdherent, setSelectedAdherent] = useState<{id: string, nom: string, prenom: string} | null>(null);
  const { toast } = useToast();

  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  useEffect(() => {
    fetchAdidyData();
  }, [selectedMonth, selectedYear]);

  const filteredRecords = records.filter(record => {
    if (showUnpaidOnly && record.paye) return false;
    if (minAmount > 0 && record.montant < minAmount) return false;
    return true;
  });

  const fetchAdidyData = async () => {
    setLoading(true);
    try {
      // Récupérer les données Adidy en excluant les Mpandray décédés
      const { data, error } = await supabase
        .from('adidy')
        .select(`
          *,
          adherents!inner (nom, prenom, decede)
        `)
        .eq('mois', selectedMonth)
        .eq('annee', selectedYear)
        .eq('adherents.decede', false)
        .order('adherents(nom)');

      if (error) throw error;

      setRecords(data || []);
      
      // Calculer les statistiques
      const totalRecords = data?.length || 0;
      const paidRecords = data?.filter(r => r.paye).length || 0;
      const totalAmount = data?.filter(r => r.paye).reduce((sum, r) => sum + Number(r.montant), 0) || 0;
      
      setStats({
        totalMpandray: totalRecords,
        paiements: paidRecords,
        montantTotal: totalAmount,
        tauxPaiement: totalRecords > 0 ? (paidRecords / totalRecords) * 100 : 0
      });
    } catch (error) {
      console.error('Erreur lors du chargement des données Adidy:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données Adidy",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentToggle = async (recordId: string, isPaid: boolean) => {
    try {
      const { error } = await supabase
        .from('adidy')
        .update({
          paye: isPaid,
          date_paiement: isPaid ? new Date().toISOString().split('T')[0] : null
        })
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Paiement ${isPaid ? 'enregistré' : 'annulé'}`,
      });

      fetchAdidyData();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le paiement",
        variant: "destructive",
      });
    }
  };

  const handleAdvancePayment = async (adherentId: string, montant: number) => {
    try {
      if (montant < 500) {
        toast({
          title: "Montant invalide",
          description: "Le montant minimum pour l'Adidy est de 500 Ar.",
          variant: "destructive",
        });
        return;
      }

      let remainingAmount = montant;
      const recordsToUpdate: AdidyRecord[] = [];

      // Récupérer TOUS les enregistrements Adidy non payés pour cet adhérent à partir du mois actuel
      const { data: unpaidRecords, error: fetchError } = await supabase
        .from('adidy')
        .select(`
          *,
          adherents!inner (nom, prenom)
        `)
        .eq('adherent_id', adherentId)
        .eq('paye', false)
        .order('annee', { ascending: true })
        .order('mois', { ascending: true });

      if (fetchError) throw fetchError;

      if (!unpaidRecords || unpaidRecords.length === 0) {
        toast({
          title: "Aucun mois à payer",
          description: "Tous les mois sont déjà payés.",
          variant: "destructive",
        });
        return;
      }

      // Filtrer pour commencer à partir du mois sélectionné
      const filteredRecords = unpaidRecords.filter(record => {
        if (record.annee > selectedYear) return true;
        if (record.annee === selectedYear && record.mois >= selectedMonth) return true;
        return false;
      });

      if (filteredRecords.length === 0) {
        toast({
          title: "Aucun mois disponible",
          description: "Aucun mois non payé disponible à partir de la période actuelle.",
          variant: "destructive",
        });
        return;
      }

      // Distribuer le montant sur tous les mois jusqu'à épuisement
      for (const record of filteredRecords) {
        if (remainingAmount >= 500) {
          recordsToUpdate.push(record);
          remainingAmount -= 500;
        } else {
          break;
        }
      }

      if (recordsToUpdate.length === 0) {
        toast({
          title: "Montant insuffisant",
          description: "Le montant ne couvre aucun mois complet.",
          variant: "destructive",
        });
        return;
      }

      // Mettre à jour chaque enregistrement
      const today = new Date().toISOString().split('T')[0];
      const updates = recordsToUpdate.map(record =>
        supabase
          .from('adidy')
          .update({
            paye: true,
            montant: 500,
            date_paiement: today
          })
          .eq('id', record.id)
      );

      await Promise.all(updates);

      const monthNames = recordsToUpdate.map(r => 
        `${months[r.mois - 1]} ${r.annee}`
      ).join(', ');

      const reliquat = remainingAmount;
      const descriptionMessage = reliquat > 0 
        ? `${recordsToUpdate.length} mois payés (${monthNames}) pour ${recordsToUpdate.length * 500} Ar. ${reliquat} Ar ignorés.`
        : `${recordsToUpdate.length} mois payés (${monthNames}) pour ${recordsToUpdate.length * 500} Ar.`;

      toast({
        title: "Paiement en avance effectué",
        description: descriptionMessage,
      });

      // Réinitialiser
      setAdvancePaymentAmount(prev => ({...prev, [adherentId]: 0}));
      setAdvancePaymentEnabled(prev => ({...prev, [adherentId]: false}));
      fetchAdidyData();
    } catch (error) {
      console.error('Erreur lors du paiement en avance:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'effectuer le paiement en avance",
        variant: "destructive",
      });
    }
  };

  const handleMontantChange = async (recordId: string, newMontant: number) => {
    try {
      // Validation du montant minimum
      if (newMontant < 500) {
        toast({
          title: "Montant invalide",
          description: "Le montant minimum pour l'Adidy est de 500 Ar.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('adidy')
        .update({ montant: newMontant })
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Montant mis à jour",
        description: `Le montant a été mis à jour à ${newMontant} Ar.`,
      });

      // Nettoyer l'état d'édition
      setEditingMontant(prev => {
        const newState = {...prev};
        delete newState[recordId];
        return newState;
      });

      fetchAdidyData();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du montant:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le montant",
        variant: "destructive",
      });
    }
  };

  const fetchCalendarData = async (adherentId: string, adherentNom: string, adherentPrenom: string) => {
    try {
      const { data, error } = await supabase
        .from('adidy')
        .select('*')
        .eq('adherent_id', adherentId)
        .eq('annee', selectedYear)
        .order('mois');

      if (error) throw error;

      setCalendarData(data || []);
      setSelectedAdherent({ id: adherentId, nom: adherentNom, prenom: adherentPrenom });
    } catch (error) {
      console.error('Erreur lors du chargement du calendrier:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le calendrier de paiement",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestion des Adidy</h2>
          <p className="text-muted-foreground">
            Suivi mensuel des cotisations des Mpandray
          </p>
        </div>

        {/* Scanner QR Code */}
        <div className="flex gap-2">
          <QRScanner onPaymentSuccess={fetchAdidyData} />
          <Button onClick={fetchAdidyData} variant="outline">
            Actualiser
          </Button>
        </div>
      </div>

      {/* Sélecteur de période */}
      <Card>
        <CardHeader>
          <CardTitle>Période</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div>
              <Label htmlFor="month">Mois</Label>
              <select
                id="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="block w-full mt-1 border border-input bg-background px-3 py-2 rounded-md"
              >
                {months.map((month, index) => (
                  <option key={index + 1} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="year">Année</Label>
              <select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="block w-32 mt-1 border border-input bg-background px-3 py-2 rounded-md"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-4 mt-4 flex-wrap">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="unpaidOnly"
                checked={showUnpaidOnly}
                onCheckedChange={(checked) => setShowUnpaidOnly(checked as boolean)}
              />
              <Label htmlFor="unpaidOnly">Afficher uniquement les non-payés</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="minAmount">Montant minimum :</Label>
              <Input
                id="minAmount"
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(Number(e.target.value))}
                placeholder="500"
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">Ar</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mpandray</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMpandray}</div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-gradient-to-r from-green-500/5 to-green-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paiements</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paiements}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-blue-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.montantTotal.toLocaleString()} Ar</div>
          </CardContent>
        </Card>

        <Card className="border-orange-500/20 bg-gradient-to-r from-orange-500/5 to-orange-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Paiement</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.tauxPaiement.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des paiements */}
      <Card>
        <CardHeader>
          <CardTitle>Suivi des paiements - {months[selectedMonth - 1]} {selectedYear}</CardTitle>
          <CardDescription>
            Cochez pour marquer comme payé, modifiez le montant si nécessaire
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <div
                key={record.id}
                className={`flex items-center justify-between p-4 border rounded-lg transition-all ${
                  record.paye ? 'border-green-500/30 bg-green-50/30' : 'border-border'
                }`}
              >
                  <div className="flex items-center space-x-4">
                  <Checkbox
                    checked={record.paye}
                    onCheckedChange={(checked) =>
                      handlePaymentToggle(record.id, checked as boolean)
                    }
                    disabled={(editingMontant[record.id] ?? record.montant) < 500}
                  />
                  <div>
                    <p className="font-medium">
                      {record.adherents.nom} {record.adherents.prenom}
                    </p>
                    {record.date_paiement && (
                      <p className="text-sm text-muted-foreground">
                        Payé le {new Date(record.date_paiement).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4 flex-wrap gap-2">
                  {!advancePaymentEnabled[record.adherent_id] ? (
                    <>
                      <div className="flex flex-col items-end">
                        <Input
                          type="number"
                          value={editingMontant[record.id] ?? record.montant}
                          onChange={(e) => {
                            const newValue = Number(e.target.value);
                            setEditingMontant(prev => ({
                              ...prev,
                              [record.id]: newValue
                            }));
                          }}
                          onBlur={(e) => {
                            const newValue = Number(e.target.value);
                            if (newValue !== record.montant && newValue >= 500) {
                              handleMontantChange(record.id, newValue);
                            } else if (newValue < 500) {
                              // Réinitialiser à la valeur d'origine si invalide
                              setEditingMontant(prev => {
                                const newState = {...prev};
                                delete newState[record.id];
                                return newState;
                              });
                            }
                          }}
                          className={`w-32 ${(editingMontant[record.id] ?? record.montant) < 500 ? 'border-destructive' : ''}`}
                          placeholder="Min 500"
                          min="500"
                          step="100"
                        />
                        {(editingMontant[record.id] ?? record.montant) < 500 && (
                          <span className="text-xs text-destructive mt-1">Min 500 Ar requis</span>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">Ar</span>
                      <Badge variant={record.paye ? "default" : "secondary"}>
                        {record.paye ? "Payé" : "En attente"}
                      </Badge>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col items-end">
                        <Input
                          type="number"
                          value={advancePaymentAmount[record.adherent_id] || 0}
                          onChange={(e) => setAdvancePaymentAmount(prev => ({
                            ...prev,
                            [record.adherent_id]: Number(e.target.value)
                          }))}
                          className="w-32"
                          placeholder="Montant total"
                          min="500"
                          step="500"
                        />
                        <span className="text-xs text-muted-foreground mt-1">
                          {advancePaymentAmount[record.adherent_id] >= 500 
                            ? `${Math.floor((advancePaymentAmount[record.adherent_id] || 0) / 500)} mois` 
                            : 'Min 500 Ar'}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">Ar</span>
                      <Button
                        size="sm"
                        onClick={() => handleAdvancePayment(record.adherent_id, advancePaymentAmount[record.adherent_id] || 0)}
                        disabled={(advancePaymentAmount[record.adherent_id] || 0) < 500}
                      >
                        Payer en avance
                      </Button>
                    </>
                  )}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`advance-${record.id}`}
                      checked={advancePaymentEnabled[record.adherent_id] || false}
                      onCheckedChange={(checked) => {
                        setAdvancePaymentEnabled(prev => ({
                          ...prev,
                          [record.adherent_id]: checked as boolean
                        }));
                        if (!checked) {
                          setAdvancePaymentAmount(prev => ({
                            ...prev,
                            [record.adherent_id]: 0
                          }));
                        }
                      }}
                    />
                    <Label htmlFor={`advance-${record.id}`} className="text-xs cursor-pointer whitespace-nowrap">
                      Paiement avance
                    </Label>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => fetchCalendarData(record.adherent_id, record.adherents.nom, record.adherents.prenom)}
                      >
                        <CalendarDays className="h-4 w-4 mr-2" />
                        Calendrier
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>
                          Calendrier de paiement - {selectedAdherent?.nom} {selectedAdherent?.prenom}
                        </DialogTitle>
                        <DialogDescription>
                          Aperçu des paiements pour l'année {selectedYear}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        {months.map((month, index) => {
                          const monthData = calendarData.find(d => d.mois === index + 1);
                          const isPaid = monthData?.paye || false;
                          const montant = monthData?.montant || 0;
                          const datePaiement = monthData?.date_paiement;

                          return (
                            <div
                              key={index}
                              className={`p-4 border rounded-lg ${
                                isPaid 
                                  ? 'border-green-500/50 bg-green-50/50' 
                                  : 'border-border bg-background'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-sm">{month}</h4>
                                <Badge variant={isPaid ? "default" : "secondary"} className="text-xs">
                                  {isPaid ? "Payé" : "Non payé"}
                                </Badge>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm">
                                  <span className="text-muted-foreground">Montant: </span>
                                  <span className="font-semibold">{montant} Ar</span>
                                </p>
                                {datePaiement && (
                                  <p className="text-xs text-muted-foreground">
                                    Payé le {new Date(datePaiement).toLocaleDateString('fr-FR')}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Total payé: </span>
                            <span className="font-bold text-green-600">
                              {calendarData.filter(d => d.paye).reduce((sum, d) => sum + Number(d.montant), 0)} Ar
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Mois payés: </span>
                            <span className="font-bold">
                              {calendarData.filter(d => d.paye).length} / {calendarData.length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
            {filteredRecords.length === 0 && records.length > 0 && (
              <p className="text-center text-muted-foreground py-8">
                Aucun résultat ne correspond aux filtres sélectionnés
              </p>
            )}
            {records.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Aucun Mpandray trouvé pour cette période
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}