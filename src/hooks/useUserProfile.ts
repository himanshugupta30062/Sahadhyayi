
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-universal';
import { useAuth } from '@/contexts/authHelpers';
import { useToast } from '@/hooks/use-toast';

// Types for profiles table
export interface UserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  email?: string | null;
  profile_photo_url: string | null;
  bio: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_sharing: boolean | null;
  writing_frequency: string | null;
  stories_written_count: number | null;
  stories_read_count: number | null;
  tags_used: any | null;
  created_at: string;
  updated_at: string | null;
  last_seen: string | null;
  // Extended fields not in base profiles table
  name?: string | null;
  dob?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  location?: string | null;
  joined_at?: string | null;
  life_tags?: string[] | null;
  social_links?: Record<string, string> | null;
  profile_picture_url?: string | null;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useQuery<UserProfile | null>({
    queryKey: ['user_profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      try {
        // Private fields are intentionally unavailable through direct table SELECT.
        const { data, error } = await (supabase as any).rpc('get_my_profile');
          
        if (error) {
          console.error('Error fetching user profile:', error);
          throw error;
        }
        
        if (!data) return null;

        const profileData = (data && typeof data === 'object' && !Array.isArray(data))
          ? data
          : null;
        if (!profileData || profileData.id !== user.id) return null;

        const normalized: UserProfile = {
          ...profileData,
          name: (data as any).name || data.full_name || '',
          full_name: data.full_name || (data as any).name || '',
          profile_picture_url: (data as any).profile_picture_url || data.profile_photo_url || null,
          profile_photo_url: data.profile_photo_url || (data as any).profile_picture_url || null,
          life_tags: (data as any).life_tags || (Array.isArray(data.tags_used) ? data.tags_used : []),
          tags_used: data.tags_used || (data as any).life_tags || null,
        };

        return normalized;
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
        const fullName = updates.full_name ?? updates.name;
        const photoUrl = updates.profile_photo_url ?? updates.profile_picture_url;
        const tags = updates.tags_used ?? updates.life_tags;

        // Ensure we don't send undefined values
        const cleanUpdates: Record<string, unknown> = Object.fromEntries(
          Object.entries(updates).filter(([_, value]) => value !== undefined)
        );

        if (fullName !== undefined) {
          cleanUpdates.full_name = fullName;
          cleanUpdates.name = fullName;
        }
        if (photoUrl !== undefined) {
          cleanUpdates.profile_photo_url = photoUrl;
        }
        if (tags !== undefined) {
          cleanUpdates.tags_used = tags;
        }
        
        let res = await supabase
          .from('profiles')
          .upsert({ 
            ...cleanUpdates, 
            id: user.id,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' })
          .select('id, full_name, username, profile_photo_url, bio, location, writing_frequency, stories_written_count, stories_read_count, tags_used, created_at, updated_at')
          .single();
          
        // Fallback to core profiles schema if database hasn't applied extended columns
        if (res.error && res.error.message?.includes('does not exist')) {
          const coreColumns: Record<string, unknown> = {
            id: user.id,
            full_name: fullName,
            username: cleanUpdates.username,
            bio: cleanUpdates.bio,
            profile_photo_url: photoUrl,
            writing_frequency: cleanUpdates.writing_frequency,
            location_sharing: cleanUpdates.location_sharing,
            location_lat: cleanUpdates.location_lat,
            location_lng: cleanUpdates.location_lng,
            tags_used: tags,
            updated_at: new Date().toISOString()
          };
          const coreFiltered = Object.fromEntries(
            Object.entries(coreColumns).filter(([_, v]) => v !== undefined)
          );
          res = await supabase
            .from('profiles')
            .upsert(coreFiltered, { onConflict: 'id' })
            .select('id, full_name, username, profile_photo_url, bio, location, writing_frequency, stories_written_count, stories_read_count, tags_used, created_at, updated_at')
            .single();
        }

        if (res.error) {
          console.error('Error upserting user profile:', res.error);
          throw res.error;
        }
        
        // Re-read the owner's private fields through the owner-only RPC.
        const { data: ownProfile, error: ownProfileError } = await (supabase as any).rpc('get_my_profile');
        if (ownProfileError) throw ownProfileError;
        const saved = ownProfile && typeof ownProfile === 'object' && !Array.isArray(ownProfile)
          ? ownProfile
          : res.data;
        return {
          ...saved,
          name: (saved as any).name || saved.full_name || '',
          full_name: saved.full_name || (saved as any).name || '',
          profile_picture_url: (saved as any).profile_picture_url || saved.profile_photo_url || null,
          profile_photo_url: saved.profile_photo_url || (saved as any).profile_picture_url || null,
          life_tags: (saved as any).life_tags || (Array.isArray(saved.tags_used) ? saved.tags_used : []),
        } as UserProfile;
      } catch (error) {
        console.error('Failed to save profile:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user_profile', user?.id], data);
      queryClient.invalidateQueries({ queryKey: ['user_profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
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

      // Deleting only public.profiles is unsafe: database recovery triggers can
      // recreate it while the Auth user still exists. Delete the authenticated
      // account through a server-side function using the service role instead.
      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: { confirmation: 'DELETE' },
      });

      if (error) {
        const context = (error as { context?: Response }).context;
        if (context) {
          try {
            const payload = await context.clone().json() as { error?: string };
            throw new Error(payload.error || error.message);
          } catch (parseError) {
            if (parseError instanceof Error && parseError.message !== error.message) {
              throw parseError;
            }
          }
        }
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Account deletion could not be confirmed.');
      }

      return data;
    },
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: "Account deleted",
        description: "Your account and associated data have been permanently deleted.",
      });
    },
    onError: (error) => {
      console.error('Account deletion failed:', error);
      toast({
        title: "Deletion failed",
        description: error instanceof Error ? error.message : "Could not delete your account. Please try again.",
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
