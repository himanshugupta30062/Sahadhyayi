import { Link } from "react-router-dom";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { BookOpen, ChevronDown, FileText, LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AuthenticatedUserDropdownProps {
  user: SupabaseUser;
  userDisplayName: string;
  onSignOut: () => void | Promise<void>;
}

function getUserInitials(nameOrEmail?: string | null) {
  if (!nameOrEmail || typeof nameOrEmail !== "string") return "U";
  const trimmed = nameOrEmail.trim();
  if (!trimmed) return "U";
  const parts = trimmed.split(" ");
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return trimmed.charAt(0).toUpperCase();
}

export default function AuthenticatedUserDropdown({
  user,
  userDisplayName,
  onSignOut,
}: AuthenticatedUserDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center space-x-2 p-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={`User account menu for ${userDisplayName}`}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} alt={userDisplayName} />
            <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white font-medium text-xs">
              {getUserInitials(user.user_metadata?.full_name || user.email)}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2 border-b border-border mb-1">
          <p className="text-sm font-semibold text-foreground truncate">{userDisplayName}</p>
          {user.email && (
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          )}
        </div>
        <DropdownMenuItem asChild>
          <Link to="/profile" className="flex items-center cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/bookshelf" className="flex items-center cursor-pointer">
            <BookOpen className="mr-2 h-4 w-4" />
            My Bookshelf
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/articles/my" className="flex items-center cursor-pointer">
            <FileText className="mr-2 h-4 w-4" />
            My Articles
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onSignOut}
          className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
