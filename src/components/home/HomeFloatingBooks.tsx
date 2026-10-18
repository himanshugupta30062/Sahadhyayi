import React from 'react';
import './HomeFloatingBooks.css';

type FloatingBookPlacement = 'hero' | 'section' | 'cta';

interface FloatingBook {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  delay: string;
  duration: string;
  cover: 'sage' | 'gold' | 'blue' | 'rose';
  hideOnMobile?: boolean;
}

const BOOK_LAYOUTS: Record<FloatingBookPlacement, FloatingBook[]> = {
  hero: [
    { top: '13%', left: '8%', delay: '-2s', duration: '18s', cover: 'sage', hideOnMobile: true },
    { top: '48%', right: '5%', delay: '-8s', duration: '22s', cover: 'gold', hideOnMobile: true },
    { bottom: '12%', left: '21%', delay: '-13s', duration: '20s', cover: 'blue' },
  ],
  section: [
    { top: '13%', left: '6%', delay: '-4s', duration: '19s', cover: 'sage', hideOnMobile: true },
    { top: '30%', right: '7%', delay: '-11s', duration: '23s', cover: 'rose', hideOnMobile: true },
    { bottom: '17%', left: '11%', delay: '-7s', duration: '21s', cover: 'gold', hideOnMobile: true },
    { bottom: '9%', right: '16%', delay: '-15s', duration: '18s', cover: 'blue' },
  ],
  cta: [
    { top: '16%', left: '10%', delay: '-5s', duration: '20s', cover: 'blue', hideOnMobile: true },
    { top: '23%', right: '11%', delay: '-12s', duration: '22s', cover: 'gold', hideOnMobile: true },
    { bottom: '12%', right: '24%', delay: '-9s', duration: '19s', cover: 'sage' },
  ],
};

const HomeFloatingBooks: React.FC<{ placement?: FloatingBookPlacement }> = ({ placement = 'section' }) => {
  const books = BOOK_LAYOUTS[placement];

  return (
    <div
      aria-hidden="true"
      className={`home-floating-books home-floating-books--${placement} pointer-events-none absolute inset-0 z-0 overflow-hidden dark:hidden`}
    >
      {books.map((book, index) => (
        <span
          key={`${placement}-book-${index}`}
          className={`home-floating-book home-floating-book--${book.cover}${book.hideOnMobile ? ' hidden sm:block' : ''}`}
          style={{
            top: book.top,
            right: book.right,
            bottom: book.bottom,
            left: book.left,
            animationDelay: book.delay,
            animationDuration: book.duration,
          }}
        >
          <span className="home-floating-book__cover">
            <span className="home-floating-book__spine" />
            <span className="home-floating-book__ribbon" />
          </span>
        </span>
      ))}
    </div>
  );
};

export default HomeFloatingBooks;
