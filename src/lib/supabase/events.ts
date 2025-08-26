import { supabase } from '@/integrations/supabase/client-universal';

export type BookEventType = 'view' | 'download';

export interface BookEventCounts {
  views: number;
  downloads: number;
}

export const logBookEvent = async (
  bookId: string,
  eventType: BookEventType,
): Promise<BookEventCounts | null> => {
  const { data, error } = await supabase.functions.invoke('log_book_event', {
    body: { book_id: bookId, event_type: eventType },
  });

  if (error) {
    console.error('Error logging book event:', error);
    return null;
  }

  return data as BookEventCounts;
};
