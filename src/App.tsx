
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { Suspense } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatbotProvider } from "@/contexts/ChatbotContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Chatbot from "@/components/chatbot/Chatbot";
import Navigation from "./components/Navigation";
import ProtectedRoute from "./components/ProtectedRoute";
const Index = React.lazy(() => import("./pages/Index"));
const About = React.lazy(() => import("./pages/About"));
const Bookshelf = React.lazy(() => import("./pages/Bookshelf"));
const BookLibrary = React.lazy(() => import("./pages/BookLibrary"));
const ReadingGroups = React.lazy(() => import("./pages/ReadingGroups"));
const Reviews = React.lazy(() => import("./pages/Reviews"));
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
import GlobalFooter from "./components/GlobalFooter";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
              <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
                <Navigation />
                <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
                <Routes>
                  <Route path="/" element={<Index />} />
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
                  <Route path="/reviews" element={<Reviews />} />
                  <Route path="/quotes" element={
                    <ProtectedRoute>
                      <Quotes />
                    </ProtectedRoute>
                  } />
                  <Route path="/authors" element={<AuthorConnect />} />
                  <Route path="/map" element={<ReaderMap />} />
                  
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  
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

export default App;
