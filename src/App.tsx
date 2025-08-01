import React from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import BookLibrary from "./pages/BookLibrary";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import ScrollToTop from "@/components/ScrollToTop";

function TestComponent() {
  const [count, setCount] = React.useState(0);
  return <div>Count: {count} <button onClick={() => setCount(c => c + 1)}>+</button></div>;
}

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <div className="min-h-screen bg-background text-foreground">
          <main className="flex-1">
            <TestComponent />
          </main>
        </div>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;