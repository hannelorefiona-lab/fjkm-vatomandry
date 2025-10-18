-- Insérer des rôles par défaut pour tous les utilisateurs existants qui n'en ont pas
INSERT INTO public.user_roles (user_id, role)
SELECT 
  au.id,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM public.user_roles) THEN 'ADMIN'::app_role
    ELSE 'MEMBRE'::app_role
  END as role
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = au.id
);