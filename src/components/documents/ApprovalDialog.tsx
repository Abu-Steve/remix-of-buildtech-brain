import { useState } from 'react';
import { X, CheckCircle, XCircle, Award, Globe, Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApproveDocument } from '@/hooks/useDocuments';

interface ApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
}

export function ApprovalDialog({ 
  isOpen, 
  onClose, 
  documentId, 
  documentTitle,
}: ApprovalDialogProps) {
  const [visibilityScope, setVisibilityScope] = useState<'company_only' | 'all_companies'>('company_only');
  
  const approveMutation = useApproveDocument();

  const handleApprove = (status: 'approved' | 'best-practice') => {
    approveMutation.mutate({
      documentId,
      groupId: null,
      status,
      visibilityScope,
      audience: ['all'],
    }, {
      onSuccess: () => onClose(),
    });
  };

  const handleReject = () => {
    approveMutation.mutate({
      documentId,
      groupId: null,
      status: 'rejected',
    }, {
      onSuccess: () => onClose(),
    });
  };

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
              <CheckCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Dokument freigeben</h2>
              <p className="text-sm text-muted-foreground truncate max-w-xs">{documentTitle}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Wer darf dieses Dokument sehen?
            </label>
            <div className="flex gap-2">
              <Badge
                variant={visibilityScope === 'company_only' ? 'default' : 'outline'}
                className="cursor-pointer transition-all px-4 py-2"
                onClick={() => setVisibilityScope('company_only')}
              >
                <Building2 className="w-4 h-4 mr-2" />
                Nur eigene Firma
              </Badge>
              <Badge
                variant={visibilityScope === 'all_companies' ? 'default' : 'outline'}
                className="cursor-pointer transition-all px-4 py-2"
                onClick={() => setVisibilityScope('all_companies')}
              >
                <Globe className="w-4 h-4 mr-2" />
                Alle Firmen
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 p-6 border-t border-border bg-muted/30">
          <Button 
            variant="destructive" 
            onClick={handleReject}
            disabled={approveMutation.isPending}
          >
            {approveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4 mr-2" />
            )}
            Ablehnen
          </Button>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleApprove('approved')}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Freigeben
            </Button>
            <Button 
              variant="hero"
              onClick={() => handleApprove('best-practice')}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Award className="w-4 h-4 mr-2" />
              )}
              Best Practice
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
