
import { useState } from "react";
import { Search } from "lucide-react";
import NavLogo from "./navigation/NavLogo";
import DesktopNavItems from "./navigation/DesktopNavItems";
import AuthSection from "./navigation/AuthSection";
import MobileNavMenu from "./navigation/MobileNavMenu";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    // This will be implemented based on the current page context
    console.log("Search:", query);
  };

  return (
    <nav className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-6">
            <NavLogo />
            
            {/* Compact Search Bar */}
            <div className="hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className={`pl-9 pr-4 py-2 w-64 border border-gray-300 rounded-full bg-gray-50 text-gray-900 placeholder-gray-500 transition-all duration-300 ${
                    isSearchFocused 
                      ? 'border-orange-400 bg-white shadow-md ring-2 ring-orange-200 scale-105' 
                      : 'hover:bg-white hover:border-gray-400'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            <DesktopNavItems />
            <AuthSection />
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              className="text-gray-700 p-2"
              aria-label="Open main menu"
              onClick={() => setIsOpen(!isOpen)}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <MobileNavMenu isOpen={isOpen} setIsOpen={setIsOpen} />
      </div>
    </nav>
  );
};

export default Navigation;
