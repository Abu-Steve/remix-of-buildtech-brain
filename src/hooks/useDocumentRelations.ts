import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useDocumentRelations(documentId: string | null) {
  return useQuery({
    queryKey: ['document-relations', documentId],
    queryFn: async () => {
      if (!documentId) return [];
      
      const { data, error } = await supabase
        .from('document_relations')
        .select(`
          id,
          relation_type,
          target_document_id,
          target_doc:documents!document_relations_target_document_id_fkey (id, title)
        `)
        .eq('source_document_id', documentId);
      
      if (error) throw error;
      
      return data?.map(r => ({
        id: r.id,
        type: r.relation_type,
        targetDocId: r.target_document_id,
        targetDocTitle: (r.target_doc as any)?.title || 'Unbekannt',
      })) || [];
    },
    enabled: !!documentId,
  });
}
