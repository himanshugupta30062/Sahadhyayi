import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SEO from '@/components/SEO';

const AdminFeedback = () => {
  const { user } = useAuth();

  const { data: feedback = [], refetch } = useQuery({
    queryKey: ['feedback'],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  if (!user) {
    return <Navigate to="/" />;
  }

  const markResponded = async (id: string) => {
    const { error } = await supabase
      .from('feedback')
      .update({ responded: true })
      .eq('id', id);
    if (!error) {
      refetch();
    }
  };

  return (
    <>
      <SEO title="Feedback Admin" description="Review user feedback" />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-background to-orange-50 py-8">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <h1 className="text-3xl font-bold text-foreground">User Feedback</h1>
          {feedback.length === 0 && (
            <p className="text-muted-foreground">No feedback available or access denied.</p>
          )}
          {feedback.map((item: any) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{item.subject || item.type}</span>
                  {!item.responded && (
                    <Button size="sm" onClick={() => markResponded(item.id)}>
                      Mark Responded
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-sm text-muted-foreground">From: {item.name} ({item.email})</p>
                {item.rating && <p className="text-sm">Rating: {item.rating}</p>}
                <p>{item.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
};

export default AdminFeedback;
