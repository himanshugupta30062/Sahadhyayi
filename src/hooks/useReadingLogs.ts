import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';

export interface ReadingLogEntry {
  id: string;
  user_id: string;
  book_id: string;
  book_title?: string | null;
  pages_read?: number | null;
  current_page?: number | null;
  total_pages?: number | null;
  minutes_read?: number | null;
  percentage?: number | null;
  journal_note?: string | null;
  logged_at: string;
}

export type ReadingLog = ReadingLogEntry;

export interface CreateReadingLogInput {
  bookId: string;
  pagesRead?: number;
  currentPage?: number;
  totalPages?: number;
  minutesRead?: number;
  percentage?: number;
  journalNote?: string;
}

const positiveInt = (value: number | undefined, label: string) => {
  if (value === undefined) return undefined;
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${label} must be a positive whole number`);
  return value;
};

export const useReadingLogs = (bookId?: string) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['reading-logs', user?.id, bookId],
    queryFn: async () => {
      if (!user?.id) return [];
      let query = supabase.from('reading_logs').select('*').eq('user_id', user.id);
      if (bookId) query = query.eq('book_id', bookId);
      const { data, error } = await query.order('logged_at', { ascending: false }).limit(200);
      if (error) throw error;
      return data as ReadingLogEntry[];
    },
    enabled: !!user?.id,
  });
};

export const useCreateReadingLog = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateReadingLogInput) => {
      if (!user?.id) throw new Error('Sign in to log reading activity');
      const bookId = input.bookId.trim();
      if (!bookId) throw new Error('Book ID is required');
      const pagesRead = positiveInt(input.pagesRead, 'Pages read');
      const currentPage = positiveInt(input.currentPage, 'Current page');
      const totalPages = positiveInt(input.totalPages, 'Total pages');
      const minutesRead = positiveInt(input.minutesRead, 'Minutes read');
      if (input.percentage !== undefined && (!Number.isFinite(input.percentage) || input.percentage < 0 || input.percentage > 100)) {
        throw new Error('Progress percentage must be between 0 and 100');
      }
      const journalNote = input.journalNote?.trim() || null;
      if (journalNote && journalNote.length > 5000) throw new Error('Journal note must be 5,000 characters or fewer');
      if (!pagesRead && !currentPage && !minutesRead && !journalNote) {
        throw new Error('Add pages, a page position, reading minutes, or a journal note');
      }
      const { data, error } = await supabase.from('reading_logs').insert({
        user_id: user.id,
        book_id: bookId,
        pages_read: pagesRead ?? null,
        current_page: currentPage ?? null,
        total_pages: totalPages ?? null,
        minutes_read: minutesRead ?? null,
        percentage: input.percentage ?? null,
        journal_note: journalNote,
      }).select().single();
      if (error) throw error;

      // Persist a deduplicated activity day only after an explicit reading log is saved.
      // Use the reader's local calendar date (and timezone), not UTC midnight.
      const loggedAt = new Date(data.logged_at ?? new Date().toISOString());
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const dateParts = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(loggedAt);
      const part = (type: string) => dateParts.find((item) => item.type === type)?.value;
      const activityDate = `${part('year')}-${part('month')}-${part('day')}`;
      const activityTimestamp = loggedAt.toISOString();
      const { error: activityError } = await supabase.from('reading_activity_days').upsert(
        {
          user_id: user.id,
          activity_date: activityDate,
          timezone,
          first_activity_at: activityTimestamp,
          last_activity_at: activityTimestamp,
          source: 'reading_log',
        },
        { onConflict: 'user_id,activity_date', ignoreDuplicates: true },
      );
      // A reading log is already saved; do not report the primary action as failed
      // if activity-day tracking is temporarily unavailable.
      if (activityError) console.warn('Reading log saved, but activity day was not recorded:', activityError);
      return data as ReadingLogEntry;
    },
    onSuccess: (entry) => {
      void queryClient.invalidateQueries({ queryKey: ['reading-logs', user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['reading-activity-days', user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['reading-streak', user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['reading-progress', user?.id] });
      return entry;
    },
  });
};
