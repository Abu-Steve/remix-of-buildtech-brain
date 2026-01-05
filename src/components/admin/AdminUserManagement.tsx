import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, UserPlus, Users, Shield, Trash2, Pencil } from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';

const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

type UserDepartment = 'office' | 'manager' | 'craftsman';
type UserRole = 'employee' | 'champion' | 'administrator';

interface UserData {
  id: string;
  name: string;
  email: string;
  department_enum: UserDepartment | null;
  user_roles: { user_id: string; role: string }[];
  user_groups: { group_id: string; groups: { name: string } | null }[];
}

const departmentLabels: Record<UserDepartment, string> = {
  office: 'Büro',
  manager: 'Manager',
  craftsman: 'Handwerker',
};

export function AdminUserManagement() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [department, setDepartment] = useState<UserDepartment>('office');
  
  // Edit modal state
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDepartment, setEditDepartment] = useState<UserDepartment>('office');
  const [editRole, setEditRole] = useState<UserRole>('employee');
  const [editGroupId, setEditGroupId] = useState('');
  
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (profilesError) throw profilesError;

      // Fetch roles for all users
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      if (rolesError) throw rolesError;

      // Fetch group memberships with group names
      const { data: userGroups, error: groupsError } = await supabase
        .from('user_groups')
        .select('user_id, group_id, groups(name)');
      if (groupsError) throw groupsError;

      // Combine data
      return profiles.map(profile => ({
        ...profile,
        user_roles: roles?.filter(r => r.user_id === profile.id) || [],
        user_groups: userGroups?.filter(ug => ug.user_id === profile.id) || [],
      }));
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: { email: string; password: string; name: string; groupId: string; role: string; department: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('create-user', {
        body: userData,
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);
      
      return response.data;
    },
    onSuccess: () => {
      toast.success('User created successfully');
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      setEmail('');
      setPassword('');
      setName('');
      setGroupId('');
      setDepartment('office');
      setRole('employee');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userData: { userId: string; name: string; email: string; department: UserDepartment; role: UserRole; groupId: string }) => {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          name: userData.name, 
          email: userData.email, 
          department_enum: userData.department 
        })
        .eq('id', userData.userId);
      
      if (profileError) throw profileError;

      // Update role - first delete existing, then insert new
      const { error: deleteRoleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userData.userId);
      
      if (deleteRoleError) throw deleteRoleError;

      const { error: insertRoleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userData.userId, role: userData.role });
      
      if (insertRoleError) throw insertRoleError;

      // Update group - first delete existing, then insert new
      const { error: deleteGroupError } = await supabase
        .from('user_groups')
        .delete()
        .eq('user_id', userData.userId);
      
      if (deleteGroupError) throw deleteGroupError;

      const { error: insertGroupError } = await supabase
        .from('user_groups')
        .insert({ user_id: userData.userId, group_id: userData.groupId });
      
      if (insertGroupError) throw insertGroupError;
    },
    onSuccess: () => {
      toast.success('Benutzer erfolgreich aktualisiert');
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      setEditingUser(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('delete-user', {
        body: { userId },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);
      
      return response.data;
    },
    onSuccess: () => {
      toast.success('Benutzer erfolgreich gelöscht');
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const openEditModal = (user: UserData) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditDepartment(user.department_enum || 'office');
    setEditRole((user.user_roles?.[0]?.role as UserRole) || 'employee');
    setEditGroupId(user.user_groups?.[0]?.group_id || '');
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;

    if (!editName.trim()) {
      toast.error('Bitte geben Sie einen Namen ein');
      return;
    }

    try {
      emailSchema.parse(editEmail);
    } catch {
      toast.error('Bitte geben Sie eine gültige E-Mail-Adresse ein');
      return;
    }

    if (!editGroupId) {
      toast.error('Bitte wählen Sie ein Unternehmen aus');
      return;
    }

    updateUserMutation.mutate({
      userId: editingUser.id,
      name: editName,
      email: editEmail,
      department: editDepartment,
      role: editRole,
      groupId: editGroupId,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(email);
    } catch {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      passwordSchema.parse(password);
    } catch {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!name.trim()) {
      toast.error('Please enter the user name');
      return;
    }

    if (!groupId) {
      toast.error('Please select a company');
      return;
    }

    createUserMutation.mutate({ email, password, name, groupId, role, department });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Create New User
          </CardTitle>
          <CardDescription>
            Add a new user and assign them to a company
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Max Mustermann"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={createUserMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="max@company.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={createUserMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={createUserMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Select value={groupId} onValueChange={setGroupId} disabled={groupsLoading || createUserMutation.isPending}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company..." />
                  </SelectTrigger>
                  <SelectContent>
                    {groups?.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                        {group.is_global && ' (All access)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as UserRole)} disabled={createUserMutation.isPending}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Mitarbeiter</SelectItem>
                    <SelectItem value="champion">Champion (kann Dokumente freigeben)</SelectItem>
                    <SelectItem value="administrator">Administrator (Vollzugriff)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Bereich</Label>
                <Select value={department} onValueChange={(v) => setDepartment(v as UserDepartment)} disabled={createUserMutation.isPending}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="office">Büro</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="craftsman">Handwerker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create User
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            All Users
          </CardTitle>
          <CardDescription>
            Manage existing users and their access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {users?.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Department badge */}
                    {user.department_enum && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-accent text-accent-foreground">
                        {departmentLabels[user.department_enum as UserDepartment]}
                      </span>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {user.user_groups?.map((ug: { group_id: string; groups: { name: string } | null }) => (
                        <span
                          key={ug.group_id}
                          className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground"
                        >
                          {ug.groups?.name}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-1">
                      {user.user_roles?.map((ur: { role: string }) => (
                        <span
                          key={ur.role}
                          className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${
                            ur.role === 'administrator'
                              ? 'bg-destructive/10 text-destructive'
                              : ur.role === 'champion'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {ur.role === 'champion' && <Shield className="w-3 h-3" />}
                          {ur.role}
                        </span>
                      ))}
                    </div>
                    
                    {/* Edit button */}
                    {user.id !== currentUser?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(user as UserData)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    
                    {/* Delete button - only show if not current user */}
                    {user.id !== currentUser?.id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            disabled={deleteUserMutation.isPending}
                          >
                            {deleteUserMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Benutzer löschen?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Möchten Sie den Benutzer <strong>{user.name}</strong> ({user.email}) wirklich löschen? 
                              Diese Aktion kann nicht rückgängig gemacht werden.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteUserMutation.mutate(user.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Löschen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Benutzer bearbeiten</DialogTitle>
            <DialogDescription>
              Ändern Sie die Daten des Benutzers
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={updateUserMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">E-Mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                disabled={updateUserMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-department">Bereich</Label>
              <Select value={editDepartment} onValueChange={(v) => setEditDepartment(v as UserDepartment)} disabled={updateUserMutation.isPending}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="office">Büro</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="craftsman">Handwerker</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Rolle</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as UserRole)} disabled={updateUserMutation.isPending}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Mitarbeiter</SelectItem>
                  <SelectItem value="champion">Champion</SelectItem>
                  <SelectItem value="administrator">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-company">Unternehmen</Label>
              <Select value={editGroupId} onValueChange={setEditGroupId} disabled={groupsLoading || updateUserMutation.isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Unternehmen wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {groups?.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)} disabled={updateUserMutation.isPending}>
              Abbrechen
            </Button>
            <Button onClick={handleUpdateUser} disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? (
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
