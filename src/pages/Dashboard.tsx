
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StoriesSection from "@/components/dashboard/StoriesSection";
import ReadingTracker from "@/components/dashboard/ReadingTracker";
import Footer from "@/components/dashboard/Footer";

const Dashboard = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<{ full_name?: string } | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    async function loadProfile() {
      if (session?.user?.id) {
        const { data } = await supabase
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 font-lora text-orange-800">
        <span className="text-2xl font-bold">Loading dashboard…</span>
      </div>
    );
  }

  return (
    <main
      className="min-h-screen flex flex-col font-lora bg-dashboard-gradient bg-dashboard-texture
      animate-fade-in-up transition-colors duration-500"
    >
      <div className="grow max-w-5xl mx-auto w-full px-3 py-6 flex flex-col gap-10">
        <DashboardHeader
          user={session?.user}
          fullName={profile?.full_name || session?.user?.email?.split("@")[0]}
        />
        <StoriesSection userId={session.user.id} />
        <ReadingTracker userId={session.user.id} />
      </div>
      <Footer email={session?.user?.email} />
    </main>
  );
};

export default Dashboard;
