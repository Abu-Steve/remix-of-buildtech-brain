-- Fix the SELECT policy to work for authenticated users
DROP POLICY IF EXISTS "Users can view documents based on metadata" ON public.documents;

CREATE POLICY "Users can view documents based on metadata"
ON public.documents
FOR SELECT
TO authenticated
USING (can_view_document(auth.uid(), id));

-- Also ensure authenticated users who aren't in the can_view_document result
-- can still see their own pending uploads
DROP POLICY IF EXISTS "Users can view own pending uploads" ON public.documents;

CREATE POLICY "Users can view own pending uploads"
ON public.documents
FOR SELECT
TO authenticated
USING (uploaded_by = auth.uid());