
import { useNavigate } from "react-router-dom";
import UserDropdownMenu from "./UserDropdownMenu";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";

const AuthSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignInClick = () => {
    navigate('/signin');
  };

  const handleSignUpClick = () => {
    navigate('/signup');
  };

  return user ? (
    <UserDropdownMenu />
  ) : (
    <div className="flex items-center space-x-2 flex-shrink-0">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignInClick}
        className="text-sahadhyayi-warm hover:text-sahadhyayi-orange hover:bg-sahadhyayi-orange-light font-medium border-2 border-sahadhyayi-orange transition-all duration-200 flex-shrink-0"
      >
        <LogIn className="w-4 h-4 mr-1" />
        <span className="hidden sm:inline">Sign In</span>
      </Button>
      <Button
        size="sm"
        onClick={handleSignUpClick}
        className="bg-sahadhyayi-orange hover:bg-sahadhyayi-orange/90 text-white font-medium shadow-warm transition-all duration-200 flex-shrink-0"
      >
        <UserPlus className="w-4 h-4 mr-1" />
        <span className="hidden sm:inline">Sign Up</span>
      </Button>
    </div>
  );
};

export default AuthSection;
