import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, CreditCard, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface Adherent {
  id_adherent: string;
  nom: string;
  prenom: string;
  sexe: string;
  date_naissance: string | null;
  quartier: string | null;
  fonction_eglise: string | null;
  etat_civil: string | null;
  faritra: string | null;
  sampana: {
    nom_sampana: string;
  } | null;
}

export function CardGenerator() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAdherent, setSelectedAdherent] = useState<Adherent | null>(null);
  const [adherents, setAdherents] = useState<Adherent[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const searchAdherents = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('adherents')
        .select(`
          *,
          sampana (nom_sampana)
        `)
        .or(`nom.ilike.%${searchTerm}%,prenom.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;
      setAdherents(data || []);
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rechercher les adhérents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCard = async () => {
    if (!selectedAdherent || !cardRef.current) return;

    setGenerating(true);
    try {
      // Générer le QR code avec les informations de l'adhérent
      const qrData = JSON.stringify({
        id: selectedAdherent.id_adherent,
        nom: selectedAdherent.nom,
        prenom: selectedAdherent.prenom,
        quartier: selectedAdherent.quartier,
        fonction: selectedAdherent.fonction_eglise
      });

      const qrCodeUrl = await QRCode.toDataURL(qrData, {
        width: 120,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Mettre à jour l'image QR dans la carte
      const qrImg = cardRef.current.querySelector('#qr-code') as HTMLImageElement;
      if (qrImg) {
        qrImg.src = qrCodeUrl;
      }

      // Attendre que l'image soit chargée
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capturer la carte en image
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#ffffff'
      });

      // Créer le PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [85.6, 53.98] // Taille carte de crédit
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 53.98);
      
      // Télécharger le PDF
      pdf.save(`carte_${selectedAdherent.nom}_${selectedAdherent.prenom}.pdf`);

      toast({
        title: "Succès",
        description: "Carte générée et téléchargée avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer la carte",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Non renseigné";
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getAge = (dateString: string | null) => {
    if (!dateString) return "";
    const birthDate = new Date(dateString);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return `${age} ans`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Générateur de Cartes</h2>
        <p className="text-muted-foreground">
          Générez des cartes d'adhérents avec QR code
        </p>
      </div>

      {/* Recherche d'adhérent */}
      <Card>
        <CardHeader>
          <CardTitle>Rechercher un adhérent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Nom ou prénom</Label>
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchAdherents()}
                placeholder="Rechercher par nom ou prénom..."
              />
            </div>
            <Button 
              onClick={searchAdherents} 
              disabled={loading || !searchTerm.trim()}
              className="mt-6"
            >
              <Search className="h-4 w-4 mr-2" />
              Rechercher
            </Button>
          </div>

          {/* Résultats de recherche */}
          {adherents.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-medium">Résultats :</h4>
              {adherents.map((adherent) => (
                <div
                  key={adherent.id_adherent}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedAdherent?.id_adherent === adherent.id_adherent
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedAdherent(adherent)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        {adherent.nom} {adherent.prenom}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {adherent.quartier} • {adherent.fonction_eglise}
                      </p>
                    </div>
                    <Badge variant="outline">{adherent.sexe === 'M' ? 'Homme' : 'Femme'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prévisualisation et génération */}
      {selectedAdherent && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Aperçu de la carte */}
          <Card>
            <CardHeader>
              <CardTitle>Aperçu de la carte</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                ref={cardRef}
                className="w-full max-w-sm mx-auto bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-lg shadow-lg overflow-hidden"
                style={{ aspectRatio: '85.6/53.98' }}
              >
                <div className="p-4 h-full flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg leading-tight">
                        {selectedAdherent.nom}
                      </h3>
                      <p className="text-sm opacity-90">
                        {selectedAdherent.prenom}
                      </p>
                    </div>
                    <img
                      id="qr-code"
                      alt="QR Code"
                      className="w-12 h-12 bg-white rounded"
                    />
                  </div>
                  
                  <div className="flex-1 text-xs space-y-1">
                    {selectedAdherent.quartier && (
                      <p className="opacity-80">📍 {selectedAdherent.quartier}</p>
                    )}
                    {selectedAdherent.fonction_eglise && (
                      <p className="opacity-80">⛪ {selectedAdherent.fonction_eglise}</p>
                    )}
                    {selectedAdherent.sampana && (
                      <p className="opacity-80">👥 {selectedAdherent.sampana.nom_sampana}</p>
                    )}
                  </div>
                  
                  <div className="mt-auto pt-2 border-t border-white/20">
                    <p className="text-xs text-center opacity-70">
                      FJKM Vatomandry
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations et génération */}
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'adhérent</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Nom complet :</span>
                  <span className="font-medium">{selectedAdherent.nom} {selectedAdherent.prenom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Sexe :</span>
                  <span>{selectedAdherent.sexe === 'M' ? 'Homme' : 'Femme'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Date de naissance :</span>
                  <span>{formatDate(selectedAdherent.date_naissance)} {getAge(selectedAdherent.date_naissance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Quartier :</span>
                  <span>{selectedAdherent.quartier || "Non renseigné"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Fonction :</span>
                  <span>{selectedAdherent.fonction_eglise || "Non renseigné"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">État civil :</span>
                  <span>
                    {selectedAdherent.etat_civil 
                      ? (selectedAdherent.etat_civil === 'marie' ? 'Marié(e)' : 
                         selectedAdherent.etat_civil === 'celibataire' ? 'Célibataire' : 'Veuf/Veuve')
                      : "Non renseigné"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Faritra :</span>
                  <span>
                    {selectedAdherent.faritra 
                      ? selectedAdherent.faritra.charAt(0).toUpperCase() + selectedAdherent.faritra.slice(1)
                      : "Non renseigné"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Sampana :</span>
                  <span>{selectedAdherent.sampana?.nom_sampana || "Non renseigné"}</span>
                </div>
              </div>

              <Button 
                onClick={generateCard} 
                disabled={generating}
                className="w-full"
              >
                {generating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Générer et télécharger la carte
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}