
import React from "react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Pencil, Mail, UserCircle2, CalendarDays, FileText, Tag } from "lucide-react";
import { useStories } from "@/hooks/useStories";

function formatDate(iso: string | null | undefined) {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const TAG_COLORS = [
  "bg-amber-100 text-amber-800",
  "bg-orange-100 text-orange-800",
  "bg-green-100 text-green-800",
  "bg-blue-100 text-blue-800",
  "bg-purple-100 text-purple-800"
];

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { data: profile, isLoading, error } = useProfile();
  const { data: stories = [] } = useStories();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <Skeleton className="w-full max-w-xl h-96 rounded-xl" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-gray-700">
        <UserCircle2 size={64} className="mb-4 text-amber-600" />
        <p className="font-bold mb-2">Profile not found</p>
        <Button variant="ghost" onClick={() => location.reload()}>Retry</Button>
      </div>
    );
  }

  // Fallbacks and helper rendering
  const avatarUrl = profile.profile_photo_url || profile.avatar_url || "";
  const initial = (profile.full_name?.[0] || user?.email?.[0] || "U").toUpperCase();
  const showUsername = profile.username ? "@" + profile.username : <span className="italic text-gray-400">Add Info</span>;
  const showBio = profile.bio ? profile.bio : <span className="italic text-gray-400">Add Info</span>;
  const writingFrequency = profile.writing_frequency || <span className="italic text-gray-400">Add Info</span>;
  const joinedDate = formatDate(profile.created_at);
  const storiesWritten = typeof profile.stories_written_count === "number"
    ? profile.stories_written_count
    : stories.length ?? 0;
  const storiesRead = typeof profile.stories_read_count === "number"
    ? profile.stories_read_count
    : 0;

  const tagsUsed: string[] = Array.isArray(profile.tags_used) ? profile.tags_used
    : (Array.isArray(profile.tags_used?.tags) ? profile.tags_used.tags : []);
  const tagsToShow = tagsUsed.length > 0
    ? tagsUsed.slice(0, 5)
    : [];

  // Activity grid: show up to 3 most recent stories written with titles, or show placeholder
  const latestStories = stories?.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 py-8 px-2">
      <div className="max-w-2xl mx-auto">
        <Card className="rounded-2xl shadow-lg px-6 py-8 bg-white/90">
          <div className="flex flex-col items-center gap-5">
            <Avatar className="h-20 w-20 ring-4 ring-amber-200 shadow">
              {avatarUrl
                ? <AvatarImage src={avatarUrl} alt={profile.full_name || "User profile"} onError={e => (e.currentTarget.src = "")} />
                : <AvatarFallback>{initial}</AvatarFallback>
              }
            </Avatar>
            <div className="text-center w-full">
              <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{profile.full_name || "Unnamed User"}</h2>
                  <div className="flex flex-row items-center justify-center gap-2 mt-1">
                    <span className="text-amber-700 font-medium">{showUsername}</span>
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {writingFrequency}
                    </Badge>
                  </div>
                </div>
                <Button
                  className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-2"
                  onClick={() => navigate("/profile/edit")}
                  variant="default"
                  tabIndex={0}
                >
                  <Pencil className="w-4 h-4" />
                  Edit Profile
                </Button>
              </div>
              <div className="flex justify-center items-center gap-2 mt-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span className="truncate">{user?.email || <span className="italic text-gray-400">No email</span>}</span>
              </div>
            </div>

            <div className="w-full border-t border-gray-200 pt-4 flex flex-col md:flex-row gap-6 justify-between">
              <div className="flex-1">
                <span className="block text-xs text-gray-500">About Me</span>
                <p className="text-gray-800 text-sm mt-1">{showBio}</p>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-amber-700" />
                  <span className="text-xs text-gray-700">Joined:</span>
                  <span className="font-medium text-xs text-gray-700">{joinedDate}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <FileText className="w-4 h-4 text-green-700" />
                  <span className="text-xs">Stories Written:</span>
                  <span className="font-bold text-xs">{storiesWritten}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <FileText className="w-4 h-4 text-blue-700" />
                  <span className="text-xs">Stories Read:</span>
                  <span className="font-bold text-xs">{storiesRead}</span>
                </div>
              </div>
            </div>

            <div className="w-full mt-4">
              <div className="flex gap-2 flex-wrap items-center mb-2">
                <Tag className="w-4 h-4 text-amber-600" />
                <span className="text-xs text-gray-700 font-semibold">Tags Most Used</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {tagsToShow.length > 0 ? tagsToShow.map((tag, idx) => (
                  <span key={tag} className={`px-3 py-1 rounded-full text-xs font-medium ${TAG_COLORS[idx % TAG_COLORS.length]} shadow`}>{tag}</span>
                )) : (
                  <span className="italic text-gray-400 text-xs">No tags yet</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Latest Activity
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {latestStories && latestStories.length > 0 ? latestStories.map((story: any) => (
              <Card key={story.id} className="rounded-lg shadow hover:shadow-lg transition">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span className="font-semibold text-gray-800">{story.title}</span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{story.description || "No description."}</p>
                  <div className="flex justify-end mt-2">
                    <Badge variant="outline" className="text-xs">{formatDate(story.created_at)}</Badge>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-2 text-center text-gray-400 italic bg-white/70 rounded p-6">
                No recent activity. Tell your story!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
