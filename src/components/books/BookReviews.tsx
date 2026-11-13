import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquareText, Pencil, Trash2, Eye, EyeOff, ThumbsUp } from 'lucide-react';
import { useAuth } from '@/contexts/authHelpers';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { REVIEW_DIMENSIONS, type ReviewDimension, type ReaderReaction } from '@/hooks/useBookReviews';
import { useBookReviews, useDeleteBookReview, useSaveBookReview, useReviewHelpfulVotes, useToggleReviewHelpfulVote } from '@/hooks/useBookReviews';
import { useToast } from '@/hooks/use-toast';

export default function BookReviews({ bookId }: { bookId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: reviews = [], isLoading, error } = useBookReviews(bookId);
  const reviewIds = reviews.filter(review => review.user_id !== user?.id).map(review => review.id);
  const { data: helpfulVotes = [] } = useReviewHelpfulVotes(reviewIds);
  const toggleHelpful = useToggleReviewHelpfulVote();
  const saveReview = useSaveBookReview(bookId);
  const deleteReview = useDeleteBookReview(bookId);
  const myReview = reviews.find((review) => review.user_id === user?.id);
  const [reviewText, setReviewText] = useState('');
  const [containsSpoilers, setContainsSpoilers] = useState(false);
  const [overallRating, setOverallRating] = useState(0);
  const [plotRating, setPlotRating] = useState(0);
  const [charactersRating, setCharactersRating] = useState(0);
  const [writingRating, setWritingRating] = useState(0);
  const [readerReaction, setReaderReaction] = useState<ReaderReaction | ''>('');
  const [dimensionScores, setDimensionScores] = useState<Record<ReviewDimension, number>>({ writing: 0, characters: 0, plot: 0, pacing: 0, worldbuilding: 0, originality: 0 });
  const [showSpoilers, setShowSpoilers] = useState<Record<string, boolean>>({});
  const [showOwnSpoilers, setShowOwnSpoilers] = useState(false);
  const [editing, setEditing] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<'newest' | 'oldest' | 'highest'>('newest');
  const [spoilerFilter, setSpoilerFilter] = useState<'all' | 'clean'>('all');
  const otherReviews = reviews.filter((review) => review.user_id !== user?.id);
  const visibleReviews = [...otherReviews]
    .filter((review) => spoilerFilter === 'all' || !review.contains_spoilers)
    .sort((a, b) => reviewOrder === 'oldest'
      ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      : reviewOrder === 'highest'
        ? (b.overall_rating || 0) - (a.overall_rating || 0) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  useEffect(() => {
    setReviewText(myReview?.review_text || '');
    setContainsSpoilers(myReview?.contains_spoilers || false);
    setOverallRating(myReview?.overall_rating || 0);
    setPlotRating(myReview?.plot_rating || 0);
    setCharactersRating(myReview?.characters_rating || 0);
    setWritingRating(myReview?.writing_rating || 0);
    setReaderReaction(myReview?.reader_reaction || '');
    setDimensionScores({ writing: 0, characters: 0, plot: 0, pacing: 0, worldbuilding: 0, originality: 0, ...(myReview?.dimensions || []).reduce((acc, item) => ({ ...acc, [item.dimension]: item.score }), {}) });
    setEditing(false);
  }, [myReview?.id, myReview?.updated_at, myReview?.review_text, myReview?.contains_spoilers]);

  const handleSave = async () => {
    try {
      if (overallRating < 1 || overallRating > 5) throw new Error('Please choose an overall rating from 1 to 5.');
      await saveReview.mutateAsync({ reviewText, containsSpoilers, overallRating, plotRating: plotRating || null, charactersRating: charactersRating || null, writingRating: writingRating || null, readerReaction: readerReaction || null, dimensions: REVIEW_DIMENSIONS.filter(d => dimensionScores[d] > 0).map(d => ({ dimension: d, score: dimensionScores[d] })) });
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
      setReaderReaction('');
      setDimensionScores({ writing: 0, characters: 0, plot: 0, pacing: 0, worldbuilding: 0, originality: 0 });
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

        {reviews.length > 0 && (() => {
          const rated = reviews.filter(review => typeof review.overall_rating === 'number' && review.overall_rating > 0);
          const average = rated.length ? rated.reduce((sum, review) => sum + (review.overall_rating || 0), 0) / rated.length : null;
          const dimensionAverages = REVIEW_DIMENSIONS.map(dimension => {
            const scores = reviews.flatMap(review => (review.dimensions || []).filter(item => item.dimension === dimension).map(item => item.score));
            return { dimension, average: scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null, count: scores.length };
          }).filter(item => item.average !== null);
          const reactions = reviews.reduce<Record<string, number>>((counts, review) => {
            if (review.reader_reaction) counts[review.reader_reaction] = (counts[review.reader_reaction] || 0) + 1;
            return counts;
          }, {});
          const topReaction = Object.entries(reactions).sort((a, b) => b[1] - a[1])[0];
          return <section aria-label="Review analytics" className="rounded-xl border bg-muted/20 p-4 space-y-3">
            <div className="flex flex-wrap items-baseline gap-2"><h3 className="font-semibold">Community snapshot</h3><span className="text-xs text-muted-foreground">From {reviews.length} reviews loaded</span></div>
            <div className="flex items-center gap-2"><span className="text-2xl font-semibold tabular-nums">{average === null ? '—' : average.toFixed(1)}</span><span className="text-amber-600">★</span><span className="text-sm text-muted-foreground">/ 5 · {rated.length} ratings</span>{topReaction && <span className="ml-auto rounded-full bg-primary/10 px-2 py-1 text-xs capitalize">{topReaction[0]} · {topReaction[1]}</span>}</div>
            {dimensionAverages.length > 0 && <div className="space-y-2">{dimensionAverages.map(item => <div key={item.dimension} className="grid grid-cols-[90px_1fr_34px] items-center gap-2 text-xs"><span className="capitalize">{item.dimension}</span><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-emerald-600" style={{ width: ((item.average || 0) / 5 * 100) + '%' }} /></div><span className="text-right tabular-nums">{item.average?.toFixed(1)}</span></div>)}</div>}
          </section>;
        })()}
        {user ? (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-3">
            <h3 className="font-medium">{myReview && !editing ? 'Your review' : myReview ? 'Edit your review' : 'Share your thoughts'}</h3>
            {myReview && !editing ? (
              <>
                {myReview.contains_spoilers && !showOwnSpoilers ? <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><p className="mb-2">Your review is marked as containing spoilers.</p><Button type="button" size="sm" variant="outline" onClick={() => setShowOwnSpoilers(true)}><Eye className="mr-1 h-4 w-4" />Reveal my review</Button></div> : <><p className="whitespace-pre-wrap text-sm text-gray-700">{myReview.review_text}</p>{myReview.contains_spoilers && <Button type="button" size="sm" variant="ghost" onClick={() => setShowOwnSpoilers(false)}><EyeOff className="mr-1 h-4 w-4" />Hide my review</Button></>}
                <p className="text-sm text-amber-700">★ {myReview.overall_rating || '—'}/5 overall{myReview.plot_rating ? ` · Plot ${myReview.plot_rating}/5` : ''}{myReview.characters_rating ? ` · Characters ${myReview.characters_rating}/5` : ''}{myReview.writing_rating ? ` · Writing ${myReview.writing_rating}/5` : ''}</p>
                {myReview.contains_spoilers && <p className="text-xs text-amber-800">Marked as containing spoilers</p>}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil className="h-4 w-4 mr-1" /> Edit review</Button>
                  <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deleteReview.isPending}><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[['Overall',overallRating,setOverallRating],['Plot',plotRating,setPlotRating],['Characters',charactersRating,setCharactersRating],['Writing',writingRating,setWritingRating]].map(([label,value,setter]) => (
                    <label key={label as string} className="text-xs font-medium text-gray-700">{label as string}{label === 'Overall' && <span className="text-red-500"> *</span>}
                      <select className="mt-1 w-full rounded-md border border-emerald-200 bg-white px-2 py-2 text-sm" value={value as number} onChange={(event) => (setter as (v:number)=>void)(Number(event.target.value))} aria-label={`${label as string} rating`}>
                        <option value={0}>Rate…</option>{[1,2,3,4,5].map((n)=><option key={n} value={n}>{n} ★</option>)}
                      </select>
                    </label>
                  ))}
                </div>
                <label className="block text-sm font-medium">Your reading reaction</label>
                <select className="w-full rounded-md border bg-background px-3 py-2 text-sm" value={readerReaction} onChange={e => setReaderReaction(e.target.value as ReaderReaction | '')} aria-label="Reading reaction">
                  <option value="">Choose a reaction (optional)</option>{(['joyful','thoughtful','inspired','heartbroken','tense','surprised','comforted','challenged'] as ReaderReaction[]).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <p className="text-sm font-medium">Additional ratings (optional, 1–5)</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{REVIEW_DIMENSIONS.map(d => <label key={d} className="text-xs capitalize">{d}<select className="mt-1 w-full rounded border bg-background px-2 py-2" value={dimensionScores[d]} onChange={e => setDimensionScores(s => ({...s,[d]:Number(e.target.value)}))}><option value={0}>Not rated</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}</select></label>)}</div>
                <Textarea value={reviewText} onChange={(event) => setReviewText(event.target.value)} rows={4} maxLength={5000} placeholder="What stayed with you after reading this book?" aria-label="Your book review" />
                <div className="flex items-center gap-2">
                  <Checkbox checked={containsSpoilers} onCheckedChange={(checked) => setContainsSpoilers(checked === true)} />
                  <span className="text-sm text-gray-600">This review contains spoilers</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-gray-500">{reviewText.trim().length}/5000</span>
                  <div className="flex gap-2">
                    {editing && <Button variant="outline" onClick={() => { setEditing(false); setReviewText(myReview?.review_text || ''); setContainsSpoilers(myReview?.contains_spoilers || false); setOverallRating(myReview?.overall_rating || 0); setPlotRating(myReview?.plot_rating || 0); setCharactersRating(myReview?.characters_rating || 0); setWritingRating(myReview?.writing_rating || 0); }}>Cancel</Button>}
                    <Button onClick={handleSave} disabled={saveReview.isPending || !reviewText.trim() || reviewText.trim().length > 5000 || overallRating < 1}>{saveReview.isPending ? 'Saving…' : 'Publish review'}</Button>
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
        {!isLoading && !error && visibleReviews.length === 0 && <p className="text-sm text-gray-500">No other reviews yet. Be the first to share a thoughtful take.</p>}
        <div className="space-y-4">
          {!isLoading && !error && otherReviews.length > 0 && <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3"><span className="text-sm text-muted-foreground">{visibleReviews.length} of {otherReviews.length} reviews</span><div className="flex gap-2"><select aria-label="Sort reviews" className="h-9 rounded-md border bg-background px-2 text-sm" value={reviewOrder} onChange={(event)=>setReviewOrder(event.target.value as typeof reviewOrder)}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="highest">Highest rated</option></select><select aria-label="Filter reviews" className="h-9 rounded-md border bg-background px-2 text-sm" value={spoilerFilter} onChange={(event)=>setSpoilerFilter(event.target.value as typeof spoilerFilter)}><option value="all">All reviews</option><option value="clean">Hide spoilers</option></select></div></div>}
          {visibleReviews.map((review) => {
            const revealed = showSpoilers[review.id] === true;
            const votes = helpfulVotes.filter(vote => vote.review_id === review.id);
            const votedHelpful = votes.some(vote => vote.user_id === user?.id);
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
                {review.reader_reaction && <p className="text-xs text-emerald-700">Felt: {review.reader_reaction}</p>}
                {!!review.dimensions?.length && <div className="flex flex-wrap gap-2">{review.dimensions.map(item => <span key={item.dimension} className="rounded-full bg-muted px-2 py-1 text-xs capitalize">{item.dimension}: {item.score}/5</span>)}</div>}
                {review.contains_spoilers && !revealed ? <p className="text-sm text-amber-800 italic">Spoiler hidden — reveal only if you want to continue.</p> : <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{review.review_text}</p>}
                <Button type="button" size="sm" variant={votedHelpful ? "secondary" : "outline"} disabled={!user || toggleHelpful.isPending} onClick={async () => { try { await toggleHelpful.mutateAsync({ reviewId: review.id, helpful: votedHelpful }); } catch (err) { toast({ title: 'Could not update helpful vote', description: err instanceof Error ? err.message : 'Please try again.', variant: 'destructive' }); } }} aria-pressed={votedHelpful}><ThumbsUp className="mr-1 h-4 w-4" />{votedHelpful ? 'Helpful' : 'Mark helpful'} · {votes.length}</Button>
              </article>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
