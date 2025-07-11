
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Footer = () => {
  const { user } = useAuth();
  const email = user?.email || 'guest@sahadhyayi.com';

  return (
    <footer className="mt-16 px-8 py-6 rounded-t-xl bg-gradient-to-r from-orange-50 to-amber-50 border-t border-orange-100 shadow-inner flex flex-col md:flex-row items-center justify-between font-sans text-orange-700 text-sm animate-fade-in-up">
      <div className="flex gap-6 mb-2 md:mb-0">
        <Link to="/about" className="hover:underline hover:text-orange-900 transition">About Us</Link>
        <Link to="/feedback" className="hover:underline hover:text-orange-900 transition">Contact</Link>
        <Link to="/terms-of-service" className="hover:underline hover:text-orange-900 transition">Terms</Link>
        <Link to="/privacy-policy" className="hover:underline hover:text-orange-900 transition">Privacy</Link>
        <Link to="/help-center" className="hover:underline hover:text-orange-900 transition">Help</Link>
      </div>
      <div>
        {user ? (
          <>Logged in as <span className="font-medium text-orange-800">{email}</span></>
        ) : (
          <span className="text-orange-600">Welcome to Sahadhyayi</span>
        )}
      </div>
    </footer>
  );
};

export default Footer;
