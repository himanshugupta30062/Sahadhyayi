import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatbotProvider } from "@/contexts/ChatbotContext";
import Chatbot from "@/components/chatbot/Chatbot";
import Navigation from "./components/Navigation";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import About from "./pages/About";
import Bookshelf from "./pages/Bookshelf";
import BookLibrary from "./pages/BookLibrary";
import ReadingGroups from "./pages/ReadingGroups";
import Reviews from "./pages/Reviews";
import AuthorConnect from "./pages/AuthorConnect";
import ReaderMap from "./pages/ReaderMap";
import Investors from "./pages/Investors";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Quotes from "./pages/Quotes";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ChatbotProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
              <Navigation />
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
              
              {/* --- PROFILE ROUTE --- */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Chatbot />
          </div>
        </BrowserRouter>
        </TooltipProvider>
      </ChatbotProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
