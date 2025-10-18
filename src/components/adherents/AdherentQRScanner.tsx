import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, QrCode, User, Phone, Mail, MapPin, Calendar } from "lucide-react";
import QrScanner from "qr-scanner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ScannedAdherent {
  id_adherent: string;
  nom: string;
  prenom: string;
  sexe: string;
  date_naissance: string | null;
  adresse: string | null;
  quartier: string | null;
  telephone: string | null;
  email: string | null;
  fonction_eglise: string | null;
  mpandray: boolean;
  etat_civil: string | null;
  faritra: string | null;
  date_inscription: string;
}

export function AdherentQRScanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedAdherent, setScannedAdherent] = useState<ScannedAdherent | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScanner | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  const startScanning = () => {
    setIsScanning(true);
  };

  useEffect(() => {
    const runScanner = async () => {
      if (!isScanning || !videoRef.current) return;
      
      try {
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
          (result) => handleScanResult(result.data),
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
            preferredCamera: 'environment'
          }
        );

        await qrScannerRef.current.start();
      } catch (error) {
        console.error("Erreur lors du démarrage du scanner:", error);
        toast({
          title: "Erreur de caméra",
          description: "Impossible d'accéder à la caméra",
          variant: "destructive",
        });
        setIsScanning(false);
      }
    };

    runScanner();
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
      let adherentId: string;
      
      try {
        const parsedData = JSON.parse(data);
        if (parsedData && typeof parsedData === 'object' && parsedData.id) {
          adherentId = parsedData.id.toString();
        } else if (parsedData && typeof parsedData === 'string') {
          adherentId = parsedData.trim();
        } else {
          adherentId = data.trim();
        }
      } catch {
        adherentId = data.trim();
      }

      // Validation UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(adherentId)) {
        toast({
          title: "Format d'ID invalide",
          description: "L'identifiant extrait du QR code n'est pas au bon format",
          variant: "destructive",
        });
        return;
      }
      
      const { data: adherent, error } = await supabase
        .from('adherents')
        .select('*')
        .eq('id_adherent', adherentId)
        .single();

      if (error || !adherent) {
        toast({
          title: "Adhérent introuvable",
          description: "Aucun adhérent ne correspond à ce QR code",
          variant: "destructive",
        });
        return;
      }

      setScannedAdherent(adherent);
      toast({
        title: "Scan réussi",
        description: `Informations de ${adherent.nom} ${adherent.prenom} chargées`,
      });

    } catch (error) {
      console.error("Erreur lors du traitement du scan:", error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors du traitement du QR code",
        variant: "destructive",
      });
    }
  };

  const resetScan = () => {
    setScannedAdherent(null);
  };

  const handleDialogClose = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      stopScanning();
      resetScan();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsOpen(true)} className="gap-2">
          <QrCode className="h-4 w-4" />
          Scanner QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Scanner QR Code Adhérent</DialogTitle>
        </DialogHeader>

        {!scannedAdherent ? (
          <div className="space-y-4">
            {!isScanning ? (
              <div className="text-center space-y-4">
                <Camera className="h-16 w-16 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Cliquez pour scanner le QR code d'un adhérent
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
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {scannedAdherent.nom} {scannedAdherent.prenom}
                    </CardTitle>
                    <CardDescription>
                      {scannedAdherent.sexe === 'M' ? 'Homme' : 'Femme'}
                      {scannedAdherent.mpandray && <Badge className="ml-2" variant="default">Mpandray</Badge>}
                    </CardDescription>
                  </div>
                  <User className="h-12 w-12 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {scannedAdherent.date_naissance && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Date de naissance:</strong> {new Date(scannedAdherent.date_naissance).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}

                {scannedAdherent.telephone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Téléphone:</strong> {scannedAdherent.telephone}
                    </span>
                  </div>
                )}

                {scannedAdherent.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Email:</strong> {scannedAdherent.email}
                    </span>
                  </div>
                )}

                {(scannedAdherent.adresse || scannedAdherent.quartier) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Adresse:</strong> {scannedAdherent.adresse || scannedAdherent.quartier || '-'}
                      {scannedAdherent.adresse && scannedAdherent.quartier && `, ${scannedAdherent.quartier}`}
                    </span>
                  </div>
                )}

                {scannedAdherent.fonction_eglise && (
                  <div className="text-sm">
                    <strong>Fonction:</strong> {scannedAdherent.fonction_eglise}
                  </div>
                )}

                {scannedAdherent.etat_civil && (
                  <div className="text-sm">
                    <strong>État civil:</strong> {scannedAdherent.etat_civil}
                  </div>
                )}

                {scannedAdherent.faritra && (
                  <div className="text-sm">
                    <strong>Faritra:</strong> {scannedAdherent.faritra}
                  </div>
                )}

                <div className="text-sm">
                  <strong>Date d'inscription:</strong> {new Date(scannedAdherent.date_inscription).toLocaleDateString('fr-FR')}
                </div>
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
