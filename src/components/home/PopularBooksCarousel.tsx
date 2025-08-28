import React from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

interface Book {
  id: number;
  title: string;
  cover: string;
}

const books: Book[] = [
  { id: 1, title: 'The Midnight Library', cover: 'https://placehold.co/200x300?text=Book+1' },
  { id: 2, title: 'Atomic Habits', cover: 'https://placehold.co/200x300?text=Book+2' },
  { id: 3, title: 'Sapiens', cover: 'https://placehold.co/200x300?text=Book+3' },
  { id: 4, title: 'Educated', cover: 'https://placehold.co/200x300?text=Book+4' },
  { id: 5, title: 'The Psychology of Money', cover: 'https://placehold.co/200x300?text=Book+5' }
];

const PopularBooksCarousel: React.FC = () => {
  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Popular Books</h2>
        <Carousel>
          <CarouselContent>
            {books.map((book) => (
              <CarouselItem key={book.id} className="basis-1/2 sm:basis-1/4 lg:basis-1/5">
                <div className="p-2">
                  <img src={book.cover} alt={book.title} className="w-full h-auto rounded shadow-md" />
                  <p className="mt-2 text-center text-sm text-gray-700">{book.title}</p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
};

export default PopularBooksCarousel;

