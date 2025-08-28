import React from "react";
import { Link } from "react-router-dom";
import { Mail, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const GlobalFooter = () => {
  return (
    <footer className="bg-zinc-950 text-zinc-300 text-sm">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Branding */}
          <div>
            <div className="flex items-center gap-2">
              <img
                src="/lovable-uploads/sahadhyayi-logo-digital-reading.png"
                alt="Sahadhyayi"
                className="h-8 w-8 invert"
              />
              <span className="text-xl font-semibold text-white">Sahadhyayi</span>
            </div>
            <p className="mt-4 leading-relaxed text-zinc-400">
              Building a global reading community through shared knowledge and deep reading.
            </p>
            <Link
              to="/social"
              className="mt-4 inline-block font-medium text-white hover:underline"
            >
              Join our community →
            </Link>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold text-white">Navigation</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/" className="hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/library" className="hover:text-white">
                  Library
                </Link>
              </li>
              <li>
                <Link to="/authors" className="hover:text-white">
                  Authors
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-white">
                  Help / FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h4 className="font-semibold text-white">Contact & Social</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <a
                  href="mailto:gyan@sahadhyayi.com"
                  className="inline-flex items-center hover:text-white"
                >
                  <Mail className="mr-2 h-4 w-4" /> gyan@sahadhyayi.com
                </a>
              </li>
              <li className="flex space-x-4 pt-2">
                <a
                  href="https://www.facebook.com/profile.php?id=61578920175928"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a
                  href="https://x.com/Sahadhyayi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href="https://www.instagram.com/sahadhyayi/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="https://www.linkedin.com/company/sahadhyayi/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-white">Legal</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/privacy" className="hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white">
                  Terms of Use
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-zinc-800 pt-6 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} Sahadhyayi. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default GlobalFooter;

