-- Create a trigger to automatically promote the first user to ADMIN
CREATE OR REPLACE FUNCTION public.promote_first_user_to_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the first user role being created
  IF (SELECT COUNT(*) FROM public.user_roles) <= 1 THEN
    -- Update the role to ADMIN for the first user
    NEW.role = 'ADMIN'::app_role;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to promote first user
DROP TRIGGER IF EXISTS promote_first_user_trigger ON public.user_roles;
CREATE TRIGGER promote_first_user_trigger
  BEFORE INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.promote_first_user_to_admin();

-- Also update existing user to be ADMIN if there's only one user
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public.user_roles) = 1 THEN
    UPDATE public.user_roles 
    SET role = 'ADMIN'::app_role 
    WHERE role = 'UTILISATEUR'::app_role;
  END IF;
END $$;