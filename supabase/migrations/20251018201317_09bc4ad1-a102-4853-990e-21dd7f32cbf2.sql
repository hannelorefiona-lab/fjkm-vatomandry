-- Supprimer l'ancienne politique d'insertion restrictive
DROP POLICY IF EXISTS "Users can insert their own default role" ON public.user_roles;

-- Créer une nouvelle politique qui autorise l'insertion de MEMBRE (rôle par défaut)
CREATE POLICY "Users can insert their own default role" 
ON public.user_roles
FOR INSERT
WITH CHECK (
  (auth.uid() = user_id) AND (role = 'MEMBRE'::app_role)
);

-- Mettre à jour la fonction promote_first_user_to_admin pour être cohérente
CREATE OR REPLACE FUNCTION public.promote_first_user_to_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier si c'est le premier utilisateur
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    -- Promouvoir au rang d'ADMIN pour le premier utilisateur
    NEW.role = 'ADMIN'::app_role;
  ELSE
    -- Assigner MEMBRE par défaut
    NEW.role = 'MEMBRE'::app_role;
  END IF;
  RETURN NEW;
END;
$$;

-- S'assurer que le trigger est bien actif
DROP TRIGGER IF EXISTS on_user_role_created ON public.user_roles;
CREATE TRIGGER on_user_role_created
  BEFORE INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.promote_first_user_to_admin();