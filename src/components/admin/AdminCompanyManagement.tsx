import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Building2, Plus, Pencil, Trash2, Search } from 'lucide-react';

export function AdminCompanyManagement() {
  const [newCompanyName, setNewCompanyName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCompany, setEditingCompany] = useState<{ id: string; name: string } | null>(null);
  const [editName, setEditName] = useState('');
  const queryClient = useQueryClient();

  const { data: companies, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('is_global', false)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from('groups').insert({ name, is_global: false });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Unternehmen erfolgreich erstellt');
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setNewCompanyName('');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from('groups').update({ name }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Unternehmen erfolgreich aktualisiert');
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setEditingCompany(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('groups').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Unternehmen erfolgreich gelöscht');
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) {
      toast.error('Bitte geben Sie einen Unternehmensnamen ein');
      return;
    }
    createMutation.mutate(newCompanyName.trim());
  };

  const handleUpdate = () => {
    if (!editingCompany || !editName.trim()) {
      toast.error('Bitte geben Sie einen Unternehmensnamen ein');
      return;
    }
    updateMutation.mutate({ id: editingCompany.id, name: editName.trim() });
  };

  const filtered = companies?.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Create new company */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Neues Unternehmen anlegen
          </CardTitle>
          <CardDescription>
            Fügen Sie ein neues Unternehmen zur Liste hinzu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="company-name">Unternehmensname</Label>
              <Input
                id="company-name"
                placeholder="z.B. Mustermann GmbH"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                disabled={createMutation.isPending}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Anlegen
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Company list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Alle Unternehmen ({companies?.length ?? 0})
          </CardTitle>
          <CardDescription>
            Verwalten Sie bestehende Unternehmen
          </CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Unternehmen suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !filtered?.length ? (
            <p className="text-muted-foreground text-center py-8">
              {searchTerm
                ? 'Keine Unternehmen gefunden.'
                : 'Noch keine Unternehmen vorhanden. Bitte zuerst ein Unternehmen anlegen.'}
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{company.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingCompany(company);
                        setEditName(company.name);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Unternehmen löschen?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Möchten Sie <strong>{company.name}</strong> wirklich löschen?
                            Benutzer, die diesem Unternehmen zugeordnet sind, verlieren ihre Zuordnung.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(company.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Löschen
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editingCompany} onOpenChange={(open) => !open && setEditingCompany(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unternehmen bearbeiten</DialogTitle>
            <DialogDescription>Ändern Sie den Namen des Unternehmens</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-company-name">Unternehmensname</Label>
              <Input
                id="edit-company-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={updateMutation.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCompany(null)} disabled={updateMutation.isPending}>
              Abbrechen
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Speichern...
                </>
              ) : (
                'Speichern'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
