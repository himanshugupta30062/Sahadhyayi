
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 pt-20">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-3xl">📚</span>
            </div>
            <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Oops! The page you're looking for seems to have wandered off into another chapter. 
              Let's get you back to the story.
            </p>
          </div>
          
          <div className="space-y-4">
            <Button 
              onClick={handleGoHome}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Home className="w-5 h-5 mr-2" />
              Return to Home
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleGoBack}
              className="w-full border-2 border-orange-300 text-orange-700 hover:bg-orange-50 py-3 px-6 rounded-xl transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </Button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              Looking for something specific?
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <a href="/library" className="text-orange-600 hover:text-orange-800 hover:underline">
                Library
              </a>
              <span className="text-gray-300">•</span>
              <a href="/authors" className="text-orange-600 hover:text-orange-800 hover:underline">
                Authors
              </a>
              <span className="text-gray-300">•</span>
              <a href="/social" className="text-orange-600 hover:text-orange-800 hover:underline">
                Social Media
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
