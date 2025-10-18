-- First, drop all existing problematic policies
DROP POLICY IF EXISTS "Admin and Responsable can insert groupes" ON groupes;
DROP POLICY IF EXISTS "Admin and Responsable can update groupes" ON groupes;  
DROP POLICY IF EXISTS "Admin and Responsable can delete groupes" ON groupes;
DROP POLICY IF EXISTS "Admin and Responsable can manage groupes" ON groupes;

-- Drop adherents_groupes policies
DROP POLICY IF EXISTS "Admin and Responsable can insert adherents_groupes" ON adherents_groupes;
DROP POLICY IF EXISTS "Admin and Responsable can update adherents_groupes" ON adherents_groupes;
DROP POLICY IF EXISTS "Admin and Responsable can delete adherents_groupes" ON adherents_groupes;

-- Drop user_roles policies
DROP POLICY IF EXISTS "Users can create their own default role" ON user_roles;

-- Now recreate them correctly
CREATE POLICY "Admin and Responsable can insert groupes" 
ON groupes 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND is_admin_or_responsable(auth.uid()));

CREATE POLICY "Admin and Responsable can update groupes" 
ON groupes 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND is_admin_or_responsable(auth.uid()));

CREATE POLICY "Admin and Responsable can delete groupes" 
ON groupes 
FOR DELETE 
USING (auth.uid() IS NOT NULL AND is_admin_or_responsable(auth.uid()));

-- Allow users to create their own default role
CREATE POLICY "Users can create their own default role" 
ON user_roles 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid() 
  AND role = 'UTILISATEUR'::app_role
);

-- Recreate adherents_groupes policies
CREATE POLICY "Admin and Responsable can insert adherents_groupes" 
ON adherents_groupes 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND is_admin_or_responsable(auth.uid()));

CREATE POLICY "Admin and Responsable can update adherents_groupes" 
ON adherents_groupes 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND is_admin_or_responsable(auth.uid()));

CREATE POLICY "Admin and Responsable can delete adherents_groupes" 
ON adherents_groupes 
FOR DELETE 
USING (auth.uid() IS NOT NULL AND is_admin_or_responsable(auth.uid()));