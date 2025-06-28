
import { useState } from "react";
import { Search } from "lucide-react";

interface GlobalHeaderProps {
  onSearch?: (query: string) => void;
}

const GlobalHeader = ({ onSearch }: GlobalHeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleSignInClick = () => {
    alert("Sign In clicked");
  };

  const handleSignUpClick = () => {
    alert("Sign Up clicked");
  };

  return (
    <div className="w-full bg-orange-50 border-b border-orange-200 px-4 py-3 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Empty space where logo was */}
        <div className="flex items-center">
          <div className="w-20"></div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search books, authors, posts..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={`w-full pl-10 pr-4 py-3 border border-orange-300 rounded-full bg-orange-50 text-gray-900 placeholder-orange-400 transition-all duration-300 ${
                isSearchFocused 
                  ? 'border-orange-400 bg-white shadow-lg ring-2 ring-orange-200 scale-105' 
                  : 'hover:bg-white hover:border-orange-400'
              }`}
            />
          </div>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSignInClick}
            className="px-6 py-2.5 bg-gradient-to-r from-orange-300 to-orange-400 text-white font-medium rounded-full transition-all duration-300 hover:from-orange-400 hover:to-orange-500 hover:shadow-lg hover:scale-105 transform"
          >
            Sign In
          </button>
          <button
            onClick={handleSignUpClick}
            className="px-6 py-2.5 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-medium rounded-full transition-all duration-300 hover:from-orange-500 hover:to-orange-600 hover:shadow-lg hover:scale-105 transform"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalHeader;
