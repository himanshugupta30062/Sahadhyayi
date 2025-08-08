import BookDetailsWrapper from '../../../components/BookDetailsWrapper';
import { supabase } from '@/integrations/supabase/client-universal';

export async function generateMetadata({ params }: { params: { id: string } }) {
  return { title: 'Book • Sahadhyayi' };
}

export default function BookPage({ params }: { params: { id: string } }) {
  return <BookDetailsWrapper id={params.id} />;
}
