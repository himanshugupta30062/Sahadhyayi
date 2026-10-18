import React from 'react';

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
      <style>{`
        @keyframes sahadhyayiTinyBookFloat {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(-10deg); }
          24% { transform: translate3d(12px, -15px, 0) rotate(-2deg); }
          52% { transform: translate3d(-2px, -30px, 0) rotate(8deg); }
          76% { transform: translate3d(-13px, -12px, 0) rotate(1deg); }
        }
        .home-floating-book {
          position: absolute;
          display: block;
          width: 22px;
          height: 30px;
          opacity: 0.52;
          transform-origin: center;
          animation: sahadhyayiTinyBookFloat 20s ease-in-out infinite;
          filter: drop-shadow(0 5px 5px rgba(36, 55, 42, 0.09));
        }
        .home-floating-book__cover {
          position: absolute;
          inset: 2px 5px 4px 2px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.55);
          border-radius: 3px 4px 4px 3px;
          box-shadow: 2px 1px 0 rgba(255,255,255,0.72), 3px 2px 0 rgba(40,50,42,0.12);
        }
        .home-floating-book__cover::before {
          content: '';
          position: absolute;
          left: 4px;
          right: 3px;
          top: 8px;
          height: 1px;
          background: rgba(255,255,255,0.72);
          box-shadow: 0 3px 0 rgba(255,255,255,0.48);
        }
        .home-floating-book__spine {
          position: absolute;
          left: 1px;
          top: 3px;
          bottom: 4px;
          width: 2px;
          background: rgba(38, 48, 40, 0.2);
          border-radius: 2px 0 0 2px;
        }
        .home-floating-book__ribbon {
          position: absolute;
          top: 0;
          right: 4px;
          width: 4px;
          height: 10px;
          background: #B68A35;
          clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 76%, 0 100%);
          opacity: 0.9;
        }
        .home-floating-book--sage .home-floating-book__cover { background: linear-gradient(145deg, #9FC5A5, #557D63); }
        .home-floating-book--gold .home-floating-book__cover { background: linear-gradient(145deg, #E7CD8A, #B58B3A); }
        .home-floating-book--blue .home-floating-book__cover { background: linear-gradient(145deg, #B5CBEA, #6F8FBE); }
        .home-floating-book--rose .home-floating-book__cover { background: linear-gradient(145deg, #E9BCC0, #BA7C8B); }
        @media (max-width: 639px) {
          .home-floating-book { transform: scale(0.86); opacity: 0.36; }
        }
        @media (prefers-reduced-motion: reduce) {
          .home-floating-book { animation: none; }
        }
      `}</style>
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
