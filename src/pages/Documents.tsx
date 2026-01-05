import { useEffect, useState } from 'react';
import { Plus, Search, Grid3X3, List, Loader2, Folder, FolderOpen, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { DocumentPreviewModal } from '@/components/documents/DocumentPreviewModal';
import { UploadModal } from '@/components/documents/UploadModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDocuments, useTags, useDownloadDocument, useViewDocument, useDeleteDocument, useGroups } from '@/hooks/useDocuments';
import { useDocumentRelations } from '@/hooks/useDocumentRelations';
import { useIsAdmin } from '@/hooks/useUserRole';
import type { Document, Tag } from '@/types';

type ViewMode = 'grid' | 'list' | 'folders';
type FilterStatus = 'all' | 'pending' | 'approved';

const statusLabels: Record<FilterStatus, string> = {
  all: 'Alle',
  pending: 'Ausstehend',
  approved: 'Genehmigt',
};

const departmentLabels: Record<string, string> = {
  office: 'Büro',
  manager: 'Manager',
  craftsman: 'Handwerker',
};

interface FolderStructure {
  [groupName: string]: {
    groupId: string;
    departments: {
      [dept: string]: (Document & { filePath: string })[];
    };
  };
}

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('folders');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // Folder navigation
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>([]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<(Document & { filePath: string }) | null>(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);
  const [previewContentType, setPreviewContentType] = useState<string | null>(null);

  const { data: documentsData, isLoading: docsLoading } = useDocuments(filterStatus);
  const { data: tagsData = [], isLoading: tagsLoading } = useTags();
  const { data: groupsData = [] } = useGroups();
  const { data: documentRelations = [] } = useDocumentRelations(previewDoc?.id || null);
  const downloadMutation = useDownloadDocument();
  const viewMutation = useViewDocument();
  const deleteMutation = useDeleteDocument();
  const isAdmin = useIsAdmin();

  useEffect(() => {
    return () => {
      if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
    };
  }, [previewObjectUrl]);

  const openPreview = (doc: Document & { filePath: string }) => {
    setPreviewDoc(doc);
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
  const documents: (Document & { filePath: string; groupName?: string; groupId?: string; audience?: string[]; visibilityScope?: string })[] = rawDocuments.map((doc: any) => ({
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
    groupName: doc.groups?.name,
    groupId: doc.group_id,
    audience: doc.audience,
    visibilityScope: doc.visibility_scope,
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

  // Build folder structure
  const folderStructure: FolderStructure = {};
  filteredDocuments.forEach(doc => {
    const groupName = doc.groupName || 'Ohne Zuordnung';
    const groupId = doc.groupId || 'ungrouped';
    
    // Determine department from file path
    let department = 'office';
    const pathParts = doc.filePath.split('/');
    if (pathParts.length >= 2) {
      const possibleDept = pathParts[1];
      if (['office', 'manager', 'craftsman'].includes(possibleDept)) {
        department = possibleDept;
      }
    }

    if (!folderStructure[groupName]) {
      folderStructure[groupName] = { groupId, departments: {} };
    }
    if (!folderStructure[groupName].departments[department]) {
      folderStructure[groupName].departments[department] = [];
    }
    folderStructure[groupName].departments[department].push(doc);
  });

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupName) 
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    );
  };

  const toggleDepartment = (key: string) => {
    setExpandedDepartments(prev => 
      prev.includes(key) 
        ? prev.filter(d => d !== key)
        : [...prev, key]
    );
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const isLoading = docsLoading || tagsLoading;

  // Build metadata for preview
  const previewMetadata = previewDoc ? {
    id: previewDoc.id,
    title: previewDoc.title,
    description: previewDoc.description,
    type: previewDoc.type,
    status: previewDoc.status,
    version: previewDoc.version,
    size: previewDoc.size,
    uploadedBy: previewDoc.uploadedBy,
    uploadedAt: previewDoc.uploadedAt,
    groupName: (previewDoc as any).groupName,
    visibilityScope: (previewDoc as any).visibilityScope as 'company_only' | 'all_companies',
    audience: (previewDoc as any).audience,
    tags: previewDoc.tags,
    relations: documentRelations.map(r => ({
      type: r.type as any,
      targetDocTitle: r.targetDocTitle,
      targetDocId: r.targetDocId,
    })),
  } : undefined;

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
              variant={viewMode === 'folders' ? 'secondary' : 'ghost'} 
              size="icon"
              onClick={() => setViewMode('folders')}
              title="Ordneransicht"
            >
              <Folder className="w-5 h-5" />
            </Button>
            <Button 
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
              size="icon"
              onClick={() => setViewMode('grid')}
              title="Rasteransicht"
            >
              <Grid3X3 className="w-5 h-5" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
              size="icon"
              onClick={() => setViewMode('list')}
              title="Listenansicht"
            >
              <List className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Status-Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Status:</span>
          {(['all', 'pending', 'approved'] as FilterStatus[]).map((status) => (
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

      {/* Folder View */}
      {!isLoading && viewMode === 'folders' && (
        <div className="space-y-2">
          {Object.entries(folderStructure).map(([groupName, groupData]) => (
            <div key={groupName} className="border rounded-lg bg-card">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(groupName)}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
              >
                <ChevronRight className={cn(
                  "w-4 h-4 transition-transform",
                  expandedGroups.includes(groupName) && "rotate-90"
                )} />
                {expandedGroups.includes(groupName) ? (
                  <FolderOpen className="w-5 h-5 text-primary" />
                ) : (
                  <Folder className="w-5 h-5 text-primary" />
                )}
                <span className="font-medium">{groupName}</span>
                <Badge variant="secondary" className="ml-auto">
                  {Object.values(groupData.departments).flat().length} Dokumente
                </Badge>
              </button>

              {/* Departments */}
              {expandedGroups.includes(groupName) && (
                <div className="pl-8 pb-2">
                  {Object.entries(groupData.departments).map(([dept, docs]) => {
                    const deptKey = `${groupName}-${dept}`;
                    return (
                      <div key={dept} className="border-l-2 border-muted ml-2">
                        <button
                          onClick={() => toggleDepartment(deptKey)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors"
                        >
                          <ChevronRight className={cn(
                            "w-4 h-4 transition-transform",
                            expandedDepartments.includes(deptKey) && "rotate-90"
                          )} />
                          {expandedDepartments.includes(deptKey) ? (
                            <FolderOpen className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Folder className="w-4 h-4 text-muted-foreground" />
                          )}
                          <span className="text-sm">{departmentLabels[dept] || dept}</span>
                          <Badge variant="outline" className="ml-auto text-xs">
                            {docs.length}
                          </Badge>
                        </button>

                        {/* Documents in department */}
                        {expandedDepartments.includes(deptKey) && (
                          <div className="pl-8 pb-2 space-y-2">
                            {docs.map((doc) => (
                              <div key={doc.id} className="animate-fade-in">
                                <DocumentCard 
                                  document={doc} 
                                  onView={() => openPreview(doc)}
                                  onDownload={() => downloadMutation.mutate(doc.filePath)}
                                  onDelete={() => deleteMutation.mutate(doc.id)}
                                  isAdmin={isAdmin}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {Object.keys(folderStructure).length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              Keine Dokumente gefunden
            </div>
          )}
        </div>
      )}

      {/* Grid/List View */}
      {!isLoading && viewMode !== 'folders' && (
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
                onDelete={() => deleteMutation.mutate(doc.id)}
                isAdmin={isAdmin}
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
            setPreviewDoc(null);
          }
        }}
        title={previewDoc?.title || ''}
        objectUrl={previewObjectUrl}
        contentType={previewContentType}
        onDownload={() => {
          if (previewDoc?.filePath) downloadMutation.mutate(previewDoc.filePath);
        }}
        metadata={previewMetadata}
      />

      {/* Upload-Modal */}
      <UploadModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </AppLayout>
  );
}
