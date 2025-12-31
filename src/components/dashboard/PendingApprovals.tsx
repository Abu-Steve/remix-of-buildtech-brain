import { useMemo, useState } from 'react';
import { Check, X, Eye, FileText, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useApproveDocument, useDocuments, useGroups } from '@/hooks/useDocuments';
import { useIsChampion } from '@/hooks/useUserRole';
import { toast } from 'sonner';

type PendingDoc = any;

function timeAgo(dateIso?: string) {
  if (!dateIso) return '';
  const date = new Date(dateIso);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  return `vor ${days} Tagen`;
}

export function PendingApprovals() {
  const isChampion = useIsChampion();
  const { data: docs = [], isLoading, error } = useDocuments('pending');
  const { data: groups = [] } = useGroups();
  const approveMutation = useApproveDocument();

  const [showAll, setShowAll] = useState(false);
  const [activeDoc, setActiveDoc] = useState<PendingDoc | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  const pendingDocs = docs || [];
  const visibleDocs = useMemo(
    () => (showAll ? pendingDocs : pendingDocs.slice(0, 3)),
    [pendingDocs, showAll],
  );

  const openReview = (doc: PendingDoc) => {
    setActiveDoc(doc);
    setSelectedGroupId(doc.group_id ?? '__general__');
  };

  const handleDecision = async (status: 'approved' | 'best-practice' | 'rejected') => {
    if (!activeDoc) return;
    if (!isChampion) {
      toast.error('Nur Champions können Dokumente genehmigen');
      return;
    }

    const groupId = selectedGroupId === '__general__' ? null : selectedGroupId;

    if (status !== 'rejected' && !groupId && selectedGroupId !== '__general__') {
      toast.error('Bitte wählen Sie eine Firma oder Allgemein');
      return;
    }

    await approveMutation.mutateAsync({
      documentId: activeDoc.id,
      groupId,
      status,
    });

    setActiveDoc(null);
  };

  return (
    <section aria-label="Ausstehende Genehmigungen" className="bg-card rounded-2xl border border-border p-5">
      <header className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-foreground">Ausstehende Genehmigungen</h2>
        <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/30">
          {pendingDocs.length} ausstehend
        </Badge>
      </header>

      {!isChampion && (
        <p className="text-sm text-muted-foreground">
          Sie haben keine Genehmigungsberechtigung.
        </p>
      )}

      {error && (
        <p className="text-sm text-destructive">Genehmigungen konnten nicht geladen werden.</p>
      )}

      {isLoading ? (
        <div className="py-6 text-sm text-muted-foreground">Ausstehende Genehmigungen werden geladen…</div>
      ) : (
        <ScrollArea className={showAll ? 'h-[28rem]' : ''}>
          <div className="space-y-3 pr-2">
            {visibleDocs.map((doc: PendingDoc, index: number) => (
              <article
                key={doc.id}
                className="p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-foreground truncate">{doc.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>{doc.uploader?.name || 'Unbekannt'}</span>
                      <span>•</span>
                      <Clock className="w-3 h-3" />
                      <span>{timeAgo(doc.created_at)}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(doc.document_tags || [])
                        .map((dt: any) => dt?.tags)
                        .filter(Boolean)
                        .map((tag: any) => (
                          <Badge key={tag.id ?? tag.name} variant="outline" className="text-xs">
                            {tag.name}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                  <Button size="sm" variant="ghost" className="flex-1 h-9" onClick={() => openReview(doc)}>
                    <Eye className="w-4 h-4 mr-1" />
                    Prüfen
                  </Button>
                  <Button
                    size="sm"
                    variant="success"
                    className="h-9"
                    onClick={() => openReview(doc)}
                    disabled={!isChampion}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 text-destructive hover:text-destructive"
                    onClick={() => {
                      setActiveDoc(doc);
                      setSelectedGroupId(doc.group_id ?? '__general__');
                      handleDecision('rejected');
                    }}
                    disabled={!isChampion || approveMutation.isPending}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </article>
            ))}

            {pendingDocs.length === 0 && (
              <div className="py-6 text-sm text-muted-foreground">Keine ausstehenden Genehmigungen.</div>
            )}
          </div>
        </ScrollArea>
      )}

      {pendingDocs.length > 3 && (
        <button
          type="button"
          className="w-full mt-4 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          onClick={() => setShowAll((s) => !s)}
        >
          {showAll ? 'Weniger anzeigen' : `Alle ausstehenden anzeigen (${pendingDocs.length})`}
        </button>
      )}

      <Dialog open={!!activeDoc} onOpenChange={(open) => !open && setActiveDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dokument prüfen</DialogTitle>
            <DialogDescription>
              Wählen Sie die Firma (oder Allgemein) und genehmigen oder lehnen Sie ab.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">{activeDoc?.title}</p>
              {activeDoc?.description && (
                <p className="text-sm text-muted-foreground">{activeDoc.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Firma</p>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Firma auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__general__">Allgemein (alle Firmen)</SelectItem>
                  <ScrollArea className="h-56">
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                        {g.is_global ? ' (Alle Zugriff)' : ''}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="success"
                className="sm:flex-1"
                onClick={() => handleDecision('approved')}
                disabled={!isChampion || approveMutation.isPending}
              >
                <Check className="w-4 h-4" />
                Genehmigen
              </Button>
              <Button
                variant="secondary"
                className="sm:flex-1"
                onClick={() => handleDecision('best-practice')}
                disabled={!isChampion || approveMutation.isPending}
              >
                Als Best Practice markieren
              </Button>
              <Button
                variant="outline"
                className="sm:flex-1 text-destructive hover:text-destructive"
                onClick={() => handleDecision('rejected')}
                disabled={!isChampion || approveMutation.isPending}
              >
                <X className="w-4 h-4" />
                Ablehnen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
