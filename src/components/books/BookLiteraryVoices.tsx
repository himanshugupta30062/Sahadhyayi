import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Feather, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client-universal';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

type VoicePublication={id:string;title:string;publication_type:string;source_url:string;excerpt:string|null;published_at:string|null;creator:{name:string;slug:string;avatar_url:string|null;creator_roles:string[]}|null};
export default function BookLiteraryVoices({bookId}:{bookId:string}){
 const query=useQuery({queryKey:['book-literary-voices',bookId],queryFn:async()=>{
  const {data,error}=await (supabase as any).from('creator_publications').select('id,title,publication_type,source_url,excerpt,published_at,literary_creators(name,slug,avatar_url,creator_roles)').eq('book_id',bookId).eq('status','published').order('published_at',{ascending:false}).limit(12);
  if(error)throw error;
  return (data||[]).map((r:any)=>({...r,creator:Array.isArray(r.literary_creators)?r.literary_creators[0]:r.literary_creators})) as VoicePublication[];
 }});
 if(query.isLoading||query.error||!query.data?.length)return null;
 return <section className="mt-8 space-y-4" aria-labelledby="literary-voices-heading"><div><p className="text-xs font-semibold uppercase tracking-widest text-primary">Beyond reader reviews</p><h2 id="literary-voices-heading" className="mt-1 font-serif text-2xl font-bold">Reviews & criticism by literary voices</h2><p className="mt-1 text-sm text-muted-foreground">Selected reviews, essays and video perspectives from reviewers and critics.</p></div><div className="grid gap-3 sm:grid-cols-2">{query.data.map(item=><Card key={item.id}><CardContent className="p-4"><div className="flex items-center gap-2"><Badge variant="secondary">{item.publication_type}</Badge>{item.published_at&&<span className="text-xs text-muted-foreground">{new Date(item.published_at).toLocaleDateString()}</span>}</div><h3 className="mt-2 font-semibold leading-snug">{item.title}</h3>{item.excerpt&&<p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{item.excerpt}</p>}<div className="mt-3 flex flex-wrap items-center justify-between gap-2"><Link to={`/literary-voices/${item.creator?.slug}`} className="text-sm font-medium hover:underline">{item.creator?.name||'Literary creator'}</Link><a href={item.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">Read / watch <ExternalLink className="h-3.5 w-3.5"/></a></div></CardContent></Card>)}</div><Link to="/reviewers-critics" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"><Feather className="h-4 w-4"/>Explore reviewers & critics</Link></section>;
}
