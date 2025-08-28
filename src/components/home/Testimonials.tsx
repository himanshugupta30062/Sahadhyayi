import React from 'react';

interface Testimonial {
  id: number;
  quote: string;
  author: string;
}

const testimonials: Testimonial[] = [
  { id: 1, quote: 'Sahadhyayi rekindled my love for reading.', author: 'Anita P.' },
  { id: 2, quote: 'A friendly community with great book discussions.', author: 'Rahul D.' },
  { id: 3, quote: 'The reading challenges keep me motivated.', author: 'Sara L.' }
];

const Testimonials: React.FC = () => {
  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-8 text-gray-900">What Readers Say</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((t) => (
            <blockquote key={t.id} className="p-6 bg-white rounded-lg shadow">
              <p className="text-gray-700 mb-4">“{t.quote}”</p>
              <footer className="text-sm font-semibold text-gray-900">{t.author}</footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

