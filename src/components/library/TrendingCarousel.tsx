
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const TrendingCarousel = () => {
  const trendingBooks = [
    { id: 1, title: 'The Seven Husbands of Evelyn Hugo', author: 'Taylor Jenkins Reid', rating: 4.5 },
    { id: 2, title: 'Project Hail Mary', author: 'Andy Weir', rating: 4.7 },
    { id: 3, title: 'The Midnight Library', author: 'Matt Haig', rating: 4.2 },
    { id: 4, title: 'Educated', author: 'Tara Westover', rating: 4.4 },
    { id: 5, title: 'Where the Crawdads Sing', author: 'Delia Owens', rating: 4.3 }
  ];

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Trending Books</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {trendingBooks.map((book) => (
            <Card key={book.id} className="flex-shrink-0 w-48 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="w-full h-32 bg-gradient-to-br from-green-500 to-blue-600 rounded mb-3 flex items-center justify-center text-white font-bold text-sm">
                  {book.title.slice(0, 20)}...
                </div>
                <h3 className="font-medium text-sm line-clamp-2 mb-1">{book.title}</h3>
                <p className="text-xs text-gray-600 mb-2">
                  <Link to={`/authors/${slugify(book.author)}`} className="underline hover:text-blue-700">
                    {book.author}
                  </Link>
                </p>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium">{book.rating}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrendingCarousel;
