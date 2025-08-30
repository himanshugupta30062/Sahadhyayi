import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Users, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/authHelpers';
import SignInLink from '@/components/SignInLink';

const ImprovedHero = () => {
  const { user } = useAuth();

  return (
    <section className="relative min-h-[80vh] flex items-center justify-center bg-gradient-hero overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] repeat"></div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Rediscover the joy of
            <span className="block text-transparent bg-gradient-to-r from-yellow-200 to-orange-200 bg-clip-text">
              deep reading
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl sm:text-2xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join Sahadhyayi, where readers become fellow companions in the journey of knowledge and discovery.
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            {user ? (
              <Link to="/dashboard">
                <Button 
                  size="lg" 
                  className="bg-white text-brand-primary hover:bg-gray-100 px-8 py-4 text-lg font-semibold shadow-elevated transition-all duration-300 hover:scale-105"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/signup">
                  <Button 
                    size="lg" 
                    className="bg-white text-brand-primary hover:bg-gray-100 px-8 py-4 text-lg font-semibold shadow-elevated transition-all duration-300 hover:scale-105"
                  >
                    Join Sahadhyayi
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <SignInLink>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="border-2 border-white text-white hover:bg-white hover:text-brand-primary px-8 py-4 text-lg font-semibold transition-all duration-300"
                  >
                    Sign In
                  </Button>
                </SignInLink>
              </>
            )}
          </div>
          
          {/* Social Proof */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <BookOpen className="w-6 h-6 text-white/80 mr-2" />
                <span className="text-2xl font-bold text-white">12,500+</span>
              </div>
              <p className="text-white/70">Books Available</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-white/80 mr-2" />
                <span className="text-2xl font-bold text-white">3,200+</span>
              </div>
              <p className="text-white/70">Active Readers</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="w-6 h-6 text-white/80 mr-2" />
                <span className="text-2xl font-bold text-white">4.8</span>
              </div>
              <p className="text-white/70">Average Rating</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-1/4 left-1/4 animate-float">
        <BookOpen className="w-8 h-8 text-white/20" />
      </div>
      <div className="absolute top-1/3 right-1/4 animate-float" style={{ animationDelay: '1s' }}>
        <Users className="w-8 h-8 text-white/20" />
      </div>
      <div className="absolute bottom-1/4 right-1/3 animate-float" style={{ animationDelay: '2s' }}>
        <Star className="w-8 h-8 text-white/20" />
      </div>
    </section>
  );
};

export default ImprovedHero;