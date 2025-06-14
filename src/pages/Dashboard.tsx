
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StoriesSection from "@/components/dashboard/StoriesSection";
import ReadingTracker from "@/components/dashboard/ReadingTracker";

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<{ full_name?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Handle session persistence + route protection
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) navigate("/signin");
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) navigate("/signin");
    });
    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, [navigate]);

  // Load user profile for welcome message
  useEffect(() => {
    async function loadProfile() {
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .maybeSingle();
        if (data) setProfile(data);
      }
      setLoading(false);
    }
    if (session?.user?.id) loadProfile();
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100 font-serif">
        <span className="text-gray-700 text-xl">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <main className="min-h-screen font-serif bg-gradient-to-br from-neutral-100 to-stone-200">
      <DashboardHeader 
        user={session?.user} 
        fullName={profile?.full_name || session?.user?.email?.split("@")[0]}
      />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">
        <StoriesSection userId={session.user.id} />
        <ReadingTracker userId={session.user.id} />
      </div>
    </main>
  );
};

export default Dashboard;
