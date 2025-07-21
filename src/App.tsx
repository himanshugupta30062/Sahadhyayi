import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
import { usePageVisitTracker } from '@/hooks/usePageVisitTracker';
import Index from "./pages/Index";
import About from "./pages/About";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import BookLibrary from "./pages/BookLibrary";
import ReadingGroups from "./pages/ReadingGroups";
import MapPage from "./pages/Map";
import SocialMedia from "./pages/SocialMedia";
import Authors from "./pages/Authors";
import AuthorDetails from "./pages/AuthorDetails";
import AuthorProfile from "./pages/AuthorProfile";
import BookDetails from "./pages/BookDetails";
import Bookshelf from "./pages/Bookshelf";
import Quotes from "./pages/Quotes";
import CommunityStories from "./pages/CommunityStories";
import BookSearchTest from "./pages/BookSearchTest";
import HelpCenter from "./pages/HelpCenter";
import Feedback from "./pages/Feedback";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import DmcaPolicy from "./pages/DmcaPolicy";
import Investors from "./pages/Investors";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
            <ChatbotProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <ScrollToTop />
                  <AutoLogoutHandler />
                  <div className="flex flex-col min-h-screen">
                    <Navigation />
                    <main className="flex-1">
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/blog" element={<Blog />} />
                        <Route path="/blog/:slug" element={<BlogPost />} />
                        <Route path="/signin" element={<SignIn />} />
                        <Route path="/signup" element={<SignUp />} />
                        <Route path="/library" element={<BookLibrary />} />
                        <Route path="/authors" element={<Authors />} />
                        <Route path="/social" element={<SocialMedia />} />
                        <Route 
                          path="/dashboard" 
                          element={
                            <ProtectedRoute>
                              <Dashboard />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/profile" 
                          element={
                            <ProtectedRoute>
                              <Profile />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/groups" 
                          element={
                            <ProtectedRoute>
                              <ReadingGroups />
                            </ProtectedRoute>
                          } 
                        />
                        <Route
                          path="/map"
                          element={
                            <ProtectedRoute>
                              <MapPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="/author/:id" element={<AuthorDetails />} />
                        <Route path="/author-profile/:id" element={<AuthorProfile />} />
                        <Route path="/book/:id" element={<BookDetails />} />
                        <Route 
                          path="/bookshelf" 
                          element={
                            <ProtectedRoute>
                              <Bookshelf />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/quotes" 
                          element={
                            <ProtectedRoute>
                              <Quotes />
                            </ProtectedRoute>
                          } 
                        />
                        <Route 
                          path="/stories" 
                          element={
                            <ProtectedRoute>
                              <CommunityStories />
                            </ProtectedRoute>
                          } 
                        />
                        <Route path="/book-search" element={<BookSearchTest />} />
                        <Route path="/help" element={<HelpCenter />} />
                        <Route path="/feedback" element={<Feedback />} />
                        <Route path="/privacy" element={<PrivacyPolicy />} />
                        <Route path="/terms" element={<TermsOfService />} />
                        <Route path="/cookies" element={<CookiePolicy />} />
                        <Route path="/dmca" element={<DmcaPolicy />} />
                        <Route path="/investors" element={<Investors />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                    <GlobalFooter />
                  </div>
                  <BackToTopButton />
                  <Chatbot />
                </BrowserRouter>
              </TooltipProvider>
            </ChatbotProvider>
          </AuthProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
