
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

// Simple test component to verify React hooks are working
const TestPage = () => {
  const [count, setCount] = React.useState(0);
  
  React.useEffect(() => {
    console.log('TestPage mounted, React hooks working');
  }, []);
  
  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Sahadhyayi - System Check</h1>
      <p className="text-gray-600 mb-4">React hooks are working properly!</p>
      <div className="bg-blue-50 p-4 rounded-lg mb-4">
        <p className="text-blue-800">Counter test: {count}</p>
        <button 
          onClick={() => setCount(c => c + 1)}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Increment
        </button>
      </div>
      <p className="text-green-600">✅ React dispatcher is functioning correctly</p>
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
