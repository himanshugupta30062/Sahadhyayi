import React from "react";
import { Link } from "react-router-dom";

export const HeroContent: React.FC = () => {
  return (
    <div className="relative z-10 text-center max-w-sm px-4 sm:px-6 py-8 mx-auto">
      <h1 className="text-4xl sm:text-5xl font-bold mb-4">
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

      <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4">
        The Book Readers Social Media
      </h2>

      <p className="text-gray-300 text-base sm:text-lg mb-8 leading-relaxed">
        Find new books, connect with readers, and share your love of reading—all in one friendly community.
      </p>

      <Link to="/library">
        <button className="group px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 text-white rounded-full font-semibold transition-all duration-300 flex items-center justify-center gap-3 shadow-xl mx-auto text-base sm:text-lg hover:shadow-2xl hover:scale-105">
          <span role="img" aria-label="Book" className="group-hover:animate-bounce">📚</span>
          <span>Explore the Library</span>
        </button>
      </Link>
    </div>
  );
};