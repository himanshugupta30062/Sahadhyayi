import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SEO from '@/components/SEO';
import { Skeleton } from '@/components/ui/skeleton';

const AdminFeedback = () => {
  const { user, loading: authLoading } = useAuth();

  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ['is-admin', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('is_admin');
      if (error) throw error;
      return Boolean(data);
    },
  });

  const { data: feedback = [], refetch } = useQuery({
    queryKey: ['feedback'],
    enabled: !!user && isAdmin === true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  if (authLoading || (user && roleLoading)) {
    return (
      <div className="min-h-screen p-8 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user || isAdmin !== true) {
    return <Navigate to="/" replace />;
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
            <p className="text-muted-foreground">No feedback available.</p>
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
