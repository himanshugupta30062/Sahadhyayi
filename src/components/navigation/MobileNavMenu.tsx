import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, User, Book, Upload, BookOpen, Settings, LogOut, LogIn, Share2, Library, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

type Props = {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
};

const MobileNavMenu = ({ isOpen, setIsOpen }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const [searchQuery, setSearchQuery] = useState("");

  const avatarFallback =
    profile?.full_name?.charAt(0) ||
    user?.email?.charAt(0) ||
    "U";

  const navItems = [
    { name: "Home", path: "/", icon: BookOpen },
    { name: "Library", path: "/library", icon: Library },
    { name: "Authors", path: "/authors", icon: BookOpen },
    { name: "Social Media", path: "/reviews", icon: Share2 },
    { name: "About Us", path: "/about", icon: BookOpen },
    ...(user
      ? [
          { name: "Dashboard", path: "/dashboard", icon: User },
          { name: "My Bookshelf", path: "/bookshelf", icon: User },
          { name: "Groups", path: "/groups", icon: User },
          { name: "My Quotes", path: "/quotes", icon: BookOpen }
        ]
      : [])
  ];

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    navigate('/');
  };

  const handleSignInClick = () => {
    alert("Sign In clicked");
    setIsOpen(false);
  };

  const handleSignUpClick = () => {
    alert("Sign Up clicked");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="lg:hidden">
      <div className="px-2 pt-2 pb-3 space-y-1 bg-white rounded-lg shadow-lg mt-2 mx-2 sm:mx-0">
        {/* Mobile Search */}
        <div className="px-3 pb-3 mb-2 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-full bg-gray-50 text-gray-900 placeholder-gray-500 focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
            />
          </div>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center space-x-2 px-3 py-3 rounded-md text-sm sm:text-base font-medium transition-colors ${
                location.pathname === item.path
                  ? "text-orange-800 bg-orange-100"
                  : "text-gray-700 hover:text-orange-800 hover:bg-orange-50"
              }`}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
        
        <div className="border-t pt-2 mt-2">
          {user ? (
            <>
              
              <div className="px-3 py-3 border-b mb-2 flex items-center">
                <Avatar className="h-8 w-8 mr-3 flex-shrink-0">
                  <AvatarImage src={profile?.profile_photo_url || ''} alt={profile?.full_name || user.email || ''} />
                  <AvatarFallback>{avatarFallback}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{profile?.full_name || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <Button variant="ghost" className="ml-2 rounded-full p-2 flex-shrink-0" aria-label="Notifications">
                  <Bell className="w-4 h-4 text-orange-700" />
                </Button>
              </div>
              <Link to="/profile" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-gray-700 mb-1 text-sm py-3">
                  <User className="w-4 h-4 mr-2" />
                  View My Profile
                </Button>
              </Link>
              <Link to="/stories" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-gray-700 mb-1 text-sm py-3">
                  <Book className="w-4 h-4 mr-2" />
                  My Life Stories
                </Button>
              </Link>
              <Link to="/stories/upload" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-gray-700 mb-1 text-sm py-3">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload New Story
                </Button>
              </Link>
              <Link to="/stories/drafts" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-gray-700 mb-1 text-sm py-3">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Saved Drafts
                </Button>
              </Link>
              <Link to="/settings" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-gray-700 mb-1 text-sm py-3">
                  <Settings className="w-4 h-4 mr-2" />
                  Account Settings
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 mt-1 text-sm py-3"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <button
                onClick={handleSignInClick}
                className="w-full mb-2 px-6 py-3 bg-gradient-to-r from-pink-400 to-purple-500 text-white font-medium rounded-full transition-all duration-300 hover:from-pink-500 hover:to-purple-600 hover:shadow-lg"
              >
                Sign In
              </button>
              <button
                onClick={handleSignUpClick}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-full transition-all duration-300 hover:from-purple-600 hover:to-pink-600 hover:shadow-lg"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileNavMenu;
