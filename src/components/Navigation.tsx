
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Calendar, User, LogIn, Rss, Library } from "lucide-react";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: "Home", path: "/", icon: BookOpen },
    { name: "My Bookshelf", path: "/bookshelf", icon: User },
    { name: "Groups", path: "/groups", icon: Users },
    { name: "Authors", path: "/authors", icon: Calendar },
    { name: "Feed", path: "/reviews", icon: Rss },
    { name: "Library", path: "/library", icon: Library },
    { name: "About", path: "/about", icon: BookOpen },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-amber-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-3 font-bold text-2xl text-gray-800">
            <img 
              src="/lovable-uploads/fff3e49f-a95f-4fcf-ad47-da2dc6626f29.png" 
              alt="Sahadhyayi" 
              className="w-8 h-8 flex-shrink-0" 
            />
            <span className="whitespace-nowrap">Sahadhyayi</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
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
            
            {/* Auth Buttons */}
            <div className="flex items-center space-x-2">
              <Button variant="ghost" className="text-gray-700">
                <LogIn className="w-4 h-4 mr-1" />
                Sign In
              </Button>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                Sign Up
              </Button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white rounded-lg shadow-lg mt-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      location.pathname === item.path
                        ? "text-amber-800 bg-amber-100"
                        : "text-gray-700 hover:text-amber-800 hover:bg-amber-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              <div className="border-t pt-2 mt-2">
                <Button variant="ghost" className="w-full justify-start text-gray-700 mb-2">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
                <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                  Sign Up
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
