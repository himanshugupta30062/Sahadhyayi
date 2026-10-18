import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Heart,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '@/contexts/authHelpers';
import { CommunityPulseDialog } from '@/components/community-pulse/CommunityPulseDialog';

const StructuredFooter = () => {
  const { user } = useAuth();
  const [isPulseOpen, setIsPulseOpen] = useState(false);

  const footerSections = [
    {
      title: 'Explore',
      links: [
        { name: 'Digital Library', href: '/library' },
        { name: 'Articles & Stories', href: '/articles' },
        { name: 'Authors', href: '/authors' },
        { name: 'Reader Map', href: '/map' },
      ],
    },
    {
      title: 'Community',
      links: [
        { name: 'Reading Feed', href: '/social' },
        { name: 'Reading Groups', href: '/groups' },
        { name: 'Live Reading Rooms', href: '/social?tab=rooms' },
        { name: 'Community Guidelines', href: '/community-guidelines' },
      ],
    },
    {
      title: 'Support & About',
      links: [
        { name: 'About Sahadhyayi', href: '/about' },
        { name: 'Help Center', href: '/help-center' },
        { name: 'Contact & Feedback', href: '/feedback' },
      ],
    },
    {
      title: 'Legal & Policies',
      links: [
        { name: 'Privacy Policy', href: '/privacy-policy' },
        { name: 'Terms of Service', href: '/terms-of-service' },
        { name: 'Cookie Policy', href: '/cookie-policy' },
      ],
    },
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
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-8 items-start">
          {/* Brand Section */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img
                src="/lovable-uploads/logo-small.webp"
                alt=""
                aria-hidden="true"
                className="w-8 h-8"
                width={32}
                height={32}
                loading="lazy"
              />
              <span className="text-xl font-bold">Sahadhyayi</span>
            </div>
            <p className="text-stone-300 text-sm leading-relaxed mb-6 max-w-sm">
              Rediscover the joy of deep reading through community, technology, and shared knowledge. Join fellow readers worldwide.
            </p>

            {/* Editorial Live Website Stats Trigger Card */}
            <div className="max-w-md">
              <button
                type="button"
                onClick={() => setIsPulseOpen(true)}
                aria-label="Open Live Website Stats"
                className="group w-full text-left p-4 rounded-xl border border-white/[0.09] bg-[#111614] hover:border-[#D5B16D]/50 hover:bg-[#151d18] transition-all flex items-center justify-between gap-4 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D5B16D] focus-visible:ring-offset-2"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-[#18241e] flex items-center justify-center text-[#D5B16D] flex-shrink-0 border border-white/5">
                    <BarChart3 className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-stone-100 flex items-center gap-2">
                      Live Website Stats
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <p className="text-xs text-stone-300 truncate mt-0.5">
                      Real-time traffic, visitors & reading activity across Sahadhyayi.
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-[#D5B16D] transition-colors flex-shrink-0" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title} className="col-span-1">
              <h3 className="text-sm font-semibold text-white mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-sm text-stone-300 hover:text-white transition-colors duration-200 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-sm"
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
              <h3 className="text-sm font-semibold mb-3">Follow Us</h3>
              <div className="flex space-x-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-gray-700 rounded-lg hover:bg-brand-primary transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                      aria-label={`Follow us on ${social.name}`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* User Status */}
            <div className="text-sm text-stone-300">
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
          <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-stone-300">
            <div className="flex items-center mb-2 sm:mb-0">
              <span>© {new Date().getFullYear()} Sahadhyayi. All rights reserved.</span>
              <span className="mx-2">•</span>
              <span className="flex items-center">
                Made with <Heart className="w-3 h-3 mx-1 text-red-400" aria-hidden="true" /> for readers worldwide
              </span>
            </div>
            <div className="text-xs text-stone-400">
              Building a global reading community
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Community Pulse Dialog / Drawer */}
      <CommunityPulseDialog
        open={isPulseOpen}
        onClose={() => setIsPulseOpen(false)}
      />
    </footer>
  );
};

export default StructuredFooter;