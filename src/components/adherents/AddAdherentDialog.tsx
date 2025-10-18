import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AddAdherentDialogProps {
  onAdherentAdded: () => void;
  groupes: any[];
}


export function AddAdherentDialog({ onAdherentAdded, groupes }: AddAdherentDialogProps) {
  const [open, setOpen] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      // Validation des champs obligatoires
      const nom = formData.get('nom') as string;
      const prenom = formData.get('prenom') as string;
      const sexe = formData.get('sexe') as string;
      
      if (!nom?.trim()) {
        toast({
          title: "Erreur de validation",
          description: "Le nom est obligatoire",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      if (!prenom?.trim()) {
        toast({
          title: "Erreur de validation", 
          description: "Le prénom est obligatoire",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      if (!sexe) {
        toast({
          title: "Erreur de validation",
          description: "Le sexe est obligatoire",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Construire la date de naissance si les trois champs sont remplis
      let dateNaissance = null;
      if (selectedDay && selectedMonth && selectedYear) {
        dateNaissance = `${selectedYear}-${selectedMonth.padStart(2, '0')}-${selectedDay.padStart(2, '0')}`;
      }

      const adherentData = {
        nom: nom.trim(),
        prenom: prenom.trim(),
        sexe: sexe as 'M' | 'F',
        date_naissance: dateNaissance,
        adresse: (formData.get('adresse') as string)?.trim() || null,
        quartier: (formData.get('quartier') as string)?.trim() || null,
        telephone: (formData.get('telephone') as string)?.trim() || null,
        email: (formData.get('email') as string)?.trim() || null,
        fonction_eglise: (formData.get('fonction_eglise') as string)?.trim() || null,
        etat_civil: (formData.get('etat_civil') as string) || null,
        mpandray: mpandray,
        faritra: (formData.get('faritra') as string) || null,
        decede: formData.get('decede') === 'on' ? true : false,
      } as any;

      const { data: adherent, error: adherentError } = await supabase
        .from('adherents')
        .insert([adherentData])
        .select()
        .single();

      if (adherentError) throw adherentError;

      // Ajouter aux groupes sélectionnés
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
        title: "Adhérent ajouté",
        description: `${adherentData.prenom} ${adherentData.nom} a été ajouté avec succès.`,
      });

      setOpen(false);
      onAdherentAdded();
      
      // Reset form
      if (e.currentTarget) {
        e.currentTarget.reset();
      }
      setSelectedDay('');
      setSelectedMonth('');
      setSelectedYear('');
      setSelectedGroupes([]);
      setMpandray(false);
      setSelectedFaritra('');
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'ajout de l'adhérent.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary hover:shadow-glow transition-bounce">
          <Plus className="mr-2 h-4 w-4" />
          Nouvel Adhérent
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter un nouvel adhérent</DialogTitle>
          <DialogDescription>
            Remplissez les informations de l'adhérent. Les champs avec * sont obligatoires.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input id="nom" name="nom" required className="transition-smooth" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom *</Label>
              <Input id="prenom" name="prenom" required className="transition-smooth" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sexe">Sexe *</Label>
              <Select name="sexe" required>
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
            <Textarea id="adresse" name="adresse" className="transition-smooth" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="faritra">Faritra</Label>
              <Select 
                name="faritra" 
                value={selectedFaritra}
                onValueChange={setSelectedFaritra}
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
              <Select name="quartier" disabled={!selectedFaritra}>
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
            <Input id="telephone" name="telephone" type="tel" className="transition-smooth" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" className="transition-smooth" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fonction_eglise">Fonction dans l'église</Label>
              <Select name="fonction_eglise">
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
              <Select name="etat_civil">
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
                <Checkbox id="decede" name="decede" />
                <Label htmlFor="decede">Décédé</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-primary hover:shadow-glow">
              {loading ? 'Ajout en cours...' : 'Ajouter l\'adhérent'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}