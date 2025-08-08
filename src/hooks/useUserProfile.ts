
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Types for user_profile
export interface UserProfile {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  profile_picture_url: string | null;
  bio: string | null;
  dob: string | null;
  gender: 'male' | 'female' | 'other' | null;
  location: string | null;
  writing_frequency: string | null;
  stories_written_count: number | null;
  stories_read_count: number | null;
  joined_at: string | null;
  life_tags: string[] | null;
  social_links: Record<string, string> | null;
  deleted: boolean | null;
  last_updated: string | null;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useQuery<UserProfile | null>({
    queryKey: ['user_profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      try {
        const { data, error } = await supabase
          .from('user_profile')
          .select('*')
          .eq('id', user.id)
          .eq('deleted', false)
          .maybeSingle();
          
        if (error) {
          console.error('Error fetching user profile:', error);
          throw error;
        }
        
        return data as UserProfile;
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
        throw error;
      }
    },
    enabled: !!user,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpsertUserProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!user) throw new Error('No authenticated user');
      
      try {
        // Ensure we don't send undefined values
        const cleanUpdates = Object.fromEntries(
          Object.entries(updates).filter(([_, value]) => value !== undefined)
        );
        
        const { data, error } = await supabase
          .from('user_profile')
          .upsert({ 
            ...cleanUpdates, 
            id: user.id,
            last_updated: new Date().toISOString()
          }, { onConflict: 'id' })
          .select()
          .single();
          
        if (error) {
          console.error('Error upserting user profile:', error);
          throw error;
        }
        
        return data as UserProfile;
      } catch (error) {
        console.error('Failed to save profile:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user_profile', user?.id], data);
      queryClient.invalidateQueries({ queryKey: ['user_profile'] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    },
    onError: (error) => {
      console.error('Profile update failed:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteUserProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('No authenticated user');
      
      try {
        const { error } = await supabase
          .from('user_profile')
          .update({ 
            deleted: true,
            last_updated: new Date().toISOString()
          })
          .eq('id', user.id);
          
        if (error) {
          console.error('Error deleting user profile:', error);
          throw error;
        }
      } catch (error) {
        console.error('Failed to delete profile:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_profile'] });
      toast({
        title: "Success",
        description: "Profile deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Profile deletion failed:', error);
      toast({
        title: "Error",
        description: "Failed to delete profile. Please try again.",
        variant: "destructive",
      });
    },
  });
};

// Profile picture upload helper (uses Supabase Storage)
export async function uploadProfilePicture(file: File, userId: string): Promise<string> {
  try {
    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      throw new Error('File size must be less than 5MB');
    }
    
    const bucket = 'avatars';
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${Date.now()}.${fileExt}`;
    
    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { 
        upsert: true,
        cacheControl: '3600'
      });
      
    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
      
    return publicUrl;
  } catch (error) {
    console.error('Failed to upload profile picture:', error);
    throw error;
  }
}
