import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Clock3, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client-universal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type FeedItem={id:string;kind:'event'|'member';title:string;detail:string;at:string};
export default function GroupActivityFeed({groupId}:{groupId:string}){
 const {data:items=[],isLoading,error}=useQuery({
  queryKey:['reading-group-activity',groupId],
  enabled:!!groupId,
  queryFn:async()=>{
   const [events,members]=await Promise.all([
    supabase.from('group_events').select('id,title,description,starts_at,status,created_at').eq('group_id',groupId).order('created_at',{ascending:false}).limit(30),
    supabase.from('group_chat_members').select('id,status,created_at').eq('group_id',groupId).eq('status','active').order('created_at',{ascending:false}).limit(30)
   ]);
   if(events.error)throw events.error;if(members.error)throw members.error;
   const eventItems=(events.data||[]).map(e=>({id:'event-'+e.id,kind:'event' as const,title:e.status==='cancelled'?'Event cancelled':e.status==='completed'?'Event completed':'Event scheduled',detail:e.title,at:e.created_at||e.starts_at}));
   const memberItems=(members.data||[]).filter(m=>m.created_at).map(m=>({id:'member-'+m.id,kind:'member' as const,title:'Member joined',detail:'A reader joined this group',at:m.created_at}));
   return [...eventItems,...memberItems].sort((a,b)=>new Date(b.at).getTime()-new Date(a.at).getTime()).slice(0,40);
  }
 });
 return <Card className="border-border bg-card"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Clock3 className="h-4 w-4"/>Group activity</CardTitle></CardHeader><CardContent className="space-y-3">
 {isLoading?Array.from({length:3},(_,i)=><Skeleton key={i} className="h-14 w-full"/>):error?<p className="text-sm text-muted-foreground">Activity could not be loaded. Please try again later.</p>:items.length===0?<p className="text-sm text-muted-foreground py-3 text-center">No activity yet. Schedule an event or welcome a reader to get things started.</p>:<div className="space-y-3">{items.map(item=><div key={item.id} className="flex gap-3 rounded-lg border border-border/60 p-3"><span className="mt-0.5 rounded-full bg-muted p-2">{item.kind==='event'?<CalendarDays className="h-4 w-4"/>:<Users className="h-4 w-4"/>}</span><div className="min-w-0 flex-1"><p className="text-sm font-medium">{item.title}</p><p className="text-sm text-muted-foreground truncate">{item.detail}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(item.at).toLocaleString()}</p></div></div>)}</div>}
 </CardContent></Card>;
}
