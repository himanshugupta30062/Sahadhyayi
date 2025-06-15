
import React from "react";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { User } from '@supabase/supabase-js';

// Rotate quotes based on day of year
const quotes = [
  "“A reader lives a thousand lives before he dies.” — George R.R. Martin",
  "“Books are a uniquely portable magic.” — Stephen King",
  "“There is no friend as loyal as a book.” — Hemingway",
  "“We write to taste life twice.” — Anaïs Nin",
  "“To learn to read is to light a fire.” — Victor Hugo",
  "“Stories are a communal currency of humanity.” — Tahir Shah",
  "“The more that you read, the more things you will know.” — Dr. Seuss",
];
function getQuoteOfTheDay() {
  const day = new Date().getDate() % quotes.length;
  return quotes[day];
}

type DashboardHeaderProps = {
  user: User | null;
  fullName: string;
};

const getInitials = (name: string) =>
  name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "";

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user, fullName }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.replace("/signin");
  };

  // Use avatar from user metadata if available
  const avatarUrl = user?.user_metadata?.avatar_url
    ? user.user_metadata.avatar_url
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=FFEDC5&color=6D4C1A&font-size=0.4`;

  return (
    <header className="px-5 py-6 border-b border-orange-100 mb-7 flex flex-col sm:flex-row items-center justify-between bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl shadow animate-fade-in-up">
      <div className="flex items-center gap-5">
        <Avatar>
          <img
            src={avatarUrl}
            alt={fullName}
            className="h-16 w-16 rounded-full block object-cover border-2 border-orange-200 shadow"
          />
          <AvatarFallback className="bg-orange-300 text-white font-bold font-lora text-2xl">
            {getInitials(fullName || user?.email)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl sm:text-4xl font-lora text-orange-900 mb-1 font-semibold tracking-tight animate-fade-in-up">
            Welcome, <span className="font-bold">{fullName}</span>!
          </h1>
          <p className="text-amber-700 text-lg font-serif mb-2 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            {getQuoteOfTheDay()}
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        className="mt-5 sm:mt-0 text-orange-700 border-orange-300 hover:bg-orange-100 font-sans font-semibold rounded-full shadow transition-all duration-200 transform hover:scale-105 hover:shadow-lg animate-fade-in-up"
        onClick={handleLogout}
      >
        <LogOut className="w-5 h-5 mr-1" />
        Log Out
      </Button>
    </header>
  );
};

export default DashboardHeader;
