import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/LoadingSpinner';
import SEO from '@/components/SEO';
import { useIsAdmin } from '@/hooks/useIsAdmin';

interface FeedbackItem {
  id: string;
  name: string;
  email: string;
  type: string | null;
  subject: string | null;
  message: string;
  rating: number | null;
  created_at: string;
}

const AdminFeedback = () => {
  const isAdmin = useIsAdmin();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchFeedback = async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setFeedback(data || []);
      setLoading(false);
    };
    fetchFeedback();
  }, [isAdmin]);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <SEO title="Feedback Admin" description="Review user feedback" />
      <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">User Feedback</h1>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-4">
              {feedback.map((fb) => (
                <Card key={fb.id}>
                  <CardHeader>
                    <CardTitle>{fb.subject || fb.type}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p><strong>From:</strong> {fb.name} ({fb.email})</p>
                    {fb.rating ? <p><strong>Rating:</strong> {fb.rating}/5</p> : null}
                    <p>{fb.message}</p>
                    <p className="text-sm text-gray-500">{new Date(fb.created_at).toLocaleString()}</p>
                  </CardContent>
                </Card>
              ))}
              {feedback.length === 0 && <p>No feedback yet.</p>}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminFeedback;
