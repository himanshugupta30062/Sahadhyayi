
import { useNavigate } from "react-router-dom";
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
        className="px-4 py-2 bg-white text-gray-800 font-medium rounded-lg border border-gray-300 transition-all duration-300 hover:bg-gray-50 hover:shadow-md hover:scale-105 transform"
      >
        Sign In
      </button>
      <button
        onClick={handleSignUpClick}
        className="px-4 py-2 bg-white text-gray-800 font-medium rounded-lg border border-gray-300 transition-all duration-300 hover:bg-gray-50 hover:shadow-md hover:scale-105 transform"
      >
        Sign Up
      </button>
    </div>
  );
};

export default AuthSection;
