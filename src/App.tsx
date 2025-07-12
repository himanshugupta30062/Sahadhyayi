
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from "./contexts/AuthContext";
import { ChatbotProvider } from "./contexts/ChatbotContext";

import Index from "./pages/Index";
import BookLibrary from "./pages/BookLibrary";
import BookDetails from "./pages/BookDetails";
import Authors from "./pages/Authors";
import AuthorProfile from "./pages/AuthorProfile";
import AuthorDetails from "./pages/AuthorDetails";
import ReadingGroups from "./pages/ReadingGroups";
import ReaderMap from "./pages/ReaderMap";
import SocialMedia from "./pages/SocialMedia";
import HelpCenter from "./pages/HelpCenter";
import Feedback from "./pages/Feedback";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import About from "./pages/About";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import DmcaPolicy from "./pages/DmcaPolicy";
import Investors from "./pages/Investors";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Bookshelf from "./pages/Bookshelf";
import NotFound from "./pages/NotFound";

import Navigation from "./components/Navigation";
import GlobalFooter from "./components/GlobalFooter";
import ScrollToTop from "./components/ScrollToTop";
import BackToTopButton from "./components/BackToTopButton";
import Chatbot from "./components/chatbot/Chatbot";

import Blog from "./pages/Blog";
import CommunityStories from "./pages/CommunityStories";
import Quotes from "./pages/Quotes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (was cacheTime)
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

function App() {
  return (
    <TooltipProvider>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ChatbotProvider>
              <BrowserRouter>
              <div className="min-h-screen bg-background flex flex-col">
                <Navigation />
                <ScrollToTop />
                <main id="main-content" className="flex-1 pt-16">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/library" element={<BookLibrary />} />
                    <Route path="/book/:id" element={<BookDetails />} />
                    <Route path="/books/:bookId" element={<BookDetails />} />
                    <Route path="/authors" element={<Authors />} />
                    <Route path="/author/:authorName" element={<AuthorProfile />} />
                    <Route path="/author-details/:id" element={<AuthorDetails />} />
                    <Route path="/groups" element={<ReadingGroups />} />
                    <Route path="/map" element={<ReaderMap />} />
                    <Route path="/social" element={<SocialMedia />} />
                    <Route path="/help" element={<HelpCenter />} />
                    <Route path="/feedback" element={<Feedback />} />
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/cookies" element={<CookiePolicy />} />
                    <Route path="/dmca" element={<DmcaPolicy />} />
                    <Route path="/investors" element={<Investors />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/bookshelf" element={<Bookshelf />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/community-stories" element={<CommunityStories />} />
                    <Route path="/quotes" element={<Quotes />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <GlobalFooter />
                <BackToTopButton />
                <Toaster />
                <Chatbot />
              </div>
            </BrowserRouter>
          </ChatbotProvider>
        </AuthProvider>
      </QueryClientProvider>
      </HelmetProvider>
    </TooltipProvider>
  );
}

export default App;
