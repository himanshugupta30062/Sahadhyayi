import React, { useRef, useState } from "react";
import { useUserProfile, useUpsertUserProfile, useDeleteUserProfile, uploadProfilePicture, UserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { Calendar } from "lucide-react";
import { useForm } from "react-hook-form";

interface ProfileFormValues {
  name: string;
  username: string;
  bio: string;
  dob: string | null;
  gender: string | null;
  location: string | null;
  life_tags: string[];
  social_links: Record<string, string>;
}
import { Pencil, Trash, MapPin, AtSign, Mail, Hash, User, Link2 } from "lucide-react";
import { format } from "date-fns";

// Options for gender
const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" }
];

// Predefined tags/life phases
const PHASES = [
  "School Life", "College Days", "Startup Journey", "Parenting", "Travelling", "Remote Work", "Self Discovery"
];

const SOCIAL_FIELDS = [
  { key: "instagram", label: "Instagram" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "twitter", label: "Twitter" },
  { key: "facebook", label: "Facebook" }
];

type EditMode = "view" | "edit" | "delete";

export const ProfileView: React.FC = () => {
  const { user, signOut } = useAuth();
  const { data: profile, isLoading } = useUserProfile();
  const upsertProfile = useUpsertUserProfile();
  const deleteProfile = useDeleteUserProfile();

  const [editMode, setEditMode] = useState<EditMode>("view");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultValues: ProfileFormValues = {
    name: profile?.name || "",
    username: profile?.username || "",
    bio: profile?.bio || "",
    dob: profile?.dob || "",
    gender: profile?.gender || "",
    location: profile?.location || "",
    life_tags: profile?.life_tags ?? [],
    social_links: profile?.social_links ?? {},
  };

  const form = useForm<ProfileFormValues>({ defaultValues });

  // Handle profile image upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files[0]) return;
    if (!user) return;
    try {
      const url = await uploadProfilePicture(files[0], user.id);
      await upsertProfile.mutateAsync({ profile_picture_url: url });
      toast({ title: "Profile Picture Updated", description: "Your photo was uploaded successfully." });
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      } else {
        toast({ title: "Upload failed", description: "An unexpected error occurred", variant: "destructive" });
      }
    }
  };

  const handleEdit = () => {
    setEditMode("edit");
    form.reset(defaultValues);
  };

  const handleDelete = () => setEditMode("delete");

  const handleConfirmDelete = async () => {
    await deleteProfile.mutateAsync();
    toast({ title: "Account marked for deletion", description: "Your account has been deleted.", variant: "destructive" });
    // Optionally, sign out user after delete
    setTimeout(signOut, 2000);
  };

  const handleCancelDelete = () => setEditMode("view");

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await upsertProfile.mutateAsync({
        ...values,
        dob: values.dob ? values.dob : null,
        gender: values.gender || null,
        location: values.location || null,
        life_tags: values.life_tags || [],
        social_links: values.social_links || {},
      });
      toast({ title: "Profile updated", description: "Your changes were saved." });
      setEditMode("view");
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast({ title: "Update failed", description: err.message, variant: "destructive" });
      } else {
        toast({ title: "Update failed", description: "An unexpected error occurred.", variant: "destructive" });
      }
    }
  };

  // Write frequency badge - display logic (placeholder: can auto-calc)
  const writingFrequency = profile?.writing_frequency || (
    profile?.stories_written_count && profile.stories_written_count > 20
      ? "Daily"
      : profile?.stories_written_count && profile.stories_written_count > 5
        ? "Weekly"
        : "Monthly"
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Skeleton className="h-80 w-full max-w-xl rounded-xl" />
      </div>
    );
  }

  // Soft-deleted
  if (profile && profile.deleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <User className="w-10 h-10 mb-2 text-gray-400" />
        <div>Your account has been deleted.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 py-4 px-1">
      <div className="max-w-2xl mx-auto animate-fade-in">
        <Card className="rounded-2xl shadow-lg p-6 bg-white/90">
          <div className="flex flex-col items-center gap-5">
            {/* Avatar */}
            <div className="relative group cursor-pointer">
              <Avatar className="h-24 w-24 ring-2 ring-amber-200 shadow">
                <AvatarImage src={profile?.profile_picture_url ?? ""} alt={profile?.name ?? "Profile"} />
                <AvatarFallback>{profile?.name?.[0] || "U"}</AvatarFallback>
              </Avatar>
              {/* Edit Button - triggers file input */}
              <Button
                type="button"
                size="sm"
                className="absolute bottom-0 right-0 bg-amber-600 text-white rounded-full p-0 w-9 h-9 flex items-center justify-center border shadow-lg hover:bg-amber-700 transition"
                onClick={() => fileInputRef.current?.click()}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            {/* Profile Fields */}
            <div className="w-full flex flex-col items-center text-center">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                {profile?.name || "Unnamed"}
                <span className="text-amber-500 font-mono text-base">{profile?.username && <>@{profile.username}</>}</span>
              </h2>
              <div className="flex justify-center items-center gap-2 mt-1 mb-2 text-gray-600 text-sm">
                <Mail className="w-4 h-4" />
                <span>{profile?.email || "No email"}</span>
              </div>
              <p className="text-gray-600 text-base mb-2">{profile?.bio}</p>
              <div className="flex flex-wrap gap-2 items-center justify-center">
                <Badge variant="secondary">{writingFrequency}</Badge>
                <Badge variant="outline">{profile?.gender ? GENDER_OPTIONS.find((g) => g.value === profile.gender)?.label : "Not set"}</Badge>
                {profile?.joined_at && (
                  <Badge variant="outline">
                    <Calendar className="w-4 h-4 mr-1 inline" />
                    Joined {format(new Date(profile.joined_at), "MMM y")}
                  </Badge>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 justify-between w-full text-center sm:text-left">
              <div>
                <span className="text-xs text-gray-600">Stories Written</span>
                <div className="font-bold text-lg text-green-700">{profile?.stories_written_count ?? 0}</div>
              </div>
              <div>
                <span className="text-xs text-gray-600">Stories Read</span>
                <div className="font-bold text-lg text-blue-700">{profile?.stories_read_count ?? 0}</div>
              </div>
              <div>
                <span className="text-xs text-gray-600">Location</span>
                <div className="font-medium text-base text-gray-800">{profile?.location ?? <span className="italic text-gray-400">Not set</span>}</div>
              </div>
            </div>
            {/* Tags/Life phases */}
            <div className="mt-4 w-full">
              <span className="text-xs text-gray-600">Tags / Life Phases</span>
              <div className="flex gap-2 flex-wrap mt-1">
                {profile?.life_tags?.length
                  ? profile.life_tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="hover:scale-105 duration-200">{tag}</Badge>
                    ))
                  : <span className="italic text-gray-400">None</span>
                }
              </div>
            </div>
            {/* Social Links */}
            <div className="mt-4 w-full">
              <span className="text-xs text-gray-600">Social Links</span>
              <div className="flex gap-2 flex-wrap mt-1">
                {SOCIAL_FIELDS.map(({ key, label }) =>
                  profile?.social_links?.[key] ? (
                    <a key={key} href={profile.social_links[key]} target="_blank" rel="noopener noreferrer" className="text-amber-700 underline flex items-center gap-1 text-xs">
                      <Link2 className="w-4 h-4" /> {label}
                    </a>
                  ) : null
                )}
                {!profile?.social_links || !Object.values(profile.social_links).filter(Boolean).length && (
                  <span className="italic text-gray-400">None</span>
                )}
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex gap-4 mt-6">
              <Button onClick={handleEdit} className="bg-amber-600 text-white hover:bg-amber-700" type="button">
                <Pencil className="w-4 h-4" /> Edit Profile
              </Button>
              <Button onClick={handleDelete} variant="destructive" type="button">
                <Trash className="w-4 h-4" /> Delete Account
              </Button>
            </div>
          </div>
        </Card>
        {/* Edit Profile Dialog */}
        <Dialog open={editMode === "edit"} onOpenChange={(open) => setEditMode(open ? "edit" : "view")}>
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
                {/* Social links */}
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
                  <Button type="submit" disabled={upsertProfile.isPending}>Save Changes</Button>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        {/* Delete Account Dialog */}
        <Dialog open={editMode === "delete"} onOpenChange={(open) => setEditMode(open ? "delete" : "view")}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete Account</DialogTitle>
              <DialogDescription>
                Are you sure you want to permanently delete your account? This action is irreversible.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleConfirmDelete} variant="destructive">Yes, Delete</Button>
              <Button onClick={handleCancelDelete} variant="outline">Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
