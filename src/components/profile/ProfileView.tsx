import React, { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUserProfile, useUpsertUserProfile, useDeleteUserProfile, uploadProfilePicture } from "@/hooks/useUserProfile";
import { useUserBookshelf } from "@/hooks/useUserBookshelf";
import { useAuth } from "@/contexts/authHelpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { ProfileFormValues } from "./types";
import { 
  Pencil, 
  Trash, 
  BookOpen, 
  Share2, 
  ArrowRight, 
  Dna, 
  Star,
  Quote, 
  Radio, 
  Sparkles, 
  Library, 
  CheckCircle,
  FileText
} from "lucide-react";
import ProfileAvatar from "./ProfileAvatar";
import ProfileInfo from "./ProfileInfo";
import ProfileTags from "./ProfileTags";
import ProfileSocialLinks from "./ProfileSocialLinks";
import UserBadges from "./UserBadges";
import EditProfileDialog from "./EditProfileDialog";
import DeleteProfileDialog from "./DeleteProfileDialog";
import { useReadingDna } from "@/hooks/useReadingDna";
import { ReadingDnaCard } from "@/components/social/dna/ReadingDnaCard";

type EditMode = "view" | "edit" | "delete";

export const ProfileView: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile, isLoading } = useUserProfile();
  const { data: myDna } = useReadingDna(user?.id);
  const { data: bookshelf = [] } = useUserBookshelf();
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
    try {
      await deleteProfile.mutateAsync();
      await signOut();
      navigate("/", { replace: true });
    } catch {
      // The mutation displays the failure toast; keep the dialog open so the user can retry.
    }
  };

  const handleCancelDelete = () => setEditMode("view");

  const handleCopyProfileLink = () => {
    const profileUrl = `${window.location.origin}/profile`;
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(profileUrl).catch(() => {
        toast({ title: 'Copy failed', description: 'Could not access clipboard.', variant: 'destructive' });
      });
      toast({
        title: "Profile Link Copied",
        description: "Your profile URL is copied to your clipboard.",
      });
    }
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

  const writingFrequency = profile?.writing_frequency || (
    profile?.stories_written_count && profile.stories_written_count > 20
      ? "Daily"
      : profile?.stories_written_count && profile.stories_written_count > 5
        ? "Weekly"
        : "Monthly"
  );

  const completedBooks = bookshelf.filter(b => b.status === 'completed');
  const showcaseBooks = completedBooks.length > 0 ? completedBooks.slice(0, 3) : bookshelf.slice(0, 3);
  const favoriteBooks = bookshelf.filter((book) => book.is_favorite === true).slice(0, 6);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Skeleton className="h-80 w-full max-w-xl rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-4 px-1">
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        {/* Main Profile Card */}
        <Card className="rounded-2xl shadow-sm p-6 bg-card border border-border">
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
              email={user?.email}
              bio={profile?.bio}
              gender={profile?.gender}
              writingFrequency={writingFrequency}
              joined_at={profile?.joined_at}
            />

            {/* Stories / Publications Native Bridge */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link to="/articles/my">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border hover:border-[hsl(var(--brand-primary))] text-foreground"
                >
                  <FileText className="w-4 h-4 mr-1.5 text-[hsl(var(--brand-primary))]" />
                  My Articles
                </Button>
              </Link>
              <Link to="/my-publications">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border hover:border-[hsl(var(--brand-secondary))] text-foreground"
                >
                  <BookOpen className="w-4 h-4 mr-1.5 text-[hsl(var(--brand-secondary))]" />
                  My Publications
                </Button>
              </Link>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopyProfileLink}
                className="text-muted-foreground hover:text-foreground"
              >
                <Share2 className="w-4 h-4 mr-1.5" />
                Share Profile
              </Button>
            </div>

            {/* Reader Stats Overview */}
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full text-center border-t border-border pt-4">
              <div className="p-2 rounded-xl bg-muted/40">
                <span className="text-xs text-muted-foreground">Stories Written</span>
                <div className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                  {profile?.stories_written_count ?? 0}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-muted/40">
                <span className="text-xs text-muted-foreground">Shelf Books</span>
                <div className="font-bold text-lg text-[hsl(var(--brand-primary))]">
                  {bookshelf.length}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-muted/40">
                <span className="text-xs text-muted-foreground">Favorite Books</span>
                <div className="font-bold text-lg text-amber-500">
                  {bookshelf.filter((book) => book.is_favorite === true).length}
                </div>
              </div>
              <div className="p-2 rounded-xl bg-muted/40">
                <span className="text-xs text-muted-foreground">Location</span>
                <div className="font-medium text-sm text-foreground truncate">
                  {profile?.location ?? <span className="italic text-muted-foreground">Not set</span>}
                </div>
              </div>
            </div>

            {/* Tags / Life phases */}
            <ProfileTags life_tags={profile?.life_tags ?? []} />

            {/* Earned Badges */}
            <UserBadges />

            {/* Social Links */}
            <ProfileSocialLinks social_links={profile?.social_links} />

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4 w-full sm:w-auto">
              <Button 
                onClick={handleEdit} 
                className="flex-1 sm:flex-initial bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)] text-white" 
                type="button"
              >
                <Pencil className="w-4 h-4 mr-1.5" /> Edit Profile
              </Button>
              <Button 
                onClick={handleDelete} 
                variant="outline" 
                className="text-destructive hover:bg-destructive/10 border-destructive/30" 
                type="button"
              >
                <Trash className="w-4 h-4 mr-1.5" /> Delete Account
              </Button>
            </div>
          </div>
        </Card>

        {/* Favorite Books */}
        <Card className="rounded-2xl border-border bg-card p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-semibold text-foreground">Favorite Books</h3>
                <span className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-xs font-semibold">
                  {bookshelf.filter((book) => book.is_favorite === true).length}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                The books that stay with you, collected in one place.
              </p>
            </div>
            <Link to="/bookshelf">
              <Button variant="outline" size="sm" className="w-full sm:w-auto border-border">
                <Library className="mr-1.5 h-4 w-4" />
                Manage favorites
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {favoriteBooks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {favoriteBooks.map((item) => (
                <Link
                  key={item.id}
                  to={`/book/${item.book_id}`}
                  className="group min-w-0 text-center"
                >
                  <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-muted shadow-sm transition-all group-hover:-translate-y-1 group-hover:shadow-md">
                    {item.books_library?.cover_image_url ? (
                      <img
                        src={item.books_library.cover_image_url}
                        alt={item.books_library.title || "Book cover"}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[hsl(var(--brand-primary)/0.12)] to-[hsl(var(--brand-secondary)/0.2)]">
                        <BookOpen className="h-8 w-8 text-[hsl(var(--brand-primary))]" />
                      </div>
                    )}
                    <div className="absolute right-2 top-2 rounded-full bg-black/65 p-1.5 text-amber-300">
                      <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-medium text-foreground transition-colors group-hover:text-[hsl(var(--brand-primary))]">
                    {item.books_library?.title || "Untitled"}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {item.books_library?.author || "Author unknown"}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-8 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Star className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-foreground">Your favorites start here</h4>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Open your bookshelf and tap the star on any saved book. Your favorites will appear here on your profile.
              </p>
              <Link to="/bookshelf" className="mt-4 inline-flex">
                <Button size="sm" className="bg-[hsl(var(--brand-primary))] text-white hover:bg-[hsl(var(--brand-primary)/0.9)]">
                  Choose favorite books
                </Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Showcase Shelf */}
        {showcaseBooks.length > 0 && (
          <Card className="rounded-2xl border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Library className="w-4 h-4 text-[hsl(var(--brand-primary))]" />
                <h3 className="text-sm font-semibold text-foreground">Reader Bookshelf Showcase</h3>
              </div>
              <Link to="/bookshelf" className="text-xs text-[hsl(var(--brand-primary))] hover:underline flex items-center">
                View Shelf ({bookshelf.length}) <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {showcaseBooks.map((item) => (
                <Link
                  key={item.id}
                  to={`/book/${item.book_id}`}
                  className="group block text-center"
                >
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted shadow-xs group-hover:shadow-md transition-all mb-1.5 relative">
                    {item.books_library?.cover_image_url ? (
                      <img
                        src={item.books_library.cover_image_url}
                        alt={item.books_library.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <BookOpen className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    {item.status === 'completed' && (
                      <div className="absolute top-1.5 right-1.5 bg-emerald-600/90 text-white p-0.5 rounded-full shadow-xs">
                        <CheckCircle className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-foreground truncate group-hover:text-[hsl(var(--brand-primary))] transition-colors">
                    {item.books_library?.title || 'Untitled'}
                  </p>
                  <p className="text-[10px] text-muted-foreground capitalize">
                    {item.status.replace('_', ' ')}
                  </p>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {/* Reading DNA & Literary Identity Showcase */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Dna className="w-5 h-5 text-[hsl(var(--brand-primary))]" />
              Literary & Social Identity
            </h3>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-[hsl(var(--brand-primary))] gap-1"
              onClick={() => navigate('/social?tab=dna')}
            >
              Explore DNA Matches <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          {myDna ? (
            <ReadingDnaCard dna={myDna} mine />
          ) : (
            <Card className="rounded-2xl border-border bg-card p-5 text-center">
              <Sparkles className="w-8 h-8 text-[hsl(var(--brand-primary))] mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-foreground mb-1">Generate Your Reading DNA</h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mb-4">
                Calculate your literary fingerprint, discover your reading archetype, and find fellow readers with high taste compatibility.
              </p>
              <Button
                size="sm"
                className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)] text-white"
                onClick={() => navigate('/social?tab=dna')}
              >
                <Dna className="w-3.5 h-3.5 mr-1.5" />
                Build My Reading DNA
              </Button>
            </Card>
          )}

          {/* Social Quick Shortcuts */}
          <div className="grid grid-cols-2 gap-3">
            <Card
              onClick={() => navigate('/social?tab=margins')}
              className="rounded-xl border-border bg-card hover:bg-muted/40 p-3.5 cursor-pointer transition-all hover:shadow-xs group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Quote className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground group-hover:text-amber-600 transition-colors">
                    Margin Notes
                  </p>
                  <p className="text-[11px] text-muted-foreground">Your book annotations & quotes</p>
                </div>
              </div>
            </Card>

            <Card
              onClick={() => navigate('/social?tab=rooms')}
              className="rounded-xl border-border bg-card hover:bg-muted/40 p-3.5 cursor-pointer transition-all hover:shadow-xs group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground group-hover:text-emerald-600 transition-colors">
                    Reading Rooms
                  </p>
                  <p className="text-[11px] text-muted-foreground">Join or host co-reading rooms</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

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
          isPending={deleteProfile.isPending}
        />
      </div>
    </div>
  );
};
