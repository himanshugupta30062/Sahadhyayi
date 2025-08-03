
import React, { FC, MouseEventHandler } from 'react';
import { Link, useLocation, type LinkProps } from 'react-router-dom';

const SignInLink: FC<Omit<LinkProps, 'to'>> = ({ children, onClick, ...props }) => {
  const location = useLocation();
  const redirect = `${location.pathname}${location.search}${location.hash}`;

  const handleClick: MouseEventHandler<HTMLAnchorElement> = (e) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('redirectScrollY', String(window.scrollY));
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Link
      {...props}
      to={`/signin?redirect=${encodeURIComponent(redirect)}`}
      state={{ from: redirect }}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
};

export default SignInLink;
