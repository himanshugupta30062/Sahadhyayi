import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquareText, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/authHelpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useBookReviews, useDeleteBookReview, useSaveBookReview } from '@/hooks/useBookReviews';
import { useToast } from '@/hooks/use-toast';

export default function BookReviews({ bookId }: { bookId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: reviews = [], isLoading, error } = useBookReviews(bookId);
  const saveReview = useSaveBookReview(bookId);
  const deleteReview = useDeleteBookReview(bookId);
  const myReview = reviews.find((review) => review.user_id === user?.id);
  const [reviewText, setReviewText] = useState('');
  const [containsSpoilers, setContainsSpoilers] = useState(false);
  const [showSpoilers, setShowSpoilers] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setReviewText(myReview?.review_text || '');
    setContainsSpoilers(myReview?.contains_spoilers || false);
    setEditing(false);
  }, [myReview?.id, myReview?.updated_at]);

  const handleSave = async () => {
    try {
      await saveReview.mutateAsync({ reviewText, containsSpoilers });
      setEditing(false);
      toast({ title: 'Review saved', description: 'Your review is now available to signed-in readers.' });
    } catch (err) {
      toast({ title: 'Could not save review', description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!myReview) return;
    try {
      await deleteReview.mutateAsync(myReview.id);
      setReviewText('');
      setContainsSpoilers(false);
      setEditing(false);
      toast({ title: 'Review deleted' });
    } catch (err) {
      toast({ title: 'Could not delete review', description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' });
    }
  };

  return (
    <Card className="bg-white/80 border-emerald-100">
      <CardContent className="p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-2">
          <MessageSquareText className="h-5 w-5 text-emerald-700" />
          <h2 className="text-xl font-semibold text-gray-900">Reader reviews</h2>
          <span className="text-sm text-gray-500">({reviews.length})</span>
        </div>

        {user ? (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-3">
            <h3 className="font-medium">{myReview && !editing ? 'Your review' : myReview ? 'Edit your review' : 'Share your thoughts'}</h3>
            {myReview && !editing ? (
              <>
                <p className="whitespace-pre-wrap text-sm text-gray-700">{myReview.review_text}</p>
                {myReview.contains_spoilers && <p className="text-xs text-amber-800">Marked as containing spoilers</p>}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil className="h-4 w-4 mr-1" /> Edit review</Button>
                  <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deleteReview.isPending}><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
                </div>
              </>
            ) : (
              <>
                <Textarea value={reviewText} onChange={(event) => setReviewText(event.target.value)} rows={4} maxLength={5000} placeholder="What stayed with you after reading this book?" aria-label="Your book review" />
                <div className="flex items-center gap-2">
                  <Checkbox checked={containsSpoilers} onCheckedChange={(checked) => setContainsSpoilers(checked === true)} />
                  <span className="text-sm text-gray-600">This review contains spoilers</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-gray-500">{reviewText.trim().length}/5000</span>
                  <div className="flex gap-2">
                    {editing && <Button variant="outline" onClick={() => { setEditing(false); setReviewText(myReview?.review_text || ''); setContainsSpoilers(myReview?.contains_spoilers || false); }}>Cancel</Button>}
                    <Button onClick={handleSave} disabled={saveReview.isPending || !reviewText.trim() || reviewText.trim().length > 5000}>{saveReview.isPending ? 'Saving…' : 'Publish review'}</Button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-600">Sign in to write a review. <Link className="font-medium text-emerald-700 underline" to={`/signin?redirect=/book/${bookId}`}>Sign in</Link></p>
        )}

        {isLoading ? <p className="text-sm text-gray-500">Loading reviews…</p> : null}
        {error ? <p className="text-sm text-red-600">Reviews could not be loaded. Please try again.</p> : null}
        {!isLoading && !error && reviews.filter((review) => review.user_id !== user?.id).length === 0 && <p className="text-sm text-gray-500">No other reviews yet. Be the first to share a thoughtful take.</p>}
        <div className="space-y-4">
          {reviews.filter((review) => review.user_id !== user?.id).map((review) => {
            const revealed = showSpoilers[review.id] === true;
            const name = review.reviewer?.full_name || (review.reviewer?.username ? `@${review.reviewer.username}` : 'Reader');
            return (
              <article key={review.id} className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{name}</p>
                    <p className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</p>
                  </div>
                  {review.contains_spoilers && <Button size="sm" variant="outline" onClick={() => setShowSpoilers((current) => ({ ...current, [review.id]: !revealed }))}>{revealed ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}{revealed ? 'Hide spoilers' : 'Reveal spoilers'}</Button>}
                </div>
                {review.contains_spoilers && !revealed ? <p className="text-sm text-amber-800 italic">Spoiler hidden — reveal only if you want to continue.</p> : <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{review.review_text}</p>}
              </article>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
