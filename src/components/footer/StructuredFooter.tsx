import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Facebook, Twitter, Instagram, Linkedin, Heart, Users, Eye, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/authHelpers';
import { Button } from '@/components/ui/button';
import CommunityStats from '@/components/CommunityStats';

const StructuredFooter = () => {
  const { user } = useAuth();
  const [showStats, setShowStats] = useState(false);

  const footerSections = [
    {
      title: 'Explore',
      links: [
        { name: 'Digital Library', href: '/library' },
        { name: 'Authors', href: '/authors' },
        { name: 'Community', href: '/social' },
        { name: 'Reading Groups', href: '/groups' },
        { name: 'Reader Map', href: '/map' },
      ]
    },
    {
      title: 'Support',
      links: [
        { name: 'Help Center', href: '/help-center' },
        { name: 'Contact Us', href: '/feedback' },
        { name: 'Community Guidelines', href: '/community-guidelines' },
        { name: 'Report Issue', href: '/feedback' },
      ]
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '/about' },
        { name: 'Privacy Policy', href: '/privacy-policy' },
        { name: 'Terms of Service', href: '/terms-of-service' },
        { name: 'Cookie Policy', href: '/cookie-policy' },
      ]
    }
  ];

  const socialLinks = [
    { name: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61578920175928', icon: Facebook },
    { name: 'Twitter', href: 'https://x.com/Sahadhyayi', icon: Twitter },
    { name: 'Instagram', href: 'https://www.instagram.com/sahadhyayi/', icon: Instagram },
    { name: 'LinkedIn', href: 'https://www.linkedin.com/company/sahadhyayi/', icon: Linkedin },
  ];

  return (
    <footer className="bg-text-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Community Stats Section */}
        {showStats && (
          <div className="mb-12 bg-black/50 rounded-2xl p-6">
            <CommunityStats />
          </div>
        )}
        
        {/* Community Actions */}
        <div className="mb-12 text-center">
          <div className="bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20 rounded-2xl p-8 border border-white/10">
            <h3 className="text-2xl font-bold mb-4">Join the Sahadhyayi Community</h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Connect with fellow readers, discover amazing books, and be part of a global reading revolution.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {user ? (
                <Link to="/dashboard">
                  <Button className="bg-brand-primary hover:bg-brand-secondary text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/signup">
                    <Button className="bg-brand-primary hover:bg-brand-secondary text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Join Community
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to="/signin">
                    <Button variant="outline" className="border-white text-white hover:bg-white hover:text-brand-primary px-8 py-3 rounded-lg font-semibold">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
              
              <Button
                variant="ghost"
                onClick={() => setShowStats(!showStats)}
                className="text-gray-300 hover:text-white flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {showStats ? 'Hide' : 'Show'} Community Stats
              </Button>
            </div>
          </div>
        </div>
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <img
                src="/lovable-uploads/sahadhyayi-logo-digital-reading.png"
                alt="Sahadhyayi"
                className="w-8 h-8"
              />
              <span className="text-xl font-bold">Sahadhyayi</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-6 max-w-xs">
              Rediscover the joy of deep reading through community, technology, and shared knowledge. Join fellow readers worldwide.
            </p>
            
            {/* Newsletter Signup */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold mb-3">Stay Connected</h4>
              <div className="flex space-x-3">
                <a
                  href="mailto:gyan@sahadhyayi.com"
                  className="inline-flex items-center px-3 py-2 text-sm bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Us
                </a>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold text-white mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-sm text-gray-300 hover:text-white transition-colors duration-200 block"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social Links */}
        <div className="border-t border-gray-700 pt-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="mb-4 sm:mb-0">
              <h4 className="text-sm font-semibold mb-3">Follow Us</h4>
              <div className="flex space-x-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-gray-700 rounded-lg hover:bg-brand-primary transition-colors duration-200"
                      aria-label={`Follow us on ${social.name}`}
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                })}
              </div>
            </div>
            
            {/* User Status */}
            <div className="text-sm text-gray-400">
              {user ? (
                <span>
                  Welcome back, <span className="text-white font-medium">{user.email}</span>
                </span>
              ) : (
                <span>Join our reading community today</span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-400">
            <div className="flex items-center mb-2 sm:mb-0">
              <span>© {new Date().getFullYear()} Sahadhyayi. All rights reserved.</span>
              <span className="mx-2">•</span>
              <span className="flex items-center">
                Made with <Heart className="w-3 h-3 mx-1 text-red-400" /> for readers worldwide
              </span>
            </div>
            <div className="text-xs">
              Building a global reading community
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default StructuredFooter;