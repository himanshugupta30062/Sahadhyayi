import { supabase } from '@/integrations/supabase/client-universal';

export const logBookEvent = async (
  bookId: string,
  eventType: 'view' | 'download'
) => {
  const { data, error } = await supabase.functions.invoke('log_book_event', {
    body: { book_id: bookId, event_type: eventType },
  });

  if (error) throw error;
  return data as { views: number; downloads: number };
};
