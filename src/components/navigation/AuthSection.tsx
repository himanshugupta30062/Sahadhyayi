
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
    <div className="flex items-center space-x-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignInClick}
        className="text-gray-700 hover:text-orange-700 hover:bg-orange-50 font-medium"
      >
        <LogIn className="w-4 h-4 mr-1" />
        Sign In
      </Button>
      <Button
        size="sm"
        onClick={handleSignUpClick}
        className="bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-sm"
      >
        <UserPlus className="w-4 h-4 mr-1" />
        Sign Up
      </Button>
    </div>
  );
};

export default AuthSection;
