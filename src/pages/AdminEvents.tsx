import { useEffect, useState } from "react";
import { CalendarDays, Pencil, Plus, Save, Star, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

type Category={id:string;name:string;slug:string};
type EventRow={id:string;title:string;slug:string;start_at:string;city:string|null;status:string;featured:boolean};
type FormState={title:string;slug:string;description:string;category_id:string;start_at:string;end_at:string;venue:string;city:string;state:string;country:string;is_online:boolean;registration_url:string;official_source_url:string;image_url:string;organizer_name:string;price_type:string;status:string;featured:boolean;verification_status:string};
const empty:FormState={title:"",slug:"",description:"",category_id:"",start_at:"",end_at:"",venue:"",city:"",state:"",country:"India",is_online:false,registration_url:"",official_source_url:"",image_url:"",organizer_name:"",price_type:"unknown",status:"draft",featured:false,verification_status:"unverified"};
const slugify=(s:string)=>s.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
const localDate=(value:string)=>value?new Date(value).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"}):"Date not set";

export default function AdminEvents(){
 const [categories,setCategories]=useState<Category[]>([]);
 const [events,setEvents]=useState<EventRow[]>([]);
 const [form,setForm]=useState<FormState>(empty);
 const [editing,setEditing]=useState<string|null>(null);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [deleting,setDeleting]=useState<string|null>(null);
 const refresh=async()=>{setLoading(true);const [c,e]=await Promise.all([(supabase as any).from("literary_event_categories").select("id,name,slug").order("sort_order"),(supabase as any).from("literary_events").select("id,title,slug,start_at,city,status,featured").order("created_at",{ascending:false}).limit(200)]);if(c.error||e.error){toast({title:"Could not load events",description:c.error?.message||e.error?.message,variant:"destructive"});}else{setCategories(c.data||[]);setEvents(e.data||[]);}setLoading(false);};
 useEffect(()=>{void refresh();},[]);
 const set=(key:keyof FormState,value:FormState[keyof FormState])=>setForm((prev)=>({...prev,[key]:value}));
 const edit=async(id:string)=>{const {data,error}=await (supabase as any).from("literary_events").select("*").eq("id",id).single();if(error){toast({title:"Could not open event",description:error.message,variant:"destructive"});return;}setEditing(id);setForm({...empty,...data,start_at:data.start_at?new Date(data.start_at).toISOString().slice(0,16):"",end_at:data.end_at?new Date(data.end_at).toISOString().slice(0,16):""});window.scrollTo({top:0,behavior:"smooth"});};
 const save=async(e:React.FormEvent)=>{e.preventDefault();if(!form.category_id||!form.start_at||!form.official_source_url){toast({title:"Missing required fields",description:"Choose a category, start date and official source URL.",variant:"destructive"});return;}setSaving(true);const payload={...form,slug:form.slug||slugify(form.title),start_at:new Date(form.start_at).toISOString(),end_at:form.end_at?new Date(form.end_at).toISOString():null,created_by:undefined,updated_at:new Date().toISOString(),last_verified_at:form.verification_status==="verified"?new Date().toISOString():null};delete (payload as any).created_by;const result=editing?await (supabase as any).from("literary_events").update(payload).eq("id",editing):await (supabase as any).from("literary_events").insert(payload);setSaving(false);if(result.error){toast({title:"Event could not be saved",description:result.error.message,variant:"destructive"});return;}toast({title:editing?"Event updated":"Event created"});setEditing(null);setForm(empty);await refresh();};
 const remove=async(id:string)=>{if(!window.confirm("Delete this event permanently?"))return;setDeleting(id);const {error}=await (supabase as any).from("literary_events").delete().eq("id",id);setDeleting(null);if(error)toast({title:"Delete failed",description:error.message,variant:"destructive"});else{toast({title:"Event deleted"});await refresh();}};
 const field=(label:string,key:keyof FormState,placeholder?:string,required=false)=><div className="space-y-2"><Label htmlFor={key}>{label}{required?" *":""}</Label><Input id={key} value={String(form[key]??"")} placeholder={placeholder} required={required} onChange={(e)=>set(key,e.target.value)}/></div>;
 return <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6"><div><Badge variant="outline">Admin · Content</Badge><h1 className="mt-2 text-3xl font-bold">Manage book events</h1><p className="mt-2 text-muted-foreground">Create and curate source-verified book fairs, festivals, launches and reading events.</p></div>
 <Card><CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5"/>{editing?"Edit event":"Create event"}</CardTitle></CardHeader><CardContent><form onSubmit={save} className="grid gap-4 md:grid-cols-2">
 {field("Event title","title","e.g. New Delhi World Book Fair 2027",true)}{field("URL slug","slug","Auto-generated from title")}
 <div className="space-y-2"><Label>Category *</Label><Select value={form.category_id} onValueChange={(v)=>set("category_id",v)}><SelectTrigger><SelectValue placeholder="Choose category"/></SelectTrigger><SelectContent>{categories.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
 <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={(v)=>set("status",v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{["draft","published","cancelled","postponed","completed"].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
 <div className="space-y-2"><Label>Starts *</Label><Input type="datetime-local" value={form.start_at} required onChange={(e)=>set("start_at",e.target.value)}/></div><div className="space-y-2"><Label>Ends</Label><Input type="datetime-local" value={form.end_at} onChange={(e)=>set("end_at",e.target.value)}/></div>
 {field("Venue","venue","Venue / campus / hall")}{field("City","city","City")}{field("State","state","State")}{field("Country","country","Country")}
 {field("Organizer","organizer_name","Organizer / publisher")}{field("Registration URL","registration_url","https://…")}{field("Official source URL *","official_source_url","https://official-event-site…",true)}{field("Banner image URL","image_url","https://…")}
 <div className="space-y-2"><Label>Entry / ticket</Label><Select value={form.price_type} onValueChange={(v)=>set("price_type",v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{["free","paid","registration-required","unknown"].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
 <div className="space-y-2"><Label>Verification</Label><Select value={form.verification_status} onValueChange={(v)=>set("verification_status",v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{["unverified","verified","needs_review"].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
 <div className="space-y-2 md:col-span-2"><Label>Description</Label><Textarea value={form.description} rows={5} placeholder="Programme, audience, highlights and useful details" onChange={(e)=>set("description",e.target.value)}/></div>
 <div className="flex flex-wrap items-center gap-6 md:col-span-2"><label className="flex items-center gap-2 text-sm"><Switch checked={form.is_online} onCheckedChange={(v)=>set("is_online",v)}/>Online event</label><label className="flex items-center gap-2 text-sm"><Switch checked={form.featured} onCheckedChange={(v)=>set("featured",v)}/>Featured</label></div>
 <div className="flex gap-2 md:col-span-2"><Button type="submit" disabled={saving}><Save className="mr-2 h-4 w-4"/>{saving?"Saving…":editing?"Save changes":"Create event"}</Button><Button type="button" variant="outline" onClick={()=>{setEditing(null);setForm(empty);}}>Reset</Button></div>
 </form></CardContent></Card>
 <Card><CardHeader><CardTitle>Event listings ({events.length})</CardTitle></CardHeader><CardContent>{loading?<p className="text-sm text-muted-foreground">Loading…</p>:events.length===0?<p className="py-6 text-center text-muted-foreground">No events yet. Create your first listing above.</p>:<div className="divide-y divide-border">{events.map(event=><div key={event.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-medium">{event.title}{event.featured&&<Star className="ml-2 inline h-3.5 w-3.5 fill-amber-500 text-amber-500"/>}</p><p className="mt-1 text-xs text-muted-foreground">{localDate(event.start_at)} · {event.city||"Online / venue TBA"} · <Badge variant={event.status==="published"?"default":"secondary"}>{event.status}</Badge></p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={()=>void edit(event.id)}><Pencil className="mr-1.5 h-3.5 w-3.5"/>Edit</Button><Button size="sm" variant="outline" disabled={deleting===event.id} onClick={()=>void remove(event.id)}><Trash2 className="mr-1.5 h-3.5 w-3.5"/>Delete</Button></div></div>)}</div>}</CardContent></Card></main>;
}
