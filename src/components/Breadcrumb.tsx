import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <nav 
      className={cn(
        "flex items-center space-x-2 text-sm text-muted-foreground",
        className
      )} 
      aria-label="Breadcrumb"
    >
      <Link 
        to="/" 
        className="flex items-center hover:text-primary transition-colors"
        aria-label="Home"
      >
        <Home className="w-4 h-4" />
        <span className="sr-only">Home</span>
      </Link>
      
      {items.map((item) => (
        <Fragment key={item.path}>
          <ChevronRight className="w-4 h-4 flex-shrink-0" />
          {item.current ? (
            <span className="text-foreground font-medium truncate" aria-current="page">
              {item.name}
            </span>
          ) : (
            <Link 
              to={item.path} 
              className="hover:text-primary transition-colors truncate"
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
