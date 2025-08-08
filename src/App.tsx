import React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './sentry';
import './webVitals';

import { toast } from '@/hooks/use-toast';
import { errorHandler } from '@/utils/errorHandler';
import type { AppError } from '@/lib/errors';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useSecureSession } from '@/hooks/useSecureSession';

// Context imports
import { AuthProvider } from "./contexts/AuthContext";
import { QuotesProvider } from "./contexts/QuotesContext";

// UI component imports
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { Chatbot } from "./components/chatbot";
import Navigation from "./components/Navigation";
import GlobalFooter from "./components/GlobalFooter";
import ScrollToTop from "./components/ScrollToTop";

// Page imports
import Index from "./pages/Index";
import BookLibrary from "./pages/BookLibrary";
import BookDetails from "./pages/BookDetails";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
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
  useSecureSession();
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AuthProvider>
              <QuotesProvider>
                <ScrollToTop />
                <div className="min-h-screen bg-background text-foreground flex flex-col">
                  <Navigation />
                  <main className="flex-1 pt-16">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/library" element={<BookLibrary />} />
                      <Route path="/signup" element={<SignUp />} />
                      <Route path="/signin" element={<SignIn />} />
                      <Route path="/dashboard" element={<Dashboard />} />
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
                      <Route path="/book/:id" element={<BookDetails />} />
                      <Route path="/bookshelf" element={<Bookshelf />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                  <GlobalFooter />
                </div>
                <Chatbot />
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
