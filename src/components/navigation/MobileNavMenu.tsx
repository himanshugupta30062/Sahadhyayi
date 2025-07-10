import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, BookOpen, Users, Map, PenTool } from "lucide-react";

interface MobileNavMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileNavMenu = ({ isOpen, onClose }: MobileNavMenuProps) => {
  const navItems = [
    { path: "/library", label: "Library", icon: BookOpen },
    { path: "/authors", label: "Authors", icon: Users },
    { path: "/groups", label: "Groups", icon: Users },
    { path: "/map", label: "Reader Map", icon: Map },
    { path: "/blog", label: "Blog", icon: BookOpen },
    { path: "/community-stories", label: "Stories", icon: PenTool },
  ];
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    onClose();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-64">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>
            Navigate through Sahadhyayi and manage your account.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          {user ? (
            <>
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarImage src={user.photoURL || ""} />
                  <AvatarFallback>
                    {user.displayName?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.displayName || "User"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {user.email || "No Email"}
                  </p>
                </div>
              </div>
              <Link to="/dashboard" className="block px-4 py-2 rounded-md hover:bg-gray-100">
                Dashboard
              </Link>
              <Link to="/profile" className="block px-4 py-2 rounded-md hover:bg-gray-100">
                Profile
              </Link>
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-2 rounded-md hover:bg-gray-100 ${
                    isActive(item.path) ? "text-orange-600" : "text-gray-700"
                  }`}
                  onClick={onClose}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Link>
              ))}
              <Button
                variant="ghost"
                className="justify-start"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/signin" className="block px-4 py-2 rounded-md hover:bg-gray-100">
                Sign In
              </Link>
              <Link to="/signup" className="block px-4 py-2 rounded-md hover:bg-gray-100">
                Sign Up
              </Link>
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-2 rounded-md hover:bg-gray-100 ${
                    isActive(item.path) ? "text-orange-600" : "text-gray-700"
                  }`}
                  onClick={onClose}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNavMenu;
