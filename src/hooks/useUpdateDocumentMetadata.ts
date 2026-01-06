import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UpdateDocumentMetadataParams {
  documentId: string;
  audience?: string[];
  visibilityScope?: 'company_only' | 'all_companies';
  tags?: string[];
  relations?: { type: string; targetDocId: string }[];
}

export function useUpdateDocumentMetadata() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentId, audience, visibilityScope, tags, relations }: UpdateDocumentMetadataParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht authentifiziert');

      // Update document fields
      const updateData: Record<string, unknown> = {};
      if (audience !== undefined) updateData.audience = audience;
      if (visibilityScope !== undefined) updateData.visibility_scope = visibilityScope;

      if (Object.keys(updateData).length > 0) {
        const { error: docError } = await supabase
          .from('documents')
          .update(updateData)
          .eq('id', documentId);

        if (docError) throw docError;
      }

      // Update tags if provided
      if (tags !== undefined) {
        // Remove existing tags
        await supabase
          .from('document_tags')
          .delete()
          .eq('document_id', documentId);

        // Add new tags
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
              .insert({ document_id: documentId, tag_id: tagId });
          }
        }
      }

      // Update relations if provided
      if (relations !== undefined) {
        // Remove existing relations where this doc is source
        await supabase
          .from('document_relations')
          .delete()
          .eq('source_document_id', documentId);

        // Add new relations
        for (const relation of relations) {
          await supabase
            .from('document_relations')
            .insert({
              source_document_id: documentId,
              target_document_id: relation.targetDocId,
              relation_type: relation.type as any,
              created_by: user.id,
            });
        }
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-relations'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Metadaten erfolgreich aktualisiert');
    },
    onError: (error) => {
      toast.error(`Aktualisierung fehlgeschlagen: ${error.message}`);
    },
  });
}
