import { useState } from 'react';
import { Plus, Search, MessageSquare, Eye, CheckCircle, Clock, Filter, TrendingUp } from 'lucide-react';
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
    title: 'What are the requirements for fire stops in cable penetrations?',
    content: 'We are installing electrical cables through fire-rated walls. What certifications do we need for the fire stop materials?',
    author: { name: 'Thomas Müller', role: 'Electrician' },
    createdAt: new Date('2024-01-17T10:30:00'),
    tags: [{ name: 'Fire Safety', color: '#ef4444' }, { name: 'Electrical', color: '#f59e0b' }],
    answers: 5,
    views: 127,
    isResolved: false,
    isHot: true,
  },
  {
    id: '2',
    title: 'Concrete curing in winter conditions - best practices?',
    content: 'We have a concrete pour scheduled for next week with temperatures expected around 2°C. What precautions should we take?',
    author: { name: 'Hans Weber', role: 'Site Manager' },
    createdAt: new Date('2024-01-16T14:15:00'),
    tags: [{ name: 'Concrete', color: '#6b7280' }, { name: 'Weather', color: '#06b6d4' }],
    answers: 8,
    views: 234,
    isResolved: true,
  },
  {
    id: '3',
    title: 'DIN 4109 sound insulation requirements for party walls',
    content: 'What is the minimum R\'w value required for party walls in residential buildings according to current standards?',
    author: { name: 'Maria Berger', role: 'Architect' },
    createdAt: new Date('2024-01-15T09:00:00'),
    tags: [{ name: 'Sound Insulation', color: '#8b5cf6' }, { name: 'Building Code', color: '#3b82f6' }],
    answers: 3,
    views: 89,
    isResolved: true,
  },
  {
    id: '4',
    title: 'Height safety systems for flat roof maintenance access',
    content: 'What permanent fall protection systems are recommended for regular roof maintenance access points?',
    author: { name: 'Klaus Fischer', role: 'Safety Officer' },
    createdAt: new Date('2024-01-14T16:45:00'),
    tags: [{ name: 'Safety', color: '#ef4444' }, { name: 'Roofing', color: '#10b981' }],
    answers: 6,
    views: 156,
    isResolved: false,
  },
  {
    id: '5',
    title: 'VOB warranty periods for different building components',
    content: 'Can someone clarify the different warranty periods under VOB for structural work vs. finishing work?',
    author: { name: 'Peter Hoffmann', role: 'Project Manager' },
    createdAt: new Date('2024-01-13T11:20:00'),
    tags: [{ name: 'VOB', color: '#3b82f6' }, { name: 'Legal', color: '#ec4899' }],
    answers: 4,
    views: 203,
    isResolved: true,
  },
];

type FilterType = 'all' | 'unanswered' | 'resolved' | 'hot';

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
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">
            Q&A Forum
          </h1>
          <p className="text-muted-foreground">
            Ask questions and share knowledge with your colleagues
          </p>
        </div>
        
        <Button variant="hero">
          <Plus className="w-4 h-4" />
          Ask Question
        </Button>
      </div>

      {/* Search and filters */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-2 px-4 py-3 bg-secondary rounded-xl">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions..."
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
              className="capitalize"
            >
              {f === 'hot' && <TrendingUp className="w-3 h-3 mr-1" />}
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* Questions list */}
      <div className="space-y-3">
        {filteredQuestions.map((question, index) => (
          <div 
            key={question.id}
            className="bg-card rounded-2xl border border-border p-5 hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start gap-4">
              {/* Stats */}
              <div className="hidden sm:flex flex-col items-center gap-1 text-center min-w-[60px]">
                <div className={cn(
                  "text-lg font-bold",
                  question.answers > 0 ? "text-foreground" : "text-muted-foreground"
                )}>
                  {question.answers}
                </div>
                <div className="text-xs text-muted-foreground">answers</div>
              </div>

              {/* Content */}
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
                      {question.answers} answers
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {question.views} views
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

      {/* Empty state */}
      {filteredQuestions.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No questions found</h3>
          <p className="text-muted-foreground mb-6">
            Try adjusting your search or be the first to ask!
          </p>
          <Button variant="hero">
            <Plus className="w-4 h-4" />
            Ask a Question
          </Button>
        </div>
      )}
    </AppLayout>
  );
}
