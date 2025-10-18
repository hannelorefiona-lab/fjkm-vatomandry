-- Étape simple: Juste ajouter le nouveau type MEMBRE à l'enum existant et mettre à jour les données
-- On garde UTILISATEUR pour la compatibilité mais on migre tout vers MEMBRE

-- Mettre à jour tous les rôles UTILISATEUR vers MEMBRE 
UPDATE user_roles 
SET role = 'MEMBRE'::app_role 
WHERE role = 'UTILISATEUR'::app_role;

-- Mettre à jour la fonction handle_new_user pour utiliser MEMBRE par défaut
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (user_id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
  );
  
  -- Assign default role (MEMBRE instead of UTILISATEUR)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'MEMBRE');
  
  RETURN NEW;
END;
$function$;

-- Mettre à jour la fonction promote_first_user_to_admin pour utiliser MEMBRE par défaut
CREATE OR REPLACE FUNCTION public.promote_first_user_to_admin()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Vérifier si c'est le premier utilisateur
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    -- Promouvoir au rang d'ADMIN pour le premier utilisateur
    NEW.role = 'ADMIN'::app_role;
  ELSE
    -- Assigner MEMBRE par défaut au lieu d'UTILISATEUR
    IF NEW.role = 'UTILISATEUR'::app_role THEN
      NEW.role = 'MEMBRE'::app_role;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;