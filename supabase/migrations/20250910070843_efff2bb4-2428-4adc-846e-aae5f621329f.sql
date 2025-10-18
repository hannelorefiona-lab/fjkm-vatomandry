-- Supprimer toutes les politiques existantes sur user_roles
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own default role" ON public.user_roles;

-- Créer une fonction pour obtenir le rôle d'un utilisateur sans récursion
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role 
  FROM public.user_roles 
  WHERE user_id = _user_id
  LIMIT 1;
$$;

-- Créer une fonction pour vérifier si un utilisateur est admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = 'ADMIN'
  );
$$;

-- Recréer les politiques sans récursion
CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all roles" 
ON public.user_roles 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can insert their own default role" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND role = 'UTILISATEUR');