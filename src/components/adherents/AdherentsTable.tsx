import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Edit, Trash2, Download, FileText, CreditCard, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import fjkmLogo from '@/assets/fjkm-logo.png';

interface Adherent {
  id_adherent: string;
  nom: string;
  prenom: string;
  sexe: string;
  date_naissance: string;
  adresse: string;
  quartier: string;
  telephone: string;
  email: string;
  fonction_eglise: string;
  date_inscription: string;
  etat_civil: string | null;
  mpandray: boolean;
  faritra: string | null;
  sampana_id: string | null;
  sampana?: {
    nom_sampana: string;
  };
}

interface AdherentsTableProps {
  onEditAdherent: (adherent: Adherent) => void;
  refreshTrigger: number;
}

export function AdherentsTable({ onEditAdherent, refreshTrigger }: AdherentsTableProps) {
  const [adherents, setAdherents] = useState<Adherent[]>([]);
  const [filteredAdherents, setFilteredAdherents] = useState<Adherent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sexeFilter, setSexeFilter] = useState('tous');
  const [quartierFilter, setQuartierFilter] = useState('tous');
  const [mpandrayFilter, setMpandrayFilter] = useState('tous');
  const [faritraFilter, setFaritraFilter] = useState('tous');
  const [quartiers, setQuartiers] = useState<string[]>([]);
  const [faritras, setFaritras] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchAdherents();
  }, [refreshTrigger]);

  useEffect(() => {
    filterAdherents();
  }, [adherents, searchTerm, sexeFilter, quartierFilter, mpandrayFilter, faritraFilter]);

  const fetchAdherents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('adherents')
        .select(`
          *,
          sampana (
            nom_sampana
          )
        `)
        .order('nom');

      if (error) throw error;

      setAdherents(data || []);
      
      // Extract unique quartiers and faritras
      const uniqueQuartiers = [...new Set((data || [])
        .map(a => a.quartier)
        .filter(Boolean)
      )].sort();
      setQuartiers(uniqueQuartiers);
      
      const uniqueFaritras = [...new Set((data || [])
        .map(a => a.faritra)
        .filter(Boolean)
      )].sort();
      setFaritras(uniqueFaritras);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les adhérents.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAdherents = () => {
    let filtered = adherents;

    if (searchTerm) {
      filtered = filtered.filter(adherent =>
        adherent.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adherent.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adherent.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adherent.telephone?.includes(searchTerm)
      );
    }

    if (sexeFilter && sexeFilter !== 'tous') {
      filtered = filtered.filter(adherent => adherent.sexe === sexeFilter);
    }

    if (quartierFilter && quartierFilter !== 'tous') {
      filtered = filtered.filter(adherent => adherent.quartier === quartierFilter);
    }

    if (mpandrayFilter && mpandrayFilter !== 'tous') {
      filtered = filtered.filter(adherent => 
        mpandrayFilter === 'oui' ? adherent.mpandray : !adherent.mpandray
      );
    }

    if (faritraFilter && faritraFilter !== 'tous') {
      filtered = filtered.filter(adherent => adherent.faritra === faritraFilter);
    }

    setFilteredAdherents(filtered);
  };

  const deleteAdherent = async (id: string, nom: string, prenom: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${prenom} ${nom} ?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('adherents')
        .delete()
        .eq('id_adherent', id);

      if (error) throw error;

      toast({
        title: "Adhérent supprimé",
        description: `${prenom} ${nom} a été supprimé avec succès.`,
      });

      fetchAdherents();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'adhérent.",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    const headers = ['Nom', 'Prénom', 'Sexe', 'Date de naissance', 'Adresse', 'Quartier', 'Téléphone', 'Email', 'Fonction', 'État civil', 'Mpandray', 'Faritra', 'Sampana', 'Date d\'inscription'];
    const csvContent = [
      headers.join(','),
      ...filteredAdherents.map(adherent => [
        `"${adherent.nom}"`,
        `"${adherent.prenom}"`,
        adherent.sexe,
        adherent.date_naissance || '',
        `"${adherent.adresse || ''}"`,
        `"${adherent.quartier || ''}"`,
        adherent.telephone || '',
        adherent.email || '',
        `"${adherent.fonction_eglise || ''}"`,
        `"${adherent.etat_civil || ''}"`,
        adherent.mpandray ? 'Oui' : 'Non',
        `"${adherent.faritra || ''}"`,
        `"${adherent.sampana?.nom_sampana || ''}"`,
        adherent.date_inscription
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `adherents_fjkm_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export réussi",
      description: `${filteredAdherents.length} adhérents exportés.`,
    });
  };

  const generateMemberCard = async (adherent: Adherent) => {
    try {
      // Generate QR code data
      const qrData = JSON.stringify({
        id: adherent.id_adherent,
        nom: adherent.nom,
        prenom: adherent.prenom,
        fonction: adherent.fonction_eglise || 'Membre'
      });
      
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 150,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });

      // Create a temporary div for the card
      const cardDiv = document.createElement('div');
      cardDiv.style.position = 'fixed';
      cardDiv.style.top = '-9999px';
      cardDiv.style.width = '400px';
      cardDiv.style.padding = '20px';
      cardDiv.style.backgroundColor = '#ffffff';
      cardDiv.style.fontFamily = 'Arial, sans-serif';
      cardDiv.innerHTML = `
        <div style="border: 2px solid #1a1a1a; border-radius: 12px; padding: 24px; background: linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${fjkmLogo}" alt="Logo FJKM" style="width: 40px; height: 40px; margin-bottom: 8px;" />
            <h2 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: bold;">FJKM VATOMANDRY</h2>
            <p style="margin: 4px 0; color: #666; font-size: 14px;">Carte de Membre</p>
          </div>
          
          <div style="display: flex; gap: 20px; align-items: center;">
            <div style="flex: 1;">
              <p style="margin: 8px 0;"><strong>Nom:</strong> ${adherent.nom}</p>
              <p style="margin: 8px 0;"><strong>Prénom:</strong> ${adherent.prenom}</p>
              <p style="margin: 8px 0;"><strong>Fonction:</strong> ${adherent.fonction_eglise || 'Membre'}</p>
              <p style="margin: 8px 0;"><strong>Quartier:</strong> ${adherent.quartier || 'N/A'}</p>
              <p style="margin: 8px 0;"><strong>Date d'inscription:</strong> ${format(new Date(adherent.date_inscription), 'dd MMM yyyy', { locale: fr })}</p>
            </div>
            <div style="text-align: center;">
              <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 120px; height: 120px;" />
              <p style="margin-top: 8px; font-size: 10px; color: #999;">ID: ${adherent.id_adherent.slice(0, 8)}</p>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(cardDiv);
      
      // Convert to canvas
      const canvas = await html2canvas(cardDiv, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      // Generate PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [86, 54] // Credit card size
      });
      
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 86, 54);
      
      // Save PDF
      pdf.save(`carte_membre_${adherent.nom}_${adherent.prenom}.pdf`);
      
      // Clean up
      document.body.removeChild(cardDiv);
      
      toast({
        title: "Carte générée",
        description: `La carte de ${adherent.prenom} ${adherent.nom} a été téléchargée.`,
      });
    } catch (error) {
      console.error('Error generating card:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer la carte.",
        variant: "destructive",
      });
    }
  };

  const generateAllCards = async () => {
    if (filteredAdherents.length === 0) {
      toast({
        title: "Aucun adhérent",
        description: "Aucun adhérent à exporter.",
        variant: "destructive",
      });
      return;
    }

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let cardIndex = 0;
      const cardsPerPage = 10; // 2 columns x 5 rows
      const cardWidth = 86;
      const cardHeight = 54;
      const marginX = 20;
      const marginY = 20;
      const spacingX = 10;
      const spacingY = 10;

      for (const adherent of filteredAdherents) {
        if (cardIndex > 0 && cardIndex % cardsPerPage === 0) {
          pdf.addPage();
        }

        const pageIndex = Math.floor(cardIndex / cardsPerPage);
        const positionOnPage = cardIndex % cardsPerPage;
        const col = positionOnPage % 2;
        const row = Math.floor(positionOnPage / 2);

        const x = marginX + col * (cardWidth + spacingX);
        const y = marginY + row * (cardHeight + spacingY);

        // Generate QR code
        const qrData = JSON.stringify({
          id: adherent.id_adherent,
          nom: adherent.nom,
          prenom: adherent.prenom,
        });
        
        const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
          width: 100,
          margin: 1,
        });

        // Draw card border
        pdf.setDrawColor(26, 26, 26);
        pdf.setLineWidth(0.5);
        pdf.roundedRect(x, y, cardWidth, cardHeight, 3, 3);

        // Add logo
        pdf.addImage(fjkmLogo, 'PNG', x + 5, y + 3, 12, 12);

        // Add content
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('FJKM VATOMANDRY', x + 20, y + 9);
        
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Carte de Membre', x + 20, y + 13);

        pdf.setFontSize(8);
        pdf.text(`Nom: ${adherent.nom}`, x + 5, y + 22);
        pdf.text(`Prénom: ${adherent.prenom}`, x + 5, y + 26);
        pdf.text(`Fonction: ${adherent.fonction_eglise || 'Membre'}`, x + 5, y + 30);
        pdf.text(`Quartier: ${adherent.quartier || 'N/A'}`, x + 5, y + 34);
        pdf.text(`Inscrit: ${format(new Date(adherent.date_inscription), 'dd/MM/yyyy')}`, x + 5, y + 38);

        // Add QR code
        pdf.addImage(qrCodeDataUrl, 'PNG', x + cardWidth - 25, y + 20, 20, 20);
        
        // Add ID
        pdf.setFontSize(6);
        pdf.text(`ID: ${adherent.id_adherent.slice(0, 8)}`, x + cardWidth - 15, y + 45, { align: 'center' });

        cardIndex++;
      }

      pdf.save(`cartes_membres_fjkm_${format(new Date(), 'yyyy-MM-dd')}.pdf`);

      toast({
        title: "Cartes générées",
        description: `${filteredAdherents.length} cartes ont été générées.`,
      });
    } catch (error) {
      console.error('Error generating cards:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer les cartes.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 bg-card p-3 md:p-4 rounded-lg border">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="grid grid-cols-2 sm:flex gap-2">
            <Select value={sexeFilter} onValueChange={setSexeFilter}>
              <SelectTrigger className="w-full sm:w-24">
                <SelectValue placeholder="Sexe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous</SelectItem>
                <SelectItem value="M">M</SelectItem>
                <SelectItem value="F">F</SelectItem>
              </SelectContent>
            </Select>

            <Select value={quartierFilter} onValueChange={setQuartierFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Quartier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous</SelectItem>
                {quartiers.map((quartier) => (
                  <SelectItem key={quartier} value={quartier}>
                    {quartier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={mpandrayFilter} onValueChange={setMpandrayFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Mpandray" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous</SelectItem>
                <SelectItem value="oui">Mpandray</SelectItem>
                <SelectItem value="non">Non</SelectItem>
              </SelectContent>
            </Select>

            <Select value={faritraFilter} onValueChange={setFaritraFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Faritra" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous</SelectItem>
                {faritras.map((faritra) => (
                  <SelectItem key={faritra} value={faritra}>
                    {faritra}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={exportToCSV} variant="outline" size="sm" className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Exporter CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
          <Button onClick={generateAllCards} variant="outline" size="sm" className="w-full sm:w-auto">
            <CreditCard className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Générer toutes les cartes</span>
            <span className="sm:hidden">Cartes</span>
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
        <span>Total: {adherents.length}</span>
        <span>Affichés: {filteredAdherents.length}</span>
        <span className="hidden sm:inline">Hommes: {filteredAdherents.filter(a => a.sexe === 'M').length}</span>
        <span className="hidden sm:inline">Femmes: {filteredAdherents.filter(a => a.sexe === 'F').length}</span>
        <span className="hidden md:inline">Mpandray: {filteredAdherents.filter(a => a.mpandray).length}</span>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[100px]">Nom</TableHead>
              <TableHead className="min-w-[100px]">Prénom</TableHead>
              <TableHead className="hidden sm:table-cell">Sexe</TableHead>
              <TableHead className="hidden md:table-cell">Quartier</TableHead>
              <TableHead className="hidden lg:table-cell">Téléphone</TableHead>
              <TableHead className="hidden md:table-cell">Fonction</TableHead>
              <TableHead className="hidden lg:table-cell">Mpandray</TableHead>
              <TableHead className="hidden xl:table-cell">Faritra</TableHead>
              <TableHead className="hidden xl:table-cell">Sampana</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAdherents.map((adherent) => (
              <TableRow key={adherent.id_adherent} className="hover:bg-muted/50">
                <TableCell className="font-medium">{adherent.nom}</TableCell>
                <TableCell>{adherent.prenom}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={adherent.sexe === 'M' ? 'default' : 'secondary'}>
                    {adherent.sexe === 'M' ? 'M' : 'F'}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">{adherent.quartier || '-'}</TableCell>
                <TableCell className="hidden lg:table-cell">{adherent.telephone || '-'}</TableCell>
                <TableCell className="hidden md:table-cell">{adherent.fonction_eglise || '-'}</TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Badge variant={adherent.mpandray ? 'default' : 'secondary'}>
                    {adherent.mpandray ? 'Oui' : 'Non'}
                  </Badge>
                </TableCell>
                <TableCell className="hidden xl:table-cell">{adherent.faritra || '-'}</TableCell>
                <TableCell className="hidden xl:table-cell">{adherent.sampana?.nom_sampana || '-'}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onEditAdherent(adherent)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => generateMemberCard(adherent)}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Carte
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => deleteAdherent(adherent.id_adherent, adherent.nom, adherent.prenom)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredAdherents.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {adherents.length === 0 ? (
              <div>
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Aucun adhérent enregistré</p>
              </div>
            ) : (
              <div>
                <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Aucun adhérent trouvé avec ces critères</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}