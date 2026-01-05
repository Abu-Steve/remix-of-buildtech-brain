import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  objectUrl: string | null;
  contentType: string | null;
  onDownload?: () => void;
};

export function DocumentPreviewModal({
  open,
  onOpenChange,
  title,
  objectUrl,
  contentType,
  onDownload,
}: Props) {
  const isPdf = !!contentType?.includes('pdf');
  const isImage = !!contentType?.startsWith('image/');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="pr-10">{title}</DialogTitle>
            {onDownload && (
              <Button variant="secondary" size="sm" onClick={onDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="px-6 pb-6">
          {!objectUrl ? (
            <div className="h-[70vh] flex items-center justify-center text-muted-foreground">
              Lade Vorschau…
            </div>
          ) : isPdf ? (
            <iframe
              key={objectUrl}
              title={title}
              src={objectUrl}
              className="w-full h-[70vh] rounded-md border"
            />
          ) : isImage ? (
            <div className="h-[70vh] flex items-center justify-center bg-muted/30 rounded-md border overflow-auto">
              <img
                src={objectUrl}
                alt={`Vorschau: ${title}`}
                className="max-h-[70vh] max-w-full object-contain"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="h-[70vh] flex flex-col items-center justify-center text-center gap-3">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
