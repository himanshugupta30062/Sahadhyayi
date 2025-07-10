
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  url: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center space-x-1 text-sm text-gray-500 ${className}`}>
      <Link 
        to="/" 
        className="flex items-center hover:text-orange-600 transition-colors"
        aria-label="Home"
      >
        <Home className="w-4 h-4" />
      </Link>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-4 h-4 text-gray-300" />
          {item.current ? (
            <span className="font-medium text-gray-900" aria-current="page">
              {item.name}
            </span>
          ) : (
            <Link 
              to={item.url} 
              className="hover:text-orange-600 transition-colors"
            >
              {item.name}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
