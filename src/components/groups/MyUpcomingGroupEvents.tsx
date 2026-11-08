import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Users, MapPin, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUserJoinedGroups } from '@/hooks/useUserGroups';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';

type EventRow = { id:string; group_id:string; title:string; description:string|null; event_type:string; starts_at:string; ends_at:string; location:string|null; status:string; capacity:number|null; groups?:{name:string}|null };
const dateLabel=(value:string)=>new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));

export default function MyUpcomingGroupEvents(){
 const memberships=useUserJoinedGroups();
 const groupIds=useMemo(()=>[...new Set((memberships.data??[]).filter(m=>m.status==='active').map(m=>m.group_id))],[memberships.data]);
 const events=useQuery({
  queryKey:['my-upcoming-group-events',groupIds],
  enabled:groupIds.length>0,
  queryFn:async()=>{
   const {data,error}=await supabase.from('group_events').select('id,group_id,title,description,event_type,starts_at,ends_at,location,status,capacity,groups:group_chats(name)').in('group_id',groupIds).eq('status','scheduled').gte('starts_at',new Date().toISOString()).order('starts_at',{ascending:true}).limit(50);
   if(error) throw error; return (data??[]) as EventRow[];
  }
 });
 if(memberships.isLoading||events.isLoading)return <div className="py-12 text-center text-muted-foreground"><Loader2 className="mx-auto mb-2 animate-spin"/>Loading your upcoming events…</div>;
 if(memberships.error||events.error)return <p role="alert" className="text-sm text-destructive">Upcoming events could not be loaded. Please try again.</p>;
 const rows=events.data??[];
 return <section className="space-y-4"><header><h2 className="text-xl font-semibold">Upcoming group events</h2><p className="text-sm text-muted-foreground">Sessions planned by reading groups you have joined.</p></header>
 {rows.length===0?<Card><CardContent className="py-10 text-center"><CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground"/><p className="font-medium">Nothing scheduled yet</p><p className="mt-1 text-sm text-muted-foreground">Your groups’ upcoming sessions will appear here.</p><Link className="mt-3 inline-block text-sm underline" to="/social?tab=groups">Explore reading groups</Link></CardContent></Card>
 :<div className="grid gap-3 md:grid-cols-2">{rows.map(event=><Card key={event.id}><CardContent className="space-y-3 p-4"><div className="flex items-start justify-between gap-2"><h3 className="font-semibold">{event.title}</h3><Badge variant="secondary">{event.event_type.replaceAll('_',' ')}</Badge></div><p className="text-sm text-muted-foreground">{event.groups?.name??'Reading group'}</p><p className="flex items-center gap-2 text-sm"><CalendarDays className="h-4 w-4"/>{dateLabel(event.starts_at)}</p>{event.location&&<p className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4"/>{event.location}</p>}{event.description&&<p className="line-clamp-2 text-sm text-muted-foreground">{event.description}</p>}<Link className="inline-flex items-center gap-1 text-sm font-medium underline" to={`/groups/${event.group_id}`}><Users className="h-4 w-4"/>View group & RSVP</Link></CardContent></Card>)}</div>}</section>;
}
