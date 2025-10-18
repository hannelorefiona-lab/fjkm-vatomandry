import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreditCard, Download, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import fjkmLogo from '@/assets/fjkm-logo.png';

interface Adherent {
  id_adherent: string;
  nom: string;
  prenom: string;
  date_naissance: string | null;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  fonction_eglise: string | null;
  quartier: string | null;
}

export const CardGenerator = () => {
  const [adherents, setAdherents] = useState<Adherent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAdherent, setSelectedAdherent] = useState<Adherent | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const fetchAdherents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('adherents')
        .select('*')
        .order('nom');

      if (error) throw error;
      setAdherents(data || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des adhérents");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateCard = async (adherent: Adherent) => {
    try {
      // Créer le PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 53.98] // Taille d'une carte de crédit
      });

      // Couleur de fond
      pdf.setFillColor(41, 128, 185); // Bleu FJKM
      pdf.rect(0, 0, 85.6, 53.98, 'F');

      // Ajouter le logo FJKM
      pdf.addImage(fjkmLogo, 'PNG', 5, 5, 12, 12);

      // En-tête FJKM
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.text('FJKM VATOMANDRY', 20, 10);
      
      pdf.setFontSize(7);
      pdf.setFont(undefined, 'normal');
      pdf.text('Fiangonan\'i Jesosy Kristy eto Madagasikara', 20, 15);

      // Ligne de séparation
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(255, 255, 255);
      pdf.line(5, 19, 80, 19);

      // Informations de l'adhérent
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      pdf.text(`${adherent.nom} ${adherent.prenom}`, 5, 26);

      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal');
      
      let yPosition = 31;
      if (adherent.fonction_eglise) {
        pdf.text(`Fonction: ${adherent.fonction_eglise}`, 5, yPosition);
        yPosition += 4;
      }
      
      if (adherent.quartier) {
        pdf.text(`Quartier: ${adherent.quartier}`, 5, yPosition);
        yPosition += 4;
      }

      // Générer le QR Code
      const qrData = JSON.stringify({
        id: adherent.id_adherent,
        nom: adherent.nom,
        prenom: adherent.prenom,
        fonction: adherent.fonction_eglise,
        date_generation: new Date().toISOString()
      });

      const qrCodeDataURL = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Ajouter le QR Code au PDF
      pdf.addImage(qrCodeDataURL, 'PNG', 58, 20, 25, 25);

      // Texte au bas de la carte
      pdf.setFontSize(6);
      pdf.text('Carte membre FJKM', 5, 48);
      pdf.text(new Date().getFullYear().toString(), 5, 52);

      // Télécharger le PDF
      const fileName = `carte_${adherent.nom}_${adherent.prenom}.pdf`;
      pdf.save(fileName);

      toast.success(`Carte générée pour ${adherent.nom} ${adherent.prenom}`);
    } catch (error: any) {
      toast.error("Erreur lors de la génération de la carte");
      console.error(error);
    }
  };

  const generateAllCards = async () => {
    if (adherents.length === 0) {
      toast.error("Aucun adhérent à traiter");
      return;
    }

    setLoading(true);
    try {
      // Créer un PDF avec plusieurs cartes
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let cardCount = 0;
      const cardsPerRow = 2;
      const cardsPerColumn = 5;
      const cardsPerPage = cardsPerRow * cardsPerColumn;
      
      const cardWidth = 85.6;
      const cardHeight = 53.98;
      const marginX = 10;
      const marginY = 10;

      for (const adherent of adherents) {
        if (cardCount > 0 && cardCount % cardsPerPage === 0) {
          pdf.addPage();
        }

        const row = Math.floor((cardCount % cardsPerPage) / cardsPerRow);
        const col = (cardCount % cardsPerPage) % cardsPerRow;
        
        const x = marginX + col * (cardWidth + 5);
        const y = marginY + row * (cardHeight + 5);

        // Générer le QR Code pour cet adhérent
        const qrData = JSON.stringify({
          id: adherent.id_adherent,
          nom: adherent.nom,
          prenom: adherent.prenom,
          fonction: adherent.fonction_eglise,
          date_generation: new Date().toISOString()
        });

        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
          width: 100,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        // Dessiner la carte
        pdf.setFillColor(41, 128, 185);
        pdf.rect(x, y, cardWidth, cardHeight, 'F');

        // Logo FJKM
        pdf.addImage(fjkmLogo, 'PNG', x + 2, y + 2, 8, 8);

        // En-tête
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(7);
        pdf.setFont(undefined, 'bold');
        pdf.text('FJKM VATOMANDRY', x + 12, y + 6);
        
        pdf.setFontSize(5);
        pdf.setFont(undefined, 'normal');
        pdf.text('Fiangonan\'i Jesosy Kristy eto Madagasikara', x + 12, y + 9);

      // Nom
      pdf.setFontSize(6);
      pdf.setFont(undefined, 'bold');
      pdf.text(`${adherent.nom} ${adherent.prenom}`, x + 2, y + 15);

        // Informations
        pdf.setFontSize(4);
        pdf.setFont(undefined, 'normal');
        if (adherent.fonction_eglise) {
          pdf.text(`Fonction: ${adherent.fonction_eglise}`, x + 2, y + 19);
        }
        if (adherent.quartier) {
          pdf.text(`Quartier: ${adherent.quartier}`, x + 2, y + 22);
        }

        // QR Code
        pdf.addImage(qrCodeDataURL, 'PNG', x + 58, y + 15, 20, 20);

        // Année
        pdf.setFontSize(4);
        pdf.text(new Date().getFullYear().toString(), x + 2, y + cardHeight - 2);

        cardCount++;
      }

      pdf.save('cartes_adherents_fjkm.pdf');
      toast.success(`${adherents.length} cartes générées avec succès`);
    } catch (error: any) {
      toast.error("Erreur lors de la génération des cartes");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAdherents = adherents.filter(adherent =>
    adherent.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adherent.prenom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="p-3 md:p-6">
        <CardTitle className="flex items-center gap-1.5 md:gap-2 text-base md:text-xl">
          <CreditCard className="h-4 w-4 md:h-5 md:w-5" />
          <span className="hidden sm:inline">Générateur de Cartes de Membres</span>
          <span className="sm:hidden">Cartes Membres</span>
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          <span className="hidden sm:inline">Générez des cartes de membres FJKM avec QR code</span>
          <span className="sm:hidden">Cartes avec QR code</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 md:p-6 space-y-3 md:space-y-4">
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={fetchAdherents} className="w-full text-xs md:text-sm">
              <Download className="mr-1.5 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Générer les cartes</span>
              <span className="sm:hidden">Générer</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] p-3 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-base md:text-lg">
                <span className="hidden sm:inline">Sélectionner les adhérents</span>
                <span className="sm:hidden">Sélection</span>
              </DialogTitle>
              <DialogDescription className="text-xs md:text-sm">
                <span className="hidden sm:inline">Choisissez les adhérents pour lesquels générer une carte</span>
                <span className="sm:hidden">Choisir adhérents</span>
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center gap-2">
                <Search className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-xs md:text-sm"
                />
              </div>

              <div className="border rounded-lg overflow-auto max-h-[50vh]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Nom</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">Prénom</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Fonction</TableHead>
                      <TableHead className="text-xs">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdherents.map((adherent) => (
                      <TableRow key={adherent.id_adherent}>
                        <TableCell className="text-xs md:text-sm">
                          <div className="flex flex-col">
                            <span>{adherent.nom}</span>
                            <span className="sm:hidden text-[10px] text-muted-foreground">
                              {adherent.prenom}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs md:text-sm hidden sm:table-cell">
                          {adherent.prenom}
                        </TableCell>
                        <TableCell className="text-xs hidden md:table-cell">
                          {adherent.fonction_eglise || '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => generateCard(adherent)}
                            className="text-xs h-7 px-2"
                          >
                            <Download className="h-3 w-3 sm:mr-1" />
                            <span className="hidden sm:inline">Générer</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowDialog(false)}
                className="w-full sm:w-auto text-xs md:text-sm"
              >
                Fermer
              </Button>
              <Button 
                onClick={generateAllCards} 
                disabled={loading}
                className="w-full sm:w-auto text-xs md:text-sm"
              >
                {loading ? "Génération..." : "Tout générer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};