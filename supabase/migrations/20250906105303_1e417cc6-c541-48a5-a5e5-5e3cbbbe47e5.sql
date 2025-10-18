-- Fix RLS policies to allow proper data insertion

-- Update adherents policies
DROP POLICY IF EXISTS "Admin and Responsable can insert adherents" ON adherents;
CREATE POLICY "Admin and Responsable can insert adherents" 
ON adherents 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND is_admin_or_responsable(auth.uid()));

-- Update groupes policies  
DROP POLICY IF EXISTS "Admin and Responsable can manage groupes" ON groupes;
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

-- Update user_roles policies to allow self-insertion for default roles
DROP POLICY IF EXISTS "Admin can manage roles" ON user_roles;
CREATE POLICY "Admin can manage all roles" 
ON user_roles 
FOR ALL 
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'ADMIN'::app_role));

-- Allow users to create their own default role
CREATE POLICY "Users can create their own default role" 
ON user_roles 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid() 
  AND role = 'UTILISATEUR'::app_role
);

-- Update adherents_groupes policies
DROP POLICY IF EXISTS "Admin and Responsable can manage adherents_groupes" ON adherents_groupes;
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

-- Create a function to promote the first user to ADMIN
CREATE OR REPLACE FUNCTION public.promote_first_user_to_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the first user
  IF (SELECT COUNT(*) FROM auth.users) = 1 THEN
    -- Update the role to ADMIN for the first user
    UPDATE public.user_roles 
    SET role = 'ADMIN'::app_role 
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;