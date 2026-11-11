import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client-universal';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type MuteOption='1h'|'8h'|'7d'|'forever';
const durations:Record<MuteOption,string>={'1h':'1 hour','8h':'8 hours','7d':'7 days','forever':'Indefinitely'};

export default function GroupMuteControl({groupId,userId}:{groupId:string;userId:string}){
 const [muted,setMuted]=useState(false),[until,setUntil]=useState<string|null>(null),[choice,setChoice]=useState<MuteOption>('8h'),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false);
 useEffect(()=>{let active=true;(async()=>{const {data,error}=await supabase.from('reading_group_notification_mutes').select('muted_until').eq('user_id',userId).eq('group_id',groupId).maybeSingle();if(!active)return;if(error)toast.error('Could not load group mute status');else if(data){const expiry=data.muted_until?new Date(data.muted_until):null;const isMuted=!expiry||expiry>new Date();setMuted(isMuted);setUntil(isMuted?data.muted_until:null);}setLoading(false);})();return()=>{active=false;};},[groupId,userId]);
 const mute=async()=>{setSaving(true);const expiry=choice==='forever'?null:new Date(Date.now()+({'1h':3600000,'8h':28800000,'7d':604800000}[choice])).toISOString();const {error}=await supabase.from('reading_group_notification_mutes').upsert({user_id:userId,group_id:groupId,muted_until:expiry},{onConflict:'user_id,group_id'});setSaving(false);if(error){toast.error('Could not mute this group');return;}setMuted(true);setUntil(expiry);toast.success('Group muted');};
 const unmute=async()=>{setSaving(true);const {error}=await supabase.from('reading_group_notification_mutes').delete().eq('user_id',userId).eq('group_id',groupId);setSaving(false);if(error){toast.error('Could not unmute this group');return;}setMuted(false);setUntil(null);toast.success('Group unmuted');};
 if(loading)return <p className="text-xs text-muted-foreground">Loading mute settings…</p>;
 return <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3"><div className="flex flex-1 items-center gap-2 text-sm">{muted?<BellOff className="h-4 w-4"/>:<Bell className="h-4 w-4"/>}<span>{muted?until?'Muted until '+new Date(until).toLocaleString():'Muted indefinitely':'Mute this group'}</span></div>{muted?<Button size="sm" variant="outline" disabled={saving} onClick={()=>void unmute()}><Bell className="mr-1 h-4 w-4"/>Unmute</Button>:<><Select value={choice} onValueChange={v=>setChoice(v as MuteOption)}><SelectTrigger className="w-[140px]" aria-label="Mute duration"><SelectValue/></SelectTrigger><SelectContent>{Object.entries(durations).map(([v,l])=><SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select><Button size="sm" variant="outline" disabled={saving} onClick={()=>void mute()}><BellOff className="mr-1 h-4 w-4"/>Mute</Button></>}</div>;
}
