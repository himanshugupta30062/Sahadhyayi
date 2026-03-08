import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/authHelpers';
import { Button } from '@/components/ui/button';
import {
  Search, Menu, X, ChevronDown, BookOpen, Gamepad2, Users, Radio,
  FileText, User, LogOut, Settings, BookMarked, PenTool,
} from 'lucide-react';
import SignInLink from '@/components/SignInLink';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavPreferences, ALL_NAV_TABS, TAB_ROUTES, DEFAULT_VISIBLE_TABS } from '@/hooks/useNavPreferences';
import NavOnboardingModal from './NavOnboardingModal';

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen, BookMarked, FileText, PenTool, Gamepad2, Users, Radio,
};

const StickyNavigation = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { preferences, needsOnboarding, savePreferences } = useNavPreferences();

  // Build nav items based on user preferences
  const visibleTabKeys = preferences?.visible_tabs || DEFAULT_VISIBLE_TABS;

  const allTabItems = ALL_NAV_TABS.map((tab) => ({
    name: tab.label,
    href: TAB_ROUTES[tab.key],
    key: tab.key,
    icon: ICON_MAP[tab.icon] || BookOpen,
  }));

  // Tabs that should always be visible (even for non-signed-in users)
  const ALWAYS_VISIBLE_TABS = ['articles', 'blog'];

  // Home is always primary
  const homeItem = { name: 'Home', href: user ? '/dashboard' : '/', key: 'home', icon: BookOpen };

  const primaryItems = user
    ? [homeItem, ...allTabItems.filter((item) => visibleTabKeys.includes(item.key))]
    : [homeItem, ...allTabItems.filter((item) => ALWAYS_VISIBLE_TABS.includes(item.key))];

  const moreItems = user
    ? allTabItems.filter((item) => !visibleTabKeys.includes(item.key))
    : allTabItems.filter((item) => !ALWAYS_VISIBLE_TABS.includes(item.key));

  const allItems = [homeItem, ...allTabItems];
  const isMoreActive = moreItems.some((item) => location.pathname === item.href);

  // For non-signed-in users, auth-required tabs redirect to sign-in
  const AUTH_REQUIRED_TABS = ['bookshelf', 'games', 'authors', 'social'];

  const handleNavClick = (e: React.MouseEvent, item: { key: string; href: string }) => {
    if (!user && AUTH_REQUIRED_TABS.includes(item.key)) {
      e.preventDefault();
      const redirect = item.href;
      navigate(`/signin?redirect=${encodeURIComponent(redirect)}`, { state: { from: redirect } });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/library?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setIsOpen(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
  };

  const handleOnboardingSave = (tabs: string[]) => {
    savePreferences.mutate({ visible_tabs: tabs, onboarding_completed: true });
  };

  const userInitial = user?.user_metadata?.full_name?.charAt(0)?.toUpperCase()
    || user?.email?.charAt(0)?.toUpperCase()
    || 'U';

  return (
    <>
      {/* Onboarding Modal */}
      {user && needsOnboarding && (
        <NavOnboardingModal open={needsOnboarding} onSave={handleOnboardingSave} />
      )}

      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to={user ? '/dashboard' : '/'} className="flex items-center space-x-2">
              <img
                src="/lovable-uploads/logo-small.webp"
                alt="Sahadhyayi"
                className="w-8 h-8"
                width={32}
                height={32}
                loading="lazy"
              />
              <span className="font-bold text-xl text-foreground">Sahadhyayi</span>
            </Link>

            {/* Desktop Navigation */}
            {!isMobile && (
              <div className="flex items-center space-x-4">
                {/* Primary Nav Items */}
                <div className="flex items-center space-x-5">
                  {primaryItems.map((item) => (
                    <Link
                      key={item.key}
                      to={item.href}
                      onClick={(e) => handleNavClick(e, item)}
                      className={`text-sm font-medium transition-colors duration-200 hover:text-brand-primary ${
                        location.pathname === item.href
                          ? 'text-brand-primary border-b-2 border-brand-primary pb-1'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}

                  {/* More Dropdown — only show if there are items in it */}
                  {moreItems.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className={`flex items-center gap-1 text-sm font-medium transition-colors duration-200 hover:text-brand-primary ${
                            isMoreActive
                              ? 'text-brand-primary border-b-2 border-brand-primary pb-1'
                              : 'text-muted-foreground'
                          }`}
                        >
                          More
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {moreItems.map((item) => (
                          <DropdownMenuItem
                            key={item.key}
                            onClick={() => {
                              if (!user && AUTH_REQUIRED_TABS.includes(item.key)) {
                                navigate(`/signin?redirect=${encodeURIComponent(item.href)}`, { state: { from: item.href } });
                              } else {
                                navigate(item.href);
                              }
                            }}
                            className={`cursor-pointer ${
                              location.pathname === item.href ? 'text-brand-primary bg-accent' : ''
                            }`}
                          >
                            <item.icon className="w-4 h-4 mr-2" />
                            {item.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Compact Search Icon */}
                <DropdownMenu open={searchOpen} onOpenChange={setSearchOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-brand-primary">
                      <Search className="w-4.5 h-4.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72 p-2">
                    <form onSubmit={handleSearch}>
                      <Input
                        type="text"
                        placeholder="Search books, authors..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full border-2 border-border focus:border-brand-primary rounded-lg"
                        autoFocus
                      />
                    </form>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Auth: Avatar dropdown or Sign In */}
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2">
                        <Avatar className="w-8 h-8 cursor-pointer">
                          <AvatarImage src={user.user_metadata?.avatar_url || ''} />
                          <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-sm font-semibold">
                            {userInitial}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <div className="px-2 py-1.5">
                        <p className="text-sm font-medium truncate">
                          {user.user_metadata?.full_name || user.email || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer">
                        <Settings className="w-4 h-4 mr-2" />
                        Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="flex items-center space-x-3">
                    <SignInLink>
                      <Button variant="outline" size="sm" className="border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white">
                        Sign In
                      </Button>
                    </SignInLink>
                    <Link to="/signup">
                      <Button size="sm" className="bg-gradient-button text-white shadow-button hover:shadow-elevated transition-all duration-200">
                        Join Now
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            {isMobile && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="p-2"
                >
                  <Search className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(!isOpen)}
                  className="p-2"
                >
                  {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Search */}
          {isMobile && searchOpen && (
            <div className="py-3 border-t border-border">
              <form onSubmit={handleSearch}>
                <Input
                  type="text"
                  placeholder="Search books, authors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border-2 border-border focus:border-brand-primary rounded-lg"
                />
              </form>
            </div>
          )}

          {/* Mobile Menu */}
          {isMobile && isOpen && (
            <div className="py-3 border-t border-border">
              <div className="space-y-1">
                {allItems.map((item) => (
                  <Link
                    key={item.key}
                    to={item.href}
                    onClick={(e) => { handleNavClick(e, item); setIsOpen(false); }}
                    className={`block px-3 py-2.5 text-base font-medium rounded-md transition-colors ${
                      location.pathname === item.href
                        ? 'text-brand-primary bg-accent'
                        : 'text-muted-foreground hover:text-brand-primary hover:bg-accent/50'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}

                {user ? (
                  <div className="pt-3 space-y-1 border-t border-border">
                    <Link
                      to="/profile"
                      onClick={() => setIsOpen(false)}
                      className="block px-3 py-2.5 text-base font-medium rounded-md text-muted-foreground hover:text-brand-primary hover:bg-accent/50"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => { handleSignOut(); setIsOpen(false); }}
                      className="block w-full text-left px-3 py-2.5 text-base font-medium rounded-md text-destructive hover:bg-destructive/10"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="pt-3 space-y-2 border-t border-border">
                    <SignInLink onClick={() => setIsOpen(false)} className="block">
                      <Button variant="outline" size="sm" className="w-full border-brand-primary text-brand-primary">
                        Sign In
                      </Button>
                    </SignInLink>
                    <Link to="/signup" onClick={() => setIsOpen(false)} className="block">
                      <Button size="sm" className="w-full bg-gradient-button text-white">
                        Join Now
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default StickyNavigation;
