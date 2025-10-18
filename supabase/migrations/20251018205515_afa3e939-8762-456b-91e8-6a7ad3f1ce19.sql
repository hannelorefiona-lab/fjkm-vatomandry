-- Supprimer les politiques RLS existantes qui causent des récursions
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own default role" ON public.user_roles;

-- Vérifier l'enum app_role et le mettre à jour si nécessaire
DO $$ 
BEGIN
  -- Ajouter les valeurs manquantes si elles n'existent pas
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ADMIN' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE app_role ADD VALUE 'ADMIN';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'RESPONSABLE' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE app_role ADD VALUE 'RESPONSABLE';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'MEMBRE' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE app_role ADD VALUE 'MEMBRE';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SECRETAIRE' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE app_role ADD VALUE 'SECRETAIRE';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'TRESORIER' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE app_role ADD VALUE 'TRESORIER';
  END IF;
END $$;

-- Modifier le défaut de la colonne role
ALTER TABLE public.user_roles 
ALTER COLUMN role SET DEFAULT 'MEMBRE'::app_role;

-- Créer des nouvelles politiques RLS sans récursion
-- Important: Ces politiques utilisent UNIQUEMENT des fonctions SECURITY DEFINER

-- Politique 1: Les utilisateurs peuvent voir leur propre rôle
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Politique 2: Les admins peuvent voir tous les rôles (via fonction SECURITY DEFINER)
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Politique 3: Les utilisateurs peuvent insérer leur propre rôle par défaut
CREATE POLICY "Users can insert default role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND role = 'MEMBRE'::app_role);

-- Politique 4: Les admins peuvent insérer n'importe quel rôle
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

-- Politique 5: Les admins peuvent mettre à jour tous les rôles
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));

-- Politique 6: Les admins peuvent supprimer des rôles
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));