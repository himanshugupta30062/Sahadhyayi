import React from 'react';
import { BookOpen } from 'lucide-react';

interface BookFlipLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  text?: string;
}

const BookFlipLoader: React.FC<BookFlipLoaderProps> = ({ 
  size = 'md', 
  showText = true, 
  text = 'Loading...' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        {/* Main book icon with flip animation */}
        <div className={`${sizeClasses[size]} relative animate-book-flip`}>
          <BookOpen 
            className={`${sizeClasses[size]} text-brand-primary transition-all duration-300`}
            strokeWidth={1.5}
          />
        </div>
        
        {/* Animated pages */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex space-x-0.5">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-0.5 h-4 bg-brand-secondary rounded-full animate-page-flip"
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1.5s'
                }}
              />
            ))}
          </div>
        </div>

        {/* Subtle glow effect */}
        <div className={`absolute inset-0 ${sizeClasses[size]} bg-brand-primary/20 rounded-full blur-lg animate-pulse`} />
      </div>
      
      {showText && (
        <p className="text-sm text-text-muted animate-pulse font-medium">
          {text}
        </p>
      )}
    </div>
  );
};

export default BookFlipLoader;