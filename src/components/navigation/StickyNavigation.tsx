import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/authHelpers';
import { Button } from '@/components/ui/button';
import { Search, Menu, X, ChevronDown, BookOpen, Gamepad2, Users, Radio, FileText } from 'lucide-react';
import SignInLink from '@/components/SignInLink';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const StickyNavigation = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const primaryItems = [
    { name: 'Home', href: user ? '/dashboard' : '/' },
    { name: 'Library', href: '/library' },
    { name: 'My Books', href: '/bookshelf' },
  ];

  const moreItems = [
    { name: 'Publish', href: '/blog', icon: BookOpen },
    { name: 'Games', href: '/games', icon: Gamepad2 },
    { name: 'Authors', href: '/authors', icon: Users },
    { name: 'Social Media', href: '/social', icon: Radio },
  ];

  const allItems = [...primaryItems, ...moreItems];

  const isMoreActive = moreItems.some((item) => location.pathname === item.href);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/library?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setIsOpen(false);
    }
  };

  return (
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
            <div className="flex items-center space-x-6">
              {/* Primary Nav Items */}
              <div className="flex items-center space-x-5">
                {primaryItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`text-sm font-medium transition-colors duration-200 hover:text-brand-primary ${
                      location.pathname === item.href
                        ? 'text-brand-primary border-b-2 border-brand-primary pb-1'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}

                {/* More Dropdown */}
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
                        key={item.name}
                        onClick={() => navigate(item.href)}
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
              </div>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="text"
                  placeholder="Search books, authors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-56 pl-10 pr-4 py-2 text-sm border-2 border-border focus:border-brand-primary rounded-lg"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              </form>

              {/* Auth Buttons */}
              {user ? (
                <Link to="/profile">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-brand-primary">
                    Profile
                  </Button>
                </Link>
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
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2.5 text-base font-medium rounded-md transition-colors ${
                    location.pathname === item.href
                      ? 'text-brand-primary bg-accent'
                      : 'text-muted-foreground hover:text-brand-primary hover:bg-accent/50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {!user && (
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
  );
};

export default StickyNavigation;