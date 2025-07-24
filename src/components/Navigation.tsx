
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import SignInLink from '@/components/SignInLink';
import { Menu, X, ChevronDown, User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  useEffect(() => {
    if (isMobile) {
      if (isOpen) {
        menuRef.current?.querySelector<HTMLElement>('a, button')?.focus();
      } else {
        menuButtonRef.current?.focus();
      }
    }
  }, [isOpen, isMobile]);

  // Updated navigation items with Authors tab
  const navItems = user ? [
    { name: "Home", href: "/dashboard" },
    { name: "Library", href: "/library" },
    { name: "Discovery", href: "/discovery" },
    { name: "Authors", href: "/authors" },
    { name: "Social Media", href: "/social" },
    { name: "My Books", href: "/bookshelf" },
    { name: "Guidelines", href: "/community-guidelines" },
  ] : [
    { name: "Home", href: "/" },
    { name: "Library", href: "/library" },
    { name: "Discovery", href: "/discovery" },
    { name: "Authors", href: "/authors" },
    { name: "Social Media", href: "/social" },
    { name: "Guidelines", href: "/community-guidelines" },
  ];

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const getUserInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  return (
    <nav
      role="navigation"
      aria-label="Main"
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200'
          : 'bg-white/90 backdrop-blur-sm'
      }`}
    >
      {/* Skip to Content accessibility link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only absolute left-2 top-2 bg-white text-gray-800 p-2 rounded"
      >
        Skip to main content
      </a>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-3 font-bold text-2xl text-gray-800">
            <img
              src="/lovable-uploads/fff3e49f-a95f-4fcf-ad47-da2dc6626f29.png"
              alt="Sahadhyayi navigation logo"
              className="w-8 h-8 flex-shrink-0"
            />
            <span className="whitespace-nowrap">Sahadhyayi</span>
          </Link>

          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="hidden md:flex items-center space-x-8">
              {/* Navigation Links */}
              <div className="flex items-center space-x-6">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`text-sm font-medium transition-colors duration-200 hover:text-amber-600 ${
                      (location.pathname === item.href || 
                       (item.href === "/" && location.pathname === "/dashboard" && user)) 
                        ? 'text-amber-600 border-b-2 border-amber-600 pb-1' 
                        : 'text-gray-700'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {/* User Actions */}
              <div className="flex items-center space-x-4">
                {user ? (
                  <>
                    <NotificationDropdown />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center space-x-2 p-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.user_metadata?.avatar_url} />
                            <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                              {getUserInitials(user.email || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem asChild>
                          <Link to="/profile" className="flex items-center">
                            <User className="mr-2 h-4 w-4" />
                            Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/settings" className="flex items-center">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign Out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <div className="flex items-center space-x-4">
                    <SignInLink>
                      <Button variant="ghost" size="sm" className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50">
                        Sign In
                      </Button>
                    </SignInLink>
                    <Link to="/signup">
                      <Button size="sm" className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile menu button */}
          {isMobile && (
            <div className="flex items-center space-x-2">
              {user && <NotificationDropdown />}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 border-2 border-orange-500 text-orange-600 hover:bg-orange-50"
                aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
                ref={menuButtonRef}
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Navigation Menu */}
        {isMobile && isOpen && (
          <div
            className="md:hidden border-t border-gray-200 bg-white/95 backdrop-blur-md"
            ref={menuRef}
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    (location.pathname === item.href || 
                     (item.href === "/" && location.pathname === "/dashboard" && user)) 
                      ? 'text-amber-600 bg-amber-50' 
                      : 'text-gray-700 hover:text-amber-600 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {user ? (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center px-3 py-2">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                        {getUserInitials(user.email || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.user_metadata?.full_name || user.email}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-amber-600 hover:bg-gray-50 rounded-md"
                  >
                    <User className="inline mr-2 h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-amber-600 hover:bg-gray-50 rounded-md"
                  >
                    <Settings className="inline mr-2 h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:text-amber-600 hover:bg-gray-50 rounded-md"
                  >
                    <LogOut className="inline mr-2 h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="pt-4 space-y-3 border-t border-gray-200">
                  <SignInLink onClick={() => setIsOpen(false)} className="block">
                    <Button variant="ghost" size="sm" className="w-full justify-center border-2 border-orange-500 text-orange-600 hover:bg-orange-50">
                      Sign In
                    </Button>
                  </SignInLink>
                  <Link to="/signup" onClick={() => setIsOpen(false)} className="block">
                    <Button size="sm" className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
