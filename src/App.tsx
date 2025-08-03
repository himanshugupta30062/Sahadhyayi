
import React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { QuotesProvider } from "@/contexts/QuotesProvider";
import { ChatbotProvider } from "@/contexts/ChatbotContext";
import Chatbot from "@/components/chatbot/Chatbot";
import Navigation from "@/components/Navigation";
import GlobalFooter from "@/components/GlobalFooter";
import ScrollToTop from "@/components/ScrollToTop";
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
import { Toaster } from "@/components/ui/toaster";
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
  console.log('React in App component:', !!React);
  
  // Enhanced React availability check
  const reactInstance = React || (globalThis as any).React || (typeof window !== 'undefined' ? (window as any).React : null);
  
  if (!reactInstance || typeof reactInstance.createElement !== 'function') {
    console.error('React not properly initialized in App component');
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Verify React hooks are available
  if (!reactInstance.useState || !reactInstance.useEffect || !reactInstance.useContext) {
    console.error('React hooks not available in App component');
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Application initialization error. Please refresh the page.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <QuotesProvider>
            <ChatbotProvider>
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
            </ChatbotProvider>
          </QuotesProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
