import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useUserGroup() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-group', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      // First get the user's group_id from user_groups
      const { data: userGroupData, error: userGroupError } = await supabase
        .from('user_groups')
        .select('group_id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (userGroupError) throw userGroupError;
      if (!userGroupData) return null;
      
      // Then get the group details
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('id, name, is_global')
        .eq('id', userGroupData.group_id)
        .single();
      
      if (groupError) throw groupError;
      return groupData;
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
