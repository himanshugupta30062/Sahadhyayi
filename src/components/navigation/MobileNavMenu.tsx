
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, User, Home, Compass, Users, BookOpen, Settings, LogOut, LogIn, UserPlus, PenTool } from "lucide-react";
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

  const avatarFallback =
    profile?.full_name?.charAt(0) ||
    user?.email?.charAt(0) ||
    "U";

  // Updated navigation structure with Authors tab
  const navItems = user ? [
    { name: "Home", path: "/dashboard", icon: Home },
    { name: "Library", path: "/library", icon: Compass },
    { name: "Authors", path: "/authors", icon: PenTool },
    { name: "Social Media", path: "/social", icon: Users },
    { name: "My Books", path: "/bookshelf", icon: BookOpen },
  ] : [
    { name: "Home", path: "/", icon: Home },
    { name: "Library", path: "/library", icon: Compass },
    { name: "Authors", path: "/authors", icon: PenTool },
    { name: "Social Media", path: "/social", icon: Users },
  ];

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    navigate('/');
  };

  const handleSignInClick = () => {
    navigate('/signin');
    setIsOpen(false);
  };

  const handleSignUpClick = () => {
    navigate('/signup');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="lg:hidden">
      <div className="fixed inset-x-0 top-16 z-40 max-h-[calc(100vh-4rem)] overflow-y-auto bg-white border-t border-gray-200 shadow-lg">
        <div className="px-2 pt-2 pb-3 space-y-1">

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
            <div className="flex flex-col space-y-2 px-3">
              <Button
                variant="ghost"
                onClick={handleSignInClick}
                className="w-full justify-center text-gray-700 hover:text-orange-700 hover:bg-orange-50 border-2 border-orange-500 py-2.5"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
              <Button
                onClick={handleSignUpClick}
                className="w-full justify-center bg-orange-600 hover:bg-orange-700 text-white py-2.5"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Sign Up
              </Button>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default MobileNavMenu;
