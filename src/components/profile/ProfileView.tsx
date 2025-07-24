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
import { ProfileFormValues } from "./types";
import { Pencil, Trash, MapPin, AtSign, Mail, Hash, User, Link2 } from "lucide-react";
import { format } from "date-fns";
import ProfileAvatar from "./ProfileAvatar";
import ProfileInfo from "./ProfileInfo";
import ProfileTags from "./ProfileTags";
import ProfileSocialLinks from "./ProfileSocialLinks";
import UserBadges from "./UserBadges";
import EditProfileDialog from "./EditProfileDialog";
import DeleteProfileDialog from "./DeleteProfileDialog";
import { openPopupWindow } from "./openPopupWindow";

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
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: "Upload failed", description: message, variant: "destructive" });
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

  const handleOpenLifeStories = () => {
    openPopupWindow("https://jeevan-katha-anek-hai1.lovable.app/", "My Life Stories");
  };

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await upsertProfile.mutateAsync({
        ...values,
        dob: values.dob ? values.dob : null,
        gender: values.gender as "male" | "female" | "other" || null,
        location: values.location || null,
        life_tags: values.life_tags || [],
        social_links: values.social_links || {},
      });
      toast({ title: "Profile updated", description: "Your changes were saved." });
      setEditMode("view");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: "Update failed", description: message, variant: "destructive" });
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
            <ProfileAvatar
              name={profile?.name}
              profile_picture_url={profile?.profile_picture_url}
              onAvatarChange={handleAvatarChange}
            />
            {/* Profile Fields */}
            <ProfileInfo
              name={profile?.name}
              username={profile?.username}
              email={profile?.email}
              bio={profile?.bio}
              gender={profile?.gender}
              writingFrequency={writingFrequency}
              joined_at={profile?.joined_at}
            />
            {/* "My Life Stories" button */}
            <Button
              onClick={handleOpenLifeStories}
              className="bg-blue-700 text-white hover:bg-blue-800"
              type="button"
            >
              My Life Stories
            </Button>
            {/* Stats */}
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
            <ProfileTags life_tags={profile?.life_tags ?? []} />
            {/* Earned Badges */}
            <UserBadges />
            {/* Social Links */}
            <ProfileSocialLinks social_links={profile?.social_links} />
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
        <EditProfileDialog
          open={editMode === "edit"}
          onOpenChange={(open) => setEditMode(open ? "edit" : "view")}
          form={form}
          onSubmit={onSubmit}
          upsertProfilePending={upsertProfile.isPending}
          defaultValues={defaultValues}
        />
        {/* Delete Account Dialog */}
        <DeleteProfileDialog
          open={editMode === "delete"}
          onOpenChange={(open) => setEditMode(open ? "delete" : "view")}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      </div>
    </div>
  );
};
