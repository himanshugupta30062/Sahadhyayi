
import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  name: string;
  path: string;
  current?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  return (
    <nav className={`flex items-center space-x-2 text-sm text-gray-600 ${className}`} aria-label="Breadcrumb">
      <Link 
        to="/" 
        className="flex items-center hover:text-amber-600 transition-colors"
        aria-label="Home"
      >
        <Home className="w-4 h-4" />
        <span className="sr-only">Home</span>
      </Link>
      
      {items.map((item, index) => (
        <Fragment key={item.path}>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          {item.current ? (
            <span className="text-gray-900 font-medium" aria-current="page">
              {item.name}
            </span>
          ) : (
            <Link 
              to={item.path} 
              className="hover:text-amber-600 transition-colors"
            >
              {item.name}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
