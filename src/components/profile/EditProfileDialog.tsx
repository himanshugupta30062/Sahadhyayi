
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client-universal";
import { useAuth } from "@/contexts/authHelpers";
import ProfileFormContent from "./ProfileFormContent";
import { UseFormReturn } from "react-hook-form";
import { ProfileFormValues } from "./types";

console.log('EditProfileDialog loading, React available:', !!React);

type EditProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<ProfileFormValues>;
  onSubmit: (values: ProfileFormValues) => Promise<void>;
  upsertProfilePending: boolean;
  defaultValues: ProfileFormValues;
};

const EditProfileDialog: React.FC<EditProfileDialogProps> = ({
  open,
  onOpenChange,
  form,
  onSubmit,
  upsertProfilePending,
  defaultValues,
}) => {
  console.log('EditProfileDialog rendering, React available:', !!React);
  
  const { user } = useAuth();

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username === defaultValues.username) return true;
    
    const { data, error } = await supabase
      .from('user_profile')
      .select('id')
      .eq('username', username)
      .neq('id', user?.id || '')
      .maybeSingle();
    
    if (error) {
      console.error('Error checking username:', error);
      return false;
    }
    
    return !data; // Available if no data found
  };

  const handleSubmit = async (values: ProfileFormValues) => {
    // Check username availability before submitting
    if (values.username && values.username !== defaultValues.username) {
      const isAvailable = await checkUsernameAvailability(values.username);
      if (!isAvailable) {
        form.setError('username', {
          type: 'manual',
          message: 'This username is already taken. Please choose another one.'
        });
        return;
      }
    }
    
    await onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] sm:max-h-[85vh] p-0 gap-0">
        <DialogHeader className="px-4 py-3 sm:px-6 sm:py-4 border-b">
          <DialogTitle className="text-lg">Edit Profile</DialogTitle>
          <DialogDescription className="text-sm">Update your details and click Save.</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-4 sm:px-6 max-h-[60vh]">
          <ProfileFormContent form={form} onSubmit={handleSubmit} />
        </ScrollArea>
        
        <DialogFooter className="px-4 py-3 sm:px-6 sm:py-4 border-t bg-gray-50/50 gap-2">
          <Button 
            type="submit" 
            disabled={upsertProfilePending}
            onClick={form.handleSubmit(handleSubmit)}
            className="flex-1 sm:flex-none bg-amber-600 hover:bg-amber-700 h-9"
          >
            {upsertProfilePending ? "Saving..." : "Save Changes"}
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="flex-1 sm:flex-none h-9">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
