
import { Link, useLocation } from "react-router-dom";
import { BookOpen, Users, Calendar, User, Rss, Library } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const DesktopNavItems = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const navItems = [
    { name: "Home", path: "/", icon: BookOpen },
    ...(user
      ? [
          { name: "Dashboard", path: "/dashboard", icon: User },
          { name: "My Bookshelf", path: "/bookshelf", icon: User },
          { name: "Groups", path: "/groups", icon: Users }
        ]
      : []),
    { name: "Authors", path: "/authors", icon: Calendar },
    { name: "Feed", path: "/reviews", icon: Rss },
    ...(user ? [{ name: "My Quotes", path: "/quotes", icon: BookOpen }] : []),
    { name: "Library", path: "/library", icon: Library },
    { name: "About", path: "/about", icon: BookOpen }
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
                ? "text-amber-800 bg-amber-100"
                : "text-gray-700 hover:text-amber-800 hover:bg-amber-50"
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
