
import { useState, useEffect } from "react";
import { Users, Mail, Heart, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const GlobalFooter = () => {
  const [memberCount, setMemberCount] = useState(15847);
  const [showCount, setShowCount] = useState(false);
  const { toast } = useToast();

  // Simulate real-time member count updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMemberCount(prev => prev + Math.floor(Math.random() * 3));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleEmailClick = () => {
    window.location.href = 'mailto:gyan@sahadhyayi.com';
  };

  const handleSocialClick = (platform: string) => {
    toast({
      title: `${platform} Coming Soon!`,
      description: "We're working on our social media presence. Stay tuned!",
    });
  };

  return (
    <footer className="bg-gradient-to-r from-orange-600 to-amber-600 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img 
                src="/lovable-uploads/fff3e49f-a95f-4fcf-ad47-da2dc6626f29.png" 
                alt="Sahadhyayi Logo" 
                className="w-8 h-8 invert" 
              />
              <h3 className="text-xl font-bold">Sahadhyayi</h3>
            </div>
            <p className="text-orange-100 text-sm mb-4">
              Reviving the transformative power of deep reading through community, technology, and shared knowledge.
            </p>
            
            {/* Community Stats Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCount(!showCount)}
              className="border-orange-200 text-orange-100 hover:bg-orange-500 hover:text-white transition-all mb-4"
            >
              <Users className="w-4 h-4 mr-2" />
              {showCount ? `${memberCount.toLocaleString()} Members` : 'Show Community Size'}
            </Button>
            
            {showCount && (
              <div className="bg-orange-500/30 p-3 rounded-lg backdrop-blur-sm">
                <p className="text-sm text-orange-100 flex items-center">
                  <Heart className="w-4 h-4 mr-2 text-red-300" />
                  Join <span className="font-bold text-white mx-1">{memberCount.toLocaleString()}</span> readers worldwide!
                </p>
                <p className="text-xs text-orange-200 mt-1">Growing every day</p>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Explore</h4>
            <ul className="space-y-2 text-orange-100">
              <li>
                <a href="/library" className="hover:text-white transition-colors flex items-center">
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
                <a href="/reviews" className="hover:text-white transition-colors">
                  Community
                </a>
              </li>
              <li>
                <a href="/map" className="hover:text-white transition-colors">
                  Reader Map
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Support</h4>
            <ul className="space-y-2 text-orange-100">
              <li>
                <a href="/about" className="hover:text-white transition-colors">
                  About Us
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
                <a href="/help" className="hover:text-white transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="/feedback" className="hover:text-white transition-colors">
                  Send Feedback
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Policies */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Legal</h4>
            <ul className="space-y-2 text-orange-100">
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
