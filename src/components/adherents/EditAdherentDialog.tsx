import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  etat_civil: string | null;
  mpandray: boolean;
  faritra: string | null;
  sampana_id: string | null;
  decede?: boolean;
}


interface EditAdherentDialogProps {
  adherent: Adherent | null;
  open: boolean;
  onClose: () => void;
  onAdherentUpdated: () => void;
  groupes: any[];
}

export function EditAdherentDialog({ adherent, open, onClose, onAdherentUpdated, groupes }: EditAdherentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedGroupes, setSelectedGroupes] = useState<string[]>([]);
  const [mpandray, setMpandray] = useState(false);
  const [selectedFaritra, setSelectedFaritra] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const { toast } = useToast();

  const quartiersParFaritra = {
    voalohany: ['Ambilakely', 'Lanijadona', 'Antantsaripaty', 'Antanambahiny'],
    faharoa: ['Marofototra', 'Centre-Ville', 'Bemasoandro', 'Ampasimandrevo'],
    fahatelo: ['Mangarivotra', 'Tanambao', 'Bazar'],
    fahefatra: ['Ampandranety', 'Bazar', 'Ampasimazava'],
    fahadimy: ['Vohitsara', 'Saint-Augustin']
  };

  useEffect(() => {
    if (adherent && open) {
      // Parse date de naissance en jour, mois, année
      if (adherent.date_naissance) {
        const date = new Date(adherent.date_naissance);
        setSelectedDay(date.getDate().toString());
        setSelectedMonth((date.getMonth() + 1).toString());
        setSelectedYear(date.getFullYear().toString());
      } else {
        setSelectedDay('');
        setSelectedMonth('');
        setSelectedYear('');
      }
      setMpandray(adherent.mpandray || false);
      setSelectedFaritra(adherent.faritra || '');
      fetchAdherentGroupes();
    }
  }, [adherent, open]);

  const fetchAdherentGroupes = async () => {
    if (!adherent) return;

    try {
      const { data, error } = await supabase
        .from('adherents_groupes')
        .select('id_groupe')
        .eq('id_adherent', adherent.id_adherent);

      if (error) throw error;

      setSelectedGroupes(data?.map(ag => ag.id_groupe) || []);
    } catch (error: any) {
      console.error('Error fetching adherent groups:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!adherent) return;

    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      // Construire la date de naissance si les trois champs sont remplis
      let dateNaissance = null;
      if (selectedDay && selectedMonth && selectedYear) {
        dateNaissance = `${selectedYear}-${selectedMonth.padStart(2, '0')}-${selectedDay.padStart(2, '0')}`;
      }
      
      const adherentData = {
        nom: formData.get('nom') as string,
        prenom: formData.get('prenom') as string,
        sexe: formData.get('sexe') as 'M' | 'F',
        date_naissance: dateNaissance,
        adresse: formData.get('adresse') as string || null,
        quartier: formData.get('quartier') as string || null,
        telephone: formData.get('telephone') as string || null,
        email: formData.get('email') as string || null,
        fonction_eglise: formData.get('fonction_eglise') as string || null,
        etat_civil: (formData.get('etat_civil') as string) || null,
        mpandray: mpandray,
        faritra: (formData.get('faritra') as string) || null,
        decede: formData.get('decede') === 'on' ? true : false,
      } as any;

      // Update adherent
      const { error: adherentError } = await supabase
        .from('adherents')
        .update(adherentData)
        .eq('id_adherent', adherent.id_adherent);

      if (adherentError) throw adherentError;

      // Update group associations
      // First, delete existing associations
      await supabase
        .from('adherents_groupes')
        .delete()
        .eq('id_adherent', adherent.id_adherent);

      // Then, insert new associations
      if (selectedGroupes.length > 0) {
        const groupeAssociations = selectedGroupes.map(groupeId => ({
          id_adherent: adherent.id_adherent,
          id_groupe: groupeId
        }));

        const { error: groupeError } = await supabase
          .from('adherents_groupes')
          .insert(groupeAssociations);

        if (groupeError) throw groupeError;
      }

      toast({
        title: "Adhérent modifié",
        description: `${adherentData.prenom} ${adherentData.nom} a été modifié avec succès.`,
      });

      onClose();
      onAdherentUpdated();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la modification.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!adherent) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'adhérent</DialogTitle>
          <DialogDescription>
            Modifiez les informations de {adherent.prenom} {adherent.nom}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input 
                id="nom" 
                name="nom" 
                defaultValue={adherent.nom}
                required 
                className="transition-smooth" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom *</Label>
              <Input 
                id="prenom" 
                name="prenom" 
                defaultValue={adherent.prenom}
                required 
                className="transition-smooth" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sexe">Sexe *</Label>
              <Select name="sexe" defaultValue={adherent.sexe} required>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le sexe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculin</SelectItem>
                  <SelectItem value="F">Féminin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date de naissance</Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Select value={selectedDay} onValueChange={setSelectedDay}>
                    <SelectTrigger>
                      <SelectValue placeholder="Jour" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <SelectItem key={day} value={day.toString()}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="Mois" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        { value: '1', label: 'Janvier' },
                        { value: '2', label: 'Février' },
                        { value: '3', label: 'Mars' },
                        { value: '4', label: 'Avril' },
                        { value: '5', label: 'Mai' },
                        { value: '6', label: 'Juin' },
                        { value: '7', label: 'Juillet' },
                        { value: '8', label: 'Août' },
                        { value: '9', label: 'Septembre' },
                        { value: '10', label: 'Octobre' },
                        { value: '11', label: 'Novembre' },
                        { value: '12', label: 'Décembre' }
                      ].map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Année" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adresse">Adresse</Label>
            <Textarea 
              id="adresse" 
              name="adresse" 
              defaultValue={adherent.adresse || ''}
              className="transition-smooth" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="faritra">Faritra</Label>
              <Select 
                name="faritra" 
                value={selectedFaritra}
                onValueChange={setSelectedFaritra}
                defaultValue={adherent.faritra || ''}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le faritra" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="voalohany">Voalohany</SelectItem>
                  <SelectItem value="faharoa">Faharoa</SelectItem>
                  <SelectItem value="fahatelo">Fahatelo</SelectItem>
                  <SelectItem value="fahefatra">Fahefatra</SelectItem>
                  <SelectItem value="fahadimy">Fahadimy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quartier">Quartier</Label>
              <Select name="quartier" disabled={!selectedFaritra} defaultValue={adherent.quartier || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le quartier" />
                </SelectTrigger>
                <SelectContent>
                  {selectedFaritra && quartiersParFaritra[selectedFaritra as keyof typeof quartiersParFaritra]?.map((quartier) => (
                    <SelectItem key={quartier} value={quartier}>
                      {quartier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telephone">Téléphone</Label>
            <Input 
              id="telephone" 
              name="telephone" 
              type="tel" 
              defaultValue={adherent.telephone || ''}
              className="transition-smooth" 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                defaultValue={adherent.email || ''}
                className="transition-smooth" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fonction_eglise">Fonction dans l'église</Label>
              <Select name="fonction_eglise" defaultValue={adherent.fonction_eglise || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une fonction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pasteur">Pasteur</SelectItem>
                  <SelectItem value="Tresorier">Trésorier</SelectItem>
                  <SelectItem value="Secretaire">Secrétaire</SelectItem>
                  <SelectItem value="Diakona">Diacre</SelectItem>
                  <SelectItem value="Loholona">Ancien</SelectItem>
                  <SelectItem value="Membre">Membre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="etat_civil">État civil</Label>
              <Select name="etat_civil" defaultValue={adherent.etat_civil || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner l'état civil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="celibataire">Célibataire</SelectItem>
                  <SelectItem value="marie">Marié(e)</SelectItem>
                  <SelectItem value="veuf">Veuf/Veuve</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 flex flex-col justify-center">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mpandray"
                  checked={mpandray}
                  onCheckedChange={(checked) => setMpandray(checked as boolean)}
                />
                <Label htmlFor="mpandray">Mpandray</Label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Groupes paroissiaux</Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                {groupes.map((groupe) => (
                  <label key={groupe.id_groupe} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      value={groupe.id_groupe}
                      checked={selectedGroupes.includes(groupe.id_groupe)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedGroupes([...selectedGroupes, groupe.id_groupe]);
                        } else {
                          setSelectedGroupes(selectedGroupes.filter(id => id !== groupe.id_groupe));
                        }
                      }}
                      className="rounded"
                    />
                    <span>{groupe.nom_groupe}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2 flex flex-col justify-center">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="decede" 
                  name="decede" 
                  defaultChecked={adherent?.decede || false}
                />
                <Label htmlFor="decede">Décédé</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-primary hover:shadow-glow">
              {loading ? 'Modification en cours...' : 'Modifier l\'adhérent'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}