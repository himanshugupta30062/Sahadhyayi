import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, User, LogOut, Settings, Search, MessageCircle, LogIn, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import ContactFormDialog from "@/components/ContactFormDialog";
import { useAuth } from "@/contexts/authHelpers";
import { useTheme } from "@/contexts/ThemeContext";
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
import { MessageDropdown } from "@/components/messages/MessageDropdown";
import { EnhancedGlobalSearch } from "@/components/EnhancedGlobalSearch";
import { useGlobalSearchShortcut } from "@/hooks/useKeyboardShortcuts";
import { EnhancedLazyImage } from "@/components/ui/EnhancedLazyImage";

const Navigation = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const menuRef = React.useRef<HTMLDivElement>(null);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);

  // Global search keyboard shortcut
  useGlobalSearchShortcut(() => setSearchOpen(true));

  React.useEffect(() => {
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

  React.useEffect(() => {
    if (isMobile) {
      if (isOpen) {
        menuRef.current?.querySelector<HTMLElement>('a, button')?.focus();
      } else {
        menuButtonRef.current?.focus();
      }
    }
  }, [isOpen, isMobile]);

  // Updated navigation items with core functionality only
  const navItems = user ? [
    { name: "Home", href: "/dashboard" },
    { name: "Library", href: "/library" },
    { name: "Articles", href: "/articles" },
    { name: "Games", href: "/games" },
    { name: "Authors", href: "/authors" },
    { name: "Social Media", href: "/social" },
    { name: "My Books", href: "/bookshelf" },
  ] : [
    { name: "Home", href: "/" },
    { name: "Library", href: "/library" },
    { name: "Articles", href: "/articles" },
    { name: "Games", href: "/games" },
    { name: "Authors", href: "/authors" },
    { name: "Social Media", href: "/social" },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
    setIsOpen(false);
  };

  const getUserInitials = (email?: string | null) => {
    if (!email || typeof email !== 'string') return 'U';
    return email.charAt(0).toUpperCase();
  };

  return (
    <nav
      role="navigation"
      aria-label="Main"
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        scrolled
          ? 'bg-background/95 backdrop-blur-md shadow-xs border-b border-border'
          : 'bg-background/85 backdrop-blur-sm border-b border-border/40'
      }`}
    >
      {/* Skip to Content accessibility link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only absolute left-2 top-2 bg-background text-foreground border border-border p-2 rounded z-50"
      >
        Skip to main content
      </a>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-3 font-bold text-2xl text-foreground">
            <EnhancedLazyImage
              src="/lovable-uploads/logo-small.webp"
              alt="Sahadhyayi navigation logo"
              className="w-8 h-8 flex-shrink-0"
              width={32}
              height={32}
            />
            <span className="whitespace-nowrap leading-none">Sahadhyayi</span>
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
                    className={`text-sm font-medium transition-colors duration-200 hover:text-[hsl(var(--brand-primary))] ${
                      (location.pathname === item.href || 
                       (item.href === "/" && location.pathname === "/dashboard" && user)) 
                        ? 'text-[hsl(var(--brand-primary))] border-b-2 border-[hsl(var(--brand-primary))] pb-1 font-semibold' 
                        : 'text-muted-foreground'
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      <span className="text-xs text-muted-foreground hidden lg:inline">
                        Cmd+K
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleTheme}
                      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                      className="h-9 w-9 text-foreground hover:bg-muted"
                    >
                      {theme === 'dark' ? (
                        <Sun className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Moon className="w-4 h-4 text-slate-700" />
                      )}
                    </Button>
                    <MessageDropdown />
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
                          <Link to="/profile" className="flex items-center">
                            <Settings className="mr-2 h-4 w-4" />
                            Account Settings
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
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleTheme}
                      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                      className="h-9 w-9 text-foreground hover:bg-muted"
                    >
                      {theme === 'dark' ? (
                        <Sun className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Moon className="w-4 h-4 text-slate-700" />
                      )}
                    </Button>
                    <ContactFormDialog
                      trigger={
                        <Button variant="outline" size="sm" className="border-amber-500 text-amber-600 hover:bg-amber-50 font-medium">
                          <MessageCircle className="w-4 h-4 mr-1.5" />
                          Contact me
                        </Button>
                      }
                    />
                    <Link to="/auth">
                      <Button size="sm" className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-medium">
                        <LogIn className="w-4 h-4 mr-1.5" />
                        Sign In
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
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                className="h-9 w-9 text-foreground hover:bg-muted p-1"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700" />
                )}
              </Button>
              {user && (
                <>
                  <MessageDropdown />
                  <NotificationDropdown />
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 border border-border text-foreground hover:bg-muted"
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
            className="md:hidden border-t border-border bg-background/98 backdrop-blur-md"
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
                      ? 'text-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary)/0.1)] font-semibold' 
                      : 'text-foreground hover:text-[hsl(var(--brand-primary))] hover:bg-muted'
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {user ? (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center px-3 py-2">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                        {getUserInitials(user.email || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {user.user_metadata?.full_name || user.email}
                      </div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 text-sm font-medium text-foreground hover:text-[hsl(var(--brand-primary))] hover:bg-muted rounded-md"
                  >
                    <User className="inline mr-2 h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 text-sm font-medium text-foreground hover:text-[hsl(var(--brand-primary))] hover:bg-muted rounded-md"
                  >
                    <Settings className="inline mr-2 h-4 w-4" />
                    Account Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-3 py-2 text-sm font-medium text-foreground hover:text-destructive hover:bg-muted rounded-md"
                  >
                    <LogOut className="inline mr-2 h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="pt-4 space-y-3 border-t border-border">
                  <Link to="/auth" onClick={() => setIsOpen(false)} className="block">
                    <Button size="sm" className="w-full bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)] text-white">
                      <LogIn className="w-4 h-4 mr-1.5" />
                      Sign In
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Global Search Dialog */}
      <EnhancedGlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </nav>
  );
};

export default Navigation;
