import React from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

const books = [
  { title: 'The Great Gatsby', cover: 'https://placehold.co/200x300?text=Gatsby' },
  { title: 'Pride and Prejudice', cover: 'https://placehold.co/200x300?text=Pride' },
  { title: '1984', cover: 'https://placehold.co/200x300?text=1984' },
  { title: 'To Kill a Mockingbird', cover: 'https://placehold.co/200x300?text=Mockingbird' }
];

const PopularBooks: React.FC = () => (
  <section className="py-16 px-4 bg-neutral">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold text-brand mb-8 text-center">Popular Books</h2>
      <Carousel className="w-full" opts={{ align: 'start' }}>
        <CarouselContent>
          {books.map((book, idx) => (
            <CarouselItem key={idx} className="basis-2/3 sm:basis-1/3 lg:basis-1/4">
              <div className="p-4 text-center">
                <img src={book.cover} alt={book.title} className="mx-auto h-48 object-cover rounded shadow mb-4" />
                <p className="text-sm font-medium text-gray-800">{book.title}</p>
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

export default PopularBooks;

