import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/authHelpers';
import { Button } from '@/components/ui/button';
import { Search, Menu, X } from 'lucide-react';
import SignInLink from '@/components/SignInLink';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';

const StickyNavigation = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const { user } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

  const navItems = [
    { name: 'Home', href: user ? '/dashboard' : '/' },
    { name: 'Library', href: '/library' },
    { name: 'Authors', href: '/authors' },
    { name: 'Community', href: '/social' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to library with search
      window.location.href = `/library?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to={user ? '/dashboard' : '/'} className="flex items-center space-x-2">
            <img
              src="/lovable-uploads/sahadhyayi-logo-digital-reading.png"
              alt="Sahadhyayi"
              className="w-8 h-8"
            />
            <span className="font-bold text-xl text-text-primary">Sahadhyayi</span>
          </Link>

          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="flex items-center space-x-8">
              {/* Navigation Items */}
              <div className="flex items-center space-x-6">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`text-sm font-medium transition-colors duration-200 hover:text-brand-primary ${
                      location.pathname === item.href
                        ? 'text-brand-primary border-b-2 border-brand-primary pb-1'
                        : 'text-text-secondary'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="text"
                  placeholder="Search books, authors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 text-sm border-2 border-gray-200 focus:border-brand-primary rounded-lg"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </form>

              {/* Auth Buttons */}
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link to="/profile">
                    <Button variant="ghost" size="sm" className="text-text-secondary hover:text-brand-primary">
                      Profile
                    </Button>
                  </Link>
                </div>
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
          <div className="py-3 border-t border-gray-200">
            <form onSubmit={handleSearch}>
              <Input
                type="text"
                placeholder="Search books, authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border-2 border-gray-200 focus:border-brand-primary rounded-lg"
              />
            </form>
          </div>
        )}

        {/* Mobile Menu */}
        {isMobile && isOpen && (
          <div className="py-3 border-t border-gray-200">
            <div className="space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-2 text-base font-medium rounded-md transition-colors ${
                    location.pathname === item.href
                      ? 'text-brand-primary bg-brand-neutral'
                      : 'text-text-secondary hover:text-brand-primary hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {!user && (
                <div className="pt-3 space-y-2 border-t border-gray-200">
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