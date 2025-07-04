
import { Link, useLocation } from "react-router-dom";
import { BookOpen, Users, Calendar, User, Share2, Library } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const DesktopNavItems = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  // For authenticated users, show only essential navigation
  const navItems = user ? [
    { name: "My Library", path: "/dashboard", icon: Library },
    { name: "Social", path: "/reviews", icon: Share2 },
  ] : [
    { name: "Home", path: "/", icon: BookOpen },
    { name: "Library", path: "/library", icon: Library },
    { name: "Authors", path: "/authors", icon: Calendar },
    { name: "Social Media", path: "/reviews", icon: Share2 },
    { name: "About Us", path: "/about", icon: BookOpen },
  ];

  return (
    <div className="flex space-x-1 lg:space-x-2 xl:space-x-3 overflow-hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            to={item.path}
            className={`flex items-center space-x-1 px-2 lg:px-3 py-2 rounded-md text-xs lg:text-sm font-medium transition-colors whitespace-nowrap ${
              location.pathname === item.path
                ? "text-orange-800 bg-orange-100"
                : "text-gray-700 hover:text-orange-800 hover:bg-orange-50"
            }`}
          >
            <Icon className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
            <span className="hidden lg:inline truncate">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
};

export default DesktopNavItems;
