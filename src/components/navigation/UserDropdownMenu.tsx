
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  User, Book, BookOpen, Upload, Settings, LogOut, Bell
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";

const UserDropdownMenu = () => {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();

  const avatarFallback =
    profile?.full_name?.charAt(0) ||
    user?.email?.charAt(0) ||
    "U";

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full focus:ring-2 focus:ring-amber-500" aria-label="User Menu">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.profile_photo_url || ''} alt={profile?.full_name || user.email || ''} />
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <div className="flex items-center gap-2 p-2 border-b">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.profile_photo_url || ''} alt={profile?.full_name || user.email || ''} />
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col ml-1">
            <p className="font-medium">{profile?.full_name || 'User'}</p>
            <p className="w-[200px] truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
          <Button variant="ghost" className="ml-auto rounded-full p-2" aria-label="Notifications">
            <Bell className="w-5 h-5 text-amber-700" />
          </Button>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile" tabIndex={0}>
            <User className="mr-2 h-4 w-4" />
            View My Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/stories" tabIndex={0}>
            <Book className="mr-2 h-4 w-4" />
            My Life Stories
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/stories/upload" tabIndex={0}>
            <Upload className="mr-2 h-4 w-4" />
            Upload New Story
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/stories/drafts" tabIndex={0}>
            <BookOpen className="mr-2 h-4 w-4" />
            Saved Drafts
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings" tabIndex={0}>
            <Settings className="mr-2 h-4 w-4" />
            Account Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          tabIndex={0}
          className="text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdownMenu;
