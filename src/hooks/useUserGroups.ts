import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  groups?: {
    id: string;
    name: string;
    description?: string;
    image_url?: string;
  };
  user_profile?: {
    id: string;
    full_name: string;
    profile_photo_url?: string;
    username?: string;
  };
}

export const useUserGroups = () => {
  const { user } = useAuth();
  
  return useQuery<GroupMember[]>({
    queryKey: ['user-groups', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('group_chat_members')
        .select(`
          id,
          group_id,
          user_id,
          role,
          joined_at,
          groups:group_chats (
            id,
            name,
            description,
            image_url,
            created_by,
            created_at
          )
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      const normalized = (data || []).map((m: any) => ({
        ...m,
        groups: Array.isArray(m.groups) ? m.groups[0] : m.groups,
      }));
      
      return normalized as GroupMember[];
    },
    enabled: !!user?.id,
  });
};

export const useUserJoinedGroups = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-joined-groups', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('group_chat_members')
        .select(`
          *,
          groups:group_chats (
            *,
            group_members:group_chat_members(count)
          )
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
};