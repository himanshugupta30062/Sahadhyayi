import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
export const useSetReadingGroupPostPin=()=>{const qc=useQueryClient();return useMutation({
 mutationFn:async(input:{postId:string;pin:boolean})=>{const {data,error}=await supabase.rpc('set_reading_group_post_pin',{p_post_id:input.postId,p_pin:input.pin});if(error)throw new Error(error.message||'Could not update announcement pin.');return data as string|null;},
 onSuccess:()=>qc.invalidateQueries({queryKey:['reading-group-posts']}),
});};
