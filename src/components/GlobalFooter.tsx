import React from "react";
import { Users, Mail, LogIn, Facebook, Twitter, Instagram, Linkedin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useCommunityStats } from "@/hooks/useCommunityStats";
import { useAuth } from "@/contexts/authHelpers";
import CommunityStats from "@/components/CommunityStats";

const GlobalFooter = () => {
  const [showCount, setShowCount] = React.useState(false);
  const [hasJoined, setHasJoined] = React.useState(false);
  const [showSignIn, setShowSignIn] = React.useState(false);
  const { toast } = useToast();
  const { isLoading, fetchStats, joinCommunity } = useCommunityStats(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (user && showSignIn) setShowSignIn(false);
  }, [user, showSignIn]);

  const handleEmailClick = () => (window.location.href = "mailto:gyan@sahadhyayi.com");

  const handleShowStats = () => {
    if (!showCount) fetchStats();
    setShowCount((s) => !s);
  };

  const handleJoinCommunity = async () => {
    if (hasJoined) return;
    if (!user) {
      try {
        localStorage.setItem("joinCommunityAfterSignIn", "true");
      } catch {
        // ignore storage errors
      }
      setShowSignIn(true);
      return;
    }
    const success = await joinCommunity();
    setHasJoined(true);
    toast({
      title: success ? "Thanks for joining!" : "Welcome!",
      description: success
        ? "Welcome to the Sahadhyayi reading community!"
        : "Thanks for your interest in joining our community!",
    });
    navigate("/social");
  };

  return (
    <>
      <footer className="relative isolate bg-black text-zinc-200">
        <div className="mx-auto max-w-7xl px-6 py-16">
          {/* Community stats (toggle) */}
          {showCount && (
            <div className="mb-10">
              <CommunityStats />
            </div>
          )}

          <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
            {/* Brand + blurb + actions */}
            <div className="md:col-span-5">
              <div className="flex items-center gap-3">
                <img
                  src="/lovable-uploads/sahadhyayi-logo-digital-reading.png"
                  alt="Sahadhyayi"
                  className="h-8 w-8 invert"
                />
                <h3 className="text-2xl font-semibold tracking-tight">Sahadhyayi</h3>
              </div>

              <p className="mt-5 max-w-md text-sm leading-6 text-zinc-400">
                Rediscover the joy of deep reading through community, technology, and shared knowledge.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShowStats}
                  disabled={isLoading}
                  className="border-zinc-700 text-zinc-200 bg-transparent hover:bg-zinc-900 hover:text-white"
                >
                  <Users className="mr-2 h-4 w-4" />
                  {isLoading ? "Loading..." : showCount ? "Hide Community Stats" : "Show Community Stats"}
                </Button>

                {!showCount && (
                  <Button
                    onClick={handleJoinCommunity}
                    disabled={hasJoined}
                    size="sm"
                    className="bg-zinc-800 hover:bg-zinc-700 text-white"
                  >
                    {hasJoined ? "Thanks for joining!" : "Join Community"}
                  </Button>
                )}
              </div>

              {/* Social pills */}
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="https://www.facebook.com/profile.php?id=61578920175928"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                >
                  <Facebook className="h-4 w-4" /> Facebook
                </a>
                <a
                  href="https://x.com/Sahadhyayi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                >
                  <Twitter className="h-4 w-4" /> Twitter
                </a>
                <a
                  href="https://www.instagram.com/sahadhyayi/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                >
                  <Instagram className="h-4 w-4" /> Instagram
                </a>
                <a
                  href="https://www.linkedin.com/company/sahadhyayi/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
                >
                  <Linkedin className="h-4 w-4" /> LinkedIn
                </a>
              </div>
            </div>

            {/* Link columns */}
            <div className="md:col-span-7">
              <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
                {/* Explore */}
                <nav aria-label="Explore Sahadhyayi">
                  <h4 className="text-sm font-semibold text-white">Explore Sahadhyayi</h4>
                  <ul className="mt-4 space-y-3">
                    {[
                      { label: "Digital Library", href: "/library" },
                      { label: "Discovery", href: "/discovery" },
                      { label: "Meet Authors", href: "/authors" },
                      { label: "Reading Groups", href: "/groups" },
                      { label: "Reader Map", href: "/map" },
                    ].map((i) => (
                      <li key={i.label}>
                        <Link
                          to={i.href}
                          className="group inline-flex items-center text-sm text-zinc-400 transition hover:text-white"
                        >
                          <span className="relative">
                            {i.label}
                            <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-zinc-600 transition-all duration-200 group-hover:w-full" />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>

                {/* Support */}
                <nav aria-label="Support">
                  <h4 className="text-sm font-semibold text-white">Support</h4>
                  <ul className="mt-4 space-y-3">
                    {[
                      { label: "Help Center", href: "/help" },
                      { label: "Community Guidelines", href: "/community-guidelines" },
                    ].map((i) => (
                      <li key={i.label}>
                        <Link
                          to={i.href}
                          className="group inline-flex items-center text-sm text-zinc-400 transition hover:text-white"
                        >
                          <span className="relative">
                            {i.label}
                            <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-zinc-600 transition-all duration-200 group-hover:w-full" />
                          </span>
                        </Link>
                      </li>
                    ))}
                    <li>
                      <button
                        onClick={handleEmailClick}
                        className="group inline-flex items-center text-sm text-zinc-400 hover:text-white"
                      >
                        <Mail className="mr-2 h-3 w-3" />
                        <span className="relative">
                          Contact Us
                          <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-zinc-600 transition-all duration-200 group-hover:w-full" />
                        </span>
                      </button>
                    </li>
                    <li>
                      <Link to="/feedback" className="group inline-flex items-center text-sm text-zinc-400 hover:text-white">
                        <span className="relative">
                          Feedback
                          <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-zinc-600 transition-all duration-200 group-hover:w-full" />
                        </span>
                      </Link>
                    </li>
                  </ul>
                </nav>

                {/* Company */}
                <nav aria-label="Company">
                  <h4 className="text-sm font-semibold text-white">Company</h4>
                  <ul className="mt-4 space-y-3">
                    {[
                      { label: "About Us", href: "/about" },
                      { label: "Privacy Policy", href: "/privacy" },
                      { label: "Terms of Service", href: "/terms" },
                      { label: "Cookie Policy", href: "/cookies" },
                      { label: "DMCA Policy", href: "/dmca" },
                      { label: "Open Source Licenses", href: "/open-source-licenses" },
                    ].map((i) => (
                      <li key={i.label}>
                        <Link
                          to={i.href}
                          className="group inline-flex items-center text-sm text-zinc-400 transition hover:text-white"
                        >
                          <span className="relative">
                            {i.label}
                            <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-zinc-600 transition-all duration-200 group-hover:w-full" />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </div>
          </div>

          {/* bottom row */}
          <div className="mt-12 border-t border-zinc-900 pt-6 text-xs text-zinc-500">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
              <p>© {new Date().getFullYear()} Sahadhyayi. All rights reserved. Building a global reading community.</p>
              <div className="text-zinc-400">
                {user ? (
                  <>Logged in as <span className="font-medium text-zinc-300">{user.email}</span></>
                ) : (
                  <span>Welcome to Sahadhyayi</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* (Optional) floating WhatsApp */}
        <a
          href="https://wa.me/919999999999" // ← your number
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="fixed bottom-6 right-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-300 md:bottom-8 md:right-8"
        >
          <MessageCircle className="h-6 w-6" />
        </a>
      </footer>

      {/* sign-in dialog */}
      <Dialog open={showSignIn} onOpenChange={setShowSignIn}>
        <DialogContent className="mx-4 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold text-gray-900">
              Join the Sahadhyayi Community
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 text-center">
            <p className="text-gray-600">Please sign in to join our community.</p>
            <Button
              onClick={() => {
                setShowSignIn(false);
                try {
                  sessionStorage.setItem("redirectScrollY", String(window.scrollY));
                } catch {
                  // ignore storage errors
                }
                const redirect = `${location.pathname}${location.search}${location.hash}`;
                navigate(`/signin?redirect=${encodeURIComponent(redirect)}`, { state: { from: redirect } });
              }}
              className="w-full bg-black text-white hover:bg-zinc-900"
            >
              <LogIn className="mr-2 h-4 w-4" /> Sign In
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GlobalFooter;

