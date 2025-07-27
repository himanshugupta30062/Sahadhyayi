
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
  User, Settings, LogOut, Bell, BookOpen, Users, Calendar, Library, Clock
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useSessionWarning } from "@/hooks/useSessionWarning";
import SessionTimeoutWarning from "@/components/SessionTimeoutWarning";

const UserDropdownMenu = () => {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const { showWarning, timeRemaining, extendSession } = useSessionWarning();

  const avatarFallback =
    profile?.full_name?.charAt(0) ||
    user?.email?.charAt(0) ||
    "U";

  const handleSignOut = async () => {
    try {
      console.log('[DROPDOWN] Starting sign out...');
      await signOut();
      console.log('[DROPDOWN] Sign out completed, navigating...');
    } catch (error) {
      console.error('[DROPDOWN] Sign out error:', error);
      // Force navigation even if there's an error
      navigate('/');
    }
  };

  // Get session info for display
  const getSessionInfo = () => {
    if (typeof window === 'undefined') return null;
    
    const sessionStart = localStorage.getItem('sessionStart');
    const lastActivity = localStorage.getItem('lastActivity');
    
    if (!sessionStart || !lastActivity) return null;
    
    const sessionAge = Date.now() - parseInt(sessionStart, 10);
    const timeSinceActivity = Date.now() - parseInt(lastActivity, 10);
    
    return {
      sessionAge: Math.floor(sessionAge / (1000 * 60)), // minutes
      timeSinceActivity: Math.floor(timeSinceActivity / (1000 * 60)) // minutes
    };
  };

  const sessionInfo = getSessionInfo();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full focus:ring-2 focus:ring-amber-500" aria-label="User Menu">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.profile_photo_url || ''} alt={profile?.full_name || user.email || ''} />
              <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-sm font-semibold">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 card-elegant shadow-elevated border-sahadhyayi-orange/20" align="end" forceMount>
          <div className="flex items-center gap-4 p-6 border-b border-sahadhyayi-orange/10 bg-gradient-warm">
            <Avatar className="h-14 w-14 ring-2 ring-sahadhyayi-orange/20">
              <AvatarImage src={profile?.profile_photo_url || ''} alt={profile?.full_name || user.email || ''} />
              <AvatarFallback className="bg-gradient-primary text-white text-xl font-bold">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <p className="font-bold text-lg text-sahadhyayi-warm truncate">{profile?.full_name || 'User'}</p>
              <p className="text-sm text-gray-600 truncate">{user.email}</p>
              {sessionInfo && (
                <div className="flex items-center gap-2 mt-2 px-2 py-1 bg-white/50 rounded-lg">
                  <Clock className="w-3 h-3 text-sahadhyayi-orange" />
                  <span className="text-xs text-sahadhyayi-warm font-medium">
                    Active: {sessionInfo.timeSinceActivity}m ago
                  </span>
                </div>
              )}
            </div>
            <Button variant="ghost" className="rounded-full p-3 hover:bg-white/20" aria-label="Notifications">
              <Bell className="w-5 h-5 text-sahadhyayi-orange" />
            </Button>
          </div>
          
          <div className="py-2">
            <DropdownMenuItem asChild>
              <Link to="/profile" className="flex items-center px-4 py-2 hover:bg-gray-50">
                <User className="mr-3 h-4 w-4 text-gray-500" />
                <span>View My Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings" className="flex items-center px-4 py-2 hover:bg-gray-50">
                <Settings className="mr-3 h-4 w-4 text-gray-500" />
                <span>Account Settings</span>
              </Link>
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator />
          
          {/* Additional Navigation Items */}
          <div className="py-2">
            <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Navigation
            </div>
            <DropdownMenuItem asChild>
              <Link to="/" className="flex items-center px-4 py-2 hover:bg-gray-50">
                <BookOpen className="mr-3 h-4 w-4 text-gray-500" />
                <span>Home</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/library" className="flex items-center px-4 py-2 hover:bg-gray-50">
                <Library className="mr-3 h-4 w-4 text-gray-500" />
                <span>Full Library</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/authors" className="flex items-center px-4 py-2 hover:bg-gray-50">
                <Calendar className="mr-3 h-4 w-4 text-gray-500" />
                <span>Authors</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/groups" className="flex items-center px-4 py-2 hover:bg-gray-50">
                <Users className="mr-3 h-4 w-4 text-gray-500" />
                <span>Reading Groups</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/about" className="flex items-center px-4 py-2 hover:bg-gray-50">
                <BookOpen className="mr-3 h-4 w-4 text-gray-500" />
                <span>About Us</span>
              </Link>
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator />
          
          <div className="py-2">
            <DropdownMenuItem
              onClick={handleSignOut}
              className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 cursor-pointer"
            >
              <LogOut className="mr-3 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <SessionTimeoutWarning
        isVisible={showWarning}
        timeRemaining={timeRemaining}
        onExtendSession={extendSession}
      />
    </>
  );
};

export default UserDropdownMenu;
