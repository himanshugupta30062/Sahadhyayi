import { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SEO from '@/components/SEO';
import { trackUiEvent } from '@/lib/analytics';
import { useAllLibraryBooks } from '@/hooks/useLibraryBooks';
import { useBookRecommendations } from '@/hooks/useBookRecommendations';
import { useAddToBookshelf, useUserBookshelf } from '@/hooks/useUserBookshelf';
import { rankPersonalizedBooks } from '@/utils/personalizedBookRecommendations';
import { useAuth } from '@/contexts/authHelpers';
import { BookOpen, Plus, Search, Sparkles, RotateCcw, BookmarkCheck, ShieldAlert, Clock, X } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import SemanticBookDiscovery from '@/components/discovery/SemanticBookDiscovery';
import MoodPaceContentFilter from '@/components/discovery/MoodPaceContentFilter';
import { useBookExperienceSummary } from '@/hooks/useBookExperienceSummary';
import {
  type MoodId,
  type PaceFilter,
  type ContentWarningFilterState,
  filterAndRankBooks,
  loadSavedDiscoveryPreferences,
  saveDiscoveryPreferences,
  clearSavedDiscoveryPreferences,
  DISCOVERY_MOODS,
  PACE_DEFINITIONS,
} from '@/utils/moodPaceDiscovery';

const Discovery = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Load saved preferences if available
  const savedPrefs = useMemo(() => loadSavedDiscoveryPreferences(), []);

  // Filter states initialized from URL search params or saved preferences
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || '');
  const [languageFilter, setLanguageFilter] = useState(() => searchParams.get('language') || 'all');
  const [genreFilter, setGenreFilter] = useState(() => searchParams.get('genre') || 'all');
  const [availabilityFilter, setAvailabilityFilter] = useState(() => searchParams.get('availability') || 'all');
  const [sortBy, setSortBy] = useState<'relevance' | 'newest' | 'title_asc' | 'pages_asc' | 'pages_desc'>('relevance');

  const [selectedMood, setSelectedMood] = useState<MoodId | null>(() => {
    const urlMood = searchParams.get('mood') as MoodId | null;
    if (urlMood && DISCOVERY_MOODS.some((m) => m.id === urlMood)) return urlMood;
    return savedPrefs?.selectedMood || null;
  });

  const [paceFilter, setPaceFilter] = useState<PaceFilter>(() => {
    const urlPace = searchParams.get('pace') as PaceFilter | null;
    if (urlPace && ['all', 'short', 'medium', 'long'].includes(urlPace)) return urlPace;
    return savedPrefs?.paceFilter || 'all';
  });

  const [includeUnknownLength, setIncludeUnknownLength] = useState<boolean>(() => {
    return savedPrefs?.includeUnknownLength ?? true;
  });

  const [contentWarnings, setContentWarnings] = useState<ContentWarningFilterState>(() => {
    return (
      savedPrefs?.contentWarnings || {
        hiddenWarnings: [],
        strictUnknown: false,
      }
    );
  });

  const [isPreferencesSaved, setIsPreferencesSaved] = useState<boolean>(() => Boolean(savedPrefs));

  const { data: books = [], isLoading, isError } = useAllLibraryBooks();
  const { data: recommendations = [] } = useBookRecommendations(user?.id);
  const { data: shelf = [] } = useUserBookshelf();
  const personalized = useMemo(() => rankPersonalizedBooks(books, shelf, 8), [books, shelf]);
  const addToShelf = useAddToBookshelf();

  // Fetch community experience summaries (moods, pacing, content warnings)
  const bookIds = useMemo(() => books.map((b) => b.id), [books]);
  const { data: experienceSummaries = new Map() } = useBookExperienceSummary(bookIds);

  // Sync state to URL params (shallow)
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedMood) params.set('mood', selectedMood);
    if (paceFilter !== 'all') params.set('pace', paceFilter);
    if (genreFilter !== 'all') params.set('genre', genreFilter);
    if (languageFilter !== 'all') params.set('language', languageFilter);
    if (availabilityFilter !== 'all') params.set('availability', availabilityFilter);

    // Keep current URL clean if nothing active
    const newQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (newQuery !== currentQuery) {
      setSearchParams(params, { replace: true });
    }
  }, [searchQuery, selectedMood, paceFilter, genreFilter, languageFilter, availabilityFilter, searchParams, setSearchParams]);

  // Handle saving preferences
  const handleSavePreferences = () => {
    saveDiscoveryPreferences({
      selectedMood,
      paceFilter,
      includeUnknownLength,
      contentWarnings,
      consentGiven: true,
    });
    setIsPreferencesSaved(true);
    void trackUiEvent('discovery_preferences_saved');
  };

  const handleClearPreferences = () => {
    clearSavedDiscoveryPreferences();
    setIsPreferencesSaved(false);
    void trackUiEvent('discovery_preferences_cleared');
  };

  // Filtered & ranked books
  const scoredBooks = useMemo(() => {
    const filtered = filterAndRankBooks(
      books,
      {
        selectedMood,
        paceFilter,
        includeUnknownLength,
        contentWarnings,
        genreFilter,
        languageFilter,
        availabilityFilter: availabilityFilter === 'readable' ? 'readable' : 'all',
        searchQuery,
      },
      experienceSummaries
    );

    // Sort order
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.book.created_at).getTime() - new Date(a.book.created_at).getTime());
    } else if (sortBy === 'title_asc') {
      filtered.sort((a, b) => a.book.title.localeCompare(b.book.title));
    } else if (sortBy === 'pages_asc') {
      filtered.sort((a, b) => (a.book.pages || 9999) - (b.book.pages || 9999));
    } else if (sortBy === 'pages_desc') {
      filtered.sort((a, b) => (b.book.pages || 0) - (a.book.pages || 0));
    } else {
      // Relevance (score + default)
      filtered.sort((a, b) => b.score - a.score);
    }

    return filtered;
  }, [
    books,
    selectedMood,
    paceFilter,
    includeUnknownLength,
    contentWarnings,
    genreFilter,
    languageFilter,
    availabilityFilter,
    searchQuery,
    sortBy,
    experienceSummaries,
  ]);

  const genres = useMemo(
    () => [...new Set(books.map((book) => book.genre).filter(Boolean))].sort((a, b) => (a ?? '').localeCompare(b ?? '')),
    [books],
  );

  const languages = useMemo(
    () => [...new Set(books.map((book) => book.language).filter(Boolean))].sort((a, b) => (a ?? '').localeCompare(b ?? '')),
    [books],
  );

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      languageFilter !== 'all' ||
      genreFilter !== 'all' ||
      availabilityFilter !== 'all' ||
      paceFilter !== 'all' ||
      selectedMood !== null ||
      contentWarnings.hiddenWarnings.length > 0 ||
      !includeUnknownLength ||
      sortBy !== 'relevance'
  );

  const clearFilters = () => {
    setSearchQuery('');
    setLanguageFilter('all');
    setGenreFilter('all');
    setAvailabilityFilter('all');
    setPaceFilter('all');
    setIncludeUnknownLength(true);
    setSelectedMood(null);
    setContentWarnings({ hiddenWarnings: [], strictUnknown: false });
    setSortBy('relevance');
    void trackUiEvent('discovery_filters_reset');
  };

  const selectedMoodMeta = DISCOVERY_MOODS.find((m) => m.id === selectedMood);

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 max-w-7xl mx-auto">
      <SEO
        title="Mood & Pace Book Discovery | Sahadhyayi"
        description="Discover books by reading mood, pace, length, and content preferences from the Sahadhyayi social library."
        url="https://sahadhyayi.com/discovery"
      />

      <header className="mb-6 text-center">
        <h1 className="text-3xl font-serif font-bold text-foreground">Discover Your Next Read</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl mx-auto">
          Explore the library by reading mood, pace, length, and content preferences tailored to how you want to read today.
        </p>
      </header>

      <div className="mb-8">
        <SemanticBookDiscovery />
      </div>

      {/* Main Filter & Discovery Control Deck */}
      <Card className="mb-8 border-border bg-card shadow-sm">
        <CardContent className="pt-6 space-y-5">
          {/* Top Search & Primary Dropdowns */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, author, or keyword..."
                value={searchQuery}
                aria-label="Search books"
                className="pl-9"
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  void trackUiEvent('discovery_filter_changed', { filter: 'search' });
                }}
              />
            </div>

            <Select
              value={sortBy}
              onValueChange={(value: 'relevance' | 'newest' | 'title_asc' | 'pages_asc' | 'pages_desc') => {
                setSortBy(value);
                void trackUiEvent('discovery_filter_changed', { filter: 'sort', value });
              }}
            >
              <SelectTrigger aria-label="Sort books">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Sort: Mood &amp; Relevance</SelectItem>
                <SelectItem value="newest">Sort: Newest added</SelectItem>
                <SelectItem value="title_asc">Sort: Title A-Z</SelectItem>
                <SelectItem value="pages_asc">Sort: Shortest first</SelectItem>
                <SelectItem value="pages_desc">Sort: Longest first</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={availabilityFilter}
              onValueChange={(value) => {
                setAvailabilityFilter(value);
                void trackUiEvent('discovery_filter_changed', { filter: 'availability', value });
              }}
            >
              <SelectTrigger aria-label="Availability">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All availability</SelectItem>
                <SelectItem value="readable">Readable online (PDF)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Genre and Language Row */}
          <div className="grid sm:grid-cols-2 gap-3 pt-1">
            <Select
              value={genreFilter}
              onValueChange={(value) => {
                setGenreFilter(value);
                void trackUiEvent('discovery_filter_changed', { filter: 'genre', value });
              }}
            >
              <SelectTrigger aria-label="Filter by genre">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All genres</SelectItem>
                {genres.map((genre) => (
                  <SelectItem key={genre} value={genre!}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={languageFilter}
              onValueChange={(value) => {
                setLanguageFilter(value);
                void trackUiEvent('discovery_filter_changed', { filter: 'language', value });
              }}
            >
              <SelectTrigger aria-label="Filter by language">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All languages</SelectItem>
                {languages.map((language) => (
                  <SelectItem key={language} value={language!}>
                    {language}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mood, Pace & Content Safety Filter Suite */}
          <MoodPaceContentFilter
            selectedMood={selectedMood}
            onSelectMood={(mood) => {
              setSelectedMood(mood);
              void trackUiEvent('discovery_filter_changed', { filter: 'mood', value: mood || 'none' });
            }}
            paceFilter={paceFilter}
            onChangePace={(pace) => {
              setPaceFilter(pace);
              void trackUiEvent('discovery_filter_changed', { filter: 'pace', value: pace });
            }}
            includeUnknownLength={includeUnknownLength}
            onToggleIncludeUnknownLength={(include) => {
              setIncludeUnknownLength(include);
              void trackUiEvent('discovery_filter_changed', { filter: 'unknown_length', value: String(include) });
            }}
            contentWarnings={contentWarnings}
            onChangeContentWarnings={(state) => {
              setContentWarnings(state);
              void trackUiEvent('discovery_filter_changed', {
                filter: 'content_warnings',
                count: state.hiddenWarnings.length,
              });
            }}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            isPreferencesSaved={isPreferencesSaved}
            onSavePreferences={handleSavePreferences}
            onClearPreferences={handleClearPreferences}
          />
        </CardContent>
      </Card>

      {/* Active Filter Chips Summary Bar */}
      {hasActiveFilters && (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground font-medium">Active filters:</span>
          {selectedMoodMeta && (
            <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary">
              {selectedMoodMeta.icon} {selectedMoodMeta.label}
              <button
                type="button"
                onClick={() => setSelectedMood(null)}
                aria-label={`Remove mood filter ${selectedMoodMeta.label}`}
                className="hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {paceFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              <Clock className="w-3 h-3" /> {PACE_DEFINITIONS[paceFilter].label}
              <button
                type="button"
                onClick={() => setPaceFilter('all')}
                aria-label={`Remove pace filter ${PACE_DEFINITIONS[paceFilter].label}`}
                className="hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {genreFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Genre: {genreFilter}
              <button
                type="button"
                onClick={() => setGenreFilter('all')}
                aria-label={`Remove genre filter ${genreFilter}`}
                className="hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {languageFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Lang: {languageFilter}
              <button
                type="button"
                onClick={() => setLanguageFilter('all')}
                aria-label={`Remove language filter ${languageFilter}`}
                className="hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {availabilityFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Readable online
              <button
                type="button"
                onClick={() => setAvailabilityFilter('all')}
                aria-label="Remove availability filter"
                className="hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {contentWarnings.hiddenWarnings.map((w) => (
            <Badge key={w} variant="secondary" className="gap-1 border-amber-500/30 text-amber-700 dark:text-amber-300">
              <ShieldAlert className="w-3 h-3" /> Hide: {w}
              <button
                type="button"
                onClick={() =>
                  setContentWarnings({
                    ...contentWarnings,
                    hiddenWarnings: contentWarnings.hiddenWarnings.filter((item) => item !== w),
                  })
                }
                aria-label={`Remove content exclusion ${w}`}
                className="hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}

          {!includeUnknownLength && (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              Strict length: known page counts only
              <button
                type="button"
                onClick={() => setIncludeUnknownLength(true)}
                aria-label="Enable unknown length books"
                className="hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Personalized Reading Taste Section */}
      {user && personalized.length > 0 && !hasActiveFilters && (
        <section className="mb-10" aria-labelledby="personalized-heading">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-brand-primary" />
            <h2 id="personalized-heading" className="text-2xl font-semibold">
              Picked for your reading taste
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Suggestions shaped by books you are reading or have completed, including your ratings.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {personalized.slice(0, 4).map((book) => (
              <Link key={book.id} to={`/book/${book.id}`} className="block">
                <Card className="h-full border-border hover:border-brand-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <p className="text-xs text-brand-primary font-medium mb-2">{book.reason}</p>
                    <h3 className="font-semibold line-clamp-2">{book.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{book.author || 'Unknown author'}</p>
                    {book.genre && (
                      <Badge variant="outline" className="mt-2">
                        {book.genre}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recommended for You Section */}
      {user && recommendations.length > 0 && !hasActiveFilters && (
        <section className="mb-10" aria-labelledby="recommended-heading">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-brand-primary" />
            <h2 id="recommended-heading" className="text-2xl font-semibold">
              Recommended for you
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendations.slice(0, 4).map((book) => (
              <Card key={book.id} className="h-full border-border hover:border-brand-primary/50 transition-colors">
                <CardContent className="p-4 flex flex-col h-full">
                  <Link to={`/book/${book.id}`} className="group">
                    <div className="flex items-center gap-1.5 text-xs text-brand-primary font-medium mb-2">
                      <Sparkles className="w-3.5 h-3.5" /> Picked from your bookshelf activity
                    </div>
                    <h3 className="font-semibold line-clamp-2 group-hover:text-brand-primary">{book.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{book.author || 'Unknown author'}</p>
                    {book.genre && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {book.genre}
                      </Badge>
                    )}
                  </Link>
                  <div className="mt-auto pt-3 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" asChild>
                      <Link to={`/book/${book.id}`}>Details</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 text-brand-primary"
                      disabled={addToShelf.isPending}
                      onClick={() => addToShelf.mutate({ bookId: book.id, status: 'want_to_read' })}
                    >
                      <BookmarkCheck className="w-4 h-4 mr-1" /> Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Primary Discovery Catalog Grid */}
      <section className="mb-10" aria-labelledby="catalog-results-heading">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 id="catalog-results-heading" className="text-2xl font-semibold">
            {selectedMoodMeta ? `${selectedMoodMeta.label} Books` : 'Explore the library'}
          </h2>
          <span className="text-xs text-muted-foreground">
            {scoredBooks.length} {scoredBooks.length === 1 ? 'book found' : 'books found'}
          </span>
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        )}

        {isError && (
          <p className="text-center text-destructive py-12">Books could not be loaded. Please try again.</p>
        )}

        {!isLoading && !isError && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {scoredBooks.slice(0, 36).map(({ book, moodMatch, paceMatch, contentWarningInfo }) => (
              <Card key={book.id} className="border-border overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex gap-4">
                  <Link
                    to={`/book/${book.id}`}
                    className="w-20 h-28 bg-muted rounded overflow-hidden shrink-0 flex items-center justify-center"
                    aria-label={`View details for ${book.title}`}
                  >
                    {book.cover_image_url ? (
                      <img src={book.cover_image_url} alt="" loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen className="w-7 h-7 text-muted-foreground" />
                    )}
                  </Link>

                  <div className="min-w-0 flex-1 flex flex-col">
                    <Link
                      to={`/book/${book.id}`}
                      onClick={() => void trackUiEvent('discovery_book_opened', { bookId: book.id })}
                    >
                      <h3 className="font-semibold line-clamp-2 hover:text-brand-primary">{book.title}</h3>
                    </Link>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">{book.author || 'Unknown author'}</p>

                    {/* Metadata & Tag Badges */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {book.genre && (
                        <Badge variant="outline" className="text-xs">
                          {book.genre}
                        </Badge>
                      )}

                      {paceMatch && (
                        <Badge variant="secondary" className="text-xs flex items-center gap-1 font-normal">
                          <Clock className="w-3 h-3 opacity-60" />
                          {paceMatch.label}
                        </Badge>
                      )}

                      {book.pdf_url && (
                        <Badge variant="secondary" className="text-xs">
                          Read online
                        </Badge>
                      )}

                      {/* Explainable Mood Signal */}
                      {moodMatch && (
                        <Badge
                          variant="outline"
                          title={moodMatch.reason}
                          className="text-xs border-primary/40 bg-primary/5 text-primary"
                        >
                          {moodMatch.type === 'community' ? '✨ Reader-tagged' : '📖 Inferred'}: {moodMatch.label}
                        </Badge>
                      )}

                      {/* Community Content Warning Badge */}
                      {contentWarningInfo.warnings.length > 0 && (
                        <Badge
                          variant="outline"
                          className="text-xs border-amber-500/40 text-amber-700 dark:text-amber-300"
                          title="Sourced from community reader submissions"
                        >
                          ⚠️ {contentWarningInfo.warnings.slice(0, 2).join(', ')}
                          {contentWarningInfo.warnings.length > 2 && '…'}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-auto pt-3 flex items-center justify-between">
                      {user ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="px-0 text-xs text-brand-primary hover:text-brand-primary"
                          disabled={addToShelf.isPending}
                          onClick={() => addToShelf.mutate({ bookId: book.id, status: 'want_to_read' })}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> Save to shelf
                        </Button>
                      ) : (
                        <Link
                          to={`/signin?redirect=${encodeURIComponent(`/book/${book.id}`)}`}
                          className="text-xs text-brand-primary hover:underline"
                        >
                          Sign in to save
                        </Link>
                      )}

                      <Link to={`/book/${book.id}`} className="text-xs text-muted-foreground hover:underline">
                        Details &rarr;
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && scoredBooks.length === 0 && (
          <Card className="border-dashed border-2 border-border">
            <CardContent className="py-12 text-center space-y-3">
              <BookOpen className="w-10 h-10 mx-auto text-muted-foreground opacity-60" />
              <h3 className="text-lg font-semibold">No books match your discovery filters</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Try choosing a different reading mood, broadening your pace range, or resetting excluded content topics.
              </p>
              <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Reset all filters
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      <footer className="text-center pt-4">
        <Button asChild variant="outline">
          <Link to="/library">
            <Search className="w-4 h-4 mr-2" />
            Browse the full library directory
          </Link>
        </Button>
      </footer>
    </div>
  );
};

export default Discovery;
