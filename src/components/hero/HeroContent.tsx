import React from "react";
import { Link } from "react-router-dom";

export const HeroContent: React.FC = () => {
  return (
    <div className="relative z-10 text-center max-w-sm sm:max-w-sm px-4 sm:px-6 py-6 sm:py-8 mx-auto pointer-events-none hero-container">
      <h1 className="text-lg sm:text-3xl md:text-5xl font-bold mb-2 sm:mb-4">
        <span
          className="text-transparent bg-clip-text animate-gradient-shift"
          style={{
            backgroundImage: "linear-gradient(135deg, #ef4444, #22c55e, #3b82f6)",
            backgroundSize: "200% 200%",
          }}
        >
          Sahadhyayi
        </span>
      </h1>

      <h2 className="text-sm sm:text-lg md:text-2xl font-semibold text-white mb-2 sm:mb-4 leading-tight">
        The Book Readers Social Media
      </h2>

      <p className="text-xs sm:text-sm md:text-lg mb-4 sm:mb-8 leading-relaxed">
        Find new books, connect with readers, and share your love of reading—all in one friendly community.
      </p>

      <Link to="/library" className="pointer-events-auto">
        <button className="group px-3 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 text-white rounded-full font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 shadow-xl mx-auto text-xs sm:text-sm md:text-lg hover:shadow-2xl hover:scale-105 min-w-0">
          <span role="img" aria-label="Book" className="group-hover:animate-bounce text-xs sm:text-base">📚</span>
          <span className="whitespace-nowrap">Explore Library</span>
        </button>
      </Link>
    </div>
  );
};