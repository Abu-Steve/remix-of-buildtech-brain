import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DbDocument {
  id: string;
  title: string;
  description: string | null;
  type: 'pdf' | 'excel' | 'presentation' | 'flowchart' | 'drawing' | 'image' | 'other';
  status: 'pending' | 'approved' | 'best-practice' | 'rejected';
  file_path: string;
  file_size: string | null;
  version: string | null;
  uploaded_by: string | null;
  group_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rating: number | null;
  downloads: number;
  is_cached: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface DbTag {
  id: string;
  name: string;
  color: string;
}

export interface DbGroup {
  id: string;
  name: string;
  description: string | null;
  is_global: boolean;
}

export function useDocuments(statusFilter?: string) {
  return useQuery({
    queryKey: ['documents', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('documents')
        .select(`
          *,
          document_tags (
            tag_id,
            tags (id, name, color)
          ),
          groups (id, name, description, is_global)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'pending' | 'approved' | 'best-practice' | 'rejected');
      }

      const { data: documents, error } = await query;
      
      if (error) throw error;

      // Fetch uploader profiles separately
      if (documents && documents.length > 0) {
        const uploaderIds = [...new Set(documents.map(d => d.uploaded_by).filter(Boolean))];
        
        if (uploaderIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, email, avatar_url')
            .in('id', uploaderIds);

          // Map profiles to documents
          return documents.map(doc => ({
            ...doc,
            uploader: profiles?.find(p => p.id === doc.uploaded_by) || null
          }));
        }
      }

      return documents?.map(doc => ({ ...doc, uploader: null })) || [];
    },
  });
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as DbTag[];
    },
  });
}

export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as DbGroup[];
    },
  });
}

interface UploadDocumentParams {
  file: File;
  title: string;
  description: string;
  tags: string[];
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, title, description, tags }: UploadDocumentParams) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Determine document type
      const typeMap: Record<string, DbDocument['type']> = {
        pdf: 'pdf',
        xls: 'excel',
        xlsx: 'excel',
        ppt: 'presentation',
        pptx: 'presentation',
        png: 'image',
        jpg: 'image',
        jpeg: 'image',
        gif: 'image',
      };
      const docType = typeMap[fileExt?.toLowerCase() || ''] || 'other';

      // Create document record
      const { data: document, error: docError } = await supabase
        .from('documents')
        .insert({
          title,
          description,
          type: docType,
          status: 'pending',
          file_path: fileName,
          file_size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (docError) throw docError;

      // Link tags
      if (tags.length > 0) {
        // Get or create tags
        for (const tagName of tags) {
          const { data: existingTag } = await supabase
            .from('tags')
            .select('id')
            .eq('name', tagName)
            .maybeSingle();

          let tagId = existingTag?.id;
          
          if (!tagId) {
            const { data: newTag } = await supabase
              .from('tags')
              .insert({ name: tagName, color: '#6B7280' })
              .select('id')
              .single();
            tagId = newTag?.id;
          }

          if (tagId) {
            await supabase
              .from('document_tags')
              .insert({ document_id: document.id, tag_id: tagId });
          }
        }
      }

      return document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document uploaded successfully! It will be reviewed by a Champion.');
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });
}

interface ApproveDocumentParams {
  documentId: string;
  groupId: string | null;
  status: 'approved' | 'best-practice' | 'rejected';
}

export function useApproveDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentId, groupId, status }: ApproveDocumentParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('documents')
        .update({
          status,
          group_id: groupId,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', documentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success(`Document ${status === 'rejected' ? 'rejected' : 'approved'} successfully!`);
    },
    onError: (error) => {
      toast.error(`Action failed: ${error.message}`);
    },
  });
}

export function useDownloadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (filePath: string) => {
      // Get signed URL for download
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 60); // 60 seconds expiry

      if (error) throw error;
      if (!data?.signedUrl) throw new Error('Could not generate download link');

      // Trigger download
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = filePath.split('/').pop() || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return data.signedUrl;
    },
    onSuccess: () => {
      toast.success('Download gestartet');
    },
    onError: (error) => {
      toast.error(`Download fehlgeschlagen: ${error.message}`);
    },
  });
}
