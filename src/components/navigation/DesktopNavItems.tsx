
import { Link, useLocation } from "react-router-dom";
import { BookOpen, Users, Calendar, User, Share2, Library } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const DesktopNavItems = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const navItems = [
    { name: "Home", path: "/", icon: BookOpen },
    { name: "Library", path: "/library", icon: Library },
    { name: "Authors", path: "/authors", icon: Calendar },
    { name: "Social Media", path: "/reviews", icon: Share2 },
    { name: "About Us", path: "/about", icon: BookOpen },
    ...(user
      ? [
          { name: "Dashboard", path: "/dashboard", icon: User },
          { name: "My Bookshelf", path: "/bookshelf", icon: User },
          { name: "Groups", path: "/groups", icon: Users },
          { name: "My Quotes", path: "/quotes", icon: BookOpen }
        ]
      : [])
  ];

  return (
    <div className="flex space-x-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            to={item.path}
            className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              location.pathname === item.path
                ? "text-orange-800 bg-orange-100"
                : "text-gray-700 hover:text-orange-800 hover:bg-orange-50"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="whitespace-nowrap">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
};

export default DesktopNavItems;
