import { useState } from 'react';
import { CalendarDays, MapPin, Users, Plus, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useGroupEvents, useGroupEventParticipants, useCreateGroupEvent, useRespondToGroupEvent, useCancelGroupEvent, type GroupEventType } from '@/hooks/useGroupEvents';

const labels: Record<GroupEventType,string> = { book_discussion:'Book discussion', co_reading:'Co-reading', reading_marathon:'Reading marathon', author_meetup:'Author meetup', weekly_session:'Weekly session', other:'Other' };
const localDate = (value:string) => new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));

export default function GroupEventsPanel({ groupId, userId, canManage }: { groupId:string; userId:string; canManage:boolean }) {
 const {data:events=[],isLoading,error}=useGroupEvents(groupId); const ids=events.map(e=>e.id);
 const {data:participants=[]}=useGroupEventParticipants(ids); const create=useCreateGroupEvent(groupId), respond=useRespondToGroupEvent(groupId), cancel=useCancelGroupEvent(groupId);
 const [open,setOpen]=useState(false),[title,setTitle]=useState(''),[description,setDescription]=useState(''),[type,setType]=useState<GroupEventType>('book_discussion'),[start,setStart]=useState(''),[end,setEnd]=useState(''),[location,setLocation]=useState(''),[capacity,setCapacity]=useState('');
 const submit=async()=>{try{await create.mutateAsync({title,description,eventType:type,startsAt:new Date(start).toISOString(),endsAt:new Date(end).toISOString(),location,capacity:capacity?Number(capacity):null});toast.success('Event created');setOpen(false);setTitle('');setDescription('');setStart('');setEnd('');setLocation('');setCapacity('');}catch(e){toast.error(e instanceof Error?e.message:'Unable to create event');}};
 const rsvp=async(eventId:string,response:'going'|'maybe'|'decline')=>{try{await respond.mutateAsync({eventId,response});toast.success(response==='decline'?'RSVP withdrawn':'RSVP: '+response);}catch(e){toast.error(e instanceof Error?e.message:'RSVP failed');}};
 if(isLoading)return <div className="py-8 text-center"><Loader2 className="mx-auto animate-spin"/>Loading events…</div>;
 if(error)return <p role="alert" className="text-sm text-destructive">Could not load group events. Please retry.</p>;
 return <section className="space-y-4" aria-label="Reading group events">
 <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">Events & sessions</h2>{canManage&&<Button onClick={()=>setOpen(v=>!v)}><Plus className="mr-2 h-4 w-4"/>Create event</Button>}</div>
 {open&&<Card><CardHeader><CardTitle>Plan a reading session</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">
 <Input aria-label="Event title" placeholder="Event title" value={title} onChange={e=>setTitle(e.target.value)} maxLength={120}/>
 <Select value={type} onValueChange={v=>setType(v as GroupEventType)}><SelectTrigger aria-label="Event type"><SelectValue/></SelectTrigger><SelectContent>{Object.entries(labels).map(([v,l])=><SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select>
 <label className="text-sm">Starts<input aria-label="Starts at" type="datetime-local" className="mt-1 w-full rounded-md border bg-background p-2" value={start} onChange={e=>setStart(e.target.value)}/></label>
 <label className="text-sm">Ends<input aria-label="Ends at" type="datetime-local" className="mt-1 w-full rounded-md border bg-background p-2" value={end} onChange={e=>setEnd(e.target.value)}/></label>
 <Input aria-label="Location" placeholder="Location / online room" value={location} onChange={e=>setLocation(e.target.value)} maxLength={240}/>
 <Input aria-label="Capacity" type="number" min="1" max="10000" placeholder="Capacity (optional)" value={capacity} onChange={e=>setCapacity(e.target.value)}/>
 <Textarea aria-label="Description" placeholder="Description (optional)" value={description} onChange={e=>setDescription(e.target.value)} maxLength={5000} className="sm:col-span-2"/>
 <div className="flex gap-2 sm:col-span-2"><Button disabled={create.isPending||title.trim().length<3||!start||!end} onClick={()=>void submit()}>{create.isPending&&<Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Publish event</Button><Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button></div>
 </CardContent></Card>}
 {events.length===0?<Card><CardContent className="py-8 text-center text-muted-foreground">No events planned yet. Start a discussion or co-reading session.</CardContent></Card>:<div className="grid gap-3">{events.map(event=>{const people=participants.filter(p=>p.event_id===event.id),mine=people.find(p=>p.user_id===userId);return <Card key={event.id}><CardContent className="space-y-3 p-4">
 <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-semibold">{event.title}</h3><Badge variant={event.status==='scheduled'?'secondary':'outline'}>{event.status==='scheduled'?labels[event.event_type]:event.status}</Badge></div>{canManage&&event.status==='scheduled'&&<Button size="sm" variant="ghost" onClick={()=>void cancel.mutateAsync(event.id).then(()=>toast.success('Event cancelled')).catch(e=>toast.error(e.message))}><XCircle className="mr-1 h-4 w-4"/>Cancel</Button>}</div>
 {event.description&&<p className="text-sm text-muted-foreground">{event.description}</p>}<p className="flex items-center gap-2 text-sm"><CalendarDays className="h-4 w-4"/>{localDate(event.starts_at)} – {localDate(event.ends_at)}</p>
 {event.location&&<p className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4"/>{event.location}</p>}<p className="flex items-center gap-2 text-sm"><Users className="h-4 w-4"/>{people.filter(p=>p.response==='going').length}{event.capacity?' / '+event.capacity:''} going · {people.filter(p=>p.response==='maybe').length} maybe</p>
 {event.status==='scheduled'&&<div className="flex flex-wrap gap-2"><Button size="sm" variant={mine?.response==='going'?'default':'outline'} disabled={respond.isPending} onClick={()=>void rsvp(event.id,mine?.response==='going'?'decline':'going')}>{mine?.response==='going'?'Withdraw':'I’m going'}</Button><Button size="sm" variant={mine?.response==='maybe'?'secondary':'outline'} disabled={respond.isPending} onClick={()=>void rsvp(event.id,mine?.response==='maybe'?'decline':'maybe')}>{mine?.response==='maybe'?'Withdraw maybe':'Maybe'}</Button></div>}
 </CardContent></Card>})}</div>}
 </section>;
}