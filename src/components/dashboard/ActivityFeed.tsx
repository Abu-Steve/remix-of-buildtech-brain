import { FileText, Check, MessageSquare, Upload, Clock, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'upload' | 'approval' | 'question' | 'best-practice';
  title: string;
  description: string;
  time: string;
  user: string;
}

const activities: Activity[] = [
  {
    id: '1',
    type: 'upload',
    title: 'Neues Dokument hochgeladen',
    description: 'Sicherheitsrichtlinien für Dacharbeiten 2024',
    time: 'vor 10 Min.',
    user: 'Hans Weber'
  },
  {
    id: '2',
    type: 'approval',
    title: 'Dokument genehmigt',
    description: 'VOB/B Konformitäts-Checkliste',
    time: 'vor 25 Min.',
    user: 'Anna Schmidt'
  },
  {
    id: '3',
    type: 'question',
    title: 'Neue Frage gestellt',
    description: 'Welche Anforderungen gelten für Brandschotts bei Kabeldurchführungen?',
    time: 'vor 1 Std.',
    user: 'Thomas Müller'
  },
  {
    id: '4',
    type: 'best-practice',
    title: 'Als Best Practice markiert',
    description: 'Betonhärtung Temperaturrichtlinien',
    time: 'vor 2 Std.',
    user: 'System'
  },
];

const typeConfig = {
  upload: { icon: Upload, className: 'bg-primary/10 text-primary' },
  approval: { icon: Check, className: 'bg-success/10 text-success' },
  question: { icon: MessageSquare, className: 'bg-info/10 text-info' },
  'best-practice': { icon: Award, className: 'bg-accent/20 text-accent-foreground' },
};

export function ActivityFeed() {
  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <h3 className="font-semibold text-foreground mb-4">Letzte Aktivitäten</h3>
      
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const config = typeConfig[activity.type];
          const Icon = config.icon;
          
          return (
            <div 
              key={activity.id}
              className="flex gap-3 animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                config.className
              )}>
                <Icon className="w-4 h-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{activity.title}</p>
                <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{activity.time}</span>
                  <span>•</span>
                  <span>{activity.user}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <button className="w-full mt-4 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
        Alle Aktivitäten anzeigen
      </button>
    </div>
  );
}
