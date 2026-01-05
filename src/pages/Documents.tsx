import { useEffect, useState } from 'react';
import { Plus, Search, Grid3X3, List, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { DocumentPreviewModal } from '@/components/documents/DocumentPreviewModal';
import { UploadModal } from '@/components/documents/UploadModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDocuments, useTags, useDownloadDocument, useViewDocument } from '@/hooks/useDocuments';
import type { Document, Tag } from '@/types';

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'pending' | 'approved' | 'best-practice';

const statusLabels: Record<FilterStatus, string> = {
  all: 'Alle',
  pending: 'Ausstehend',
  approved: 'Genehmigt',
  'best-practice': 'Best Practice',
};

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewFilePath, setPreviewFilePath] = useState<string | null>(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);
  const [previewContentType, setPreviewContentType] = useState<string | null>(null);

  const { data: documentsData, isLoading: docsLoading } = useDocuments(filterStatus);
  const { data: tagsData = [], isLoading: tagsLoading } = useTags();
  const downloadMutation = useDownloadDocument();
  const viewMutation = useViewDocument();

  useEffect(() => {
    return () => {
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    };
  }, [previewObjectUrl]);

  const openPreview = (doc: { title: string; filePath: string }) => {
    setPreviewTitle(doc.title);
    setPreviewFilePath(doc.filePath);
    setPreviewContentType(null);
    setPreviewObjectUrl(null);
    setPreviewOpen(true);

    viewMutation.mutate(doc.filePath, {
      onSuccess: ({ objectUrl, contentType }) => {
        setPreviewObjectUrl(objectUrl);
        setPreviewContentType(contentType);
      },
      onError: () => {
        setPreviewOpen(false);
      },
    });
  };

  // Map raw DB data to include file_path for download
  const rawDocuments = documentsData || [];
  // Datenbank-Dokumente in UI-Format umwandeln
  const documents: (Document & { filePath: string })[] = rawDocuments.map((doc: any) => ({
    id: doc.id,
    title: doc.title,
    description: doc.description || '',
    type: doc.type,
    status: doc.status,
    tags: doc.document_tags?.map((dt: any) => ({
      id: dt.tags?.id,
      name: dt.tags?.name,
      color: dt.tags?.color,
      count: 0,
    })).filter((t: any) => t.id) || [],
    uploadedBy: doc.uploader?.name || 'Unbekannt',
    uploadedAt: new Date(doc.created_at),
    version: doc.version || '1.0',
    size: doc.file_size || 'Unbekannt',
    approvedBy: doc.approved_by,
    approvedAt: doc.approved_at ? new Date(doc.approved_at) : undefined,
    rating: doc.rating,
    downloads: doc.downloads || 0,
    isCached: doc.is_cached,
    filePath: doc.file_path,
  }));

  // Tags mit Anzahl transformieren
  const tags: Tag[] = tagsData.map((tag) => ({
    id: tag.id,
    name: tag.name,
    color: tag.color,
    count: documents.filter(d => d.tags.some(t => t.id === tag.id)).length,
  }));

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
                        doc.tags.some(tag => selectedTags.includes(tag.id));
    return matchesSearch && matchesTags;
  });

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const isLoading = docsLoading || tagsLoading;

  return (
    <AppLayout>
      {/* Kopfzeile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">
            Dokumente
          </h1>
          <p className="text-muted-foreground">
            {filteredDocuments.length} Dokumente gefunden
          </p>
        </div>
        
        <Button variant="hero" onClick={() => setIsUploadModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Dokument hochladen
        </Button>
      </div>

      {/* Suche und Filter */}
      <div className="space-y-4 mb-6">
        {/* Suchleiste */}
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-secondary rounded-xl">
            <Search className="w-5 h-5 text-muted-foreground" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nach Titel, Beschreibung oder Tags suchen..."
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-5 h-5" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Status-Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Status:</span>
          {(['all', 'pending', 'approved', 'best-practice'] as FilterStatus[]).map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(status)}
            >
              {statusLabels[status]}
            </Button>
          ))}
        </div>

        {/* Tag-Filter */}
        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Tags:</span>
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                className="cursor-pointer transition-all"
                style={selectedTags.includes(tag.id) ? { backgroundColor: tag.color } : {}}
                onClick={() => toggleTag(tag.id)}
              >
                {tag.name} ({tag.count})
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Ladezustand */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Dokumente Raster/Liste */}
      {!isLoading && (
        <div className={cn(
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" 
            : "space-y-3"
        )}>
          {filteredDocuments.map((doc, index) => (
            <div 
              key={doc.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <DocumentCard 
                document={doc} 
                onView={() => openPreview(doc)}
                onDownload={() => downloadMutation.mutate(doc.filePath)}
              />
            </div>
          ))}
        </div>
      )}

      <DocumentPreviewModal
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open);
          if (!open) {
            if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
            setPreviewObjectUrl(null);
            setPreviewContentType(null);
            setPreviewFilePath(null);
          }
        }}
        title={previewTitle}
        objectUrl={previewObjectUrl}
        contentType={previewContentType}
        onDownload={() => {
          if (previewFilePath) downloadMutation.mutate(previewFilePath);
        }}
      />

      {/* Upload-Modal */}
      <UploadModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </AppLayout>
  );
}
