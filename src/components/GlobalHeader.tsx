
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
    <div className="w-full bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo/Brand */}
        <div className="flex items-center">
          <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            Lovable
          </span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search books, authors, posts..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full bg-gray-50 text-gray-900 placeholder-gray-500 transition-all duration-300 ${
                isSearchFocused 
                  ? 'border-pink-400 bg-white shadow-lg ring-2 ring-pink-200 scale-105' 
                  : 'hover:bg-white hover:border-gray-400'
              }`}
            />
          </div>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSignInClick}
            className="px-6 py-2.5 bg-gradient-to-r from-pink-400 to-purple-500 text-white font-medium rounded-full transition-all duration-300 hover:from-pink-500 hover:to-purple-600 hover:shadow-lg hover:scale-105 transform"
          >
            Sign In
          </button>
          <button
            onClick={handleSignUpClick}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-full transition-all duration-300 hover:from-purple-600 hover:to-pink-600 hover:shadow-lg hover:scale-105 transform"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalHeader;
