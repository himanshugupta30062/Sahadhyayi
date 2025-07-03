
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
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const clearHighlights = () => {
    document.querySelectorAll("mark.search-highlight").forEach((mark) => {
      const text = document.createTextNode(mark.textContent || "");
      mark.replaceWith(text);
    });
    document.body.normalize();
  };

  const highlightElement = (el: HTMLElement, term: string) => {
    const regex = new RegExp(`(${escapeRegExp(term)})`, "gi");
    if (!regex.test(el.textContent || "")) return;
    el.innerHTML = (el.textContent || "").replace(regex, '<mark class="search-highlight">$1</mark>');
  };

  const handleSearch = () => {
    const term = searchQuery.trim();
    if (!term) return;
    clearHighlights();
    const elements = document.querySelectorAll(
      "#root h1, #root h2, #root h3, #root p, #root li"
    );
    let firstMatch: HTMLElement | null = null;
    elements.forEach((el) => {
      if (el.textContent?.toLowerCase().includes(term.toLowerCase())) {
        if (!firstMatch) firstMatch = el as HTMLElement;
        highlightElement(el as HTMLElement, term);
      }
    });
    if (firstMatch) {
      firstMatch.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <nav className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0 min-w-0">
            <NavLogo />

            {/* Mobile Search Icon */}
            <button
              className="md:hidden p-2 text-gray-700"
              aria-label="Search"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Compact Search Bar */}
            <div className="hidden md:block flex-shrink-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className={`pl-4 pr-9 py-2 w-48 lg:w-64 border border-gray-300 rounded-full bg-gray-50 text-gray-900 placeholder-gray-500 transition-all duration-300 ${
                    isSearchFocused
                      ? 'border-orange-400 bg-white shadow-md ring-2 ring-orange-200 scale-105'
                      : 'hover:bg-white hover:border-gray-400'
                  }`}
                />
                <button
                  onClick={handleSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-600"
                  aria-label="Search"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-2 xl:space-x-4 flex-shrink-0">
            <div className="flex-shrink-0">
              <DesktopNavItems />
            </div>
            <AuthSection />
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center flex-shrink-0">
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

        {isMobileSearchOpen && (
          <div className="md:hidden py-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                    setIsMobileSearchOpen(false);
                  }
                }}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={`pl-4 pr-9 py-2 w-full border border-gray-300 rounded-full bg-gray-50 text-gray-900 placeholder-gray-500 transition-all duration-300${
                  isSearchFocused
                    ? ' border-orange-400 bg-white shadow-md ring-2 ring-orange-200'
                    : ' hover:bg-white hover:border-gray-400'
                }`}
              />
              <button
                onClick={() => {
                  handleSearch();
                  setIsMobileSearchOpen(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-600"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Navigation */}
        <MobileNavMenu isOpen={isOpen} setIsOpen={setIsOpen} />
      </div>
    </nav>
  );
};

export default Navigation;
