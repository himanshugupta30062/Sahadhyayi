
import React from "react";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type DashboardHeaderProps = {
  user: any;
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

  return (
    <header className="bg-white/80 backdrop-blur-lg px-4 py-3 border-b border-stone-200 mb-6 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback className="bg-stone-400 text-white font-bold text-xl">
            {getInitials(fullName || user?.email)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-serif font-medium text-stone-800">
            Welcome, {fullName}!
          </h1>
          <p className="text-stone-500 text-sm">Sahadhyayi — Your Story, Your Legacy</p>
        </div>
      </div>
      <Button
        variant="outline"
        className="text-stone-700 hover:bg-stone-100 font-serif flex gap-2"
        onClick={handleLogout}
      >
        <LogOut className="w-4 h-4" />
        Log Out
      </Button>
    </header>
  );
};

export default DashboardHeader;
