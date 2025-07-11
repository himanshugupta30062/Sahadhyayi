
import React from "react";
import { useAuth } from "@/contexts/AuthContext";

const Footer = () => {
  const { user } = useAuth();
  const email = user?.email || 'guest@sahadhyayi.com';

  return (
    <footer className="mt-16 px-8 py-6 rounded-t-xl bg-gradient-to-r from-orange-50 to-amber-50 border-t border-orange-100 shadow-inner flex flex-col md:flex-row items-center justify-between font-sans text-orange-700 text-sm animate-fade-in-up">
      <div className="flex gap-6 mb-2 md:mb-0">
        <a href="/about" className="hover:underline hover:text-orange-900 transition">About Us</a>
        <a href="/contact" className="hover:underline hover:text-orange-900 transition">Contact</a>
        <a href="/terms" className="hover:underline hover:text-orange-900 transition">Terms</a>
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
