import React from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

interface Event {
  id: number;
  title: string;
  date: string;
  image: string;
}

const events: Event[] = [
  { id: 1, title: 'Spring Reading Challenge', date: 'Apr 5', image: 'https://placehold.co/300x180?text=Event+1' },
  { id: 2, title: 'Author Q&A: Matt Haig', date: 'Apr 12', image: 'https://placehold.co/300x180?text=Event+2' },
  { id: 3, title: 'Poetry Month Kickoff', date: 'Apr 20', image: 'https://placehold.co/300x180?text=Event+3' }
];

const UpcomingEvents: React.FC = () => {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Upcoming Events</h2>
        <Carousel>
          <CarouselContent>
            {events.map((event) => (
              <CarouselItem key={event.id} className="basis-1/1 sm:basis-1/2 lg:basis-1/3">
                <div className="p-2">
                  <img src={event.image} alt={event.title} className="w-full h-auto rounded shadow-md" />
                  <div className="mt-2 text-center">
                    <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                    <p className="text-xs text-gray-600">{event.date}</p>
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
};

export default UpcomingEvents;

