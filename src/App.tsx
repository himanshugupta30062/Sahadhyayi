import React, { useEffect, lazy, Suspense, memo } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, useSearchParams } from "react-router-dom";

import { toast } from '@/hooks/use-toast';
import { errorHandler } from '@/utils/errorHandler';
import usePageVisitTracker from '@/hooks/usePageVisitTracker';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { initializeSecurity, initializeSecureSession, setCSRFToken, generateCSRFToken } from '@/utils/security.ts';

// Context imports
import { AuthProvider } from "./contexts/AuthContext";
import QuotesProvider from "./contexts/QuotesContext";
import BookExpertProvider from "./contexts/BookExpertContext";
import { ThemeProvider } from "./contexts/ThemeContext";

// UI component imports
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import Navigation from "./components/Navigation";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import StructuredFooter from "./components/footer/StructuredFooter";
import DeferredSection from "./components/DeferredSection";
import ScrollToTop from "./components/ScrollToTop";
import BookFlipLoader from "./components/ui/BookFlipLoader";

// Immediate load pages (critical path)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import ConfirmEmail from "./pages/ConfirmEmail";
import NotFound from "./pages/NotFound";

// Lazy loaded pages (optimized chunks)
const Library = lazy(() => import('./pages/library'));
const BookDetails = lazy(() => import('./pages/BookDetails'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const BookExpert = lazy(() => import('./components/book-expert/BookExpert'));

// Secondary pages (can be loaded later)
const Profile = lazy(() => import('./pages/Profile'));
const SocialMedia = lazy(() => import('./pages/SocialMedia'));
const Authors = lazy(() => import('./pages/Authors'));
const AuthorSlugPage = lazy(() => import('./pages/authors/[slug]'));
const AuthorDetails = lazy(() => import('./pages/AuthorDetails'));
const ReadingGroups = lazy(() => import('./pages/ReadingGroups'));
const GroupDetails = lazy(() => import('./pages/GroupDetails'));
const Map = lazy(() => import('./pages/Map'));
const About = lazy(() => import('./pages/About'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const Bookshelf = lazy(() => import('./pages/Bookshelf'));
const Discovery = lazy(() => import('./pages/Discovery'));
const Games = lazy(() => import('./pages/Games'));
const PublishBook = lazy(() => import('./pages/PublishBook'));
const MyPublications = lazy(() => import('./pages/MyPublications'));
const Articles = lazy(() => import('./pages/Articles'));
const ArticleWrite = lazy(() => import('./pages/ArticleWrite'));
const ArticleDetail = lazy(() => import('./pages/ArticleDetail'));
const MyArticles = lazy(() => import('./pages/MyArticles'));

// Footer pages (lowest priority)
const HelpCenter = lazy(() => import('./pages/HelpCenter'));
const Feedback = lazy(() => import('./pages/Feedback'));
const CommunityGuidelines = lazy(() => import('./pages/CommunityGuidelines'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'));
const AdminLibraryQuality = lazy(() => import('./pages/AdminLibraryQuality'));
const AdminLibraryArchive = lazy(() => import('./pages/AdminLibraryArchive'));
const AdminFeedback = lazy(() => import('./pages/AdminFeedback'));

// Optimized loading fallback
const LoadingFallback = memo(({ message = "Loading..." }: { message?: string }) => (
  <div className="flex items-center justify-center min-h-[200px]">
    <BookFlipLoader size="md" text={message} />
  </div>
));

// Optimized query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
    mutations: {
      onError: (err: unknown) => {
        const message = (err as any)?.message || 'Action failed';
        
        // Only report in development or for critical errors
        if (import.meta.env.DEV || message.includes('critical')) {
          errorHandler.reportCustomError(
            message,
            { 
              action: 'mutation', 
              component: 'QueryClient', 
              route: typeof window !== 'undefined' ? window.location.pathname : undefined 
            },
            'high'
          );
        }
        
        toast({
          title: 'Action failed',
          description: message,
          variant: 'destructive'
        });
      }
    }
  }
});

const ReaderRedirect = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const query = searchParams.toString();
  return <Navigate to={`/book/${id}?tab=read${query ? `&${query}` : ''}`} replace />;
};

const BooksRedirect = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const query = searchParams.toString();
  return <Navigate to={`/book/${id}${query ? `?${query}` : ''}`} replace />;
};

const PageTracker = () => {
  usePageVisitTracker();
  return null;
};

const App = memo(() => {
  useEffect(() => {
    initializeSecurity();
    initializeSecureSession();
    
    // Set CSRF token refresh interval
    const intervalId = setInterval(() => {
      setCSRFToken(generateCSRFToken());
    }, 30 * 60 * 1000); // 30 minutes
    
    return () => clearInterval(intervalId);
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <AuthProvider>
                <QuotesProvider>
                  <BookExpertProvider>
                    <ScrollToTop />
                    <PageTracker />
                  <div className="min-h-screen bg-background text-foreground flex flex-col">
                    {/* Skip to main content link for keyboard accessibility */}
                    <a
                      href="#main-content"
                      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:font-semibold focus:shadow-lg focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:rounded-md transition-none"
                    >
                      Skip to main content
                    </a>
                    
                    <Navigation />
                    
                    <main id="main-content" tabIndex={-1} className="flex-1 pt-16 outline-none">
                      <span id="main" className="sr-only" />
                      <Routes>
                        {/* Critical routes - no lazy loading */}
                        <Route path="/" element={<Index />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/signup" element={<Auth />} />
                        <Route path="/signin" element={<Auth />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/confirm-email" element={<ConfirmEmail />} />
                        
                        {/* Primary routes - optimized lazy loading */}
                        <Route
                          path="/library"
                          element={
                            <Suspense fallback={<LoadingFallback message="Loading library..." />}>
                              <Library />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/dashboard"
                          element={
                            <ProtectedRoute>
                              <Suspense fallback={<LoadingFallback message="Loading dashboard..." />}>
                                <Dashboard />
                              </Suspense>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/book/:id"
                          element={
                            <Suspense fallback={<LoadingFallback message="Loading book details..." />}>
                              <BookDetails />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/reader/:id"
                          element={<ReaderRedirect />}
                        />
                        <Route
                          path="/books/:id"
                          element={<BooksRedirect />}
                        />
                        
                        {/* Secondary routes */}
                        <Route
                          path="/profile"
                          element={
                            <ProtectedRoute>
                              <Suspense fallback={<LoadingFallback />}>
                                <Profile />
                              </Suspense>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/social"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <SocialMedia />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/discovery"
                          element={
                            <Suspense fallback={<LoadingFallback message="Loading discovery..." />}>
                              <Discovery />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/authors"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <Authors />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/authors/:slug"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <AuthorSlugPage />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/author/:slug"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <AuthorDetails />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/groups"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <ReadingGroups />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/groups/:id"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <GroupDetails />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/map"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <Map />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/about"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <About />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/blog"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <Blog />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/blog/:slug"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <BlogPost />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/bookshelf"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <Bookshelf />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/games"
                          element={
                            <Suspense fallback={<LoadingFallback message="Loading games..." />}>
                              <Games />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/publish"
                          element={
                            <ProtectedRoute>
                              <Suspense fallback={<LoadingFallback message="Loading publisher..." />}>
                                <PublishBook />
                              </Suspense>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/my-publications"
                          element={
                            <ProtectedRoute>
                              <Suspense fallback={<LoadingFallback />}>
                                <MyPublications />
                              </Suspense>
                            </ProtectedRoute>
                          }
                        />
                        
                        <Route
                          path="/articles"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <Articles />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/articles/write"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <ArticleWrite />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/articles/edit/:id"
                          element={
                            <ProtectedRoute>
                              <Suspense fallback={<LoadingFallback />}>
                                <ArticleWrite />
                              </Suspense>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/articles/my"
                          element={
                            <ProtectedRoute>
                              <Suspense fallback={<LoadingFallback />}>
                                <MyArticles />
                              </Suspense>
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/my-articles"
                          element={<Navigate to="/articles/my" replace />}
                        />
                        <Route
                          path="/articles/:slug"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <ArticleDetail />
                            </Suspense>
                          }
                        />
                        
                        <Route
                          path="/help-center"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <HelpCenter />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/feedback"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <Feedback />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/admin/library-archive"
                          element={
                            <AdminRoute>
                              <Suspense fallback={<LoadingFallback message="Loading library archive..." />}>
                                <AdminLibraryArchive />
                              </Suspense>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/visitors"
                          element={
                            <AdminRoute>
                              <Suspense fallback={<LoadingFallback message="Loading visitor analytics..." />}>
                                <AdminLibraryArchive defaultTab="visitors" />
                              </Suspense>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/library-quality"
                          element={
                            <AdminRoute>
                              <Suspense fallback={<LoadingFallback message="Loading quality dashboard..." />}>
                                <AdminLibraryQuality />
                              </Suspense>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/feedback"
                          element={
                            <AdminRoute>
                              <Suspense fallback={<LoadingFallback message="Loading feedback..." />}>
                                <AdminFeedback />
                              </Suspense>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/community-guidelines"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <CommunityGuidelines />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/privacy-policy"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <PrivacyPolicy />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/terms-of-service"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <TermsOfService />
                            </Suspense>
                          }
                        />
                        <Route
                          path="/cookie-policy"
                          element={
                            <Suspense fallback={<LoadingFallback />}>
                              <CookiePolicy />
                            </Suspense>
                          }
                        />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                    
                    <StructuredFooter />
                  </div>
                  
                  {/* Book Expert - load only after idle time so it does not compete with the initial route */}
                  <DeferredSection idle fallback={null} minHeightClassName="min-h-0">
                    <BookExpert />
                  </DeferredSection>
                  
                  <Toaster />
                </BookExpertProvider>
              </QuotesProvider>
            </AuthProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
});

App.displayName = 'App';

export default App;
