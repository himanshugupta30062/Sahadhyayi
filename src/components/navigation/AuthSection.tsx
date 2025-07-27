
import { useNavigate, useLocation } from "react-router-dom";
import UserDropdownMenu from "./UserDropdownMenu";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";

const AuthSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignInClick = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('redirectScrollY', String(window.scrollY));
    }
    const redirect = `${location.pathname}${location.search}${location.hash}`;
    navigate(`/signin?redirect=${encodeURIComponent(redirect)}`, { state: { from: redirect } });
  };

  const handleSignUpClick = () => {
    navigate('/signup');
  };

  return user ? (
    <div className="flex items-center gap-2">
      <NotificationDropdown />
      <UserDropdownMenu />
    </div>
  ) : (
    <div className="flex items-center space-x-2 flex-shrink-0">
      <Button
        variant="outline" 
        size="sm"
        onClick={handleSignInClick}
        className="btn-secondary text-sm font-semibold flex-shrink-0 whitespace-nowrap"
      >
        <LogIn className="w-4 h-4 mr-2 flex-shrink-0" />
        <span className="hidden sm:inline">Sign In</span>
      </Button>
      <Button
        size="sm"
        onClick={handleSignUpClick}
        className="btn-primary text-sm font-semibold flex-shrink-0 whitespace-nowrap"
      >
        <UserPlus className="w-4 h-4 mr-2 flex-shrink-0" />
        <span className="hidden sm:inline">Sign Up</span>
      </Button>
    </div>
  );
};

export default AuthSection;
