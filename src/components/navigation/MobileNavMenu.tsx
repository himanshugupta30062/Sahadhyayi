
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, User, Book, Upload, BookOpen, Settings, LogOut, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useState } from "react";

type Props = {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
};

const MobileNavMenu = ({ isOpen, setIsOpen }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();

  const avatarFallback =
    profile?.full_name?.charAt(0) ||
    user?.email?.charAt(0) ||
    "U";

  const navItems = [
    { name: "Home", path: "/", icon: BookOpen },
    ...(user
      ? [
          { name: "Dashboard", path: "/dashboard", icon: User },
          { name: "My Bookshelf", path: "/bookshelf", icon: User },
          { name: "Groups", path: "/groups", icon: User }
        ]
      : []),
    { name: "Authors", path: "/authors", icon: BookOpen },
    { name: "Feed", path: "/reviews", icon: BookOpen },
    { name: "Library", path: "/library", icon: BookOpen },
    { name: "About", path: "/about", icon: BookOpen }
  ];

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    navigate('/');
  };

  if (!isOpen) return null;

  return (
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
                onClick={handleSignOut}
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
  );
};

export default MobileNavMenu;
