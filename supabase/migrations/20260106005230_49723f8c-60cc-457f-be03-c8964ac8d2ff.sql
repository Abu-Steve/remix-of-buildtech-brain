
-- Update can_view_document function with new access logic
CREATE OR REPLACE FUNCTION public.can_view_document(_user_id uuid, _doc_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _doc RECORD;
  _user_department user_department;
  _user_group_id uuid;
  _user_email text;
BEGIN
  -- Get user email to check for test admin
  SELECT email INTO _user_email
  FROM public.profiles
  WHERE id = _user_id;
  
  -- Test admin can see everything
  IF _user_email = 'admin@buildtech.de' THEN
    RETURN true;
  END IF;

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
  
  -- Check if user is in same company as document
  IF _doc.group_id IS NOT NULL AND _user_group_id IS NOT NULL AND _doc.group_id = _user_group_id THEN
    -- SAME COMPANY: Check audience (managers see everything in their company)
    IF _user_department = 'manager' THEN
      RETURN true;
    END IF;
    
    -- Check audience for non-managers
    IF _doc.audience IS NULL OR 'all' = ANY(_doc.audience) THEN
      RETURN true;
    END IF;
    
    IF _user_department IS NOT NULL AND _user_department::text = ANY(_doc.audience) THEN
      RETURN true;
    END IF;
    
    RETURN false;
  ELSE
    -- DIFFERENT COMPANY: Only visible if visibility_scope = 'all_companies'
    IF _doc.visibility_scope = 'all_companies' THEN
      -- Still need to check audience
      IF _user_department = 'manager' THEN
        RETURN true;
      END IF;
      
      IF _doc.audience IS NULL OR 'all' = ANY(_doc.audience) THEN
        RETURN true;
      END IF;
      
      IF _user_department IS NOT NULL AND _user_department::text = ANY(_doc.audience) THEN
        RETURN true;
      END IF;
    END IF;
    
    RETURN false;
  END IF;
END;
$function$;
