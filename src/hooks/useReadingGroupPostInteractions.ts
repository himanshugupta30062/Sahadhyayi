import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/authHelpers';
import { supabase } from '@/integrations/supabase/client-universal';
export type GroupPostReaction = 'loved'|'insightful'|'cozy'|'thought_provoking'|'unputdownable';
export interface GroupPostComment { id:string; post_id:string; author_id:string; author_name:string; body:string; created_at:string }
const commentsKey=(postId:string,userId:string|null)=>['reading-group-post-comments',postId,userId] as const;
export const useReadingGroupPostComments=(postId:string,enabled=false)=>{
 const {user}=useAuth();return useQuery({queryKey:commentsKey(postId,user?.id??null),queryFn:async()=>{
  const {data,error}=await supabase.rpc('list_reading_group_post_comments',{p_post_id:postId,p_limit:80});
  if(error)throw new Error(error.message||'Could not load replies.');return (data??[]) as GroupPostComment[];
 },enabled:Boolean(postId&&user?.id&&enabled),staleTime:15000});
};
export const useCreateReadingGroupPostComment=()=>{
 const {user}=useAuth();const qc=useQueryClient();return useMutation({mutationFn:async(input:{postId:string;body:string})=>{
  const {data,error}=await supabase.rpc('create_reading_group_post_comment',{p_post_id:input.postId,p_body:input.body.trim()});
  if(error)throw new Error(error.message||'Could not add reply.');return data as string;
 },onSuccess:(_,input)=>qc.invalidateQueries({queryKey:commentsKey(input.postId,user?.id??null)})});
};
export const useToggleReadingGroupPostReaction=()=>{
 const qc=useQueryClient();return useMutation({mutationFn:async(input:{postId:string;reaction:GroupPostReaction})=>{
  const {data,error}=await supabase.rpc('toggle_reading_group_post_reaction',{p_post_id:input.postId,p_reaction:input.reaction});
  if(error)throw new Error(error.message||'Could not react to post.');return data;
 },onSuccess:()=>qc.invalidateQueries({queryKey:['reading-group-posts']})});
};
