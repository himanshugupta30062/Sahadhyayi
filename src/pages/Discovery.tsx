import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import SEO from '@/components/SEO';

// Simple data for trending books and curated lists
const trendingBooks = [
  { id: 1, title: 'Project Hail Mary', author: 'Andy Weir', rating: 4.7 },
  { id: 2, title: 'The Midnight Library', author: 'Matt Haig', rating: 4.6 },
  { id: 3, title: 'Educated', author: 'Tara Westover', rating: 4.5 },
];

const curatedLists = [
  {
    title: "If you liked 'Dune', try these",
    books: [
      { id: 4, title: 'Hyperion', author: 'Dan Simmons' },
      { id: 5, title: 'Foundation', author: 'Isaac Asimov' },
    ],
  },
  {
    title: 'Books about Space Exploration',
    books: [
      { id: 6, title: 'The Martian', author: 'Andy Weir' },
      { id: 7, title: 'Packing for Mars', author: 'Mary Roach' },
    ],
  },
];

interface Review {
  id: number;
  user: string;
  text: string;
  votes: number;
}

export const implementEnhancedDiscovery = () => {
  // Placeholder function for future integration
  return true;
};

const Discovery = () => {
  const [reviews, setReviews] = useState<Record<number, Review[]>>({});
  const [newReview, setNewReview] = useState('');

  const addReview = (bookId: number) => {
    const entry = reviews[bookId] || [];
    const newEntry: Review = {
      id: Date.now(),
      user: 'Guest',
      text: newReview,
      votes: 0,
    };
    setReviews({ ...reviews, [bookId]: [newEntry, ...entry] });
    setNewReview('');
  };

  const voteReview = (bookId: number, reviewId: number) => {
    const list = reviews[bookId] || [];
    setReviews({
      ...reviews,
      [bookId]: list.map((r) =>
        r.id === reviewId ? { ...r, votes: r.votes + 1 } : r
      ),
    });
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4">
      <SEO
        title="Book Discovery"
        description="Discover books through trending lists and community reviews"
        url="https://sahadhyayi.com/discovery"
      />
      <h1 className="text-3xl font-bold mb-6 text-center">Discover New Books</h1>

      {/* Trending Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Trending</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {trendingBooks.map((b) => (
            <Card key={b.id} className="bg-white/90 backdrop-blur-sm border-amber-200">
              <CardHeader>
                <CardTitle className="text-lg">{b.title}</CardTitle>
                <p className="text-sm text-gray-600">{b.author}</p>
                <Badge className="mt-2">Rating {b.rating}</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Input
                    placeholder="Write a review"
                    value={newReview}
                    onChange={(e) => setNewReview(e.target.value)}
                  />
                  <Button size="sm" onClick={() => addReview(b.id)}>
                    Submit Review
                  </Button>
                  <div className="space-y-2 mt-4">
                    {(reviews[b.id] || [])
                      .sort((a, b) => b.votes - a.votes)
                      .map((r) => (
                        <div key={r.id} className="border p-2 rounded">
                          <p className="text-sm mb-1">{r.text}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => voteReview(b.id, r.id)}
                          >
                            Vote ({r.votes})
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Curated Lists */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Curated Lists</h2>
        {curatedLists.map((list) => (
          <div key={list.title} className="mb-6">
            <h3 className="text-xl font-medium mb-2">{list.title}</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {list.books.map((b) => (
                <Card key={b.id} className="bg-white/90 backdrop-blur-sm border-amber-200">
                  <CardHeader>
                    <CardTitle className="text-lg">{b.title}</CardTitle>
                    <p className="text-sm text-gray-600">{b.author}</p>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Discovery;
