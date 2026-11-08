import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';

export type GroupEventType = 'book_discussion' | 'co_reading' | 'reading_marathon' | 'author_meetup' | 'weekly_session' | 'other';
export type GroupEventResponse = 'going' | 'maybe';
export interface GroupEvent {
  id: string; group_id: string; title: string; description: string | null;
  event_type: GroupEventType; starts_at: string; ends_at: string; timezone: string;
  location: string | null; organizer_id: string; capacity: number | null;
  status: 'scheduled' | 'cancelled' | 'completed'; created_at: string;
}
export interface GroupEventParticipant { event_id: string; user_id: string; response: GroupEventResponse; }

export const useGroupEvents = (groupId: string, enabled = true) => {
  return useQuery({
    queryKey: ['group-events', groupId],
    enabled: Boolean(groupId) && enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from('group_events').select('*')
        .eq('group_id', groupId).order('starts_at', { ascending: true }).limit(100);
      if (error) throw error;
      return (data ?? []) as GroupEvent[];
    },
  });
};

export const useGroupEventParticipants = (eventIds: string[], enabled = true) => {
  return useQuery({
    queryKey: ['group-event-participants', ...eventIds],
    enabled: enabled && eventIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from('group_event_participants')
        .select('event_id,user_id,response').in('event_id', eventIds);
      if (error) throw error;
      return (data ?? []) as GroupEventParticipant[];
    },
  });
};

export const useCreateGroupEvent = (groupId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; description?: string; eventType: GroupEventType; startsAt: string; endsAt: string; timezone?: string; location?: string; capacity?: number | null }) => {
      if (input.title.trim().length < 3) throw new Error('Event title must contain at least 3 characters.');
      if (new Date(input.startsAt) <= new Date() || new Date(input.endsAt) <= new Date(input.startsAt)) throw new Error('Choose a future start and an end after it.');
      const { data, error } = await supabase.rpc('create_reading_group_event', {
        p_group_id: groupId, p_title: input.title.trim(), p_description: input.description?.trim() || null,
        p_event_type: input.eventType, p_starts_at: input.startsAt, p_ends_at: input.endsAt,
        p_timezone: input.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
        p_location: input.location?.trim() || null, p_capacity: input.capacity ?? null,
      });
      if (error) throw new Error(error.message || 'Could not create event.');
      return data as string;
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['group-events', groupId] }); },
  });
};

export const useRespondToGroupEvent = (groupId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, response }: { eventId: string; response: 'going' | 'maybe' | 'decline' }) => {
      const { data, error } = await supabase.rpc('respond_to_reading_group_event', { p_event_id: eventId, p_response: response });
      if (error) throw new Error(error.message || 'Could not update RSVP.');
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['group-events', groupId] });
      void qc.invalidateQueries({ queryKey: ['group-event-participants'] });
    },
  });
};

export const useCancelGroupEvent = (groupId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.rpc('cancel_reading_group_event', { p_event_id: eventId });
      if (error) throw new Error(error.message || 'Could not cancel event.');
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['group-events', groupId] }); },
  });
};
