import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useUserRole';
import { useEffect } from 'react';
import { AdminUserManagement } from '@/components/admin/AdminUserManagement';
import { AppLayout } from '@/components/layout/AppLayout';
import { Loader2, ShieldAlert, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Admin() {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <ShieldAlert className="w-16 h-16 text-destructive" />
        <h1 className="text-2xl font-bold">Zugriff verweigert</h1>
        <p className="text-muted-foreground">Nur Administratoren können auf diese Seite zugreifen.</p>
        <Button asChild className="mt-4">
          <Link to="/">
            <Home className="w-4 h-4 mr-2" />
            Zurück zum Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin-Bereich</h1>
        <p className="text-muted-foreground">Benutzer und Systemeinstellungen verwalten</p>
      </div>
      <AdminUserManagement />
    </AppLayout>
  );
}
