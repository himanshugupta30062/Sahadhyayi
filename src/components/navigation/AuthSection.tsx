
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import UserDropdownMenu from "./UserDropdownMenu";
import { useAuth } from "@/contexts/AuthContext";

const AuthSection = () => {
  const { user } = useAuth();

  const handleSignInClick = () => {
    alert("Sign In clicked");
  };

  const handleSignUpClick = () => {
    alert("Sign Up clicked");
  };

  return user ? (
    <UserDropdownMenu />
  ) : (
    <div className="flex items-center space-x-3">
      <button
        onClick={handleSignInClick}
        className="px-6 py-2.5 bg-gradient-to-r from-pink-400 to-purple-500 text-white font-medium rounded-full transition-all duration-300 hover:from-pink-500 hover:to-purple-600 hover:shadow-lg hover:scale-105 transform"
      >
        Sign In
      </button>
      <button
        onClick={handleSignUpClick}
        className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-full transition-all duration-300 hover:from-purple-600 hover:to-pink-600 hover:shadow-lg hover:scale-105 transform"
      >
        Sign Up
      </button>
    </div>
  );
};

export default AuthSection;
