import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { X, Link2, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface DocumentRelationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
}

const relationTypes = [
  { value: 'extends', label: 'erweitert' },
  { value: 'references', label: 'verweist auf' },
  { value: 'supersedes', label: 'ersetzt' },
  { value: 'depends_on', label: 'setzt voraus' },
  { value: 'implements', label: 'setzt um' },
  { value: 'explains', label: 'erklärt' },
  { value: 'related_to', label: 'thematisch verwandt' },
];

type RelationType = 'extends' | 'references' | 'supersedes' | 'depends_on' | 'implements' | 'explains' | 'related_to';

export function DocumentRelationsModal({ isOpen, onClose, documentId, documentTitle }: DocumentRelationsModalProps) {
  const [selectedDocument, setSelectedDocument] = useState('');
  const [relationType, setRelationType] = useState<RelationType>('related_to');
  const queryClient = useQueryClient();

  // Fetch all documents except current one
  const { data: documents = [] } = useQuery({
    queryKey: ['documents-for-relations', documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('id, title')
        .neq('id', documentId)
        .order('title');
      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  // Fetch existing relations
  const { data: relations = [], isLoading: relationsLoading } = useQuery({
    queryKey: ['document-relations', documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_relations')
        .select(`
          id,
          relation_type,
          target_document_id,
          documents!document_relations_target_document_id_fkey(id, title)
        `)
        .eq('source_document_id', documentId);
      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  const addRelationMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('document_relations')
        .insert({
          source_document_id: documentId,
          target_document_id: selectedDocument,
          relation_type: relationType,
          created_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-relations', documentId] });
      setSelectedDocument('');
      toast.success('Relation hinzugefügt');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteRelationMutation = useMutation({
    mutationFn: async (relationId: string) => {
      const { error } = await supabase
        .from('document_relations')
        .delete()
        .eq('id', relationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-relations', documentId] });
      toast.success('Relation entfernt');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-slide-in-up">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Dokumentrelationen</h2>
              <p className="text-sm text-muted-foreground truncate max-w-xs">{documentTitle}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Add new relation */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Neue Relation hinzufügen</label>
            
            <div className="flex gap-2">
              <Select value={relationType} onValueChange={(v) => setRelationType(v as RelationType)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {relationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedDocument} onValueChange={setSelectedDocument}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Dokument auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {documents.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                size="icon"
                onClick={() => addRelationMutation.mutate()}
                disabled={!selectedDocument || addRelationMutation.isPending}
              >
                {addRelationMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Existing relations */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Bestehende Relationen</label>
            
            {relationsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : relations.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Keine Relationen vorhanden
              </p>
            ) : (
              <div className="space-y-2">
                {relations.map((relation) => {
                  const typeLabel = relationTypes.find(t => t.value === relation.relation_type)?.label || relation.relation_type;
                  const targetDoc = relation.documents as { id: string; title: string } | null;
                  
                  return (
                    <div
                      key={relation.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {typeLabel}
                        </Badge>
                        <span className="text-sm text-foreground truncate max-w-xs">
                          {targetDoc?.title || 'Unbekannt'}
                        </span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteRelationMutation.mutate(relation.id)}
                        disabled={deleteRelationMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/30">
          <Button variant="outline" onClick={onClose}>
            Schließen
          </Button>
        </div>
      </div>
    </div>
  );
}
