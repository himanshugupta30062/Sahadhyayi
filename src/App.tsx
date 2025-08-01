import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
// import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from "@/components/ErrorBoundary";
import ScrollToTop from "@/components/ScrollToTop";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            {/* <TooltipProvider> */}
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ScrollToTop />
                <div className="min-h-screen bg-background text-foreground">
                  <main className="flex-1">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/library" element={<div className="p-8"><h1 className="text-2xl font-bold">Library</h1><p>Library page is working!</p></div>} />
                      <Route path="*" element={<div className="p-8"><h1 className="text-2xl font-bold">Page Not Found</h1><p>404 - The page you're looking for doesn't exist.</p></div>} />
                    </Routes>
                  </main>
                </div>
              </BrowserRouter>
            {/* </TooltipProvider> */}
          </AuthProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;