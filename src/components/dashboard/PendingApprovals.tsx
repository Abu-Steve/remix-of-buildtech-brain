import { Check, X, Eye, FileText, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PendingDocument {
  id: string;
  title: string;
  uploadedBy: string;
  uploadedAt: string;
  type: string;
  tags: string[];
}

const pendingDocs: PendingDocument[] = [
  {
    id: '1',
    title: 'Scaffolding Inspection Protocol v2.1',
    uploadedBy: 'Klaus Fischer',
    uploadedAt: '2 hours ago',
    type: 'PDF',
    tags: ['Safety', 'Scaffolding']
  },
  {
    id: '2',
    title: 'DIN 18533 Waterproofing Guide',
    uploadedBy: 'Maria Berger',
    uploadedAt: '5 hours ago',
    type: 'PDF',
    tags: ['Waterproofing', 'Standards']
  },
  {
    id: '3',
    title: 'Electrical Installation Checklist',
    uploadedBy: 'Peter Hoffmann',
    uploadedAt: '1 day ago',
    type: 'Excel',
    tags: ['Electrical', 'Checklist']
  },
];

export function PendingApprovals() {
  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Pending Approvals</h3>
        <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/30">
          {pendingDocs.length} pending
        </Badge>
      </div>
      
      <div className="space-y-3">
        {pendingDocs.map((doc, index) => (
          <div 
            key={doc.id}
            className="p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground truncate">{doc.title}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>{doc.uploadedBy}</span>
                  <span>•</span>
                  <Clock className="w-3 h-3" />
                  <span>{doc.uploadedAt}</span>
                </div>
                
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {doc.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
              <Button size="sm" variant="ghost" className="flex-1 h-9">
                <Eye className="w-4 h-4 mr-1" />
                Review
              </Button>
              <Button size="sm" variant="success" className="h-9">
                <Check className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" className="h-9 text-destructive hover:text-destructive">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-4 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
        View all pending ({pendingDocs.length})
      </button>
    </div>
  );
}
