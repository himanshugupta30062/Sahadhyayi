
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import UserDropdownMenu from "./UserDropdownMenu";
import { useAuth } from "@/contexts/AuthContext";

const AuthSection = () => {
  const { user } = useAuth();

  return user ? (
    <UserDropdownMenu />
  ) : (
    <div className="flex items-center space-x-2">
      <Link to="/signin">
        <Button variant="ghost" className="text-gray-700">
          Sign In
        </Button>
      </Link>
      <Link to="/signup">
        <Button className="bg-amber-600 hover:bg-amber-700 text-white">
          Sign Up
        </Button>
      </Link>
    </div>
  );
};

export default AuthSection;
