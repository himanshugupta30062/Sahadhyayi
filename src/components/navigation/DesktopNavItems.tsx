import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, BookOpen, Gamepad2, Users, Radio } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DesktopNavItems = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const primaryItems = [
    { path: "/library", label: "Library" },
    { path: "/bookshelf", label: "My Books" },
  ];

  const moreItems = [
    { path: "/blog", label: "Publish", icon: BookOpen },
    { path: "/games", label: "Games", icon: Gamepad2 },
    { path: "/authors", label: "Authors", icon: Users },
    { path: "/social", label: "Social Media", icon: Radio },
  ];

  const isMoreActive = moreItems.some((item) => isActive(item.path));

  return (
    <div className="hidden md:flex items-center space-x-8">
      {primaryItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`text-sm font-medium transition-colors hover:text-brand-primary ${
            isActive(item.path) ? "text-brand-primary" : "text-muted-foreground"
          }`}
        >
          {item.label}
        </Link>
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-brand-primary ${
              isMoreActive ? "text-brand-primary" : "text-muted-foreground"
            }`}
          >
            More
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {moreItems.map((item) => (
            <DropdownMenuItem
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`cursor-pointer ${isActive(item.path) ? "text-brand-primary bg-accent" : ""}`}
            >
              <item.icon className="w-4 h-4 mr-2" />
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default DesktopNavItems;
