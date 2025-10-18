-- Créer une table pour stocker les paramètres système
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Activer RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS
CREATE POLICY "Admins can view all settings" ON public.system_settings
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update settings" ON public.system_settings
  FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert settings" ON public.system_settings
  FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- Créer un trigger pour mettre à jour updated_at
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer les paramètres par défaut
INSERT INTO public.system_settings (key, value, description) VALUES
  ('app_name', '"FJKM Vatomandry"', 'Nom de l''application'),
  ('email_notifications', 'true', 'Activer les notifications par email'),
  ('auto_backup', 'true', 'Sauvegarde automatique activée'),
  ('max_users_per_group', '50', 'Nombre maximum d''utilisateurs par groupe'),
  ('session_timeout', '30', 'Durée de session en minutes'),
  ('maintenance_mode', 'false', 'Mode maintenance')
ON CONFLICT (key) DO NOTHING;