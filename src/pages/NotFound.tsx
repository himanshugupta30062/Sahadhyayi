
import { useLocation, useNavigate, Link } from "react-router-dom";
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import SEO from "@/components/SEO";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <>
      <SEO
        title="Page Not Found - Sahadhyayi"
        description="Sorry, the page you're looking for doesn't exist. Return to the Sahadhyayi home page."
        canonical="https://sahadhyayi.com/404"
        url="https://sahadhyayi.com/404"
        noIndex={true}
      />
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground pt-16 px-4">
        <div className="text-center max-w-md w-full mx-auto p-8 rounded-2xl border border-border bg-card shadow-sm">
          <div className="mb-8">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 border border-border shadow-sm">
              <span className="text-3xl" role="img" aria-label="Book">📚</span>
            </div>
            <h1 className="text-6xl font-bold text-foreground mb-3 tracking-tight">404</h1>
            <h2 className="text-2xl font-semibold text-foreground mb-3">Page Not Found</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed text-sm">
              Oops! The page you're looking for seems to have wandered off into another chapter. 
              Let's get you back to the story.
            </p>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={handleGoHome}
              className="w-full bg-[#1C442D] hover:bg-[#143221] dark:bg-[#D5B16D] dark:hover:bg-[#c49f5c] text-white dark:text-[#0B0D0C] font-medium py-3 px-6 rounded-xl transition-colors"
            >
              <Home className="w-5 h-5 mr-2" />
              Return to Home
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleGoBack}
              className="w-full border-border text-foreground hover:bg-muted py-3 px-6 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </Button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground mb-4">
              Looking for something specific?
            </p>
            <div className="flex flex-wrap justify-center items-center gap-3 text-sm">
              <Link to="/library" className="text-[hsl(var(--brand-primary))] hover:underline font-medium">
                Library
              </Link>
              <span className="text-muted-foreground/40">•</span>
              <Link to="/authors" className="text-[hsl(var(--brand-primary))] hover:underline font-medium">
                Authors
              </Link>
              <span className="text-muted-foreground/40">•</span>
              <Link to="/social" className="text-[hsl(var(--brand-primary))] hover:underline font-medium">
                Social Media
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
