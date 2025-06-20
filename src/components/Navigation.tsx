
import { useState } from "react";
import NavLogo from "./navigation/NavLogo";
import DesktopNavItems from "./navigation/DesktopNavItems";
import AuthSection from "./navigation/AuthSection";
import MobileNavMenu from "./navigation/MobileNavMenu";
import DarkModeToggle from "./DarkModeToggle";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="w-full bg-white/80 backdrop-blur-md border-b border-amber-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <NavLogo />

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            <DesktopNavItems />
            <DarkModeToggle />
            <AuthSection />
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-2">
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
            <DarkModeToggle />
          </div>
        </div>
        {/* Mobile Navigation */}
        <MobileNavMenu isOpen={isOpen} setIsOpen={setIsOpen} />
      </div>
    </nav>
  );
};

export default Navigation;
