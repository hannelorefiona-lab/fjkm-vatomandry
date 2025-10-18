-- Supprimer les politiques problématiques
DROP POLICY IF EXISTS "Admin can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can create their own default role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

-- Créer des politiques simples et sans récursion
CREATE POLICY "Users can view their own role" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'ADMIN'
  )
);

CREATE POLICY "Admins can update all roles" 
ON public.user_roles 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.user_roles WHERE role = 'ADMIN'
  )
);

CREATE POLICY "Users can insert their own default role" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND role = 'UTILISATEUR');