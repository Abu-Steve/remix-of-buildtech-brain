import { 
  FileText, 
  FileSpreadsheet, 
  Presentation, 
  Image as ImageIcon, 
  GitBranch, 
  FileIcon,
  Download,
  Star,
  MoreVertical,
  Check,
  Clock,
  Award,
  WifiOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Document, DocumentType, DocumentStatus } from '@/types';

interface DocumentCardProps {
  document: Document;
  onView?: () => void;
  onDownload?: () => void;
}

const typeIcons: Record<DocumentType, React.ElementType> = {
  pdf: FileText,
  excel: FileSpreadsheet,
  presentation: Presentation,
  flowchart: GitBranch,
  drawing: ImageIcon,
  image: ImageIcon,
  other: FileIcon,
};

const statusConfig: Record<DocumentStatus, { icon: React.ElementType; label: string; className: string }> = {
  pending: { icon: Clock, label: 'Pending Review', className: 'status-pending border' },
  approved: { icon: Check, label: 'Approved', className: 'status-approved border' },
  'best-practice': { icon: Award, label: 'Best Practice', className: 'status-best-practice border' },
  rejected: { icon: Clock, label: 'Rejected', className: 'bg-destructive/15 text-destructive border border-destructive/30' },
};

export function DocumentCard({ document, onView, onDownload }: DocumentCardProps) {
  const TypeIcon = typeIcons[document.type];
  const statusInfo = statusConfig[document.status];
  const StatusIcon = statusInfo.icon;

  return (
    <div 
      className="group relative bg-card rounded-2xl border border-border p-4 hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer min-h-[220px] pb-16"
      onClick={onView}
    >
      {/* Cached indicator */}
      {document.isCached && (
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
          <WifiOff className="w-4 h-4 text-success" />
        </div>
      )}

      {/* Document type icon */}
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
        <TypeIcon className="w-5 h-5 text-primary" />
      </div>

      {/* Title and description */}
      <h3 className="font-semibold text-foreground text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
        {document.title}
      </h3>
      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
        {document.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {document.tags.slice(0, 2).map((tag) => (
          <Badge 
            key={tag.id} 
            variant="secondary"
            className="text-xs px-1.5 py-0"
            style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
          >
            {tag.name}
          </Badge>
        ))}
        {document.tags.length > 2 && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            +{document.tags.length - 2}
          </Badge>
        )}
      </div>

      {/* Status and metadata */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <Badge className={cn("text-xs px-1.5 py-0", statusInfo.className)}>
          <StatusIcon className="w-3 h-3 mr-1" />
          {statusInfo.label}
        </Badge>
        
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>v{document.version}</span>
          <span>•</span>
          <span>{document.size}</span>
        </div>
      </div>

      {/* Hover actions - positioned below status */}
      <div className="absolute inset-x-4 bottom-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          size="sm" 
          variant="hero"
          className="flex-1 h-8 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onView?.();
          }}
        >
          Dokument öffnen
        </Button>
        <Button 
          size="icon" 
          variant="secondary"
          className="shrink-0 h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onDownload?.();
          }}
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>

      {/* Rating */}
      {document.rating && (
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-accent/20 text-accent-foreground text-xs font-medium">
          <Star className="w-3 h-3 fill-accent text-accent" />
          {document.rating.toFixed(1)}
        </div>
      )}
    </div>
  );
}
