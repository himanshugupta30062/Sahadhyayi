import React, { lazy, Suspense, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, Search, MessageCircle, LogIn, Sun, Moon, BookOpen, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/authHelpers";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { EnhancedLazyImage } from "@/components/ui/EnhancedLazyImage";

const ContactFormDialog = lazy(() => import("@/components/ContactFormDialog"));
const AuthenticatedUserDropdown = lazy(() => import("@/components/AuthenticatedUserDropdown"));

const EnhancedGlobalSearch = lazy(() =>
  import("@/components/EnhancedGlobalSearch").then(({ EnhancedGlobalSearch }) => ({ default: EnhancedGlobalSearch }))
);
const MessageDropdown = lazy(() =>
  import("@/components/messages/MessageDropdown").then(({ MessageDropdown }) => ({ default: MessageDropdown }))
);
const NotificationDropdown = lazy(() =>
  import("@/components/notifications/NotificationDropdown").then(({ NotificationDropdown }) => ({ default: NotificationDropdown }))
);

const Navigation = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [contactDialogRequested, setContactDialogRequested] = useState(false);
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const menuRef = React.useRef<HTMLDivElement>(null);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (user) setContactDialogRequested(false);
  }, [user]);

  // Close the mobile menu after any route change (link tap, redirect, or browser navigation).
  React.useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  React.useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled((previous) => (previous === isScrolled ? previous : isScrolled));
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  React.useEffect(() => {
    if (isMobile) {
      if (isOpen) {
        menuRef.current?.querySelector<HTMLElement>('a, button')?.focus();
      } else {
        menuButtonRef.current?.focus();
      }
    }
  }, [isOpen, isMobile]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Updated navigation items with core functionality only
  const navItems = user ? [
    { name: "Home", href: "/dashboard" },
    { name: "Library", href: "/library" },
    { name: "Articles", href: "/articles" },
    { name: "Games", href: "/games" },
    { name: "Authors", href: "/authors" },
    { name: "Social Media", href: "/social" },
    { name: "My Books", href: "/bookshelf" },
    { name: "Blog", href: "/blog" },
  ] : [
    { name: "Home", href: "/" },
    { name: "Library", href: "/library" },
    { name: "Articles", href: "/articles" },
    { name: "Games", href: "/games" },
    { name: "Authors", href: "/authors" },
    { name: "Social Media", href: "/social" },
    { name: "Blog", href: "/blog" },
  ];

  const userDisplayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Reader';

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
    setIsOpen(false);
  };

  const contactButton = (onClick?: () => void) => (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="border-border text-foreground hover:bg-muted font-medium"
    >
      <MessageCircle className="w-4 h-4 mr-1.5" />
      Contact me
    </Button>
  );

  const getUserInitials = (nameOrEmail?: string | null) => {
    if (!nameOrEmail || typeof nameOrEmail !== 'string') return 'U';
    const trimmed = nameOrEmail.trim();
    if (!trimmed) return 'U';
    const parts = trimmed.split(' ');
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return trimmed.charAt(0).toUpperCase();
  };

  const isCurrentRoute = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    if (href === '/dashboard') {
      return location.pathname === '/dashboard' || (Boolean(user) && location.pathname === '/');
    }
    if (href === '/authors') {
      return (
        location.pathname === '/authors' ||
        location.pathname.startsWith('/authors/') ||
        location.pathname.startsWith('/author/')
      );
    }
    if (href === '/library') {
      return (
        location.pathname === '/library' ||
        location.pathname.startsWith('/library/') ||
        location.pathname.startsWith('/book/') ||
        location.pathname.startsWith('/books/') ||
        location.pathname.startsWith('/reader/')
      );
    }
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        scrolled
          ? 'bg-background/95 backdrop-blur-md shadow-xs border-b border-border'
          : 'bg-background/85 backdrop-blur-sm border-b border-border/40'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to={user ? "/dashboard" : "/"}
            className="flex items-center space-x-3 font-bold text-2xl text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
            aria-label="Sahadhyayi Home"
          >
            <EnhancedLazyImage
              src="/optimized-assets/site-logo.webp"
              alt=""
              aria-hidden="true"
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
              <nav aria-label="Main navigation" className="flex items-center space-x-3 lg:space-x-5">
                {navItems.map((item) => {
                  const isActive = isCurrentRoute(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={item.href === "/blog"
                        ? `inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                            isActive
                              ? 'border-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary))] text-white shadow-sm'
                              : 'border-[hsl(var(--brand-primary)/0.35)] bg-[hsl(var(--brand-primary)/0.08)] text-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.15)]'
                          }`
                        : `text-sm font-medium transition-colors duration-200 hover:text-[hsl(var(--brand-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm ${
                            isActive
                              ? 'text-[hsl(var(--brand-primary))] border-b-2 border-[hsl(var(--brand-primary))] pb-1 font-semibold'
                              : 'text-muted-foreground'
                          }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* User Actions */}
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="group relative flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground bg-muted/50 hover:bg-muted hover:text-foreground border border-border/70 hover:border-border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer shadow-2xs"
                  aria-label="Search library, authors, and books"
                  title="Search library, authors, and books"
                >
                  <Search className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" aria-hidden="true" />
                  <span className="text-xs text-foreground/80 font-normal">
                    Search library & authors...
                  </span>
                </button>

                {user ? (
                  <>
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
                    <Suspense fallback={<span className="inline-block h-9 w-9 shrink-0" aria-hidden="true" />}>
                      <MessageDropdown />
                    </Suspense>
                    <Suspense fallback={<span className="inline-block h-9 w-9 shrink-0" aria-hidden="true" />}>
                      <NotificationDropdown />
                    </Suspense>
                    <Suspense fallback={<span className="inline-block h-9 w-9 shrink-0" aria-hidden="true" />}>
                      <AuthenticatedUserDropdown
                        user={user}
                        userDisplayName={userDisplayName}
                        onSignOut={handleSignOut}
                      />
                    </Suspense>
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
                    {contactDialogRequested ? (
                      <Suspense fallback={contactButton(() => setContactDialogRequested(true))}>
                        <ContactFormDialog initialOpen trigger={contactButton()} />
                      </Suspense>
                    ) : (
                      contactButton(() => setContactDialogRequested(true))
                    )}
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
                onClick={() => setSearchOpen(true)}
                aria-label="Search library and books"
                title="Search library and books"
                className="h-9 w-9 text-foreground hover:bg-muted p-1"
              >
                <Search className="w-4 h-4" aria-hidden="true" />
              </Button>
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
                  <Suspense fallback={<span className="inline-block h-9 w-9 shrink-0" aria-hidden="true" />}>
                    <MessageDropdown />
                  </Suspense>
                  <Suspense fallback={<span className="inline-block h-9 w-9 shrink-0" aria-hidden="true" />}>
                    <NotificationDropdown />
                  </Suspense>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 border border-border text-foreground hover:bg-muted min-h-[40px] min-w-[40px]"
                aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
                aria-expanded={isOpen}
                aria-controls="mobile-navigation-menu"
                ref={menuButtonRef}
              >
                {isOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Navigation Menu */}
        {isMobile && isOpen && (
          <nav
            id="mobile-navigation-menu"
            aria-label="Mobile navigation"
            className="md:hidden border-t border-border bg-background/98 backdrop-blur-md"
            ref={menuRef}
          >
            <div className="px-3 pt-3 pb-3 space-y-1">
              {/* Mobile Quick Search Bar */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setSearchOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 mb-2 rounded-xl bg-muted/60 hover:bg-muted border border-border/70 text-left text-sm text-muted-foreground transition-colors cursor-pointer"
                aria-label="Search books, authors, and articles"
              >
                <Search className="w-4 h-4 text-foreground/70" />
                <span className="text-foreground/90 font-medium">Search books & authors...</span>
              </button>
              {navItems.map((item) => {
                const isActive = isCurrentRoute(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={item.href === "/blog"
                      ? `block px-3 py-2 text-sm font-semibold rounded-md transition-colors duration-200 min-h-[44px] flex items-center border ${
                          isActive
                            ? 'text-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary)/0.1)] border-[hsl(var(--brand-primary)/0.3)]'
                            : 'text-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary)/0.06)] border-[hsl(var(--brand-primary)/0.18)] hover:bg-[hsl(var(--brand-primary)/0.12)]'
                        }`
                      : `block px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 min-h-[44px] flex items-center ${
                          isActive
                            ? 'text-[hsl(var(--brand-primary))] bg-[hsl(var(--brand-primary)/0.1)] font-semibold'
                            : 'text-foreground hover:text-[hsl(var(--brand-primary))] hover:bg-muted'
                        }`}
                  >
                    {item.name}
                  </Link>
                );
              })}

              {user ? (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center px-3 py-2">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={user.user_metadata?.avatar_url} alt={userDisplayName} />
                      <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white font-medium">
                        {getUserInitials(user.user_metadata?.full_name || user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground truncate">
                        {userDisplayName}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 text-sm font-medium text-foreground hover:text-[hsl(var(--brand-primary))] hover:bg-muted rounded-md min-h-[44px] flex items-center"
                  >
                    <User className="inline mr-2 h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    to="/bookshelf"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 text-sm font-medium text-foreground hover:text-[hsl(var(--brand-primary))] hover:bg-muted rounded-md min-h-[44px] flex items-center"
                  >
                    <BookOpen className="inline mr-2 h-4 w-4" />
                    My Bookshelf
                  </Link>
                  <Link
                    to="/articles/my"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 text-sm font-medium text-foreground hover:text-[hsl(var(--brand-primary))] hover:bg-muted rounded-md min-h-[44px] flex items-center"
                  >
                    <FileText className="inline mr-2 h-4 w-4" />
                    My Articles
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md min-h-[44px] flex items-center cursor-pointer"
                  >
                    <LogOut className="inline mr-2 h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="pt-4 space-y-3 border-t border-border">
                  <Link to="/auth" onClick={() => setIsOpen(false)} className="block">
                    <Button size="sm" className="w-full bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)] text-white min-h-[44px]">
                      <LogIn className="w-4 h-4 mr-1.5" />
                      Sign In
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        )}
      </div>

      {/* Load search code only when a reader opens the global search dialog. */}
      {searchOpen && (
        <Suspense fallback={null}>
          <EnhancedGlobalSearch isOpen onClose={() => setSearchOpen(false)} />
        </Suspense>
      )}
    </header>
  );
};

export default Navigation;
