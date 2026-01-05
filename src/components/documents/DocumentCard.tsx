import { 
  FileText, 
  FileSpreadsheet, 
  Presentation, 
  Image as ImageIcon, 
  GitBranch, 
  FileIcon,
  Download,
  Star,
  Trash2,
  Check,
  Clock,
  Award,
  WifiOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { Document, DocumentType, DocumentStatus } from '@/types';

interface DocumentCardProps {
  document: Document;
  onView?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  isAdmin?: boolean;
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

export function DocumentCard({ document, onView, onDownload, onDelete, isAdmin }: DocumentCardProps) {
  const TypeIcon = typeIcons[document.type];
  const statusInfo = statusConfig[document.status];
  const StatusIcon = statusInfo.icon;

  return (
    <div 
      className="group relative bg-card rounded-2xl border border-border p-5 hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={onView}
    >
      {/* Cached indicator */}
      {document.isCached && (
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
          <WifiOff className="w-4 h-4 text-success" />
        </div>
      )}

      {/* Document type icon */}
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
        <TypeIcon className="w-6 h-6 text-primary" />
      </div>

      {/* Title and description */}
      <h3 className="font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
        {document.title}
      </h3>
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
        {document.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {document.tags.slice(0, 3).map((tag) => (
          <Badge 
            key={tag.id} 
            variant="secondary"
            className="text-xs px-2 py-0.5"
            style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
          >
            {tag.name}
          </Badge>
        ))}
        {document.tags.length > 3 && (
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
            +{document.tags.length - 3}
          </Badge>
        )}
      </div>

      {/* Status and metadata row */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <Badge className={cn("text-xs", statusInfo.className)}>
          <StatusIcon className="w-3 h-3 mr-1" />
          {statusInfo.label}
        </Badge>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>v{document.version}</span>
          <span>•</span>
          <span>{document.size}</span>
        </div>
      </div>

      {/* Hover actions - full width row below status */}
      <div className="flex items-center gap-2 mt-3 opacity-0 max-h-0 overflow-hidden group-hover:opacity-100 group-hover:max-h-10 transition-all duration-300">
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
          className="h-8 w-8 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onDownload?.();
          }}
        >
          <Download className="w-4 h-4" />
        </Button>
        
        {isAdmin && onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                size="icon" 
                variant="destructive"
                className="h-8 w-8 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>Dokument löschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Das Dokument "{document.title}" wird unwiderruflich gelöscht. 
                  Diese Aktion kann nicht rückgängig gemacht werden.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Löschen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
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
