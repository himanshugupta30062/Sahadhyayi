import { useEffect, useState } from 'react';
import { Bell, BellOff, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client-universal';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

type Preferences = { enabled:boolean; event_reminders:boolean; quiet_hours_enabled:boolean; quiet_hours_start:string|null; quiet_hours_end:string|null; timezone:string };
const defaults:Preferences={enabled:true,event_reminders:true,quiet_hours_enabled:false,quiet_hours_start:'22:00',quiet_hours_end:'08:00',timezone:'Asia/Kolkata'};

export default function GroupEventNotificationSettings(){
 const [prefs,setPrefs]=useState<Preferences>(defaults),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
 useEffect(()=>{let alive=true;(async()=>{const {data:{user}}=await supabase.auth.getUser();if(!user){if(alive)setLoading(false);return;}
 const {data,error}=await supabase.from('reading_group_notification_preferences').select('enabled,event_reminders,quiet_hours_enabled,quiet_hours_start,quiet_hours_end,timezone').eq('user_id',user.id).maybeSingle();
 if(error){toast.error('Could not load reminder settings');}else if(data&&alive)setPrefs({...defaults,...data,quiet_hours_start:data.quiet_hours_start?.slice(0,5)??defaults.quiet_hours_start,quiet_hours_end:data.quiet_hours_end?.slice(0,5)??defaults.quiet_hours_end});
 if(alive)setLoading(false);})();return()=>{alive=false;};},[]);
 const save=async(next:Preferences)=>{setPrefs(next);setSaving(true);const {data:{user}}=await supabase.auth.getUser();if(!user){setSaving(false);return;}
 const {error}=await supabase.from('reading_group_notification_preferences').upsert({user_id:user.id,...next,quiet_hours_start:next.quiet_hours_enabled?next.quiet_hours_start:null,quiet_hours_end:next.quiet_hours_enabled?next.quiet_hours_end:null,updated_at:new Date().toISOString()});
 setSaving(false);if(error){toast.error('Settings could not be saved');}else toast.success('Reminder settings saved');};
 const toggle=(key:'enabled'|'event_reminders'|'quiet_hours_enabled',value:boolean)=>void save({...prefs,[key]:value});
 return <Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4"/>Event reminder settings</CardTitle></CardHeader><CardContent className="space-y-4">
 {loading?<p className="text-sm text-muted-foreground">Loading preferences…</p>:<>
 <div className="flex items-center justify-between gap-3"><Label htmlFor="rg-notifications" className="flex items-center gap-2"><Bell className="h-4 w-4"/>Group notifications</Label><Switch id="rg-notifications" checked={prefs.enabled} disabled={saving} onCheckedChange={v=>toggle('enabled',v)}/></div>
 <div className="flex items-center justify-between gap-3"><Label htmlFor="rg-reminders" className="flex items-center gap-2"><Clock className="h-4 w-4"/>24h & 1h event reminders</Label><Switch id="rg-reminders" checked={prefs.event_reminders} disabled={saving||!prefs.enabled} onCheckedChange={v=>toggle('event_reminders',v)}/></div>
 <div className="flex items-center justify-between gap-3"><Label htmlFor="rg-quiet" className="flex items-center gap-2"><BellOff className="h-4 w-4"/>Quiet hours</Label><Switch id="rg-quiet" checked={prefs.quiet_hours_enabled} disabled={saving} onCheckedChange={v=>toggle('quiet_hours_enabled',v)}/></div>
 {prefs.quiet_hours_enabled&&<div className="grid grid-cols-2 gap-3"><label className="text-sm">From<input aria-label="Quiet hours start" type="time" className="mt-1 w-full rounded-md border bg-background p-2" value={prefs.quiet_hours_start??'22:00'} onChange={e=>setPrefs(p=>({...p,quiet_hours_start:e.target.value}))}/></label><label className="text-sm">Until<input aria-label="Quiet hours end" type="time" className="mt-1 w-full rounded-md border bg-background p-2" value={prefs.quiet_hours_end??'08:00'} onChange={e=>setPrefs(p=>({...p,quiet_hours_end:e.target.value}))}/></label><Button className="col-span-2" size="sm" disabled={saving} onClick={()=>void save(prefs)}>Save quiet hours</Button></div>}
 <p className="text-xs text-muted-foreground">Times use {prefs.timezone}. Reminders are delivered in the Sahadhyayi notification inbox.</p>
 </>}
 </CardContent></Card>;
}
