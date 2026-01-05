import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, FileText, Tag, Sparkles, AlertCircle, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTags, useUploadDocument } from '@/hooks/useDocuments';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAudience, setSelectedAudience] = useState<string[]>(['all']);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const { data: availableTags = [] } = useTags();
  const uploadMutation = useUploadDocument();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setTitle(uploadedFile.name.replace(/\.[^/.]+$/, ''));
      
      // KI-Tag-Analyse simulieren (wird später durch echte KI ersetzt)
      setIsAnalyzing(true);
      setTimeout(() => {
        // Relevante Tags basierend auf Dateiname vorschlagen
        const suggestions: string[] = [];
        const fileName = uploadedFile.name.toLowerCase();
        if (fileName.includes('safety') || fileName.includes('sicherheit')) suggestions.push('Sicherheit');
        if (fileName.includes('regulation') || fileName.includes('vorschrift')) suggestions.push('Vorschriften');
        if (fileName.includes('best') || fileName.includes('practice')) suggestions.push('Best Practice');
        if (suggestions.length === 0) suggestions.push('Technisch');
        setAiSuggestions(suggestions);
        setIsAnalyzing(false);
      }, 1000);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    },
    maxFiles: 1,
  });

  const toggleTag = (tagName: string) => {
    setSelectedTags(prev => 
      prev.includes(tagName) 
        ? prev.filter(t => t !== tagName)
        : [...prev, tagName]
    );
  };

  const toggleAudience = (value: string) => {
    if (value === 'all') {
      setSelectedAudience(['all']);
    } else {
      const newAudience = selectedAudience.includes(value)
        ? selectedAudience.filter(a => a !== value)
        : [...selectedAudience.filter(a => a !== 'all'), value];
      setSelectedAudience(newAudience.length === 0 ? ['all'] : newAudience);
    }
  };

  const handleSubmit = async () => {
    if (file && title) {
      await uploadMutation.mutateAsync({
        file,
        title,
        description,
        tags: selectedTags,
        audience: selectedAudience,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setSelectedTags([]);
    setSelectedAudience(['all']);
    setAiSuggestions([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Hintergrund */}
      <div 
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-xl bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-slide-in-up">
        {/* Kopfzeile */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Dokument hochladen</h2>
              <p className="text-sm text-muted-foreground">Teilen Sie Ihr Wissen mit dem Team</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Inhalt */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
              isDragActive 
                ? "border-primary bg-primary/5" 
                : file 
                  ? "border-success bg-success/5" 
                  : "border-border hover:border-primary/50"
            )}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-success" />
                <div className="text-left">
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-foreground mb-1">
                  {isDragActive ? 'Datei hier ablegen' : 'Ziehen & Ablegen oder klicken zum Hochladen'}
                </p>
                <p className="text-sm text-muted-foreground">
                  PDF, Excel, PowerPoint oder Bilder bis zu 50MB
                </p>
              </>
            )}
          </div>

          {/* Titel */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Dokumenttitel</label>
            <Input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Dokumenttitel eingeben..."
            />
          </div>

          {/* Beschreibung */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Beschreibung</label>
            <Textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreiben Sie dieses Dokument kurz..."
              rows={3}
            />
          </div>

          {/* KI-Tag-Vorschläge */}
          {aiSuggestions.length > 0 && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">KI-Vorschläge für Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {aiSuggestions.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer transition-all"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Dokument wird auf Tag-Vorschläge analysiert...</span>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags auswählen
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedTags.includes(tag.name) ? "default" : "outline"}
                  className="cursor-pointer transition-all"
                  style={selectedTags.includes(tag.name) ? { backgroundColor: tag.color } : {}}
                  onClick={() => toggleTag(tag.name)}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Zielgruppe */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Zielgruppe (Audience)
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'Alle' },
                { value: 'office', label: 'Büro' },
                { value: 'manager', label: 'Manager' },
                { value: 'craftsman', label: 'Handwerker' },
              ].map((option) => (
                <Badge
                  key={option.value}
                  variant={selectedAudience.includes(option.value) ? "default" : "outline"}
                  className="cursor-pointer transition-all"
                  onClick={() => toggleAudience(option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Prüfhinweis */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20">
            <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-warning">Prüfung erforderlich</p>
              <p className="text-muted-foreground mt-1">
                Ihr Dokument wird von einem Champion geprüft, bevor es für alle Teammitglieder sichtbar wird.
              </p>
            </div>
          </div>
        </div>

        {/* Fußzeile */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/30">
          <Button variant="outline" onClick={handleClose}>
            Abbrechen
          </Button>
          <Button 
            variant="hero" 
            onClick={handleSubmit}
            disabled={!file || !title || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Wird hochgeladen...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Dokument hochladen
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
