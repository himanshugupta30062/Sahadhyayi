import React from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

const events = [
  { title: 'September Reading Challenge', date: 'Sep 15', image: 'https://placehold.co/300x150?text=Challenge' },
  { title: 'Author Q&A: Jane Doe', date: 'Sep 22', image: 'https://placehold.co/300x150?text=Q+A' },
  { title: 'Community Meetup', date: 'Oct 5', image: 'https://placehold.co/300x150?text=Meetup' }
];

const UpcomingEvents: React.FC = () => (
  <section className="py-16 px-4 bg-white">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold text-brand mb-8 text-center">Upcoming Events</h2>
      <Carousel className="w-full" opts={{ align: 'start' }}>
        <CarouselContent>
          {events.map((event, idx) => (
            <CarouselItem key={idx} className="basis-3/4 sm:basis-1/2 lg:basis-1/3">
              <div className="p-4 bg-neutral rounded shadow text-center h-full flex flex-col justify-between">
                <img src={event.image} alt="" className="mb-4 h-32 w-full object-cover rounded" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{event.title}</h3>
                  <p className="text-sm text-gray-600">{event.date}</p>
                </div>
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

export default UpcomingEvents;

