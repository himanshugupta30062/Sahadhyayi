import React, { useEffect, lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './sentry';

import { toast } from '@/hooks/use-toast';
import { errorHandler } from '@/utils/errorHandler';
import usePageVisitTracker from '@/hooks/usePageVisitTracker';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { initializeSecurity, initializeSecureSession, setCSRFToken, generateCSRFToken } from '@/utils/security';

// Context imports
import AuthProvider from "./contexts/AuthContext";
import QuotesProvider from "./contexts/QuotesContext";
import BookExpertProvider from "./contexts/BookExpertContext";

// UI component imports
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
const BookExpert = lazy(() => import('./components/book-expert/BookExpert'));
import Navigation from "./components/Navigation";
import GlobalFooter from "./components/GlobalFooter";
import ScrollToTop from "./components/ScrollToTop";

// Page imports
import Index from "./pages/Index";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
const BookLibrary = lazy(() => import('./pages/BookLibrary'));
const BookDetails = lazy(() => import('./pages/BookDetails'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
import Profile from "./pages/Profile";
import SocialMedia from "./pages/SocialMedia";
import Authors from "./pages/Authors";
import AuthorSlugPage from "./pages/authors/[slug]";
import AuthorDetails from "./pages/AuthorDetails";
import ReadingGroups from "./pages/ReadingGroups";
import Map from "./pages/Map";
import About from "./pages/About";
import Blog from "./pages/Blog";
import NotFound from "./pages/NotFound";
import Bookshelf from "./pages/Bookshelf";

import "./App.css";

  const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (err: unknown) => {
        const message = (err as any)?.message || 'Action failed';
        errorHandler.reportCustomError(
          message,
          { action: 'mutation', component: 'QueryClient', route: typeof window !== 'undefined' ? window.location.pathname : undefined },
          'high'
        );
        toast({
          title: 'Action failed',
          description: message,
          variant: 'destructive'
        });
      }
    }
  }
});

function App() {
  // Track page visits for analytics
  usePageVisitTracker();

  useEffect(() => {
    initializeSecurity();
    initializeSecureSession();
    const id = setInterval(() => setCSRFToken(generateCSRFToken()), 30 * 60 * 1000);
    return () => clearInterval(id);
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
                  <a
                    href="#main"
                    className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 bg-background border rounded px-2 py-1"
                  >
                    Skip to content
                  </a>
                  <Navigation />
                  <main id="main" tabIndex={-1} className="flex-1 pt-16">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route
                        path="/library"
                        element={
                          <Suspense fallback={<div>Loading…</div>}>
                            <BookLibrary />
                          </Suspense>
                        }
                      />
                      <Route path="/signup" element={<SignUp />} />
                      <Route path="/signin" element={<SignIn />} />
                      <Route
                        path="/dashboard"
                        element={
                          <Suspense fallback={<div>Loading…</div>}>
                            <Dashboard />
                          </Suspense>
                        }
                      />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/social" element={<SocialMedia />} />
                      <Route path="/authors" element={<Authors />} />
                      {/* Main author profile page accessed via slug */}
                      <Route path="/authors/:slug" element={<AuthorSlugPage />} />
                      {/* Legacy author page accessed via /author/:slug */}
                      <Route path="/author/:slug" element={<AuthorDetails />} />
                      <Route path="/groups" element={<ReadingGroups />} />
                      <Route path="/map" element={<Map />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route
                        path="/book/:id"
                        element={
                          <Suspense fallback={<div>Loading…</div>}>
                            <BookDetails />
                          </Suspense>
                        }
                      />
                      <Route path="/bookshelf" element={<Bookshelf />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                  <GlobalFooter />
                </div>
                <Suspense fallback={<div />}>
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
}

export default App;
