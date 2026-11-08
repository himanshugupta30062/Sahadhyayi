import React from "react";
import { Link } from "react-router-dom";
import { Bookmark, BookOpen, ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSavedSocialPosts, useToggleSavedSocialPost } from "@/hooks/useSavedSocialPosts";
import { useToast } from "@/hooks/use-toast";
import { SocialSurface } from "@/components/social/SocialSurface";
import SEO from "@/components/SEO";

export default function ReadingCabinet() {
  const { data = [], isLoading, error } = useSavedSocialPosts();
  const saveMutation = useToggleSavedSocialPost();
  const { toast } = useToast();
  const remove = (postId: string) => saveMutation.mutate({ postId, isSaved: true }, {
    onSuccess: () => toast({ title: "Removed from Reading Cabinet" }),
    onError: (e) => toast({ title: "Couldn't remove saved post", description: e.message, variant: "destructive" }),
  });

  return <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
    <SEO title="Reading Cabinet | Sahadhyayi" description="Your private collection of saved reading conversations and posts." />
    <div className="flex items-center gap-3">
      <Button asChild variant="ghost" size="sm"><Link to="/social"><ArrowLeft className="mr-2 h-4 w-4"/>Back to Social</Link></Button>
      <div><h1 className="text-2xl font-semibold">Reading Cabinet</h1><p className="text-sm text-muted-foreground">A private shelf for posts worth returning to.</p></div>
    </div>
    {isLoading ? <p role="status">Loading your saved posts…</p> : error ? <SocialSurface className="p-5">Your cabinet couldn't load. Please try again.</SocialSurface> : data.length === 0 ?
      <SocialSurface className="p-10 text-center space-y-3"><Bookmark className="mx-auto h-8 w-8"/><h2 className="font-semibold">Your cabinet is empty</h2><p className="text-sm text-muted-foreground">Save a useful post, quote, or book discussion from Social to find it here.</p><Button asChild><Link to="/social">Explore Social</Link></Button></SocialSurface> :
      <div className="space-y-3">{data.map((saved) => {
        const post = saved.post;
        if (!post) return <Card key={saved.id}><CardContent className="p-4 text-sm text-muted-foreground">This post is no longer available.</CardContent></Card>;
        const profile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
        const book = Array.isArray(post.books_library) ? post.books_library[0] : post.books_library;
        return <Card key={saved.id}><CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3"><div className="text-sm font-medium">{profile?.full_name || "Reader"}{profile?.username ? ` · @${profile.username}` : ""}</div><Button variant="ghost" size="sm" onClick={() => remove(saved.post_id)} disabled={saveMutation.isPending} aria-label="Remove saved post"><Trash2 className="h-4 w-4"/></Button></div>
          <p className="whitespace-pre-wrap">{post.quote_text || post.content}</p>
          {post.quote_author && <p className="text-sm text-muted-foreground">— {post.quote_author}</p>}
          {book && <Link className="flex items-center gap-2 text-sm text-muted-foreground" to={`/book/${book.id}`}><BookOpen className="h-4 w-4"/>{book.title}{book.author ? ` · ${book.author}` : ""}</Link>}
          <Button asChild variant="outline" size="sm"><Link to={`/social?post=${post.id}`}>View in Social</Link></Button>
          <p className="text-xs text-muted-foreground">Saved {new Date(saved.created_at).toLocaleDateString()}</p>
        </CardContent></Card>;
      })}</div>}
  </div>;
}
