import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

import { AuthProvider } from "./contexts/AuthContext";
import { ChatbotProvider } from "./contexts/ChatbotContext";

import Index from "./pages/Index";
import BookLibrary from "./pages/BookLibrary";
import BookDetails from "./pages/BookDetails";
import AuthorDetails from "./pages/AuthorDetails";
import ReadingGroups from "./pages/ReadingGroups";
import ReaderMap from "./pages/ReaderMap";
import SocialFeed from "./pages/SocialFeed";
import HelpCenter from "./pages/HelpCenter";
import FeedbackPage from "./pages/FeedbackPage";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import DMCACompliance from "./pages/DMCACompliance";
import InvestorRelations from "./pages/InvestorRelations";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import BookShelf from "./pages/BookShelf";
import NotFound from "./pages/NotFound";

import Navigation from "./components/navigation/Navigation";
import GlobalFooter from "./components/footer/GlobalFooter";
import Chatbot from "./components/chatbot/Chatbot";
import ScrollToTop from "./components/ScrollToTop";

import Blog from "./pages/Blog";
import CommunityStories from "./pages/CommunityStories";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ChatbotProvider>
            <BrowserRouter>
              <div className="min-h-screen bg-background">
                <Navigation />
                <ScrollToTop />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/library" element={<BookLibrary />} />
                    <Route path="/book/:bookId" element={<BookDetails />} />
                    <Route path="/author/:authorId" element={<AuthorDetails />} />
                    <Route path="/groups" element={<ReadingGroups />} />
                    <Route path="/map" element={<ReaderMap />} />
                    <Route path="/social" element={<SocialFeed />} />
                    <Route path="/help" element={<HelpCenter />} />
                    <Route path="/feedback" element={<FeedbackPage />} />
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/cookies" element={<CookiePolicy />} />
                    <Route path="/dmca" element={<DMCACompliance />} />
                    <Route path="/investors" element={<InvestorRelations />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/bookshelf" element={<BookShelf />} />
                    <Route path="*" element={<NotFound />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/community-stories" element={<CommunityStories />} />
                  </Routes>
                </main>
                <GlobalFooter />
                <Toaster />
                <Chatbot />
              </div>
            </BrowserRouter>
          </ChatbotProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
