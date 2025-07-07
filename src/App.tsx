
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React, { Suspense } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ChatbotProvider } from "@/contexts/ChatbotContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Chatbot from "@/components/chatbot/Chatbot";
import Navigation from "./components/Navigation";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingSpinner from "./components/LoadingSpinner";
import ScrollToTop from "./components/ScrollToTop";

const Index = React.lazy(() => import("./pages/Index"));
const About = React.lazy(() => import("./pages/About"));
const Bookshelf = React.lazy(() => import("./pages/Bookshelf"));
const BookLibrary = React.lazy(() => import("./pages/BookLibrary"));
const ReadingGroups = React.lazy(() => import("./pages/ReadingGroups"));
const SocialMedia = React.lazy(() => import("./pages/SocialMedia"));
const AuthorConnect = React.lazy(() => import("./pages/AuthorConnect"));
const ReaderMap = React.lazy(() => import("./pages/ReaderMap"));
const Investors = React.lazy(() => import("./pages/Investors"));
const SignUp = React.lazy(() => import("./pages/SignUp"));
const SignIn = React.lazy(() => import("./pages/SignIn"));
const Quotes = React.lazy(() => import("./pages/Quotes"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const Profile = React.lazy(() => import("./pages/Profile"));
const BookDetails = React.lazy(() => import("./pages/BookDetails"));
const BookSearchTest = React.lazy(() => import("./pages/BookSearchTest"));

// Footer Pages
const HelpCenter = React.lazy(() => import("./pages/HelpCenter"));
const Feedback = React.lazy(() => import("./pages/Feedback"));
const PrivacyPolicy = React.lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = React.lazy(() => import("./pages/TermsOfService"));
const CookiePolicy = React.lazy(() => import("./pages/CookiePolicy"));
const DmcaPolicy = React.lazy(() => import("./pages/DmcaPolicy"));

import GlobalFooter from "./components/GlobalFooter";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      // Cache query results for 5 minutes to avoid repeated
      // metadata requests that hit PostgREST on every render
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000, // Updated from cacheTime to gcTime
    },
  },
});

// Route wrapper to handle authenticated user redirects
const AuthenticatedRouteWrapper = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner type="page" />;
  }
  
  // If user is authenticated and tries to access home page, redirect to dashboard
  if (user && window.location.pathname === '/') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ChatbotProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
                <Navigation />
                <Suspense fallback={<LoadingSpinner type="page" />}>
                <Routes>
                  <Route path="/" element={
                    <AuthenticatedRouteWrapper>
                      <Index />
                    </AuthenticatedRouteWrapper>
                  } />
                  <Route path="/about" element={<About />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/signin" element={<SignIn />} />
                  <Route path="/investors" element={<Investors />} />
                  
                  {/* Protected Routes */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/bookshelf" element={
                    <ProtectedRoute>
                      <Bookshelf />
                    </ProtectedRoute>
                  } />
                  <Route path="/library" element={<BookLibrary />} />
                  <Route path="/books/:id" element={<BookDetails />} />
                  <Route path="/groups" element={
                    <ProtectedRoute>
                      <ReadingGroups />
                    </ProtectedRoute>
                  } />
                  {/* Redirect /reviews to /social */}
                  <Route path="/reviews" element={<Navigate to="/social" replace />} />
                  <Route path="/social" element={<SocialMedia />} />
                  <Route path="/quotes" element={
                    <ProtectedRoute>
                      <Quotes />
                    </ProtectedRoute>
                  } />
                  <Route path="/authors" element={<AuthorConnect />} />
                  <Route path="/map" element={<ReaderMap />} />
                  <Route path="/book-search-test" element={<BookSearchTest />} />
                  
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <ComingSoonPage title="Account Settings" />
                    </ProtectedRoute>
                  } />

                  {/* Footer Pages */}
                  <Route path="/help" element={<HelpCenter />} />
                  <Route path="/feedback" element={<Feedback />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/cookies" element={<CookiePolicy />} />
                  <Route path="/dmca" element={<DmcaPolicy />} />
                  <Route path="/contact" element={<ComingSoonPage title="Contact Us" />} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </Suspense>
                <GlobalFooter />
                <Chatbot />
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </ChatbotProvider>
      </AuthProvider>
    </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

// Coming Soon Page Component
const ComingSoonPage = ({ title }: { title: string }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🚧</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600 mb-6">
            This page is currently under construction. Please revisit after some time.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">We're working hard to bring you this feature!</p>
            <p className="text-xs text-gray-400">Expected completion: Coming Soon</p>
          </div>
        </div>
        <div className="space-y-4">
          <a
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
          >
            ← Return to Dashboard
          </a>
          <div className="flex justify-center space-x-4 text-sm">
            <a href="/social" className="text-amber-600 hover:text-amber-700">Community</a>
            <a href="/library" className="text-amber-600 hover:text-amber-700">Library</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
