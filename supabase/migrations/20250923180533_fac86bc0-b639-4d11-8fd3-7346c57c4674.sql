-- Créer l'enum pour l'état civil
CREATE TYPE public.etat_civil AS ENUM ('celibataire', 'marie', 'veuf');

-- Créer l'enum pour faritra
CREATE TYPE public.faritra AS ENUM ('voalohany', 'faharoa', 'fahatelo', 'fahefatra', 'fahadimy');

-- Créer la table Sampana
CREATE TABLE public.sampana (
  id_sampana UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom_sampana VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insérer les sampana de base
INSERT INTO public.sampana (nom_sampana, description) VALUES
('Chorale', 'Groupe de chant de l''église'),
('École du Dimanche', 'Éducation religieuse des enfants'),
('FBL', 'Femmes de Bonne Libération'),
('Jeunes', 'Groupe des jeunes de l''église'),
('Diacres', 'Service diaconal'),
('Ancien', 'Conseil des anciens');

-- Ajouter les colonnes manquantes à la table adherents
ALTER TABLE public.adherents 
ADD COLUMN etat_civil etat_civil,
ADD COLUMN mpandray BOOLEAN DEFAULT false,
ADD COLUMN faritra faritra,
ADD COLUMN sampana_id UUID REFERENCES public.sampana(id_sampana);

-- Créer la table Adidy pour le suivi des paiements des Mpandray
CREATE TABLE public.adidy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  adherent_id UUID NOT NULL REFERENCES public.adherents(id_adherent) ON DELETE CASCADE,
  mois INTEGER NOT NULL CHECK (mois >= 1 AND mois <= 12),
  annee INTEGER NOT NULL,
  montant NUMERIC(10,2) NOT NULL DEFAULT 0,
  paye BOOLEAN DEFAULT false,
  date_paiement DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(adherent_id, mois, annee)
);

-- Activer RLS sur les nouvelles tables
ALTER TABLE public.sampana ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adidy ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour sampana
CREATE POLICY "Authenticated users can view sampana" ON public.sampana
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin and Responsable can insert sampana" ON public.sampana
FOR INSERT WITH CHECK (is_admin_or_responsable(auth.uid()));

CREATE POLICY "Admin and Responsable can update sampana" ON public.sampana
FOR UPDATE USING (is_admin_or_responsable(auth.uid()));

CREATE POLICY "Admin can delete sampana" ON public.sampana
FOR DELETE USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- Politiques RLS pour adidy
CREATE POLICY "Authenticated users can view adidy" ON public.adidy
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin and Tresorier can insert adidy" ON public.adidy
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND 
  (has_role(auth.uid(), 'ADMIN'::app_role) OR has_role(auth.uid(), 'TRESORIER'::app_role))
);

CREATE POLICY "Admin and Tresorier can update adidy" ON public.adidy
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND 
  (has_role(auth.uid(), 'ADMIN'::app_role) OR has_role(auth.uid(), 'TRESORIER'::app_role))
);

CREATE POLICY "Admin can delete adidy" ON public.adidy
FOR DELETE USING (has_role(auth.uid(), 'ADMIN'::app_role));

-- Créer un trigger pour l'auto-génération des Adidy pour les nouveaux Mpandray
CREATE OR REPLACE FUNCTION public.generate_adidy_for_mpandray()
RETURNS TRIGGER AS $$
BEGIN
  -- Si l'adhérent devient Mpandray, créer les entrées Adidy pour l'année courante
  IF NEW.mpandray = true AND (OLD IS NULL OR OLD.mpandray = false) THEN
    INSERT INTO public.adidy (adherent_id, mois, annee)
    SELECT NEW.id_adherent, generate_series(1, 12), EXTRACT(YEAR FROM NOW())
    ON CONFLICT (adherent_id, mois, annee) DO NOTHING;
  END IF;
  
  -- Si l'adhérent n'est plus Mpandray, supprimer les entrées Adidy non payées
  IF NEW.mpandray = false AND OLD.mpandray = true THEN
    DELETE FROM public.adidy 
    WHERE adherent_id = NEW.id_adherent 
    AND paye = false 
    AND annee >= EXTRACT(YEAR FROM NOW());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_generate_adidy_for_mpandray
AFTER INSERT OR UPDATE ON public.adherents
FOR EACH ROW
EXECUTE FUNCTION public.generate_adidy_for_mpandray();

-- Créer un trigger pour mettre à jour updated_at sur sampana
CREATE TRIGGER update_sampana_updated_at
BEFORE UPDATE ON public.sampana
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Créer un trigger pour mettre à jour updated_at sur adidy
CREATE TRIGGER update_adidy_updated_at
BEFORE UPDATE ON public.adidy
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();