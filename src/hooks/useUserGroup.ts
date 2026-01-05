import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useUserGroup() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-group', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_groups')
        .select(`
          group_id,
          groups (id, name, is_global)
        `)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data?.groups || null;
    },
    enabled: !!user,
  });
}

export function useUserDepartment() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-department', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('department_enum')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data?.department_enum || null;
    },
    enabled: !!user,
  });
}
