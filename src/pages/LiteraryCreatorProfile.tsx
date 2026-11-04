import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, BookOpen, ExternalLink, Globe, Youtube } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";

type Creator = {id:string;name:string;slug:string;bio:string|null;avatar_url:string|null;creator_roles:string[];genres:string[];languages:string[];website_url:string|null;verified:boolean};
type SocialLink = {id:string;platform:string;label:string|null;handle:string|null;url:string};
type Publication = {id:string;title:string;publication_type:string;source_url:string;excerpt:string|null;published_at:string|null;book_id:string|null};

const labels:Record<string,string>={reviewer:"Book Reviewer",critic:"Literary Critic",booktuber:"BookTuber",bookstagrammer:"Bookstagrammer",booktok:"BookTok Creator",blogger:"Literary Blogger"};
const platformIcons:Record<string,string>={youtube:"YouTube",instagram:"Instagram",tiktok:"TikTok",x:"X",substack:"Substack",website:"Website",goodreads:"Goodreads",other:"External"};

export default function LiteraryCreatorProfile(){
 const {slug}=useParams();const [creator,setCreator]=useState<Creator|null>(null);const [links,setLinks]=useState<SocialLink[]>([]);const [publications,setPublications]=useState<Publication[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState(false);
 useEffect(()=>{let active=true;const load=async()=>{setLoading(true);setError(false);
 const {data:c,error:ce}=await supabase.from("literary_creators").select("id,name,slug,bio,avatar_url,creator_roles,genres,languages,website_url,verified").eq("slug",slug??"").eq("status","published").maybeSingle();
 if(!active)return;if(ce||!c){setError(true);setLoading(false);return;}setCreator(c as Creator);
 const [lr,pr]=await Promise.all([supabase.from("creator_social_links").select("id,platform,label,handle,url").eq("creator_id",c.id).order("sort_order"),supabase.from("creator_publications").select("id,title,publication_type,source_url,excerpt,published_at,book_id").eq("creator_id",c.id).eq("status","published").order("published_at",{ascending:false}).limit(30)]);
 if(!active)return;setLinks((lr.data??[]) as SocialLink[]);setPublications((pr.data??[]) as Publication[]);setLoading(false);};void load();return()=>{active=false}},[slug]);
 if(loading)return <main className="mx-auto max-w-5xl px-4 py-16"><div className="h-64 animate-pulse rounded-2xl bg-muted"/></main>;
 if(error||!creator)return <main className="mx-auto max-w-3xl px-4 py-20 text-center"><h1 className="font-serif text-3xl font-bold">Literary voice not found</h1><p className="mt-3 text-muted-foreground">This profile may be unpublished or unavailable.</p><Button asChild className="mt-6"><Link to="/reviewers-critics">Back to directory</Link></Button></main>;
 return <main className="min-h-screen bg-background"><SEO title={creator.name+" | Literary Voice | Sahadhyayi"} description={creator.bio??("Discover "+creator.name+" on Sahadhyayi.")} canonical={"https://sahadhyayi.com/literary-voices/"+creator.slug} url={"https://sahadhyayi.com/literary-voices/"+creator.slug}/>
 <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6"><Button asChild variant="ghost" size="sm"><Link to="/reviewers-critics"><ArrowLeft className="mr-2 h-4 w-4"/>All reviewers & critics</Link></Button>
 <Card className="mt-5 overflow-hidden"><div className="h-2 bg-gradient-to-r from-[#1C442D] via-[#D5B16D] to-[#1C442D]"/><CardContent className="p-6 sm:p-10"><div className="flex flex-col gap-6 sm:flex-row sm:items-start"><div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted">{creator.avatar_url?<img src={creator.avatar_url} alt={creator.name} className="h-full w-full object-cover"/>:<BookOpen className="h-10 w-10 text-muted-foreground"/>}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2">{creator.creator_roles.map(r=><Badge key={r} variant="secondary">{labels[r]??r}</Badge>)}{creator.verified&&<Badge className="bg-emerald-600/10 text-emerald-700 dark:text-emerald-300">Verified profile</Badge>}</div><h1 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">{creator.name}</h1><p className="mt-4 max-w-3xl whitespace-pre-wrap leading-7 text-muted-foreground">{creator.bio||"A literary voice sharing perspectives on books and reading."}</p><div className="mt-5 flex flex-wrap gap-2">{creator.genres.map(g=><Badge key={g} variant="outline">{g}</Badge>)}</div>{creator.languages.length>0&&<p className="mt-3 text-sm text-muted-foreground">Languages: {creator.languages.join(", ")}</p>}</div></div>
 <div className="mt-7 flex flex-wrap gap-3">{creator.website_url&&<Button asChild><a href={creator.website_url} target="_blank" rel="noopener noreferrer">Visit website <ExternalLink className="ml-2 h-4 w-4"/></a></Button>}{links.map(l=><Button key={l.id} asChild variant="outline"><a href={l.url} target="_blank" rel="noopener noreferrer">{platformIcons[l.platform]??l.label??l.platform} <ArrowUpRight className="ml-2 h-3.5 w-3.5"/></a></Button>)}</div>
 </CardContent></Card>
 <section className="mt-10"><div className="mb-4"><h2 className="font-serif text-2xl font-bold">Reviews & publications</h2><p className="mt-1 text-sm text-muted-foreground">Original work from {creator.name}, linked to its source.</p></div>{publications.length===0?<div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No publications have been added yet.</div>:<div className="grid gap-4 sm:grid-cols-2">{publications.map(p=><Card key={p.id}><CardContent className="p-5"><Badge variant="secondary">{p.publication_type}</Badge><h3 className="mt-3 font-semibold">{p.title}</h3>{p.excerpt&&<p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{p.excerpt}</p>}<Button asChild variant="link" className="mt-3 px-0"><a href={p.source_url} target="_blank" rel="noopener noreferrer">Read original <ArrowUpRight className="ml-1 h-4 w-4"/></a></Button></CardContent></Card>)}</div>}</section>
 <div className="mt-10 rounded-xl bg-muted/40 p-5 text-sm text-muted-foreground"><Globe className="mb-2 h-5 w-5"/>Sahadhyayi links to the creator’s original publications. Content remains on its source platform unless permission is granted.</div></div></main>;
}
