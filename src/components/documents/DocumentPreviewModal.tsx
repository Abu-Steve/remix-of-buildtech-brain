import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Users, Building2, Link2, Tag, Eye, Globe, Lock, Calendar, User, Pencil, Save, X, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useIsChampion, useIsAdmin } from '@/hooks/useUserRole';
import { useDocuments, useTags } from '@/hooks/useDocuments';
import { useUpdateDocumentMetadata } from '@/hooks/useUpdateDocumentMetadata';
import { Input } from '@/components/ui/input';

type RelationType = 'extends' | 'references' | 'supersedes' | 'depends_on' | 'implements' | 'explains' | 'related_to';

const relationLabels: Record<RelationType, string> = {
  extends: 'erweitert',
  references: 'verweist auf',
  supersedes: 'ersetzt',
  depends_on: 'setzt voraus',
  implements: 'setzt um',
  explains: 'erklärt',
  related_to: 'thematisch verwandt',
};

const audienceLabels: Record<string, string> = {
  all: 'Alle',
  office: 'Büro',
  manager: 'Manager',
  craftsman: 'Handwerker',
};

type DocumentMetadata = {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  version?: string;
  size?: string;
  uploadedBy?: string;
  uploadedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  groupName?: string;
  visibilityScope?: 'company_only' | 'all_companies';
  audience?: string[];
  tags?: { id: string; name: string; color: string }[];
  relations?: { type: RelationType; targetDocTitle: string; targetDocId: string }[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  objectUrl: string | null;
  contentType: string | null;
  onDownload?: () => void;
  metadata?: DocumentMetadata;
};

export function DocumentPreviewModal({
  open,
  onOpenChange,
  title,
  objectUrl,
  contentType,
  onDownload,
  metadata,
}: Props) {
  const isPdf = !!contentType?.includes('pdf');
  const isImage = !!contentType?.startsWith('image/');
  
  const isChampion = useIsChampion();
  const isAdmin = useIsAdmin();
  const canEdit = isChampion || isAdmin;
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedAudience, setEditedAudience] = useState<string[]>([]);
  const [editedVisibility, setEditedVisibility] = useState<'company_only' | 'all_companies'>('company_only');
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [editedRelations, setEditedRelations] = useState<{ type: RelationType; targetDocId: string }[]>([]);
  
  const { data: allDocuments } = useDocuments();
  const { data: allTags } = useTags();
  const updateMetadata = useUpdateDocumentMetadata();

  // Initialize edit state when metadata changes or editing starts
  useEffect(() => {
    if (metadata && isEditing) {
      setEditedAudience(metadata.audience || ['all']);
      setEditedVisibility(metadata.visibilityScope || 'company_only');
      setEditedTags(metadata.tags?.map(t => t.name) || []);
      setEditedRelations(metadata.relations?.map(r => ({ type: r.type, targetDocId: r.targetDocId })) || []);
    }
  }, [metadata, isEditing]);

  const handleStartEdit = () => {
    if (metadata) {
      setEditedAudience(metadata.audience || ['all']);
      setEditedVisibility(metadata.visibilityScope || 'company_only');
      setEditedTags(metadata.tags?.map(t => t.name) || []);
      setEditedRelations(metadata.relations?.map(r => ({ type: r.type, targetDocId: r.targetDocId })) || []);
    }
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setNewTag('');
  };

  const handleSave = async () => {
    if (!metadata) return;
    
    await updateMetadata.mutateAsync({
      documentId: metadata.id,
      audience: editedAudience,
      visibilityScope: editedVisibility,
      tags: editedTags,
      relations: editedRelations,
    });
    
    setIsEditing(false);
  };

  const handleAudienceChange = (value: string) => {
    if (value === 'all') {
      setEditedAudience(['all']);
    } else {
      const newAudience = editedAudience.filter(a => a !== 'all');
      if (newAudience.includes(value)) {
        const filtered = newAudience.filter(a => a !== value);
        setEditedAudience(filtered.length > 0 ? filtered : ['all']);
      } else {
        setEditedAudience([...newAudience, value]);
      }
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !editedTags.includes(newTag.trim())) {
      setEditedTags([...editedTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagName: string) => {
    setEditedTags(editedTags.filter(t => t !== tagName));
  };

  const handleAddRelation = () => {
    setEditedRelations([...editedRelations, { type: 'related_to', targetDocId: '' }]);
  };

  const handleRemoveRelation = (index: number) => {
    setEditedRelations(editedRelations.filter((_, i) => i !== index));
  };

  const handleRelationChange = (index: number, field: 'type' | 'targetDocId', value: string) => {
    const updated = [...editedRelations];
    if (field === 'type') {
      updated[index].type = value as RelationType;
    } else {
      updated[index].targetDocId = value;
    }
    setEditedRelations(updated);
  };

  const otherDocuments = allDocuments?.filter(d => d.id !== metadata?.id) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl p-0 overflow-hidden max-h-[90vh]">
        <DialogHeader className="px-6 pt-6">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="pr-10 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {title}
            </DialogTitle>
            {onDownload && (
              <Button variant="secondary" size="sm" onClick={onDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="preview" className="w-full">
          <div className="px-6">
            <TabsList className="grid w-full max-w-[400px] grid-cols-2">
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Vorschau
              </TabsTrigger>
              <TabsTrigger value="metadata" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Metadaten
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="preview" className="px-6 pb-6 mt-4">
            {!objectUrl ? (
              <div className="h-[60vh] flex items-center justify-center text-muted-foreground">
                Lade Vorschau…
              </div>
            ) : isPdf ? (
              <iframe
                key={objectUrl}
                title={title}
                src={objectUrl}
                className="w-full h-[60vh] rounded-md border"
              />
            ) : isImage ? (
              <div className="h-[60vh] flex items-center justify-center bg-muted/30 rounded-md border overflow-auto">
                <img
                  src={objectUrl}
                  alt={`Vorschau: ${title}`}
                  className="max-h-[60vh] max-w-full object-contain"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="h-[60vh] flex flex-col items-center justify-center text-center gap-3">
                <p className="text-muted-foreground">
                  Vorschau für diesen Dateityp ist nicht verfügbar.
                </p>
                {onDownload && (
                  <Button variant="hero" onClick={onDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Datei herunterladen
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="metadata" className="px-6 pb-6 mt-4">
            {metadata ? (
              <div className="space-y-4">
                {/* Edit controls for Champions/Admins */}
                {canEdit && (
                  <div className="flex justify-end gap-2">
                    {isEditing ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleCancelEdit}
                          disabled={updateMetadata.isPending}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Abbrechen
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={handleSave}
                          disabled={updateMetadata.isPending}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {updateMetadata.isPending ? 'Speichern...' : 'Speichern'}
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" onClick={handleStartEdit}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Bearbeiten
                      </Button>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[55vh] overflow-y-auto">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Grundinformationen
                    </h3>
                    
                    <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                      {metadata.description && (
                        <div>
                          <span className="text-sm text-muted-foreground">Beschreibung</span>
                          <p className="text-sm">{metadata.description}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-sm text-muted-foreground">Typ</span>
                          <p className="text-sm font-medium capitalize">{metadata.type}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Status</span>
                          <Badge variant={metadata.status === 'approved' ? 'default' : 'secondary'}>
                            {metadata.status === 'pending' ? 'Ausstehend' : 
                             metadata.status === 'approved' ? 'Genehmigt' : 
                             metadata.status === 'best-practice' ? 'Best Practice' : 'Abgelehnt'}
                          </Badge>
                        </div>
                        {metadata.version && (
                          <div>
                            <span className="text-sm text-muted-foreground">Version</span>
                            <p className="text-sm font-medium">{metadata.version}</p>
                          </div>
                        )}
                        {metadata.size && (
                          <div>
                            <span className="text-sm text-muted-foreground">Größe</span>
                            <p className="text-sm font-medium">{metadata.size}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Upload & Approval */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Upload & Freigabe
                    </h3>
                    
                    <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                      {metadata.uploadedBy && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <span className="text-sm text-muted-foreground">Hochgeladen von </span>
                            <span className="text-sm font-medium">{metadata.uploadedBy}</span>
                            {metadata.uploadedAt && (
                              <span className="text-sm text-muted-foreground">
                                {' '}am {format(metadata.uploadedAt, 'dd.MM.yyyy', { locale: de })}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {metadata.approvedBy && metadata.approvedAt && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <span className="text-sm text-muted-foreground">Freigegeben von </span>
                            <span className="text-sm font-medium">{metadata.approvedBy}</span>
                            <span className="text-sm text-muted-foreground">
                              {' '}am {format(metadata.approvedAt, 'dd.MM.yyyy', { locale: de })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Access Rights */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Zugriffsrechte
                    </h3>
                    
                    <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                      {metadata.groupName && (
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            <span className="text-muted-foreground">Firma: </span>
                            <span className="font-medium">{metadata.groupName}</span>
                          </span>
                        </div>
                      )}
                      
                      {isEditing ? (
                        <>
                          <div>
                            <label className="text-sm text-muted-foreground block mb-2">Sichtbarkeit</label>
                            <Select value={editedVisibility} onValueChange={(v) => setEditedVisibility(v as 'company_only' | 'all_companies')}>
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="company_only">Nur eigene Firma</SelectItem>
                                <SelectItem value="all_companies">Alle Firmen</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <label className="text-sm text-muted-foreground block mb-2">Zielgruppe</label>
                            <div className="flex flex-wrap gap-2">
                              {['all', 'office', 'manager', 'craftsman'].map((aud) => (
                                <Badge
                                  key={aud}
                                  variant={editedAudience.includes(aud) ? 'default' : 'outline'}
                                  className="cursor-pointer"
                                  onClick={() => handleAudienceChange(aud)}
                                >
                                  {audienceLabels[aud]}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            {metadata.visibilityScope === 'all_companies' ? (
                              <Globe className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <Lock className="w-4 h-4 text-muted-foreground" />
                            )}
                            <span className="text-sm">
                              <span className="text-muted-foreground">Sichtbarkeit: </span>
                              <span className="font-medium">
                                {metadata.visibilityScope === 'all_companies' 
                                  ? 'Alle Firmen' 
                                  : 'Nur eigene Firma'}
                              </span>
                            </span>
                          </div>

                          {metadata.audience && metadata.audience.length > 0 && (
                            <div>
                              <span className="text-sm text-muted-foreground">Zielgruppe: </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {metadata.audience.map((a) => (
                                  <Badge key={a} variant="secondary">
                                    {audienceLabels[a] || a}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Tags
                    </h3>
                    
                    <div className="p-4 rounded-lg border bg-muted/30">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {editedTags.map((tagName) => (
                              <Badge key={tagName} variant="secondary" className="flex items-center gap-1">
                                {tagName}
                                <button
                                  onClick={() => handleRemoveTag(tagName)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Neuer Tag..."
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                              className="flex-1"
                            />
                            <Button variant="outline" size="sm" onClick={handleAddTag}>
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          {allTags && allTags.length > 0 && (
                            <div>
                              <span className="text-xs text-muted-foreground">Vorhandene Tags:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {allTags.filter(t => !editedTags.includes(t.name)).slice(0, 10).map((tag) => (
                                  <Badge
                                    key={tag.id}
                                    variant="outline"
                                    className="cursor-pointer text-xs"
                                    onClick={() => setEditedTags([...editedTags, tag.name])}
                                  >
                                    + {tag.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : metadata.tags && metadata.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {metadata.tags.map((tag) => (
                            <Badge 
                              key={tag.id}
                              style={{ backgroundColor: tag.color }}
                            >
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Keine Tags</p>
                      )}
                    </div>
                  </div>

                  {/* Relations */}
                  <div className="space-y-4 md:col-span-2">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Link2 className="w-4 h-4" />
                      Verknüpfungen
                    </h3>
                    
                    <div className="p-4 rounded-lg border bg-muted/30">
                      {isEditing ? (
                        <div className="space-y-3">
                          {editedRelations.map((rel, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Select
                                value={rel.type}
                                onValueChange={(v) => handleRelationChange(idx, 'type', v)}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(relationLabels).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                value={rel.targetDocId}
                                onValueChange={(v) => handleRelationChange(idx, 'targetDocId', v)}
                              >
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="Dokument auswählen..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {otherDocuments.map((doc) => (
                                    <SelectItem key={doc.id} value={doc.id}>{doc.title}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveRelation(idx)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" onClick={handleAddRelation}>
                            <Plus className="w-4 h-4 mr-2" />
                            Verknüpfung hinzufügen
                          </Button>
                        </div>
                      ) : metadata.relations && metadata.relations.length > 0 ? (
                        <div className="space-y-2">
                          {metadata.relations.map((rel, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">{relationLabels[rel.type]}</span>
                              <span className="font-medium">{rel.targetDocTitle}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Keine Verknüpfungen</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[60vh] flex items-center justify-center text-muted-foreground">
                Keine Metadaten verfügbar
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
