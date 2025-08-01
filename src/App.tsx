
import React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Simple test component to verify React is working
const TestPage = () => {
  console.log('TestPage rendering...');
  
  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Sahadhyayi - Test Mode</h1>
      <p className="text-gray-600 mb-4">React is working properly!</p>
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-blue-800">If you can see this page, React hooks are functioning correctly.</p>
      </div>
    </div>
  );
};

console.log('App component loading...');

function App() {
  console.log('App component rendering...');
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<TestPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
