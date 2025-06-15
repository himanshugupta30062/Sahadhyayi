
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogDescription>Update your details and click Save.</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            name="name"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Full Name" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            name="username"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Username" readOnly />
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
                <FormLabel>About Me</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Your bio..." className="h-24" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            name="dob"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            name="gender"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <FormControl>
                  <select {...field} className="border rounded w-full h-9 text-sm px-2">
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
                <FormLabel>Location / City</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter your city" />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            name="life_tags"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Life Phases / Tags</FormLabel>
                <div className="flex gap-2 flex-wrap">
                  {PHASES.map(phase => (
                    <label key={phase} className="flex items-center gap-1 text-xs cursor-pointer bg-amber-50 rounded px-2 py-1 border">
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
                        className="accent-amber-600"
                      />
                      {phase}
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
                <FormLabel>Social Links</FormLabel>
                <div className="flex flex-col gap-2">
                  {SOCIAL_FIELDS.map(({ key, label }) => (
                    <Input
                      key={key}
                      type="url"
                      placeholder={label + " URL"}
                      value={field.value?.[key] || ""}
                      onChange={e => {
                        const val = e.target.value;
                        field.onChange({ ...field.value, [key]: val });
                      }}
                      className="text-sm"
                    />
                  ))}
                </div>
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button type="submit" disabled={upsertProfilePending}>Save Changes</Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  </Dialog>
);

export default EditProfileDialog;
