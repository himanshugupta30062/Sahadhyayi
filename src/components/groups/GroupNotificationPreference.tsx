import { useQuery,useMutation,useQueryClient } from '@tanstack/react-query';
import { BellOff,Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card,CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';

export default function GroupNotificationPreference({groupId}:{groupId:string}){
 const {user}=useAuth();const qc=useQueryClient();const key=['group-notification-preference',user?.id,groupId];
 const {data:muted=false,isLoading}=useQuery({queryKey:key,enabled:!!user?.id&&!!groupId,queryFn:async()=>{
  const {data,error}=await supabase.from('reading_group_notification_preferences').select('muted').eq('user_id',user!.id).eq('group_id',groupId).maybeSingle();
  if(error)throw error;return Boolean(data?.muted);
 }});
 const save=useMutation({mutationFn:async(next:boolean)=>{
  const {error}=await supabase.from('reading_group_notification_preferences').upsert({user_id:user!.id,group_id:groupId,muted:next,updated_at:new Date().toISOString()},{onConflict:'user_id,group_id'});
  if(error)throw error;
 },onSuccess:(_,next)=>{void qc.invalidateQueries({queryKey:key});toast.success(next?'Group notifications muted':'Group notifications enabled');},onError:()=>toast.error('Could not update notification preference')});
 if(!user)return null;
 return <Card><CardContent className="flex items-center justify-between gap-3 p-4"><div className="min-w-0"><p className="font-medium text-sm">Group notifications</p><p className="text-xs text-muted-foreground">{muted?'Muted for this group':'Posts, replies, events and RSVPs'}</p></div><Button variant="outline" size="sm" disabled={isLoading||save.isPending} onClick={()=>save.mutate(!muted)}>{muted?<Bell className="mr-2 h-4 w-4"/>:<BellOff className="mr-2 h-4 w-4"/>}{muted?'Unmute':'Mute'}</Button></CardContent></Card>;
}
