import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SEO from '@/components/SEO';
import { trendingBooks, curatedLists, type Review } from './discoveryHelpers';
import { trackUiEvent } from '@/lib/analytics';

const Discovery = () => {
  const [reviews, setReviews] = useState<Record<number, Review[]>>({});
  const [newReview, setNewReview] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'rating_desc' | 'title_asc'>('relevance');

  const filteredTrendingBooks = useMemo(() => {
    let list = [...trendingBooks];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter((book) =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.genre.toLowerCase().includes(query)
      );
    }

    if (languageFilter !== 'all') list = list.filter(book => book.language === languageFilter);
    if (genreFilter !== 'all') list = list.filter(book => book.genre === genreFilter);
    if (levelFilter !== 'all') list = list.filter(book => book.level === levelFilter);
    if (availabilityFilter !== 'all') list = list.filter(book => String(book.available) === availabilityFilter);

    if (sortBy === 'rating_desc') list.sort((a, b) => b.rating - a.rating);
    if (sortBy === 'title_asc') list.sort((a, b) => a.title.localeCompare(b.title));

    return list;
  }, [availabilityFilter, genreFilter, languageFilter, levelFilter, searchQuery, sortBy]);

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
    void trackUiEvent('discovery_review_submitted', { bookId });
  };

  const voteReview = (bookId: number, reviewId: number) => {
    const list = reviews[bookId] || [];
    setReviews({
      ...reviews,
      [bookId]: list.map((r) =>
        r.id === reviewId ? { ...r, votes: r.votes + 1 } : r
      ),
    });
    void trackUiEvent('discovery_review_voted', { bookId });
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4">
      <SEO
        title="Book Discovery"
        description="Discover books through trending lists and community reviews"
        url="https://sahadhyayi.com/discovery"
      />
      <h1 className="text-3xl font-bold mb-6 text-center">Discover New Books</h1>

      <Card className="mb-8 border-border">
        <CardContent className="pt-6 space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <Input
              placeholder="Search by title, author, or keyword"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                void trackUiEvent('discovery_filter_changed', { filter: 'search' });
              }}
            />
            <Select value={sortBy} onValueChange={(value: 'relevance' | 'rating_desc' | 'title_asc') => {
              setSortBy(value);
              void trackUiEvent('discovery_filter_changed', { filter: 'sort', value });
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Sort: Relevance</SelectItem>
                <SelectItem value="rating_desc">Sort: Highest rating</SelectItem>
                <SelectItem value="title_asc">Sort: Title A-Z</SelectItem>
              </SelectContent>
            </Select>
            <Select value={availabilityFilter} onValueChange={(value) => {
              setAvailabilityFilter(value);
              void trackUiEvent('discovery_filter_changed', { filter: 'availability', value });
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All availability</SelectItem>
                <SelectItem value="true">Available now</SelectItem>
                <SelectItem value="false">Waitlist</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <Select value={languageFilter} onValueChange={(value) => {
              setLanguageFilter(value);
              void trackUiEvent('discovery_filter_changed', { filter: 'language', value });
            }}>
              <SelectTrigger><SelectValue placeholder="Language" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All languages</SelectItem>
                <SelectItem value="English">English</SelectItem>
              </SelectContent>
            </Select>
            <Select value={genreFilter} onValueChange={(value) => {
              setGenreFilter(value);
              void trackUiEvent('discovery_filter_changed', { filter: 'genre', value });
            }}>
              <SelectTrigger><SelectValue placeholder="Genre" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All genres</SelectItem>
                <SelectItem value="Sci-Fi">Sci-Fi</SelectItem>
                <SelectItem value="Fiction">Fiction</SelectItem>
                <SelectItem value="Memoir">Memoir</SelectItem>
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={(value) => {
              setLevelFilter(value);
              void trackUiEvent('discovery_filter_changed', { filter: 'level', value });
            }}>
              <SelectTrigger><SelectValue placeholder="Reading level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All reading levels</SelectItem>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Trending Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Trending</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {filteredTrendingBooks.map((b) => (
            <Card key={b.id} className="bg-white/90 backdrop-blur-sm border-amber-200">
              <CardHeader>
                <CardTitle className="text-lg">{b.title}</CardTitle>
                <p className="text-sm text-gray-600">{b.author}</p>
                <Badge className="mt-2">Rating {b.rating}</Badge>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline">{b.language}</Badge>
                  <Badge variant="outline">{b.genre}</Badge>
                  <Badge variant="outline">{b.level}</Badge>
                  <Badge variant={b.available ? 'default' : 'secondary'}>{b.available ? 'Available' : 'Waitlist'}</Badge>
                </div>
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
        {filteredTrendingBooks.length === 0 && (
          <Card className="border-dashed border-2 border-border">
            <CardContent className="py-12 text-center space-y-2">
              <h3 className="text-lg font-semibold">No books match your filters</h3>
              <p className="text-sm text-muted-foreground">Try broadening your filters or searching with fewer keywords.</p>
            </CardContent>
          </Card>
        )}
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
