import { FileText, Users, HelpCircle, TrendingUp, Plus, Search, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { PendingApprovals } from '@/components/dashboard/PendingApprovals';
import { Button } from '@/components/ui/button';

export default function Index() {
  return (
    <AppLayout>
      {/* Willkommensbereich */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">
              Willkommen zurück
            </h1>
            <p className="text-muted-foreground">
              Hier sehen Sie, was heute in Ihrer Wissensdatenbank passiert.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link to="/chat">
              <Button variant="outline" className="gap-2">
                <Sparkles className="w-4 h-4" />
                KI fragen
              </Button>
            </Link>
            <Link to="/documents">
              <Button variant="hero" className="gap-2">
                <Plus className="w-4 h-4" />
                Dokument hochladen
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Statistik-Karten */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Dokumente gesamt"
          value="1.247"
          change="+12%"
          changeType="positive"
          icon={FileText}
        />
        <StatsCard
          title="Aktive Benutzer"
          value="342"
          change="+5%"
          changeType="positive"
          icon={Users}
          iconColor="text-success"
        />
        <StatsCard
          title="Offene Fragen"
          value="28"
          change="-8%"
          changeType="positive"
          icon={HelpCircle}
          iconColor="text-info"
        />
        <StatsCard
          title="Best Practices"
          value="89"
          change="+3"
          changeType="positive"
          icon={TrendingUp}
          iconColor="text-accent-foreground"
        />
      </div>

      {/* Schnellzugriff */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link 
          to="/documents" 
          className="group p-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
        >
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Search className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">Dokumente suchen</h3>
          <p className="text-sm text-muted-foreground">Schnell Antworten finden</p>
        </Link>
        
        <Link 
          to="/chat" 
          className="group p-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-hero flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-glow">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">KI-Assistent</h3>
          <p className="text-sm text-muted-foreground">Sofortige Antworten erhalten</p>
        </Link>
        
        <Link 
          to="/forum" 
          className="group p-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
        >
          <div className="w-11 h-11 rounded-xl bg-info/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <HelpCircle className="w-5 h-5 text-info" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">Fragen & Antworten</h3>
          <p className="text-sm text-muted-foreground">Die Community fragen</p>
        </Link>
        
        <Link 
          to="/documents?filter=cached" 
          className="group p-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
        >
          <div className="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5 text-success" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">Offline-Dokumente</h3>
          <p className="text-sm text-muted-foreground">12 Dokumente zwischengespeichert</p>
        </Link>
      </div>

      {/* Hauptinhalt */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityFeed />
        </div>
        <div>
          <PendingApprovals />
        </div>
      </div>
    </AppLayout>
  );
}
