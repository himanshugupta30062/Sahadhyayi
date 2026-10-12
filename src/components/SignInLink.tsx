
import React, { FC, MouseEventHandler } from 'react';
import { Link, useLocation, type LinkProps } from 'react-router-dom';

export interface SignInLinkProps extends Omit<LinkProps, 'to'> {
  intent?: string;
  bookId?: string;
  redirectPath?: string;
}

const SignInLink: FC<SignInLinkProps> = ({ children, onClick, intent, bookId, redirectPath, ...props }) => {
  const location = useLocation();
  const redirect = redirectPath || `${location.pathname}${location.search}${location.hash}`;

  const handleClick: MouseEventHandler<HTMLAnchorElement> = (e) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('redirectScrollY', String(window.scrollY));
    }
    if (onClick) {
      onClick(e);
    }
  };

  const queryParams = new URLSearchParams();
  queryParams.set('redirect', redirect);
  if (intent) queryParams.set('intent', intent);
  if (bookId) queryParams.set('book_id', bookId);

  return (
    <Link
      {...props}
      to={`/signin?${queryParams.toString()}`}
      state={{ from: redirect, intent, bookId }}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
};

export default SignInLink;
