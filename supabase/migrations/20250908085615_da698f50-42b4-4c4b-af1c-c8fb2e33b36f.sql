-- Corriger les politiques RLS pour permettre aux utilisateurs de créer leurs propres rôles
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Créer des politiques RLS plus permissives pour user_roles
CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own role" 
ON public.user_roles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Permettre aux admins de gérer tous les rôles
CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'ADMIN'
  )
);

-- S'assurer que le trigger pour promouvoir le premier utilisateur fonctionne
CREATE OR REPLACE FUNCTION public.promote_first_user_to_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier si c'est le premier utilisateur
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    -- Promouvoir au rang d'ADMIN pour le premier utilisateur
    NEW.role = 'ADMIN'::app_role;
  END IF;
  RETURN NEW;
END;
$$;

-- Recréer le trigger pour le premier utilisateur
DROP TRIGGER IF EXISTS promote_first_user_trigger ON public.user_roles;
CREATE TRIGGER promote_first_user_trigger
  BEFORE INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.promote_first_user_to_admin();