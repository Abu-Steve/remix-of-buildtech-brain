-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('employee', 'champion', 'administrator');

-- Create enum for document status
CREATE TYPE public.document_status AS ENUM ('pending', 'approved', 'best-practice', 'rejected');

-- Create enum for document types
CREATE TYPE public.document_type AS ENUM ('pdf', 'excel', 'presentation', 'flowchart', 'drawing', 'image', 'other');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  department TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'employee',
  UNIQUE (user_id, role)
);

-- Create groups table (companies/labels)
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_global BOOLEAN DEFAULT false, -- For BuildTech (everyone)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_groups junction table (many-to-many)
CREATE TABLE public.user_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, group_id)
);

-- Create tags table
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6B7280',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type document_type NOT NULL DEFAULT 'other',
  status document_status NOT NULL DEFAULT 'pending',
  file_path TEXT NOT NULL,
  file_size TEXT,
  version TEXT DEFAULT '1.0',
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rating NUMERIC(2,1),
  downloads INTEGER DEFAULT 0,
  is_cached BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create document_tags junction table
CREATE TABLE public.document_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE NOT NULL,
  UNIQUE (document_id, tag_id)
);

-- Insert preset groups
INSERT INTO public.groups (name, description, is_global) VALUES
  ('BuildTech', 'Global company - all employees have access', true),
  ('CMS', 'CMS Division', false),
  ('GMS', 'GMS Division', false);

-- Insert some default tags
INSERT INTO public.tags (name, color) VALUES
  ('Safety', '#EF4444'),
  ('Regulations', '#3B82F6'),
  ('Best Practice', '#10B981'),
  ('Training', '#8B5CF6'),
  ('Technical', '#F59E0B');

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_tags ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Security definer function to check group membership
CREATE OR REPLACE FUNCTION public.user_in_group(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_groups
    WHERE user_id = _user_id AND group_id = _group_id
  ) OR EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = _group_id AND is_global = true
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User roles policies (only admins can manage, users can view own)
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'administrator'));

-- Groups policies (everyone can view)
CREATE POLICY "Authenticated users can view groups" ON public.groups
  FOR SELECT TO authenticated USING (true);

-- User groups policies
CREATE POLICY "Users can view own group memberships" ON public.user_groups
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can manage group memberships" ON public.user_groups
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'administrator'));

-- Tags policies (everyone can view and use)
CREATE POLICY "Authenticated users can view tags" ON public.tags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create tags" ON public.tags
  FOR INSERT TO authenticated WITH CHECK (true);

-- Documents policies
CREATE POLICY "Users can view documents in their groups or global" ON public.documents
  FOR SELECT TO authenticated 
  USING (
    status != 'pending' AND (
      public.user_in_group(auth.uid(), group_id) OR
      group_id IS NULL
    )
    OR uploaded_by = auth.uid()
    OR public.has_role(auth.uid(), 'champion')
    OR public.has_role(auth.uid(), 'administrator')
  );

CREATE POLICY "Authenticated users can upload documents" ON public.documents
  FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Champions can update documents" ON public.documents
  FOR UPDATE TO authenticated 
  USING (
    uploaded_by = auth.uid() OR
    public.has_role(auth.uid(), 'champion') OR
    public.has_role(auth.uid(), 'administrator')
  );

CREATE POLICY "Admins can delete documents" ON public.documents
  FOR DELETE TO authenticated 
  USING (public.has_role(auth.uid(), 'administrator'));

-- Document tags policies
CREATE POLICY "View document tags" ON public.document_tags
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Manage document tags" ON public.document_tags
  FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = document_id AND (
        d.uploaded_by = auth.uid() OR
        public.has_role(auth.uid(), 'champion') OR
        public.has_role(auth.uid(), 'administrator')
      )
    )
  );

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email
  );
  
  -- Give new users employee role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'employee');
  
  -- Add to BuildTech group by default (global)
  INSERT INTO public.user_groups (user_id, group_id)
  SELECT NEW.id, id FROM public.groups WHERE is_global = true;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();