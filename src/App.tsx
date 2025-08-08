import React, { useEffect, useState, lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './sentry';

import { toast } from '@/hooks/use-toast';
import { errorHandler } from '@/utils/errorHandler';
import type { AppError } from '@/lib/errors';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { initializeSecurity } from '@/utils/security';

// Context imports
import { AuthProvider } from "./contexts/AuthContext";
import { QuotesProvider } from "./contexts/QuotesContext";

// UI component imports
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import Navigation from "./components/Navigation";
import GlobalFooter from "./components/GlobalFooter";
import ScrollToTop from "./components/ScrollToTop";

// Page imports
import Index from "./pages/Index";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
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

const BookLibrary = lazy(() => import('./pages/BookLibrary'));
const BookDetails = lazy(() => import('./pages/BookDetails'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Chatbot = lazy(() => import('./components/chatbot/ChatbotContainer'));

import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
      onError: (err: unknown) => {
        const e = err as AppError;
        errorHandler.handleError({
          message: e.message || 'Query failed',
          context: { scope: 'react-query', status: e.status, code: e.code },
          severity: (e.severity as any) || 'high'
        });
        if (e.severity === 'critical' || e.severity === 'high' || e.severity === 'network') {
          toast({
            title: 'Something went wrong',
            description: e.message,
            variant: 'destructive'
          });
        }
      }
    },
    mutations: {
      onError: (err: unknown) => {
        const e = err as AppError;
        errorHandler.handleError({
          message: e.message || 'Action failed',
          context: { scope: 'react-query-mutation', status: e.status, code: e.code },
          severity: (e.severity as any) || 'high'
        });
        toast({
          title: 'Action failed',
          description: e.message,
          variant: 'destructive'
        });
      }
    }
  }
});

function App() {
  useEffect(() => {
    initializeSecurity();
  }, []);

  const [showChat, setShowChat] = useState(false);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AuthProvider>
              <QuotesProvider>
                <ScrollToTop />
                <div className="min-h-screen bg-background text-foreground flex flex-col">
                  <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 bg-background border rounded px-2 py-1">
                    Skip to content
                  </a>
                  <Navigation />
                  <main id="main" tabIndex={-1} className="flex-1 pt-16">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/library" element={<Suspense fallback={<div>Loading…</div>}><BookLibrary /></Suspense>} />
                      <Route path="/signup" element={<SignUp />} />
                      <Route path="/signin" element={<SignIn />} />
                      <Route path="/dashboard" element={<Suspense fallback={<div>Loading…</div>}><Dashboard /></Suspense>} />
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
                      <Route path="/book/:id" element={<Suspense fallback={<div>Loading…</div>}><BookDetails /></Suspense>} />
                      <Route path="/bookshelf" element={<Bookshelf />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                  <GlobalFooter />
                </div>
                {showChat && (
                  <Suspense fallback={<div />}>
                    <Chatbot initiallyOpen onClose={() => setShowChat(false)} />
                  </Suspense>
                )}
                {!showChat && (
                  <button
                    className="fixed bottom-6 right-6 z-50 rounded-full border bg-background px-3 py-2 shadow"
                    aria-controls="chat-panel"
                    aria-expanded={false}
                    onClick={() => setShowChat(true)}
                  >
                    Chat
                  </button>
                )}
                <Toaster />
              </QuotesProvider>
            </AuthProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
