-- 1. Create department enum
CREATE TYPE public.user_department AS ENUM ('office', 'manager', 'craftsman');

-- 2. Create visibility scope enum for documents
CREATE TYPE public.visibility_scope AS ENUM ('company_only', 'all_companies');

-- 3. Create relation type enum
CREATE TYPE public.document_relation_type AS ENUM (
  'extends',
  'references', 
  'supersedes',
  'depends_on',
  'implements',
  'explains',
  'related_to'
);

-- 4. Add department column to profiles (using enum)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS department_enum user_department;

-- 5. Add new metadata columns to documents
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS visibility_scope visibility_scope DEFAULT 'company_only',
ADD COLUMN IF NOT EXISTS audience text[] DEFAULT ARRAY['all']::text[];

-- 6. Create document_relations table
CREATE TABLE public.document_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  target_document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  relation_type document_relation_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  CONSTRAINT no_self_relation CHECK (source_document_id != target_document_id),
  UNIQUE(source_document_id, target_document_id, relation_type)
);

-- 7. Enable RLS on document_relations
ALTER TABLE public.document_relations ENABLE ROW LEVEL SECURITY;

-- 8. RLS policies for document_relations
CREATE POLICY "Users can view document relations"
ON public.document_relations
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create relations"
ON public.document_relations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Champions and admins can manage relations"
ON public.document_relations
FOR ALL
USING (
  has_role(auth.uid(), 'champion') OR 
  has_role(auth.uid(), 'administrator')
);

-- 9. Create function to check document visibility based on metadata
CREATE OR REPLACE FUNCTION public.can_view_document(_user_id uuid, _doc_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _doc RECORD;
  _user_department user_department;
  _user_group_id uuid;
BEGIN
  -- Get document info
  SELECT visibility_scope, audience, group_id, uploaded_by, status
  INTO _doc
  FROM public.documents
  WHERE id = _doc_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Uploader can always see their own docs
  IF _doc.uploaded_by = _user_id THEN
    RETURN true;
  END IF;
  
  -- Champions and admins can see all docs
  IF has_role(_user_id, 'champion') OR has_role(_user_id, 'administrator') THEN
    RETURN true;
  END IF;
  
  -- Pending docs only visible to uploader/champions/admins (handled above)
  IF _doc.status = 'pending' THEN
    RETURN false;
  END IF;
  
  -- Get user's department and group
  SELECT department_enum INTO _user_department
  FROM public.profiles
  WHERE id = _user_id;
  
  SELECT group_id INTO _user_group_id
  FROM public.user_groups
  WHERE user_id = _user_id
  LIMIT 1;
  
  -- Check company visibility
  IF _doc.visibility_scope = 'company_only' THEN
    -- Must be in same group or doc has no group (global)
    IF _doc.group_id IS NOT NULL AND _user_group_id != _doc.group_id THEN
      -- Check if group is global
      IF NOT EXISTS (SELECT 1 FROM public.groups WHERE id = _doc.group_id AND is_global = true) THEN
        RETURN false;
      END IF;
    END IF;
  END IF;
  
  -- Check audience
  IF 'all' = ANY(_doc.audience) THEN
    RETURN true;
  END IF;
  
  IF _user_department IS NOT NULL AND _user_department::text = ANY(_doc.audience) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- 10. Update documents RLS policy for viewing
DROP POLICY IF EXISTS "Users can view documents in their groups or global" ON public.documents;

CREATE POLICY "Users can view documents based on metadata"
ON public.documents
FOR SELECT
USING (
  can_view_document(auth.uid(), id)
);