
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" }
];
const PHASES = [
  "School Life", "College Days", "Startup Journey", "Parenting", "Travelling", "Remote Work", "Self Discovery"
];
const SOCIAL_FIELDS = [
  { key: "instagram", label: "Instagram" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "twitter", label: "Twitter" },
  { key: "facebook", label: "Facebook" }
];

type EditProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: any;
  onSubmit: (values: any) => Promise<void>;
  upsertProfilePending: boolean;
  defaultValues: any;
};

const EditProfileDialog: React.FC<EditProfileDialogProps> = ({
  open,
  onOpenChange,
  form,
  onSubmit,
  upsertProfilePending,
  defaultValues,
}) => {
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

  const handleSubmit = async (values: any) => {
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
          <Form {...form}>
            <form className="space-y-4 py-4" onSubmit={form.handleSubmit(handleSubmit)}>
              <FormField
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full Name" {...field} className="h-9" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                name="username"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Username</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Username" className="h-9" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="bio"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">About Me</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Your bio..." className="h-20 resize-none" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                name="dob"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} className="h-9" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                name="gender"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Gender</FormLabel>
                    <FormControl>
                      <select {...field} className="border rounded w-full h-9 text-sm px-3 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500">
                        <option value="">Select gender</option>
                        {GENDER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                name="location"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Location / City</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter your city" className="h-9" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                name="life_tags"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Life Phases / Tags</FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {PHASES.map(phase => (
                        <label key={phase} className="flex items-center gap-2 text-xs cursor-pointer bg-amber-50 rounded px-3 py-2 border hover:bg-amber-100 transition-colors">
                          <input
                            type="checkbox"
                            checked={field.value?.includes(phase) || false}
                            onChange={e => {
                              const checked = e.target.checked;
                              field.onChange(
                                checked
                                  ? [...(field.value || []), phase]
                                  : (field.value || []).filter((v: string) => v !== phase)
                              );
                            }}
                            className="accent-amber-600 w-3 h-3"
                          />
                          <span className="flex-1">{phase}</span>
                        </label>
                      ))}
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                name="social_links"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Social Links</FormLabel>
                    <div className="space-y-2">
                      {SOCIAL_FIELDS.map(({ key, label }) => (
                        <Input
                          key={key}
                          type="url"
                          placeholder={`${label} URL`}
                          value={field.value?.[key] || ""}
                          onChange={e => {
                            const val = e.target.value;
                            field.onChange({ ...field.value, [key]: val });
                          }}
                          className="h-9 text-sm"
                        />
                      ))}
                    </div>
                  </FormItem>
                )}
              />
            </form>
          </Form>
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
