import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AuthorEvent {
  id: string;
  author_id: string;
  title: string;
  description?: string;
  event_type: string;
  start_date: string;
  end_date?: string;
  location?: string;
  event_url?: string;
  image_url?: string;
  max_attendees?: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventAttendee {
  id: string;
  event_id: string;
  user_id: string;
  status: 'interested' | 'attending' | 'maybe';
  created_at: string;
}

export const useAuthorEvents = (authorId?: string) => {
  return useQuery({
    queryKey: ['author-events', authorId],
    enabled: !!authorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('author_events')
        .select('*')
        .eq('author_id', authorId)
        .eq('is_published', true)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true });

      if (error) throw error;
      return data as AuthorEvent[];
    },
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (event: Omit<AuthorEvent, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('author_events')
        .insert([event])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['author-events', data.author_id] });
      toast({
        title: "Event created!",
        description: "Your event has been published and followers will be notified.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    },
  });
};

export const useEventAttendance = (eventId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const attendanceQuery = useQuery({
    queryKey: ['event-attendance', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('author_event_attendees')
        .select('*')
        .eq('event_id', eventId!);

      if (error) throw error;
      return data as EventAttendee[];
    },
  });

  const updateAttendance = useMutation({
    mutationFn: async ({ status }: { status: 'interested' | 'attending' | 'maybe' }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('You must be logged in to RSVP to events');

      const { data, error } = await supabase
        .from('author_event_attendees')
        .upsert([{
          event_id: eventId!,
          user_id: userData.user.id,
          status,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-attendance', eventId] });
      toast({
        title: "RSVP updated!",
        description: "Your attendance status has been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update attendance",
        variant: "destructive",
      });
    },
  });

  return {
    data: attendanceQuery.data,
    isLoading: attendanceQuery.isLoading,
    updateAttendance: updateAttendance.mutate,
    isUpdating: updateAttendance.isPending,
  };
};