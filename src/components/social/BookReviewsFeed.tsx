import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client-universal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, MessageSquare, ShieldAlert } from 'lucide-react';

type ReviewRow = { id:string; book_id:string; user_id:string; review_text:string; contains_spoilers:boolean; created_at:string; book?:{title:string;author:string|null;cover_image_url:string|null}|null; reviewer?:{full_name:string|null;username:string|null;profile_photo_url:string|null}|null };
export default function BookReviewsFeed() {
 const query=useQuery({queryKey:['community-book-reviews'],queryFn:async()=>{
  const {data,error}=await supabase.from('book_reviews').select('id,book_id,user_id,review_text,contains_spoilers,created_at,book:books_library(title,author,cover_image_url)').order('created_at',{ascending:false}).limit(40);
  if(error) throw error;
  const rows=(data||[]) as unknown as ReviewRow[];
  const ids=[...new Set(rows.map(r=>r.user_id))];
  const {data:profiles}=ids.length?await supabase.from('profiles_public').select('id,full_name,username,profile_photo_url').in('id',ids):{data:[]};
  const map=new Map((profiles||[]).map(p=>[p.id,p]));
  return rows.map(r=>({...r,reviewer:map.get(r.user_id)||null}));
 }});
 if(query.isLoading)return <div className="py-12 text-center text-sm text-muted-foreground">Loading reader reviews…</div>;
 if(query.error)return <div role="alert" className="rounded-xl border p-5 text-sm text-muted-foreground">Could not load reviews right now. Please refresh and try again.</div>;
 if(!query.data?.length)return <Card><CardContent className="p-8 text-center"><MessageSquare className="mx-auto mb-3 h-8 w-8 text-muted-foreground"/><h3 className="font-semibold">No community reviews yet</h3><p className="mt-2 text-sm text-muted-foreground">Visit a book page and share the first thoughtful review.</p><Link className="mt-4 inline-block text-sm font-medium underline" to="/library">Explore the Library</Link></CardContent></Card>;
 return <div className="space-y-4">{query.data.map(r=><Card key={r.id} className="overflow-hidden"><CardContent className="p-5 sm:p-6"><div className="flex gap-4"><Link to={`/book/${r.book_id}`} className="shrink-0"><img src={r.book?.cover_image_url||'/placeholder.svg'} alt={r.book?.title||'Book cover'} className="h-24 w-16 rounded-md object-cover bg-muted" loading="lazy"/></Link><div className="min-w-0 flex-1"><Link to={`/book/${r.book_id}`} className="font-serif text-lg font-semibold hover:underline">{r.book?.title||'Book'}</Link><p className="text-xs text-muted-foreground">{r.book?.author||'Author not listed'}</p><div className="mt-2 flex items-center gap-2"><Avatar className="h-6 w-6"><AvatarImage src={r.reviewer?.profile_photo_url||undefined}/><AvatarFallback>{(r.reviewer?.full_name||r.reviewer?.username||'R').slice(0,1).toUpperCase()}</AvatarFallback></Avatar><span className="text-xs text-muted-foreground">{r.reviewer?.full_name||r.reviewer?.username||'Reader'} · {new Date(r.created_at).toLocaleDateString()}</span></div></div></div>{r.contains_spoilers?<Badge variant="secondary" className="mt-4"><ShieldAlert className="mr-1 h-3 w-3"/>Contains spoilers</Badge>:null}<p className="mt-4 whitespace-pre-wrap text-sm leading-6">{r.review_text}</p><Link to={`/book/${r.book_id}?tab=reviews`} className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"><BookOpen className="h-3.5 w-3.5"/>Read all reviews for this book</Link></CardContent></Card>)}</div>;
}
