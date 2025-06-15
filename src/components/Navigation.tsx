import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  BookOpen,
  Users,
  Calendar,
  User,
  LogIn,
  Rss,
  Library,
  LogOut,
  Settings,
  Bell,
  Book,
  Upload
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();

  const navItems = [
    { name: "Home", path: "/", icon: BookOpen },
    ...(user
      ? [
          { name: "Dashboard", path: "/dashboard", icon: User },
          { name: "My Bookshelf", path: "/bookshelf", icon: User },
          { name: "Groups", path: "/groups", icon: Users }
        ]
      : []),
    { name: "Authors", path: "/authors", icon: Calendar },
    { name: "Feed", path: "/reviews", icon: Rss },
    { name: "Library", path: "/library", icon: Library },
    { name: "About", path: "/about", icon: BookOpen }
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Display bell icon (notification) in avatar menu as an option
  // You may want to mount an unread badge here in the future.

  // Avatar fallback initial (first letter, or U)
  const avatarFallback =
    profile?.full_name?.charAt(0)
      || user?.email?.charAt(0)
      || 'U';

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-amber-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-3 font-bold text-2xl text-gray-800">
            <img 
              src="/lovable-uploads/fff3e49f-a95f-4fcf-ad47-da2dc6626f29.png" 
              alt="Sahadhyayi" 
              className="w-8 h-8 flex-shrink-0"
            />
            <span className="whitespace-nowrap">Sahadhyayi</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            <div className="flex space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? "text-amber-800 bg-amber-100"
                        : "text-gray-700 hover:text-amber-800 hover:bg-amber-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="whitespace-nowrap">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Auth Section */}
            {user ? (
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
                    {/* Bell Icon for Notifications */}
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
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/signin">
                  <Button variant="ghost" className="text-gray-700">
                    <LogIn className="w-4 h-4 mr-1" />
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700"
              aria-label="Open main menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white rounded-lg shadow-lg mt-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      location.pathname === item.path
                        ? "text-amber-800 bg-amber-100"
                        : "text-gray-700 hover:text-amber-800 hover:bg-amber-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              <div className="border-t pt-2 mt-2">
                {user ? (
                  <>
                    <div className="px-3 py-2 border-b mb-2 flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={profile?.profile_photo_url || ''} alt={profile?.full_name || user.email || ''} />
                        <AvatarFallback>{avatarFallback}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{profile?.full_name || 'User'}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      {/* Bell Icon (optional notifications) */}
                      <Button variant="ghost" className="ml-auto rounded-full p-2" aria-label="Notifications">
                        <Bell className="w-5 h-5 text-amber-700" />
                      </Button>
                    </div>
                    <Link to="/profile" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-gray-700 mb-1">
                        <User className="w-4 h-4 mr-2" />
                        View My Profile
                      </Button>
                    </Link>
                    <Link to="/stories" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-gray-700 mb-1">
                        <Book className="w-4 h-4 mr-2" />
                        My Life Stories
                      </Button>
                    </Link>
                    <Link to="/stories/upload" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-gray-700 mb-1">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload New Story
                      </Button>
                    </Link>
                    <Link to="/stories/drafts" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-gray-700 mb-1">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Saved Drafts
                      </Button>
                    </Link>
                    <Link to="/settings" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-gray-700 mb-1">
                        <Settings className="w-4 h-4 mr-2" />
                        Account Settings
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-red-600 mt-1"
                      onClick={() => { setIsOpen(false); handleSignOut(); }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/signin" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start text-gray-700 mb-2">
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/signup" onClick={() => setIsOpen(false)}>
                      <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
