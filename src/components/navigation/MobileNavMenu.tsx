import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Link, useLocation, useNavigate } from "react-router-dom";
import SignInLink from '@/components/SignInLink';
import { useAuth } from "@/contexts/authHelpers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, BookOpen, Users, Gamepad2, Radio, FileText, PenTool, Home, BookMarked } from "lucide-react";

interface MobileNavMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileNavMenu = ({ isOpen, onClose }: MobileNavMenuProps) => {
  const primaryItems = [
    { path: "/dashboard", label: "Home", icon: Home },
    { path: "/library", label: "Library", icon: BookOpen },
    { path: "/bookshelf", label: "My Shelf", icon: BookMarked },
  ];

  const secondaryItems = [
    { path: "/articles", label: "Articles", icon: FileText },
    { path: "/blog", label: "Publish", icon: PenTool },
    { path: "/games", label: "Games", icon: Gamepad2 },
    { path: "/authors", label: "Authors", icon: Users },
    { path: "/social", label: "Social Media", icon: Radio },
  ];

  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
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
                  <AvatarImage src={user.user_metadata?.avatar_url || ""} />
                  <AvatarFallback>
                    {user.user_metadata?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.user_metadata?.full_name || user.email || "User"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {user.email || "No Email"}
                  </p>
                </div>
              </div>
              <Link to="/profile" className="block px-4 py-2 rounded-md hover:bg-accent" onClick={onClose}>
                Profile
              </Link>

              {/* Primary nav */}
              <div className="space-y-0.5">
                <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Main</p>
                {primaryItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-4 py-2 rounded-md hover:bg-accent ${
                      isActive(item.path) ? "text-brand-primary bg-accent" : "text-foreground"
                    }`}
                    onClick={onClose}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Secondary nav */}
              <div className="space-y-0.5">
                <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Explore</p>
                {secondaryItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-4 py-2 rounded-md hover:bg-accent ${
                      isActive(item.path) ? "text-brand-primary bg-accent" : "text-foreground"
                    }`}
                    onClick={onClose}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                ))}
              </div>

              <Button
                variant="ghost"
                className="justify-start text-destructive hover:bg-destructive/10"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <SignInLink className="block px-4 py-2 rounded-md hover:bg-accent">
                Sign In
              </SignInLink>
              <Link to="/signup" className="block px-4 py-2 rounded-md hover:bg-accent">
                Sign Up
              </Link>
              {[...primaryItems, ...secondaryItems].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-2 rounded-md hover:bg-accent ${
                    isActive(item.path) ? "text-brand-primary" : "text-foreground"
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
