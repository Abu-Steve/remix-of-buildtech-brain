import { useState } from 'react';
import { Plus, Search, Filter, Grid3X3, List, SortAsc } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { UploadModal } from '@/components/documents/UploadModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Document, Tag } from '@/types';

const mockTags: Tag[] = [
  { id: '1', name: 'Safety', color: '#ef4444', count: 145 },
  { id: '2', name: 'Building Code', color: '#3b82f6', count: 89 },
  { id: '3', name: 'Electrical', color: '#f59e0b', count: 67 },
  { id: '4', name: 'Plumbing', color: '#06b6d4', count: 45 },
  { id: '5', name: 'HVAC', color: '#8b5cf6', count: 34 },
  { id: '6', name: 'Structural', color: '#10b981', count: 78 },
];

const mockDocuments: Document[] = [
  {
    id: '1',
    title: 'Scaffolding Safety Guidelines 2024',
    description: 'Comprehensive safety protocols for scaffolding installation, inspection, and use on construction sites.',
    type: 'pdf',
    status: 'best-practice',
    tags: [mockTags[0], mockTags[5]],
    uploadedBy: 'Hans Weber',
    uploadedAt: new Date('2024-01-15'),
    version: '2.1',
    size: '2.4 MB',
    rating: 4.8,
    downloads: 342,
    isCached: true,
  },
  {
    id: '2',
    title: 'VOB/B Contract Compliance Checklist',
    description: 'Step-by-step checklist for ensuring compliance with VOB/B regulations in construction contracts.',
    type: 'excel',
    status: 'approved',
    tags: [mockTags[1]],
    uploadedBy: 'Anna Schmidt',
    uploadedAt: new Date('2024-01-10'),
    version: '1.3',
    size: '856 KB',
    rating: 4.5,
    downloads: 189,
  },
  {
    id: '3',
    title: 'DIN 18533 Waterproofing Standards',
    description: 'Technical documentation covering waterproofing requirements according to DIN 18533 standard.',
    type: 'pdf',
    status: 'approved',
    tags: [mockTags[1], mockTags[5]],
    uploadedBy: 'Thomas Müller',
    uploadedAt: new Date('2024-01-08'),
    version: '1.0',
    size: '5.2 MB',
    downloads: 267,
    isCached: true,
  },
  {
    id: '4',
    title: 'Electrical Installation Inspection Form',
    description: 'Standardized form for documenting electrical installation inspections on residential projects.',
    type: 'pdf',
    status: 'pending',
    tags: [mockTags[2], mockTags[0]],
    uploadedBy: 'Peter Hoffmann',
    uploadedAt: new Date('2024-01-18'),
    version: '1.0',
    size: '340 KB',
    downloads: 12,
  },
  {
    id: '5',
    title: 'HVAC System Design Flowchart',
    description: 'Visual guide for HVAC system design decisions in commercial buildings.',
    type: 'flowchart',
    status: 'best-practice',
    tags: [mockTags[4]],
    uploadedBy: 'Maria Berger',
    uploadedAt: new Date('2024-01-05'),
    version: '3.0',
    size: '1.8 MB',
    rating: 4.9,
    downloads: 456,
  },
  {
    id: '6',
    title: 'Plumbing Code Quick Reference',
    description: 'Quick reference guide for common plumbing code requirements and installation standards.',
    type: 'pdf',
    status: 'approved',
    tags: [mockTags[3], mockTags[1]],
    uploadedBy: 'Klaus Fischer',
    uploadedAt: new Date('2024-01-12'),
    version: '2.0',
    size: '1.1 MB',
    rating: 4.3,
    downloads: 178,
    isCached: true,
  },
];

type ViewMode = 'grid' | 'list';
type FilterStatus = 'all' | 'pending' | 'approved' | 'best-practice';

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    const matchesTags = selectedTags.length === 0 || 
                        doc.tags.some(tag => selectedTags.includes(tag.id));
    return matchesSearch && matchesStatus && matchesTags;
  });

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">
            Documents
          </h1>
          <p className="text-muted-foreground">
            {filteredDocuments.length} documents found
          </p>
        </div>
        
        <Button variant="hero" onClick={() => setIsUploadModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Upload Document
        </Button>
      </div>

      {/* Search and filters */}
      <div className="space-y-4 mb-6">
        {/* Search bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-secondary rounded-xl">
            <Search className="w-5 h-5 text-muted-foreground" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, description, or tags..."
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

        {/* Status filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Status:</span>
          {(['all', 'pending', 'approved', 'best-practice'] as FilterStatus[]).map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(status)}
              className="capitalize"
            >
              {status === 'all' ? 'All' : status.replace('-', ' ')}
            </Button>
          ))}
        </div>

        {/* Tag filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Tags:</span>
          {mockTags.map((tag) => (
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
      </div>

      {/* Documents grid/list */}
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
            <DocumentCard document={doc} />
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredDocuments.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No documents found</h3>
          <p className="text-muted-foreground mb-6">
            Try adjusting your search or filter criteria.
          </p>
          <Button variant="outline" onClick={() => {
            setSearchQuery('');
            setFilterStatus('all');
            setSelectedTags([]);
          }}>
            Clear all filters
          </Button>
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={(data) => {
          console.log('Upload:', data);
          setIsUploadModalOpen(false);
        }}
      />
    </AppLayout>
  );
}
