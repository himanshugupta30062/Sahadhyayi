import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SEO from '@/components/SEO';

interface FeedbackEntry {
  id: string;
  name: string | null;
  email: string | null;
  type: string | null;
  subject: string | null;
  message: string;
  rating: number | null;
  created_at: string;
}

const AdminFeedback = () => {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setEntries(data as FeedbackEntry[]);
    };
    fetchData();
  }, []);

  return (
    <>
      <SEO title="Feedback Admin" description="Review user feedback" />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-6">
        <h1 className="text-3xl font-bold mb-6">User Feedback</h1>
        <div className="space-y-4">
          {entries.map((fb) => (
            <Card key={fb.id}>
              <CardHeader>
                <CardTitle>{fb.subject || fb.type || 'Feedback'}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">{fb.name} ({fb.email})</p>
                {fb.rating ? <p className="text-sm">Rating: {fb.rating}/5</p> : null}
                <p className="mt-2 whitespace-pre-line">{fb.message}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(fb.created_at).toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
};

export default AdminFeedback;
