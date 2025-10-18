-- Ajouter le champ "décédé" à la table adherents
ALTER TABLE public.adherents 
ADD COLUMN decede BOOLEAN DEFAULT false;

-- Mettre à jour la fonction generate_adidy_for_mpandray pour exclure les décédés
CREATE OR REPLACE FUNCTION public.generate_adidy_for_mpandray()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Si l'adhérent devient Mpandray et n'est pas décédé, créer les entrées Adidy pour l'année courante
  IF NEW.mpandray = true AND NEW.decede = false AND (OLD IS NULL OR OLD.mpandray = false) THEN
    INSERT INTO public.adidy (adherent_id, mois, annee)
    SELECT NEW.id_adherent, generate_series(1, 12), EXTRACT(YEAR FROM NOW())
    ON CONFLICT (adherent_id, mois, annee) DO NOTHING;
  END IF;
  
  -- Si l'adhérent n'est plus Mpandray ou est décédé, supprimer les entrées Adidy non payées
  IF (NEW.mpandray = false OR NEW.decede = true) AND OLD.mpandray = true THEN
    DELETE FROM public.adidy 
    WHERE adherent_id = NEW.id_adherent 
    AND paye = false 
    AND annee >= EXTRACT(YEAR FROM NOW());
  END IF;
  
  RETURN NEW;
END;
$function$;