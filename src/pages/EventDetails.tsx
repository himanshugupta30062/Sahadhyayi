import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Clock3, ExternalLink, Globe2, MapPin, Ticket } from "lucide-react";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type EventRecord = {
 id:string; title:string; slug:string; description?:string|null; start_at:string; end_at?:string|null;
 timezone?:string|null; venue?:string|null; city?:string|null; state?:string|null; country?:string|null;
 is_online:boolean; registration_url?:string|null; official_source_url:string; image_url?:string|null;
 organizer_name?:string|null; price_type:string; status:string; featured:boolean; category_id:string;
};
const dateTime = (value:string) => new Intl.DateTimeFormat("en-IN",{dateStyle:"full",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(value));

export default function EventDetails() {
 const {slug}=useParams<{slug:string}>();
 const [event,setEvent]=useState<EventRecord|null>(null);
 const [category,setCategory]=useState("");
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState(false);
 useEffect(()=>{let active=true;const load=async()=>{setLoading(true);const {data,error:queryError}=await (supabase as any).from("literary_events").select("*").eq("slug",slug).eq("status","published").maybeSingle();if(!active)return;if(queryError||!data){setError(true);setEvent(null);}else{setEvent(data);const result=await (supabase as any).from("literary_event_categories").select("name").eq("id",data.category_id).maybeSingle();if(active)setCategory(result.data?.name||"Book event");}setLoading(false);};void load();return()=>{active=false;};},[slug]);
 if(loading)return <div className="mx-auto max-w-5xl px-4 py-12"><Skeleton className="h-72 w-full rounded-2xl"/><Skeleton className="mt-6 h-8 w-2/3"/></div>;
 if(error||!event)return <main className="mx-auto max-w-3xl px-4 py-20 text-center"><CalendarDays className="mx-auto h-12 w-12 text-muted-foreground"/><h1 className="mt-4 text-2xl font-bold">Event not found</h1><p className="mt-2 text-muted-foreground">This event may have ended, been removed or its listing is not published.</p><Button asChild className="mt-6"><Link to="/events"><ArrowLeft className="mr-2 h-4 w-4"/>Back to Events</Link></Button></main>;
 const schema={"@context":"https://schema.org","@type":"Event","name":event.title,"startDate":event.start_at,"endDate":event.end_at||undefined,"eventStatus":event.status==="cancelled"?"https://schema.org/EventCancelled":event.status==="postponed"?"https://schema.org/EventPostponed":"https://schema.org/EventScheduled","eventAttendanceMode":event.is_online?"https://schema.org/OnlineEventAttendanceMode":"https://schema.org/OfflineEventAttendanceMode","url":`https://sahadhyayi.com/events/${event.slug}`,image:event.image_url?[event.image_url]:undefined,"description":event.description||event.title,"organizer":event.organizer_name?{"@type":"Organization","name":event.organizer_name}:undefined,"location":event.is_online?{"@type":"VirtualLocation","url":event.registration_url||event.official_source_url}:{"@type":"Place","name":event.venue||event.city,"address":{"@type":"PostalAddress","addressLocality":event.city,addressRegion:event.state,addressCountry:event.country||"India"}}};
 return <><SEO title={event.title} description={event.description||`Details, dates and registration for ${event.title}.`} canonical={`https://sahadhyayi.com/events/${event.slug}`} image={event.image_url} schema={schema}/><main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><Link to="/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4"/>All events</Link><div className="mt-5 overflow-hidden rounded-2xl border border-border/70 bg-card">{event.image_url&&<img src={event.image_url} alt="" className="max-h-[460px] w-full object-cover"/>}<div className="p-6 sm:p-10"><Badge variant="secondary">{category}</Badge><h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">{event.title}</h1><div className="mt-6 grid gap-4 sm:grid-cols-2"><Card><CardContent className="flex items-start gap-3 p-4"><CalendarDays className="mt-1 h-5 w-5 text-primary"/><div><p className="font-medium">Date & time</p><p className="mt-1 text-sm text-muted-foreground">{dateTime(event.start_at)}{event.end_at&&` – ${dateTime(event.end_at)}`}</p></div></CardContent></Card><Card><CardContent className="flex items-start gap-3 p-4"><MapPin className="mt-1 h-5 w-5 text-primary"/><div><p className="font-medium">{event.is_online?"Online event":"Venue"}</p><p className="mt-1 text-sm text-muted-foreground">{event.is_online?"Join from anywhere":[event.venue,event.city,event.state,event.country].filter(Boolean).join(", ")||"Venue to be announced"}</p></div></CardContent></Card></div>{event.organizer_name&&<p className="mt-4 text-sm text-muted-foreground">Organized by <span className="font-medium text-foreground">{event.organizer_name}</span></p>}<div className="prose prose-neutral mt-8 max-w-none dark:prose-invert"><p className="whitespace-pre-line leading-relaxed">{event.description||"More event details will be shared by the organizer."}</p></div><div className="mt-8 flex flex-wrap gap-3">{event.registration_url&&<Button asChild><a href={event.registration_url} target="_blank" rel="noopener noreferrer"><Ticket className="mr-2 h-4 w-4"/>Register / Tickets<ExternalLink className="ml-2 h-3.5 w-3.5"/></a></Button>}<Button asChild variant="outline"><a href={event.official_source_url} target="_blank" rel="noopener noreferrer">Official event source<ExternalLink className="ml-2 h-3.5 w-3.5"/></a></Button></div></div></div></main></>;
}
