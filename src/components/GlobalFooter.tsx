
import React from "react";
import { Users, Mail, LogIn, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useCommunityStats } from "@/hooks/useCommunityStats";
import { useAuth } from "@/contexts/authHelpers";
import CommunityStats from "@/components/CommunityStats";
import SignInLink from '@/components/SignInLink';

const GlobalFooter = () => {
  
  
  const [showCount, setShowCount] = React.useState(false);
  const [hasJoined, setHasJoined] = React.useState(false);
  const [showSignIn, setShowSignIn] = React.useState(false);
  const { toast } = useToast();
  const { stats, isLoading, fetchStats, joinCommunity } = useCommunityStats(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (user && showSignIn) {
      setShowSignIn(false);
    }
  }, [user, showSignIn]);

  const handleEmailClick = () => {
    window.location.href = 'mailto:gyan@sahadhyayi.com';
  };

  const handleSocialClick = (platform: string) => {
    toast({
      title: `${platform} Coming Soon!`,
      description: "We're working on our social media presence. Stay tuned!",
    });
  };

  const handleShowStats = () => {
    if (!showCount) {
      fetchStats();
    }
    setShowCount(!showCount);
  };

  const handleJoinCommunity = async () => {
    if (hasJoined) return;

    if (!user) {
      // Remember intent to join after the user signs in
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('joinCommunityAfterSignIn', 'true');
        } catch {
          // ignore storage errors
        }
      }
      setShowSignIn(true);
      return;
    }

    // User is signed in, take them to social page and join community
    const success = await joinCommunity();
    if (success) {
      setHasJoined(true);
      toast({
        title: "Thanks for joining!",
        description: "Welcome to the Sahadhyayi reading community!",
      });
    } else {
      toast({
        title: "Welcome!",
        description: "Thanks for your interest in joining our community!",
      });
      setHasJoined(true);
    }
    
    // Navigate to social page
    navigate('/social');
  };

  return (
    <>
    <footer className="bg-gradient-to-r from-orange-600 to-amber-600 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Community Stats Section */}
        {showCount && (
          <div className="mb-8">
            <CommunityStats />
          </div>
        )}

        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img
                src="/lovable-uploads/sahadhyayi-logo-digital-reading.png"
                alt="Sahadhyayi footer logo"
                className="w-8 h-8 invert"
              />
              <h3 className="text-xl font-bold">Sahadhyayi</h3>
            </div>
            <p className="text-white text-sm mb-4">
              Rediscover the joy of deep reading through community, technology, and shared knowledge.
            </p>
            
            {/* Community Stats Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowStats}
              disabled={isLoading}
              className="border-white text-white bg-transparent hover:bg-white hover:text-orange-600 transition-all mb-4 font-medium"
            >
              <Users className="w-4 h-4 mr-2" />
              {isLoading ? 'Loading...' : showCount ? 'Hide Community Stats' : 'Show Community Stats'}
            </Button>
            
            {!showCount && (
              <div className="bg-orange-500/30 p-4 rounded-lg backdrop-blur-sm space-y-3 mb-4 text-white">
                <p>Click "Show Community Stats" to see how we're growing.</p>
                <Button
                  onClick={handleJoinCommunity}
                  disabled={hasJoined}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white transition-all"
                  size="sm"
                >
                  {hasJoined ? "Thanks for joining!" : "Join Community"}
                </Button>
              </div>
            )}
          </div>

          {/* Explore Sahadhyayi */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Explore Sahadhyayi</h4>
            <ul className="space-y-2 text-white">
              <li>
                <Link to="/library" className="hover:text-white transition-colors">
                  Digital Library
                </Link>
              </li>
              <li>
                <Link to="/discovery" className="hover:text-white transition-colors">
                  Discovery
                </Link>
              </li>
              <li>
                <Link to="/authors" className="hover:text-white transition-colors">
                  Meet Authors
                </Link>
              </li>
              <li>
                <Link to="/groups" className="hover:text-white transition-colors">
                  Reading Groups
                </Link>
              </li>
              <li>
                <Link to="/map" className="hover:text-white transition-colors">
                  Reader Map
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Support</h4>
            <ul className="space-y-2 text-white">
              <li>
                <Link to="/help" className="hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/community-guidelines" className="hover:text-white transition-colors">
                  Community Guidelines
                </Link>
              </li>
              <li>
                <button 
                  onClick={handleEmailClick}
                  className="hover:text-white transition-colors flex items-center text-left"
                >
                  <Mail className="w-3 h-3 mr-2" />
                  Contact Us
                </button>
              </li>
              <li>
                <Link to="/feedback" className="hover:text-white transition-colors">
                  Feedback
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Company</h4>
            <ul className="space-y-2 text-white">
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="hover:text-white transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/dmca" className="hover:text-white transition-colors">
                  DMCA Policy
                </Link>
              </li>
              <li>
                <Link to="/open-source-licenses" className="hover:text-white transition-colors">
                  Open Source Licenses
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-orange-500 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white text-sm">
            © 2024 Sahadhyayi. All rights reserved. Building a global reading community.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0 mr-24 md:mr-0">
            <a
              href="https://www.facebook.com/profile.php?id=61578920175928"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-white transition-colors p-2 hover:bg-orange-500 rounded"
              title="Facebook"
            >
              <span className="sr-only">Facebook</span>
              <Facebook className="h-4 w-4" />
            </a>
            <button
              onClick={() => handleSocialClick('Twitter')}
              className="text-white hover:text-white transition-colors p-2 hover:bg-orange-500 rounded"
              title="Twitter"
            >
              <span className="sr-only">Twitter</span>
              <Twitter className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleSocialClick('Instagram')}
              className="text-white hover:text-white transition-colors p-2 hover:bg-orange-500 rounded"
              title="Instagram"
            >
              <span className="sr-only">Instagram</span>
              <Instagram className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleSocialClick('LinkedIn')}
              className="text-white hover:text-white transition-colors p-2 hover:bg-orange-500 rounded"
              title="LinkedIn"
            >
              <span className="sr-only">LinkedIn</span>
              <Linkedin className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
    <Dialog open={showSignIn} onOpenChange={setShowSignIn}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-gray-900">
            Join the Sahadhyayi Community
          </DialogTitle>
        </DialogHeader>
        <div className="text-center space-y-4 py-4">
          <p className="text-gray-600">Please sign in to join our community.</p>
          <Button
            onClick={() => {
              setShowSignIn(false);
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('redirectScrollY', String(window.scrollY));
              }
              const redirect = `${location.pathname}${location.search}${location.hash}`;
              navigate(`/signin?redirect=${encodeURIComponent(redirect)}`, { state: { from: redirect } });
            }}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            <LogIn className="w-4 h-4 mr-2" /> Sign In
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default GlobalFooter;
