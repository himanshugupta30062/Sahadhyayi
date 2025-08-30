import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Facebook, Twitter, Instagram, Linkedin, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/authHelpers';

const StructuredFooter = () => {
  const { user } = useAuth();

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