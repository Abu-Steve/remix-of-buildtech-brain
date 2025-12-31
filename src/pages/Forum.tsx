import { useState } from 'react';
import { Plus, Search, MessageSquare, Eye, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ForumQuestion {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
    role: string;
  };
  createdAt: Date;
  tags: Array<{ name: string; color: string }>;
  answers: number;
  views: number;
  isResolved: boolean;
  isHot?: boolean;
}

const mockQuestions: ForumQuestion[] = [
  {
    id: '1',
    title: 'Welche Anforderungen gelten für Brandschotts bei Kabeldurchführungen?',
    content: 'Wir installieren elektrische Kabel durch brandgeschützte Wände. Welche Zertifizierungen benötigen wir für die Brandschottmaterialien?',
    author: { name: 'Thomas Müller', role: 'Elektriker' },
    createdAt: new Date('2024-01-17T10:30:00'),
    tags: [{ name: 'Brandschutz', color: '#ef4444' }, { name: 'Elektrik', color: '#f59e0b' }],
    answers: 5,
    views: 127,
    isResolved: false,
    isHot: true,
  },
  {
    id: '2',
    title: 'Betonhärtung bei Winterbedingungen - Best Practices?',
    content: 'Wir haben einen Betonguß für nächste Woche geplant bei erwarteten Temperaturen um 2°C. Welche Vorsichtsmaßnahmen sollten wir treffen?',
    author: { name: 'Hans Weber', role: 'Bauleiter' },
    createdAt: new Date('2024-01-16T14:15:00'),
    tags: [{ name: 'Beton', color: '#6b7280' }, { name: 'Wetter', color: '#06b6d4' }],
    answers: 8,
    views: 234,
    isResolved: true,
  },
  {
    id: '3',
    title: 'DIN 4109 Schallschutzanforderungen für Trennwände',
    content: 'Welcher Mindest-R\'w-Wert ist für Trennwände in Wohngebäuden nach aktuellen Normen erforderlich?',
    author: { name: 'Maria Berger', role: 'Architektin' },
    createdAt: new Date('2024-01-15T09:00:00'),
    tags: [{ name: 'Schallschutz', color: '#8b5cf6' }, { name: 'Bauvorschriften', color: '#3b82f6' }],
    answers: 3,
    views: 89,
    isResolved: true,
  },
  {
    id: '4',
    title: 'Absturzsicherungssysteme für Flachdachwartungszugang',
    content: 'Welche permanenten Absturzsicherungen werden für regelmäßige Dachwartungszugangspunkte empfohlen?',
    author: { name: 'Klaus Fischer', role: 'Sicherheitsbeauftragter' },
    createdAt: new Date('2024-01-14T16:45:00'),
    tags: [{ name: 'Sicherheit', color: '#ef4444' }, { name: 'Dacharbeiten', color: '#10b981' }],
    answers: 6,
    views: 156,
    isResolved: false,
  },
  {
    id: '5',
    title: 'VOB-Gewährleistungsfristen für verschiedene Baukomponenten',
    content: 'Kann jemand die unterschiedlichen Gewährleistungsfristen nach VOB für Rohbauarbeiten vs. Ausbauarbeiten erklären?',
    author: { name: 'Peter Hoffmann', role: 'Projektmanager' },
    createdAt: new Date('2024-01-13T11:20:00'),
    tags: [{ name: 'VOB', color: '#3b82f6' }, { name: 'Recht', color: '#ec4899' }],
    answers: 4,
    views: 203,
    isResolved: true,
  },
];

type FilterType = 'all' | 'unanswered' | 'resolved' | 'hot';

const filterLabels: Record<FilterType, string> = {
  all: 'Alle',
  hot: 'Beliebt',
  unanswered: 'Unbeantwortet',
  resolved: 'Gelöst',
};

export default function Forum() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredQuestions = mockQuestions.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' ||
                          (filter === 'unanswered' && q.answers === 0) ||
                          (filter === 'resolved' && q.isResolved) ||
                          (filter === 'hot' && q.isHot);
    return matchesSearch && matchesFilter;
  });

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Gerade eben';
    if (diffHours < 24) return `vor ${diffHours} Std.`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
  };

  return (
    <AppLayout>
      {/* Kopfzeile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">
            Fragen & Antworten
          </h1>
          <p className="text-muted-foreground">
            Stellen Sie Fragen und teilen Sie Wissen mit Ihren Kollegen
          </p>
        </div>
        
        <Button variant="hero">
          <Plus className="w-4 h-4" />
          Frage stellen
        </Button>
      </div>

      {/* Suche und Filter */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-2 px-4 py-3 bg-secondary rounded-xl">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Fragen suchen..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'hot', 'unanswered', 'resolved'] as FilterType[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === 'hot' && <TrendingUp className="w-3 h-3 mr-1" />}
              {filterLabels[f]}
            </Button>
          ))}
        </div>
      </div>

      {/* Fragenliste */}
      <div className="space-y-3">
        {filteredQuestions.map((question, index) => (
          <div 
            key={question.id}
            className="bg-card rounded-2xl border border-border p-5 hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start gap-4">
              {/* Statistiken */}
              <div className="hidden sm:flex flex-col items-center gap-1 text-center min-w-[60px]">
                <div className={cn(
                  "text-lg font-bold",
                  question.answers > 0 ? "text-foreground" : "text-muted-foreground"
                )}>
                  {question.answers}
                </div>
                <div className="text-xs text-muted-foreground">Antworten</div>
              </div>

              {/* Inhalt */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-2">
                  {question.isResolved && (
                    <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  )}
                  {question.isHot && !question.isResolved && (
                    <TrendingUp className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  )}
                  <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2">
                    {question.title}
                  </h3>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {question.content}
                </p>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {question.tags.map((tag) => (
                    <Badge 
                      key={tag.name} 
                      variant="secondary"
                      className="text-xs"
                      style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {question.answers} Antworten
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {question.views} Aufrufe
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span>{question.author.name}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(question.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Leerer Zustand */}
      {filteredQuestions.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Keine Fragen gefunden</h3>
          <p className="text-muted-foreground mb-6">
            Passen Sie Ihre Suche an oder stellen Sie die erste Frage!
          </p>
          <Button variant="hero">
            <Plus className="w-4 h-4" />
            Frage stellen
          </Button>
        </div>
      )}
    </AppLayout>
  );
}
