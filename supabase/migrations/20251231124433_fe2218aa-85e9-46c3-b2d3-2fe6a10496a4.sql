-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies for documents bucket
CREATE POLICY "Authenticated users can upload documents" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Users can view documents in their groups"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Champions and admins can delete documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'documents' AND (
    public.has_role(auth.uid(), 'champion') OR
    public.has_role(auth.uid(), 'administrator')
  )
);