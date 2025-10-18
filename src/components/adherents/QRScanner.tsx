import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, QrCode, CheckCircle, XCircle, Loader2 } from "lucide-react";
import QrScanner from "qr-scanner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ScannedAdherent {
  id: string;
  nom: string;
  prenom: string;
  mpandray: boolean;
  adidyRecord?: {
    id: string;
    montant: number;
    paye: boolean;
    date_paiement: string | null;
    mois: number;
    annee: number;
  };
}

export function QRScanner({ onPaymentSuccess }: { onPaymentSuccess?: () => void }) {
  console.log("QRScanner component rendered");
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedAdherent, setScannedAdherent] = useState<ScannedAdherent | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(500);
  const [enableAdvancePayment, setEnableAdvancePayment] = useState(false);
  const [processing, setProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const { toast } = useToast();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    return () => {
      // Cleanup scanner when component unmounts
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  // Nouvelle logique : startScanning ne fait que setIsScanning(true)
  const startScanning = () => {
    setIsScanning(true);
  };

  // Quand isScanning passe à true, on lance le scan (la balise <video> est alors présente)
  useEffect(() => {
    const runScanner = async () => {
      if (!isScanning || !videoRef.current) return;
      try {
        // Vérifier les permissions de caméra
        const hasCamera = await QrScanner.hasCamera();
        if (!hasCamera) {
          toast({
            title: "Caméra non disponible",
            description: "Aucune caméra n'a été détectée sur cet appareil",
            variant: "destructive",
          });
          setIsScanning(false);
          return;
        }
        if (qrScannerRef.current) {
          qrScannerRef.current.destroy();
        }
        qrScannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            console.log("Résultat du scan:", result.data);
            handleScanResult(result.data);
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: 'environment'
          }
        );
        await qrScannerRef.current.start();
        console.log("Scanner QR démarré avec succès");
      } catch (error) {
        console.error("Erreur lors du démarrage du scanner:", error);
        let errorMessage = "Impossible d'accéder à la caméra";
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError') {
            errorMessage = "Accès à la caméra refusé. Veuillez autoriser l'accès à la caméra dans les paramètres.";
          } else if (error.name === 'NotFoundError') {
            errorMessage = "Aucune caméra trouvée sur cet appareil";
          }
        }
        toast({
          title: "Erreur de caméra",
          description: errorMessage,
          variant: "destructive",
        });
        setIsScanning(false);
      }
    };
    runScanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isScanning]);

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
    }
    setIsScanning(false);
  };

  const handleScanResult = async (data: string) => {
    stopScanning();
    
    try {
      // Le QR code peut contenir soit un ID simple, soit un objet JSON
      let adherentId: string;
      
      try {
        // Tenter de parser en JSON d'abord
        const parsedData = JSON.parse(data);
        if (parsedData && typeof parsedData === 'object' && parsedData.id) {
          adherentId = parsedData.id.toString();
          console.log("QR Code JSON scanné:", parsedData);
        } else if (parsedData && typeof parsedData === 'string') {
          adherentId = parsedData.trim();
        } else {
          adherentId = data.trim();
        }
      } catch {
        // Si ce n'est pas du JSON, utiliser comme ID direct
        adherentId = data.trim();
      }
      
      console.log("ID adhérent extrait:", adherentId);

      // Validation du format de l'ID
      if (!adherentId || adherentId.length === 0) {
        toast({
          title: "QR Code invalide",
          description: "Le QR code scanné ne contient pas d'identifiant valide",
          variant: "destructive",
        });
        return;
      }

      // Validation du format UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(adherentId)) {
        toast({
          title: "Format d'ID invalide",
          description: "L'identifiant extrait du QR code n'est pas au bon format",
          variant: "destructive",
        });
        return;
      }
      
      // Vérifier que l'adhérent existe et est Mpandray
      const { data: adherent, error: adherentError } = await supabase
        .from('adherents')
        .select('id_adherent, nom, prenom, mpandray')
        .eq('id_adherent', adherentId)
        .single();

      if (adherentError) {
        console.error("Erreur Supabase:", adherentError);
        if (adherentError.code === 'PGRST116') {
          toast({
            title: "Adhérent introuvable",
            description: `L'adhérent avec l'ID "${adherentId}" n'existe pas dans la base de données`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erreur de base de données",
            description: "Impossible de récupérer les informations de l'adhérent",
            variant: "destructive",
          });
        }
        return;
      }

      if (!adherent) {
        toast({
          title: "Adhérent introuvable",
          description: `L'adhérent avec l'ID "${adherentId}" n'existe pas dans la base de données`,
          variant: "destructive",
        });
        return;
      }

      if (!adherent.mpandray) {
        toast({
          title: "Adhérent non Mpandray",
          description: `${adherent.nom} ${adherent.prenom} n'est pas enregistré comme Mpandray`,
          variant: "destructive",
        });
        return;
      }

      // Vérifier le paiement Adidy du mois en cours
      const { data: adidyRecord, error: adidyError } = await supabase
        .from('adidy')
        .select('*')
        .eq('adherent_id', adherentId)
        .eq('mois', currentMonth)
        .eq('annee', currentYear)
        .maybeSingle();

      if (adidyError) {
        console.error("Erreur lors de la vérification Adidy:", adidyError);
        toast({
          title: "Erreur Adidy",
          description: "Impossible de vérifier le statut du paiement pour ce mois",
          variant: "destructive",
        });
        return;
      }

      // Si aucun enregistrement Adidy existe pour ce mois, créer un nouveau
      let finalAdidyRecord = adidyRecord;
      if (!adidyRecord) {
        console.log("Création d'un nouvel enregistrement Adidy pour", adherentId);
        const { data: newRecord, error: createError } = await supabase
          .from('adidy')
          .insert({
            adherent_id: adherentId,
            mois: currentMonth,
            annee: currentYear,
            montant: 0,
            paye: false
          })
          .select()
          .single();

        if (createError) {
          console.error("Erreur lors de la création de l'enregistrement Adidy:", createError);
          toast({
            title: "Erreur de création",
            description: "Impossible de créer l'enregistrement Adidy",
            variant: "destructive",
          });
          return;
        }
        finalAdidyRecord = newRecord;
      }

      setScannedAdherent({
        id: adherent.id_adherent,
        nom: adherent.nom,
        prenom: adherent.prenom,
        mpandray: adherent.mpandray,
        adidyRecord: finalAdidyRecord || undefined,
      });

      // Message de succès
      toast({
        title: "Scan réussi",
        description: `${adherent.nom} ${adherent.prenom} trouvé`,
        variant: "default",
      });

    } catch (error) {
      console.error("Erreur lors du traitement du scan:", error);
      toast({
        title: "Erreur inattendue",
        description: "Une erreur inattendue s'est produite lors du traitement du QR code",
        variant: "destructive",
      });
    }
  };

  const handlePayment = async () => {
    if (!scannedAdherent || !scannedAdherent.adidyRecord) return;

    setProcessing(true);

    try {
      if (paymentAmount < 500) {
        toast({
          title: "Montant invalide",
          description: "Le montant minimum pour l'Adidy est de 500 Ar.",
          variant: "destructive",
        });
        setProcessing(false);
        return;
      }

      if (enableAdvancePayment && paymentAmount > 500) {
        // Paiement en avance : distribuer sur plusieurs mois
        let remainingAmount = paymentAmount;
        const recordsToUpdate: any[] = [];

        // Récupérer tous les enregistrements Adidy non payés à partir du mois actuel
        const { data: unpaidRecords, error: fetchError } = await supabase
          .from('adidy')
          .select('*')
          .eq('adherent_id', scannedAdherent.id)
          .eq('paye', false)
          .order('annee', { ascending: true })
          .order('mois', { ascending: true });

        if (fetchError) throw fetchError;

        // Filtrer pour commencer à partir du mois actuel
        const filteredRecords = (unpaidRecords || []).filter(record => {
          if (record.annee > currentYear) return true;
          if (record.annee === currentYear && record.mois >= currentMonth) return true;
          return false;
        });

        // Distribuer le montant jusqu'à épuisement
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
            title: "Aucun mois à payer",
            description: "Aucun mois non payé disponible.",
            variant: "destructive",
          });
          setProcessing(false);
          return;
        }

        // Mettre à jour tous les enregistrements
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

        const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
          "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
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

        // Rafraîchir les données parent
        onPaymentSuccess?.();

        // Réinitialiser
        resetScan();
      } else {
        // Paiement normal pour le mois actuel
        const { error } = await supabase
          .from('adidy')
          .update({
            paye: true,
            montant: paymentAmount,
            date_paiement: new Date().toISOString().split('T')[0]
          })
          .eq('id', scannedAdherent.adidyRecord.id);

        if (error) throw error;

        toast({
          title: "Paiement enregistré",
          description: `Paiement de ${paymentAmount} Ar enregistré avec succès`,
        });

        // Rafraîchir les données parent
        onPaymentSuccess?.();

        // Mettre à jour l'état local
        setScannedAdherent(prev => prev ? {
          ...prev,
          adidyRecord: prev.adidyRecord ? {
            ...prev.adidyRecord,
            paye: true,
            montant: paymentAmount,
            date_paiement: new Date().toISOString().split('T')[0]
          } : undefined
        } : null);
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du paiement:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le paiement",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const resetScan = () => {
    setScannedAdherent(null);
    setPaymentAmount(500);
    setEnableAdvancePayment(false);
  };


  // Corrige la gestion d'ouverture/fermeture du Dialog
  const handleDialogClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      stopScanning();
      resetScan();
    }
  };

  console.log("QRScanner rendering button");
  
  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)} className="gap-2 bg-gradient-primary hover:shadow-glow">
          <QrCode className="h-4 w-4" />
          Scanner QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Scanner QR Code Mpandray</DialogTitle>
        </DialogHeader>

        {!scannedAdherent ? (
          <div className="space-y-4">
            {!isScanning ? (
              <div className="text-center space-y-4">
                <Camera className="h-16 w-16 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Cliquez pour scanner le QR code d'un Mpandray. 
                  <br />
                  Compatible avec tous les formats de QR codes générés par l'application.
                </p>
                <Button onClick={startScanning} className="w-full">
                  Démarrer le scan
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <video
                  ref={videoRef}
                  className="w-full h-64 bg-black rounded-lg object-cover"
                  autoPlay
                  muted
                />
                <Button onClick={stopScanning} variant="outline" className="w-full">
                  Arrêter le scan
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {scannedAdherent.nom} {scannedAdherent.prenom}
                </CardTitle>
                <CardDescription>
                  Mpandray - {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {scannedAdherent.adidyRecord ? (
                  scannedAdherent.adidyRecord.paye ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <Badge variant="default">Déjà payé</Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <p><strong>Montant:</strong> {scannedAdherent.adidyRecord.montant} Ar</p>
                        <p><strong>Date de paiement:</strong> {new Date(scannedAdherent.adidyRecord.date_paiement!).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-500" />
                        <Badge variant="secondary">Non payé</Badge>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amount">Montant payé</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="amount"
                            type="number"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(Number(e.target.value))}
                            className="flex-1"
                            min="500"
                            step="500"
                          />
                          <span className="text-sm text-muted-foreground">Ar</span>
                        </div>
                        {paymentAmount > 500 && (
                          <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                              id="advance-payment-qr"
                              checked={enableAdvancePayment}
                              onCheckedChange={(checked) => setEnableAdvancePayment(checked as boolean)}
                            />
                            <Label htmlFor="advance-payment-qr" className="text-xs cursor-pointer">
                              Paiement en avance ({Math.floor(paymentAmount / 500)} mois)
                            </Label>
                          </div>
                        )}
                      </div>
                      <Button 
                        onClick={handlePayment} 
                        disabled={processing || paymentAmount < 500}
                        className="w-full"
                      >
                        {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Valider le paiement
                      </Button>
                    </div>
                  )
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-orange-500" />
                    <span className="text-sm">Aucun enregistrement Adidy pour ce mois</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button onClick={resetScan} variant="outline" className="w-full">
              Scanner un autre QR code
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}