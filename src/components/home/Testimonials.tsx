import React from 'react';

const testimonials = [
  { quote: 'Sahadhyayi reignited my love for books.', author: 'Anita P.' },
  { quote: 'A welcoming community for serious readers.', author: 'Ravi S.' },
  { quote: 'The curated lists help me find my next favorite read.', author: 'Mina K.' }
];

const Testimonials: React.FC = () => (
  <section className="py-16 px-4 bg-neutral">
    <div className="max-w-4xl mx-auto text-center">
      <h2 className="text-2xl sm:text-3xl font-bold text-brand mb-8">What readers are saying</h2>
      <ul className="space-y-6">
        {testimonials.map((t, idx) => (
          <li key={idx} className="text-gray-800">
            <p className="text-lg italic mb-2">“{t.quote}”</p>
            <p className="text-sm text-gray-600">— {t.author}</p>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

export default Testimonials;

