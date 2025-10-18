-- Ajouter les rôles SECRETAIRE et MEMBRE à l'enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'SECRETAIRE';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'MEMBRE';

-- Mettre à jour les politiques RLS pour le rôle SECRETAIRE sur adherents
DROP POLICY IF EXISTS "Admin and Responsable can insert adherents" ON public.adherents;
DROP POLICY IF EXISTS "Admin and Responsable can update adherents" ON public.adherents;

CREATE POLICY "Admin, Responsable and Secretaire can insert adherents" 
ON public.adherents 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (
    has_role(auth.uid(), 'ADMIN'::app_role) 
    OR has_role(auth.uid(), 'RESPONSABLE'::app_role)
    OR has_role(auth.uid(), 'SECRETAIRE'::app_role)
  )
);

CREATE POLICY "Admin, Responsable and Secretaire can update adherents" 
ON public.adherents 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'ADMIN'::app_role) 
  OR has_role(auth.uid(), 'RESPONSABLE'::app_role)
  OR has_role(auth.uid(), 'SECRETAIRE'::app_role)
);

-- Permettre aux MEMBRES de voir leur propre profil
CREATE POLICY "Members can view their own adherent data" 
ON public.adherents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.id_adherent = adherents.id_adherent
  )
);