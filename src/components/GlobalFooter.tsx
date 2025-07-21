
import { useState } from "react";
import { Users, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCommunityStats } from "@/hooks/useCommunityStats";
import CommunityStats from "@/components/CommunityStats";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const GlobalFooter = () => {
  const [showCount, setShowCount] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const { toast } = useToast();
  const { stats, isLoading, fetchStats, joinCommunity } = useCommunityStats(false);
  const { user } = useAuth();
  const navigate = useNavigate();

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
      toast({
        title: 'Sign in required',
        description: 'Please sign in to join the Sahadhyayi community.'
      });
      navigate('/signin');
      return;
    }

    const success = await joinCommunity();
    if (success) {
      setHasJoined(true);
      toast({
        title: 'Thanks for joining!',
        description: 'Welcome to the Sahadhyayi reading community!'
      });
      navigate('/social');
    } else {
      toast({
        title: 'Welcome!',
        description: 'Thanks for your interest in joining our community!'
      });
      setHasJoined(true);
      navigate('/social');
    }
  };

  return (
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
                src="/lovable-uploads/fff3e49f-a95f-4fcf-ad47-da2dc6626f29.png"
                alt="Sahadhyayi footer logo"
                className="w-8 h-8 invert"
              />
              <h3 className="text-xl font-bold">Sahadhyayi</h3>
            </div>
            <p className="text-orange-100 text-sm mb-4">
              Rediscover the joy of deep reading through community, technology, and shared knowledge.
            </p>
            
            {/* Community Stats Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowStats}
              disabled={isLoading}
              className="border-orange-200 text-orange-100 hover:bg-orange-500 hover:text-white transition-all mb-4"
            >
              <Users className="w-4 h-4 mr-2" />
              {isLoading ? 'Loading...' : showCount ? 'Hide Community Stats' : 'Show Community Stats'}
            </Button>
            
            {!showCount && (
              <div className="bg-orange-500/30 p-4 rounded-lg backdrop-blur-sm space-y-3 mb-4 text-orange-100">
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
            <ul className="space-y-2 text-orange-100">
              <li>
                <a href="/library" className="hover:text-white transition-colors">
                  Digital Library
                </a>
              </li>
              <li>
                <a href="/authors" className="hover:text-white transition-colors">
                  Meet Authors
                </a>
              </li>
              <li>
                <a href="/groups" className="hover:text-white transition-colors">
                  Reading Groups
                </a>
              </li>
              <li>
                <a href="/map" className="hover:text-white transition-colors">
                  Reader Map
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Support</h4>
            <ul className="space-y-2 text-orange-100">
              <li>
                <a href="/help" className="hover:text-white transition-colors">
                  Help Center
                </a>
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
                <a href="/feedback" className="hover:text-white transition-colors">
                  Feedback
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Company</h4>
            <ul className="space-y-2 text-orange-100">
              <li>
                <a href="/about" className="hover:text-white transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/cookies" className="hover:text-white transition-colors">
                  Cookie Policy
                </a>
              </li>
              <li>
                <a href="/dmca" className="hover:text-white transition-colors">
                  DMCA Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-orange-500 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-orange-100 text-sm">
            © 2024 Sahadhyayi. All rights reserved. Building a global reading community.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <button 
              onClick={() => handleSocialClick('Facebook')}
              className="text-orange-100 hover:text-white transition-colors p-2 hover:bg-orange-500 rounded"
              title="Facebook"
            >
              <span className="sr-only">Facebook</span>
              📘
            </button>
            <button 
              onClick={() => handleSocialClick('Twitter')}
              className="text-orange-100 hover:text-white transition-colors p-2 hover:bg-orange-500 rounded"
              title="Twitter"
            >
              <span className="sr-only">Twitter</span>
              🐦
            </button>
            <button 
              onClick={() => handleSocialClick('Instagram')}
              className="text-orange-100 hover:text-white transition-colors p-2 hover:bg-orange-500 rounded"
              title="Instagram"
            >
              <span className="sr-only">Instagram</span>
              📷
            </button>
            <button 
              onClick={() => handleSocialClick('LinkedIn')}
              className="text-orange-100 hover:text-white transition-colors p-2 hover:bg-orange-500 rounded"
              title="LinkedIn"
            >
              <span className="sr-only">LinkedIn</span>
              💼
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default GlobalFooter;
