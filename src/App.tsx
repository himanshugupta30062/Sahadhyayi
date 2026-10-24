import React, { useEffect, lazy, Suspense, memo } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, useSearchParams } from "react-router-dom";

import { toast } from '@/hooks/use-toast';
import { errorHandler } from '@/utils/errorHandler';
import usePageVisitTracker from '@/hooks/usePageVisitTracker';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { isSupabaseConfigured } from "@/integrations/supabase/client-universal";
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
import DeferredSection from "./components/DeferredSection";
import ScrollToTop from "./components/ScrollToTop";
import BookFlipLoader from "./components/ui/BookFlipLoader";

// Immediate load pages (critical path)
import NotFound from "./pages/NotFound";

// Lazy loaded pages (optimized chunks)
const Index = lazy(() => import("./pages/Index"));
const Library = lazy(() => import('./pages/library'));
const Auth = lazy(() => import('./pages/Auth'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ConfirmEmail = lazy(() => import('./pages/ConfirmEmail'));
const BookDetails = lazy(() => import('./pages/BookDetails'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const BookExpert = lazy(() => import('./components/book-expert/BookExpert'));
const StructuredFooter = lazy(() => import("./components/footer/StructuredFooter"));
const WebsiteTour = lazy(() => import("./components/onboarding/WebsiteTour"));

// Secondary pages (can be loaded later)
const Profile = lazy(() => import('./pages/Profile'));
const SocialMedia = lazy(() => import('./pages/SocialMedia'));
const Authors = lazy(() => import('./pages/Authors'));
const Publishers = lazy(() => import('./pages/Publishers'));
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

const AuthorConnect = lazy(() => import('./pages/AuthorConnect'));
const AuthorProfilePage = lazy(() => import('./pages/AuthorProfile'));
const ReaderMap = lazy(() => import('./pages/ReaderMap'));
const Investors = lazy(() => import('./pages/Investors'));
const QuotesPage = lazy(() => import('./pages/Quotes'));
const CommunityStories = lazy(() => import('./pages/CommunityStories'));
const BookLibrary = lazy(() => import('./pages/BookLibrary'));
const DmcaPolicy = lazy(() => import('./pages/DmcaPolicy'));
const OpenSourceLicenses = lazy(() => import('./pages/OpenSourceLicenses'));
const SignIn = lazy(() => import('./pages/SignIn'));
const SignUp = lazy(() => import('./pages/SignUp'));

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
const AdminBookExpertRag = lazy(() => import('./pages/AdminBookExpertRag'));
const AdminAuthorEnrichment = lazy(() => import('./pages/AdminAuthorEnrichment'));

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
    // Initialize telemetry asynchronously after the UI mounts. This keeps the
    // Sentry SDK and replay integrations out of the main application chunk
    // without disabling monitoring or error reporting.
    void import("@/sentry").catch(() => {
      // Core application behavior must remain available if telemetry fails.
    });

    initializeSecurity();
    initializeSecureSession();
    
    // Set CSRF token refresh interval
    const intervalId = setInterval(() => {
      setCSRFToken(generateCSRFToken());
    }, 30 * 60 * 1000); // 30 minutes
    
    return () => clearInterval(intervalId);
  }, []);

  if (!isSupabaseConfigured) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12 text-foreground">
        <section role="alert" className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 shadow-lg">
          <h1 className="text-2xl font-semibold">Sahadhyayi is temporarily unavailable</h1>
          <p className="mt-3 text-muted-foreground">
            The production site is missing its public Supabase configuration. The application has loaded safely,
            but account, library, and community data cannot be connected yet.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Hosting configuration required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. Configure these in the
            deployment environment and redeploy the site.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
          >
            Retry connection
          </button>
        </section>
      </main>
    );
  }

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
                        <Route path="/" element={<Suspense fallback={<LoadingFallback message="Loading Sahadhyayi..." />}><Index /></Suspense>} />
                        <Route path="/auth" element={<Suspense fallback={<LoadingFallback />}><Auth /></Suspense>} />
                        <Route path="/signup" element={<Suspense fallback={<LoadingFallback />}><SignUp /></Suspense>} />
                        <Route path="/signin" element={<Suspense fallback={<LoadingFallback />}><SignIn /></Suspense>} />
                        <Route path="/reset-password" element={<Suspense fallback={<LoadingFallback />}><ResetPassword /></Suspense>} />
                        <Route path="/confirm-email" element={<Suspense fallback={<LoadingFallback />}><ConfirmEmail /></Suspense>} />
                        
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
                          path="/publishers"
                          element={
                            <Suspense fallback={<LoadingFallback message="Loading publishers..." />}>
                              <Publishers />
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
                            <ProtectedRoute>
                              <Suspense fallback={<LoadingFallback />}>
                                <ArticleWrite />
                              </Suspense>
                            </ProtectedRoute>
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
                          path="/admin/book-expert-rag"
                          element={
                            <AdminRoute>
                              <Suspense fallback={<LoadingFallback message="Loading Book Expert RAG..." />}>
                                <AdminBookExpertRag />
                              </Suspense>
                            </AdminRoute>
                          }
                        />
                        <Route
                          path="/admin/author-enrichment"
                          element={
                            <AdminRoute>
                              <Suspense fallback={<LoadingFallback message="Loading author enrichment..." />}>
                                <AdminAuthorEnrichment />
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

                        <Route path="/author-connect" element={<Suspense fallback={<LoadingFallback />}><AuthorConnect /></Suspense>} />
                        <Route path="/author-profile/:authorName" element={<Suspense fallback={<LoadingFallback />}><AuthorProfilePage /></Suspense>} />
                        <Route path="/reader-map/:bookId?" element={<Suspense fallback={<LoadingFallback />}><ReaderMap /></Suspense>} />
                        <Route path="/investors" element={<Suspense fallback={<LoadingFallback />}><Investors /></Suspense>} />
                        <Route path="/quotes" element={<Suspense fallback={<LoadingFallback />}><QuotesPage /></Suspense>} />
                        <Route path="/community-stories" element={<Suspense fallback={<LoadingFallback />}><CommunityStories /></Suspense>} />
                        <Route path="/book-library" element={<Suspense fallback={<LoadingFallback />}><BookLibrary /></Suspense>} />
                        <Route path="/dmca" element={<Suspense fallback={<LoadingFallback />}><DmcaPolicy /></Suspense>} />
                        <Route path="/dmca-policy" element={<Navigate to="/dmca" replace />} />
                        <Route path="/open-source-licenses" element={<Suspense fallback={<LoadingFallback />}><OpenSourceLicenses /></Suspense>} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                    
                    {/* Defer below-the-fold and onboarding code until the initial route is interactive. */}
                    <DeferredSection rootMargin="1200px" fallback={null} minHeightClassName="min-h-[320px]">
                      <StructuredFooter />
                    </DeferredSection>
                    <DeferredSection idle fallback={null} minHeightClassName="min-h-0">
                      <WebsiteTour />
                    </DeferredSection>
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
