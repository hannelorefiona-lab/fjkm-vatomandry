-- Créer la table contributions
CREATE TABLE public.contributions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  adherent_id uuid NOT NULL,
  type character varying NOT NULL CHECK (type IN ('dime', 'offrande', 'don')),
  montant numeric(10,2) NOT NULL CHECK (montant > 0),
  date_contribution date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Ajouter la foreign key vers adherents
ALTER TABLE public.contributions 
ADD CONSTRAINT fk_contributions_adherent 
FOREIGN KEY (adherent_id) REFERENCES public.adherents(id_adherent) ON DELETE CASCADE;

-- Activer RLS
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour contributions
-- Admin peut tout faire
CREATE POLICY "Admin can manage all contributions"
ON public.contributions
FOR ALL
USING ((auth.uid() IS NOT NULL) AND has_role(auth.uid(), 'ADMIN'::app_role))
WITH CHECK ((auth.uid() IS NOT NULL) AND has_role(auth.uid(), 'ADMIN'::app_role));

-- Trésorier peut tout faire sur les contributions
CREATE POLICY "Tresorier can manage all contributions"
ON public.contributions
FOR ALL
USING ((auth.uid() IS NOT NULL) AND has_role(auth.uid(), 'TRESORIER'::app_role))
WITH CHECK ((auth.uid() IS NOT NULL) AND has_role(auth.uid(), 'TRESORIER'::app_role));

-- Admin et Responsable peuvent voir les contributions
CREATE POLICY "Admin and Responsable can view contributions"
ON public.contributions
FOR SELECT
USING ((auth.uid() IS NOT NULL) AND is_admin_or_responsable(auth.uid()));

-- Les utilisateurs connectés peuvent voir leurs propres contributions
CREATE POLICY "Users can view their own contributions"
ON public.contributions
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.id_adherent = contributions.adherent_id
  )
);

-- Créer un trigger pour updated_at
CREATE TRIGGER update_contributions_updated_at
BEFORE UPDATE ON public.contributions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Créer des index pour les performances
CREATE INDEX idx_contributions_adherent_id ON public.contributions(adherent_id);
CREATE INDEX idx_contributions_date ON public.contributions(date_contribution);
CREATE INDEX idx_contributions_type ON public.contributions(type);