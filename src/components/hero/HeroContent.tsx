import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/authHelpers";

export const HeroContent: React.FC = () => {
  const { user } = useAuth();
  const primaryCta = user
    ? { to: "/dashboard", label: "Go to Dashboard" }
    : { to: "/library", label: "Explore Library" };

  return (
    <div className="relative z-10 text-center max-w-sm sm:max-w-sm px-4 sm:px-6 py-6 sm:py-8 mx-auto pointer-events-none hero-container">
      <h1 className="text-base sm:text-3xl md:text-5xl font-bold mb-1.5 sm:mb-4 text-slate-50">
        Sahadhyayi
      </h1>

      <p className="text-xs sm:text-lg md:text-2xl font-semibold text-slate-100 mb-1.5 sm:mb-4 leading-tight">
        The Book Readers Social Media
      </p>

      <p className="text-[10px] sm:text-sm md:text-lg mb-3 sm:mb-8 leading-relaxed text-slate-100">
        Find new books, connect with readers, and share your love of reading—all in one friendly community.
      </p>

      <Link to={primaryCta.to} className="pointer-events-auto">
        <button className="group px-2.5 sm:px-6 md:px-8 py-1.5 sm:py-3 md:py-4 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 text-white rounded-full font-semibold transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 md:gap-3 shadow-xl mx-auto text-[10px] sm:text-sm md:text-lg hover:shadow-2xl hover:scale-105 min-w-0">
          <span role="img" aria-label="Book" className="group-hover:animate-bounce text-[10px] sm:text-base">📚</span>
          <span className="whitespace-nowrap">{primaryCta.label}</span>
        </button>
      </Link>
    </div>
  );
};
