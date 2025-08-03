
import React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { QuotesProvider } from "@/contexts/QuotesContext";
import { ChatbotProvider } from "@/contexts/ChatbotContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import Chatbot from "@/components/chatbot/Chatbot";
import Navigation from "@/components/Navigation";
import GlobalFooter from "@/components/GlobalFooter";
import ScrollToTop from "@/components/ScrollToTop";
import { Toaster } from "@/components/ui/toaster";
import Index from "./pages/Index";
import BookLibrary from "./pages/BookLibrary";
import BookDetails from "./pages/BookDetails";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import SocialMedia from "./pages/SocialMedia";
import Authors from "./pages/Authors";
import AuthorDetails from "./pages/AuthorDetails";
import ReadingGroups from "./pages/ReadingGroups";
import Map from "./pages/Map";
import About from "./pages/About";
import Blog from "./pages/Blog";
import NotFound from "./pages/NotFound";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

console.log('App component loading...');

function App() {
  console.log('App component rendering...');
  console.log('React in App:', !!React);
  console.log('React hooks available:', !!React.useState);
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <QuotesProvider>
            <ChatbotProvider>
              <TooltipProvider>
                <BrowserRouter>
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
                        <Route path="/author/:id" element={<AuthorDetails />} />
                        <Route path="/groups" element={<ReadingGroups />} />
                        <Route path="/map" element={<Map />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/blog" element={<Blog />} />
                        <Route path="/book/:id" element={<BookDetails />} />
                        <Route path="/books/:bookId" element={<BookDetails />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                    <GlobalFooter />
                  </div>
                  <Chatbot />
                  <Toaster />
                </BrowserRouter>
              </TooltipProvider>
            </ChatbotProvider>
          </QuotesProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
