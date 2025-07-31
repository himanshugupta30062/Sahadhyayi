import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
// import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { QuotesProvider } from "@/contexts/QuotesContext";
import { ChatbotProvider } from "@/contexts/ChatbotContext";
import Chatbot from "@/components/chatbot/Chatbot";
import { HelmetProvider } from 'react-helmet-async';
import Navigation from "@/components/Navigation";
import GlobalFooter from "@/components/GlobalFooter";
import BackToTopButton from "@/components/BackToTopButton";
import ScrollToTop from "@/components/ScrollToTop";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import usePageVisitTracker from '@/hooks/usePageVisitTracker';
import Index from "./pages/Index";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Component to handle auto-logout functionality
const AutoLogoutHandler = () => {
  useAutoLogout();
  return null;
};

function App() {
  // Track page visits
  usePageVisitTracker();

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <QuotesProvider>
              <ChatbotProvider>
              {/* <TooltipProvider> */}
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <ScrollToTop />
                  <div className="min-h-screen bg-background text-foreground flex flex-col">
                    <AutoLogoutHandler />
                    <Navigation />
                    <main className="flex-1">
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="*" element={<div>Simple Test Page</div>} />
                      </Routes>
                    </main>
                    <GlobalFooter />
                  </div>
                  <BackToTopButton />
                  <Chatbot />
                </BrowserRouter>
              {/* </TooltipProvider> */}
            </ChatbotProvider>
          </QuotesProvider>
          </AuthProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;