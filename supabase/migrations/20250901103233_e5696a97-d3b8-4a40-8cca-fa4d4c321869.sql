-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('ADMIN', 'RESPONSABLE', 'UTILISATEUR');

-- Create sexe enum for adherents
CREATE TYPE public.sexe AS ENUM ('M', 'F');

-- Create adherents table
CREATE TABLE public.adherents (
    id_adherent UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    sexe public.sexe NOT NULL,
    date_naissance DATE,
    adresse VARCHAR(255),
    quartier VARCHAR(100),
    telephone VARCHAR(20),
    email VARCHAR(100),
    fonction_eglise VARCHAR(100),
    date_inscription DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create groupes table
CREATE TABLE public.groupes (
    id_groupe UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_groupe VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create adherents_groupes junction table
CREATE TABLE public.adherents_groupes (
    id_adherent UUID REFERENCES public.adherents(id_adherent) ON DELETE CASCADE,
    id_groupe UUID REFERENCES public.groupes(id_groupe) ON DELETE CASCADE,
    date_adhesion DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id_adherent, id_groupe)
);

-- Create profiles table for extended user information
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    id_adherent UUID REFERENCES public.adherents(id_adherent) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL DEFAULT 'UTILISATEUR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Enable Row Level Security on all tables
ALTER TABLE public.adherents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groupes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adherents_groupes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user has admin or responsable role
CREATE OR REPLACE FUNCTION public.is_admin_or_responsable(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('ADMIN', 'RESPONSABLE')
  )
$$;

-- Create function to automatically create profile and assign default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (user_id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
  );
  
  -- Assign default role (UTILISATEUR)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'UTILISATEUR');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for updating timestamps
CREATE TRIGGER update_adherents_updated_at
  BEFORE UPDATE ON public.adherents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_groupes_updated_at
  BEFORE UPDATE ON public.groupes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for adherents table
CREATE POLICY "Users can view adherents if authenticated" 
ON public.adherents 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admin and Responsable can insert adherents" 
ON public.adherents 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin_or_responsable(auth.uid()));

CREATE POLICY "Admin and Responsable can update adherents" 
ON public.adherents 
FOR UPDATE 
TO authenticated
USING (public.is_admin_or_responsable(auth.uid()));

CREATE POLICY "Only Admin can delete adherents" 
ON public.adherents 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'ADMIN'));

-- RLS Policies for groupes table
CREATE POLICY "Users can view groupes if authenticated" 
ON public.groupes 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admin and Responsable can manage groupes" 
ON public.groupes 
FOR ALL
TO authenticated
USING (public.is_admin_or_responsable(auth.uid()));

-- RLS Policies for adherents_groupes table
CREATE POLICY "Users can view adherents_groupes if authenticated" 
ON public.adherents_groupes 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Admin and Responsable can manage adherents_groupes" 
ON public.adherents_groupes 
FOR ALL
TO authenticated
USING (public.is_admin_or_responsable(auth.uid()));

-- RLS Policies for profiles table
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admin can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'ADMIN'));

-- RLS Policies for user_roles table
CREATE POLICY "Admin can view all roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'ADMIN'));

CREATE POLICY "Admin can manage roles" 
ON public.user_roles 
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'ADMIN'));

-- Insert some default groups
INSERT INTO public.groupes (nom_groupe, description) VALUES
('Chorale', 'Groupe des choristes de l''église'),
('Jeunesse', 'Groupe des jeunes de la paroisse'),
('École du Dimanche', 'Enseignement des enfants le dimanche'),
('Diacres', 'Service de diaconie'),
('Anciens', 'Conseil des anciens'),
('Femmes', 'Groupe des femmes de la paroisse'),
('Hommes', 'Groupe des hommes de la paroisse');

-- Create indexes for better performance
CREATE INDEX idx_adherents_nom ON public.adherents(nom);
CREATE INDEX idx_adherents_quartier ON public.adherents(quartier);
CREATE INDEX idx_adherents_date_naissance ON public.adherents(date_naissance);
CREATE INDEX idx_groupes_nom ON public.groupes(nom_groupe);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);