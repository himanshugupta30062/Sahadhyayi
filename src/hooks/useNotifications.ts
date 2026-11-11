import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';

export interface Notification {
  id: string;
  user_id: string;
  author_id: string | null;
  actor_id?: string | null;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  updated_at: string;
  entity_type?: string | null;
  entity_id?: string | null;
  link?: string | null;
  authors?: { id: string; name: string; profile_image_url?: string } | null;
  actor?: { id: string; full_name?: string; username?: string; profile_photo_url?: string } | null;
}

type NotificationRealtimeEntry = { channel: ReturnType<typeof supabase.channel>; refs: number };
const notificationRealtimeChannels = new Map<string, NotificationRealtimeEntry>();

const invalidateNotificationQueries = (queryClient: ReturnType<typeof useQueryClient>, userId: string) => {
  void queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
  void queryClient.invalidateQueries({ queryKey: ['unread-notifications-count', userId] });
};

const useNotificationRealtimeSync = (userId: string | undefined, queryClient: ReturnType<typeof useQueryClient>) => {
  useEffect(() => {
    if (!userId) return;
    const existing = notificationRealtimeChannels.get(userId);
    if (existing) {
      existing.refs += 1;
    } else {
      const channel = supabase
        .channel(`notifications-sync-${userId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        }, () => invalidateNotificationQueries(queryClient, userId))
        .subscribe((status) => {
          // Reconcile after initial connection and every successful reconnect;
          // Realtime does not replay changes missed while offline.
          if (status === 'SUBSCRIBED') invalidateNotificationQueries(queryClient, userId);
        });
      notificationRealtimeChannels.set(userId, { channel, refs: 1 });
    }
    return () => {
      const entry = notificationRealtimeChannels.get(userId);
      if (!entry) return;
      entry.refs -= 1;
      if (entry.refs <= 0) {
        notificationRealtimeChannels.delete(userId);
        void supabase.removeChannel(entry.channel);
      }
    };
  }, [userId, queryClient]);
};

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  useNotificationRealtimeSync(user?.id, queryClient);
  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*, authors:author_id(id, name, profile_image_url), actor:actor_id(id, full_name, username, profile_photo_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as Notification[];
    },
    enabled: !!user?.id,
  });
};

export const useUnreadNotificationsCount = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  useNotificationRealtimeSync(user?.id, queryClient);
  return useQuery({
    queryKey: ['unread-notifications-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase.from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id).eq('read', false);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user?.id) throw new Error('You must be signed in to update notifications.');
      const { error } = await supabase.from('notifications').update({ read: true })
        .eq('id', notificationId).eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (user?.id) invalidateNotificationQueries(queryClient, user.id);
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('You must be signed in to update notifications.');
      const { error } = await supabase.from('notifications').update({ read: true })
        .eq('user_id', user.id).eq('read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      if (user?.id) invalidateNotificationQueries(queryClient, user.id);
    },
  });
};
