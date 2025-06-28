
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import UserDropdownMenu from "./UserDropdownMenu";
import { useAuth } from "@/contexts/AuthContext";

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
    <div className="flex items-center space-x-3">
      <button
        onClick={handleSignInClick}
        className="px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-700 hover:shadow-md hover:scale-105 transform"
      >
        Sign In
      </button>
      <button
        onClick={handleSignUpClick}
        className="px-5 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg transition-all duration-300 hover:from-green-600 hover:to-green-700 hover:shadow-md hover:scale-105 transform"
      >
        Sign Up
      </button>
    </div>
  );
};

export default AuthSection;
