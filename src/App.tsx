import React, { useEffect, lazy, Suspense, memo } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { toast } from '@/hooks/use-toast';
import { errorHandler } from '@/utils/errorHandler';
import usePageVisitTracker from '@/hooks/usePageVisitTracker';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { initializeSecurity, initializeSecureSession, setCSRFToken, generateCSRFToken } from '@/utils/security.ts';

// Context imports
import { AuthProvider } from "./contexts/AuthContext";
import QuotesProvider from "./contexts/QuotesContext";
import BookExpertProvider from "./contexts/BookExpertContext";

// UI component imports
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import Navigation from "./components/Navigation";
import StructuredFooter from "./components/footer/StructuredFooter";
import ScrollToTop from "./components/ScrollToTop";
import BookFlipLoader from "./components/ui/BookFlipLoader";

// Immediate load pages (critical path)
import Index from "./pages/Index";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import ResetPassword from "./pages/ResetPassword";
import ConfirmEmail from "./pages/ConfirmEmail";
import NotFound from "./pages/NotFound";

// Lazy loaded pages (optimized chunks)
const Library = lazy(() => import('./pages/library'));
const BookDetails = lazy(() => import('./pages/BookDetails'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const BookExpert = lazy(() => import('./components/book-expert/BookExpert'));

// Secondary pages (can be loaded later)
const Profile = lazy(() => import('./pages/Profile'));
const SocialMedia = lazy(() => import('./pages/SocialMedia'));
const Authors = lazy(() => import('./pages/Authors'));
const AuthorSlugPage = lazy(() => import('./pages/authors/[slug]'));
const AuthorDetails = lazy(() => import('./pages/AuthorDetails'));
const ReadingGroups = lazy(() => import('./pages/ReadingGroups'));
const GroupDetails = lazy(() => import('./pages/GroupDetails'));
const Map = lazy(() => import('./pages/Map'));
const About = lazy(() => import('./pages/About'));
const Blog = lazy(() => import('./pages/Blog'));
const Bookshelf = lazy(() => import('./pages/Bookshelf'));

// Footer pages (lowest priority)
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const Feedback = lazy(() => import('./pages/Feedback'));
const CommunityGuidelines = lazy(() => import('./pages/CommunityGuidelines'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'));

// Optimized loading fallback
const LoadingFallback = memo(({ message = "Loading..." }: { message?: string }) => (
  <div className="flex items-center justify-center min-h-[200px]">
    <BookFlipLoader size="md" text={message} />
  </div>
));

// Optimized query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
    mutations: {
      onError: (err: unknown) => {
        const message = (err as any)?.message || 'Action failed';
        
        // Only report in development or for critical errors
        if (import.meta.env.DEV || message.includes('critical')) {
          errorHandler.reportCustomError(
            message,
            { 
              action: 'mutation', 
              component: 'QueryClient', 
              route: typeof window !== 'undefined' ? window.location.pathname : undefined 
            },
            'high'
          );
        }
        
        toast({
          title: 'Action failed',
          description: message,
          variant: 'destructive'
        });
      }
    }
  }
});

const App = memo(() => {
  usePageVisitTracker();

  useEffect(() => {
    initializeSecurity();
    initializeSecureSession();
    
    // Set CSRF token refresh interval
    const intervalId = setInterval(() => {
      setCSRFToken(generateCSRFToken());
    }, 30 * 60 * 1000); // 30 minutes
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AuthProvider>
              <QuotesProvider>
                <BookExpertProvider>
                  <ScrollToTop />
                  <div className="min-h-screen bg-background text-foreground flex flex-col">
                    {/* Skip to content link for accessibility */}
                    <a
                      href="#main"
                      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 bg-background border rounded px-2 py-1 z-50"
                    >
                      Skip to content
                    </a>
                    
                    <Navigation />
                    
                    <main id="main" tabIndex={-1} className="flex-1 pt-16">
                      <Routes>
                        {/* Critical routes - no lazy loading */}
                        <Route path="/" element={<Index />} />
                        <Route path="/signup" element={<SignUp />} />
                        <Route path="/signin" element={<SignIn />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/confirm-email" element={<ConfirmEmail />} />
                        <Route path="*" element={<NotFound />} />
                        
                        {/* Primary routes - optimized lazy loading */}
                        <Route
                          path="/library"
                          element={
                            <Suspense fallback={<LoadingFallback message="Loading library..." />}>
                              <Library />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/dashboard"
                          element={
                            <Suspense fallback={<LoadingFallback message="Loading dashboard..." />}>
                              <Dashboard />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/book/:id"
                          element={
                            <Suspense fallback={<LoadingFallback message="Loading book details..." />}>
                              <BookDetails />
                            </Suspense>
                          }
                        />
                        
                        {/* Secondary routes */}
                        <Route
                          path="/profile"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <Profile />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/social"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <SocialMedia />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/authors"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <Authors />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/authors/:slug"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <AuthorSlugPage />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/author/:slug"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <AuthorDetails />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/groups"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <ReadingGroups />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/groups/:id"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <GroupDetails />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/map"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <Map />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/about"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <About />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/blog"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <Blog />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/bookshelf"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <Bookshelf />
                            </Suspense>
                          }
                        />
                        
                        {/* Footer/Legal routes - lowest priority */}
                        <Route
                          path="/help-center"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <HelpCenter />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/feedback"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <Feedback />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/community-guidelines"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <CommunityGuidelines />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/privacy-policy"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <PrivacyPolicy />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/terms-of-service"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <TermsOfService />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/cookie-policy"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <CookiePolicy />
                            </Suspense>
                          }
                        />
                      </Routes>
                    </main>
                    
                    <StructuredFooter />
                  </div>
                  
                  {/* Book Expert - lowest priority loading */}
                  <Suspense fallback={null}>
                    <BookExpert />
                  </Suspense>
                  
                  <Toaster />
                </BookExpertProvider>
              </QuotesProvider>
            </AuthProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
});

App.displayName = 'App';

export default App;