import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  MessageSquare, 
  HelpCircle, 
  Settings, 
  Menu, 
  X,
  Bell,
  Search,
  User,
  Download,
  Wifi,
  WifiOff,
  LogOut,
  Users
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Dokumente', href: '/documents', icon: FileText },
  { name: 'KI-Chat', href: '/chat', icon: MessageSquare },
  { name: 'Fragen & Antworten', href: '/forum', icon: HelpCircle },
];

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isAdmin = useIsAdmin();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar Hintergrund */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Seitenleiste */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-72 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center shadow-glow">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">BuildTech</h1>
              <p className="text-xs text-muted-foreground">Wissensdatenbank</p>
            </div>
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
          
          {/* Admin-Only: Benutzerverwaltung */}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                location.pathname === '/admin'
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Users className="w-5 h-5" />
              Benutzerverwaltung
            </Link>
          )}
        </nav>

        {/* Online-Anzeige */}
        <div className="absolute bottom-32 left-4 right-4">
          <div className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl text-sm",
            isOnline 
              ? "bg-success/10 text-success" 
              : "bg-warning/10 text-warning"
          )}>
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4" />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span>Offline-Modus</span>
              </>
            )}
          </div>
        </div>

        {/* Benutzerbereich */}
        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <Link 
            to="/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-hero flex items-center justify-center">
              <User className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.email || 'Benutzer'}</p>
              <p className="text-xs text-muted-foreground">Einstellungen</p>
            </div>
            <Settings className="w-4 h-4 text-muted-foreground" />
          </Link>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 px-4 py-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5" />
            Abmelden
          </Button>
        </div>
      </aside>

      {/* Hauptinhalt */}
      <div className="lg:pl-72">
        {/* Kopfzeile */}
        <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              {/* Suche */}
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-secondary rounded-xl w-64 lg:w-80">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input 
                  type="text"
                  placeholder="Dokumente suchen..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Download className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-success rounded-full" />
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
              </Button>
            </div>
          </div>
        </header>

        {/* Seiteninhalt */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
