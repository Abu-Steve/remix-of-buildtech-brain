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
      {/* Welcome section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">
              Welcome back, Max
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening in your knowledge base today.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link to="/chat">
              <Button variant="outline" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Ask AI
              </Button>
            </Link>
            <Link to="/documents">
              <Button variant="hero" className="gap-2">
                <Plus className="w-4 h-4" />
                Upload Document
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Total Documents"
          value="1,247"
          change="+12%"
          changeType="positive"
          icon={FileText}
        />
        <StatsCard
          title="Active Users"
          value="342"
          change="+5%"
          changeType="positive"
          icon={Users}
          iconColor="text-success"
        />
        <StatsCard
          title="Open Questions"
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

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link 
          to="/documents" 
          className="group p-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
        >
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Search className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">Search Documents</h3>
          <p className="text-sm text-muted-foreground">Find answers quickly</p>
        </Link>
        
        <Link 
          to="/chat" 
          className="group p-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-hero flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-glow">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">AI Assistant</h3>
          <p className="text-sm text-muted-foreground">Get instant answers</p>
        </Link>
        
        <Link 
          to="/forum" 
          className="group p-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
        >
          <div className="w-11 h-11 rounded-xl bg-info/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <HelpCircle className="w-5 h-5 text-info" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">Q&A Forum</h3>
          <p className="text-sm text-muted-foreground">Ask the community</p>
        </Link>
        
        <Link 
          to="/documents?filter=cached" 
          className="group p-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
        >
          <div className="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5 text-success" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">Offline Docs</h3>
          <p className="text-sm text-muted-foreground">12 documents cached</p>
        </Link>
      </div>

      {/* Main content grid */}
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
