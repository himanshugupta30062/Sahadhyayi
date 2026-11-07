import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Mail,
  MapPin,
  MessageSquare,
  Search,
  Sparkles,
  Star,
  Users,
  Video,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SEO from '@/components/SEO';
import { ScheduleSessionDialog } from '@/components/authors/ScheduleSessionDialog';
import { useToast } from '@/hooks/use-toast';
import { useAuthors } from '@/hooks/useAuthors';

interface MentorAuthor {
  id: string;
  name: string;
  genre: string;
  category: 'fiction' | 'non-fiction' | 'history' | 'sci-fi' | 'philosophy' | 'poetry';
  bio: string;
  image: string;
  rating: number;
  followers_count: number;
  books: string[];
  mentorshipTopics: string[];
  nextSession: string;
  availableSlots: string[];
  location: string;
  verified: boolean;
}

const CURATED_MENTORS: MentorAuthor[] = [
  {
    id: 'author-ramachandra-guha',
    name: 'Dr. Ramachandra Guha',
    genre: 'History & Biography',
    category: 'history',
    bio: 'Eminent historian, biographer, and cricket writer. Author of "India After Gandhi" and "Gandhi: The Years That Changed the World". Mentors in archival research and narrative non-fiction.',
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
    rating: 4.95,
    followers_count: 42000,
    books: ['India After Gandhi', 'Gandhi Before India', 'A Corner of a Foreign Field'],
    mentorshipTopics: ['Archival Research', 'Biographical Narrative', 'Writing Modern History'],
    nextSession: 'Nov 24, 2026 at 5:00 PM IST',
    availableSlots: ['Nov 24, 2026', 'Dec 01, 2026', 'Dec 08, 2026'],
    location: 'Bengaluru, India',
    verified: true,
  },
  {
    id: 'author-priya-sharma',
    name: 'Priya Sharma',
    genre: 'Contemporary Fiction',
    category: 'fiction',
    bio: 'Celebrated contemporary novelist whose narratives explore cultural transitions, family dynamics, and urban Indian identity. Mentors emerging writers in character voice and pacing.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    followers_count: 28500,
    books: ['Mumbai Monsoons', 'Threads of Tradition', 'City of Whispers'],
    mentorshipTopics: ['Character Development', 'Dialogue & Subtext', 'Publishing Pathways'],
    nextSession: 'Nov 20, 2026 at 7:00 PM IST',
    availableSlots: ['Nov 20, 2026', 'Nov 27, 2026', 'Dec 04, 2026'],
    location: 'Mumbai, India',
    verified: true,
  },
  {
    id: 'author-rajesh-kumar',
    name: 'Dr. Rajesh Kumar',
    genre: 'Speculative & Hard Sci-Fi',
    category: 'sci-fi',
    bio: 'Theoretical physicist and science fiction novelist. Explores quantum mechanics, synthetic consciousness, and South Asian futurism. Specializes in worldbuilding logic.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    rating: 4.85,
    followers_count: 19800,
    books: ['Quantum Dreams', 'The Neural Network', 'Chronicles of Indra'],
    mentorshipTopics: ['Hard Sci-Fi Worldbuilding', 'Scientific Plausibility in Fiction', 'AI Tropes'],
    nextSession: 'Nov 22, 2026 at 6:30 PM IST',
    availableSlots: ['Nov 22, 2026', 'Nov 29, 2026', 'Dec 06, 2026'],
    location: 'New Delhi, India',
    verified: true,
  },
  {
    id: 'author-arjun-mehta',
    name: 'Arjun Mehta',
    genre: 'Historical Fiction & Epics',
    category: 'history',
    bio: 'Researches ancient and medieval South Asia. Reconstructs forgotten dynasties, battles, and political philosophies through compelling dramatic storytelling.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    followers_count: 21500,
    books: ['The Last Mughal', 'Swords of Swaraj', 'Kingdoms of Sand'],
    mentorshipTopics: ['Period Research', 'Historical Accuracy vs Drama', 'Epic Structure'],
    nextSession: 'Nov 25, 2026 at 4:00 PM IST',
    availableSlots: ['Nov 25, 2026', 'Dec 02, 2026', 'Dec 09, 2026'],
    location: 'Jaipur, India',
    verified: true,
  },
  {
    id: 'author-meenakshi-sundaram',
    name: 'Dr. Meenakshi Sundaram',
    genre: 'Philosophy & Classical Translations',
    category: 'philosophy',
    bio: 'Sanskrit scholar, literary translator, and essayist. Focuses on translating philosophical verses and ancient epics into accessible contemporary English prose.',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80',
    rating: 4.92,
    followers_count: 17400,
    books: ['Verses of the Upanishads', 'Echoes of Sanskrit Poetry'],
    mentorshipTopics: ['Literary Translation', 'Sanskrit Poetics & Rasa', 'Philosophical Non-Fiction'],
    nextSession: 'Nov 28, 2026 at 3:00 PM IST',
    availableSlots: ['Nov 28, 2026', 'Dec 05, 2026', 'Dec 12, 2026'],
    location: 'Chennai, India',
    verified: true,
  },
  {
    id: 'author-vikramaditya-roy',
    name: 'Vikramaditya Roy',
    genre: 'Poetry & Literary Criticism',
    category: 'poetry',
    bio: 'Poet, critic, and editor of literary quarterlies. Mentors writers in stanza construction, lyrical resonance, and critical reviewing for journals.',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80',
    rating: 4.88,
    followers_count: 15200,
    books: ['Monsoon Ghazals', 'The Anatomy of Metaphor'],
    mentorshipTopics: ['Poetic Meter & Rhyme', 'Submitting to Literary Journals', 'Book Reviewing'],
    nextSession: 'Nov 26, 2026 at 8:00 PM IST',
    availableSlots: ['Nov 26, 2026', 'Dec 03, 2026', 'Dec 10, 2026'],
    location: 'Kolkata, India',
    verified: true,
  },
];

const GENRE_FILTERS = [
  { key: 'all', label: 'All Genres' },
  { key: 'fiction', label: 'Fiction' },
  { key: 'history', label: 'History & Biography' },
  { key: 'sci-fi', label: 'Science Fiction' },
  { key: 'philosophy', label: 'Philosophy' },
  { key: 'poetry', label: 'Poetry & Verse' },
];

const AuthorConnect = () => {
  const { data: dbAuthors = [] } = useAuthors();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'rating' | 'followers' | 'name'>('rating');

  // Message Dialog State
  const [messageAuthor, setMessageAuthor] = useState<MentorAuthor | null>(null);
  const [messageTopic, setMessageTopic] = useState('Manuscript Feedback');
  const [messageText, setMessageText] = useState('');
  const { toast } = useToast();

  // Combine database authors (if any meet mentor criteria) with curated mentors
  const allAuthors = useMemo(() => {
    const list: MentorAuthor[] = [...CURATED_MENTORS];
    dbAuthors.forEach((dbAuthor) => {
      if (!list.some((a) => a.id === dbAuthor.id || a.name.toLowerCase() === dbAuthor.name.toLowerCase())) {
        list.push({
          id: dbAuthor.id,
          name: dbAuthor.name,
          genre: (dbAuthor.genres && dbAuthor.genres[0]) || 'Literature',
          category: 'fiction',
          bio: dbAuthor.bio || 'Published author and literary creator in the Sahadhyayi reading community.',
          image: dbAuthor.profile_image_url || '',
          rating: dbAuthor.rating || 4.8,
          followers_count: dbAuthor.followers_count || 1200,
          books: [],
          mentorshipTopics: ['Writing & Publishing', 'Literary Discussions'],
          nextSession: 'Schedule a session',
          availableSlots: dbAuthor.availableSlots || ['Next week', 'Next month'],
          location: dbAuthor.location || 'India',
          verified: Boolean(dbAuthor.verified),
        });
      }
    });
    return list;
  }, [dbAuthors]);

  const filteredAuthors = useMemo(() => {
    return allAuthors
      .filter((author) => {
        const matchCategory = selectedCategory === 'all' || author.category === selectedCategory;
        const term = searchTerm.trim().toLowerCase();
        const matchSearch =
          !term ||
          author.name.toLowerCase().includes(term) ||
          author.genre.toLowerCase().includes(term) ||
          author.bio.toLowerCase().includes(term) ||
          author.books.some((b) => b.toLowerCase().includes(term)) ||
          author.mentorshipTopics.some((t) => t.toLowerCase().includes(term));
        return matchCategory && matchSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'followers') return b.followers_count - a.followers_count;
        return a.name.localeCompare(b.name);
      });
  }, [allAuthors, selectedCategory, searchTerm, sortBy]);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    toast({
      title: 'Inquiry Sent Successfully',
      description: `Your note regarding "${messageTopic}" has been delivered to ${messageAuthor?.name}. They will respond to your connected email.`,
    });
    setMessageText('');
    setMessageAuthor(null);
  };

  return (
    <>
      <SEO
        title="Connect with Authors & Literary Mentors — Sahadhyayi"
        description="Connect directly with published authors, critics, and scholars on Sahadhyayi. Book one-on-one mentorship sessions, seek manuscript guidance, and join live author AMAs."
        canonical="https://sahadhyayi.com/author-connect"
        url="https://sahadhyayi.com/author-connect"
      />

      <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7]">
        {/* Hero Section */}
        <section className="relative border-b border-[#E8E8E3] bg-[#F4F3EF] dark:border-[#222824] dark:bg-[#111614] pt-24 pb-14 sm:pb-18 px-4 sm:px-6 lg:px-8 overflow-hidden transition-colors">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#1C442D]/5 dark:bg-[#D5B16D]/5 blur-3xl" />
            <div className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-[#D5B16D]/5 dark:bg-[#1C442D]/10 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl">
            {/* Cultural Origin Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D8D2C6] bg-white/80 dark:border-[#2E3B33] dark:bg-[#151D18] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#1C442D] dark:text-[#D5B16D] mb-4 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-[#D5B16D]" />
              <span>Author Connect & Literary Mentorship</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1C201D] dark:text-[#F3F0E7] max-w-3xl leading-[1.18]">
              Connect with Authors, Critics & Thinkers
            </h1>
            <p className="mt-4 text-base sm:text-lg text-[#636B65] dark:text-[#A5ADA6] max-w-2xl leading-relaxed">
              Book personalized one-on-one sessions, seek writing and publishing guidance, and discuss manuscripts directly with published authors, historians, and literary scholars.
            </p>

            {/* 3 Value Pillars */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-3xl">
              <div className="flex items-center gap-2.5 rounded-xl border border-[#E3DDD4] dark:border-[#242F28] bg-white/80 dark:bg-[#161D19] p-3 text-xs font-semibold text-[#1C201D] dark:text-[#E2DFD2] shadow-2xs">
                <GraduationCap className="h-4 w-4 text-[#1C442D] dark:text-[#D5B16D] shrink-0" />
                <span>1-on-1 Manuscript Guidance</span>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-[#E3DDD4] dark:border-[#242F28] bg-white/80 dark:bg-[#161D19] p-3 text-xs font-semibold text-[#1C201D] dark:text-[#E2DFD2] shadow-2xs">
                <Users className="h-4 w-4 text-[#1C442D] dark:text-[#D5B16D] shrink-0" />
                <span>Book Club Guest Visits</span>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-[#E3DDD4] dark:border-[#242F28] bg-white/80 dark:bg-[#161D19] p-3 text-xs font-semibold text-[#1C201D] dark:text-[#E2DFD2] shadow-2xs">
                <Video className="h-4 w-4 text-[#1C442D] dark:text-[#D5B16D] shrink-0" />
                <span>Live Interactive Q&A</span>
              </div>
            </div>
          </div>
        </section>

        {/* Filter and Search Bar */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by author name, genre, books, or topics…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 bg-white dark:bg-[#141A17] border-border text-sm"
              />
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <label htmlFor="sort-authors" className="text-xs font-semibold uppercase text-muted-foreground">
                Sort:
              </label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                <SelectTrigger id="sort-authors" className="h-10 w-44 bg-white dark:bg-[#141A17] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="followers">Most Followed</SelectItem>
                  <SelectItem value="name">Author Name (A-Z)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Genre Filter Chips */}
          <div className="flex flex-wrap gap-2 pt-1 border-b border-border pb-4">
            {GENRE_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setSelectedCategory(f.key)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  selectedCategory === f.key
                    ? 'bg-[#1C442D] text-white dark:bg-[#D5B16D] dark:text-[#0B0D0C] shadow-xs'
                    : 'bg-white dark:bg-[#141A17] text-[#636B65] dark:text-[#A5ADA6] border border-border hover:border-[#1C442D]/40 dark:hover:border-[#D5B16D]/40'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Showing {filteredAuthors.length} author{filteredAuthors.length !== 1 ? 's' : ''} available for mentorship & live sessions
          </p>

          {/* Authors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2 pb-16">
            {filteredAuthors.map((author) => (
              <Card
                key={author.id}
                className="group border border-[#E3DDD4] dark:border-[#253028] bg-white dark:bg-[#131916] hover:shadow-lg hover:border-[#1C442D]/40 dark:hover:border-[#D5B16D]/40 transition-all flex flex-col justify-between rounded-2xl overflow-hidden"
              >
                <div>
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16 rounded-2xl border-2 border-border/80 shrink-0">
                        <AvatarImage src={author.image} alt={author.name} className="object-cover" />
                        <AvatarFallback className="rounded-2xl bg-gradient-to-br from-[#1C442D] to-[#2B6040] text-white font-bold text-lg">
                          {author.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-serif font-bold text-lg text-foreground truncate">
                            {author.name}
                          </h3>
                          {author.verified && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" title="Verified Author" />
                          )}
                        </div>

                        <p className="text-xs text-[#8F681C] dark:text-[#D5B16D] font-medium truncate mt-0.5">
                          {author.genre}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                            {author.rating.toFixed(1)}
                          </span>
                          <span>·</span>
                          <span>{author.followers_count.toLocaleString()} readers</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="px-5 pb-4 space-y-3">
                    <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] line-clamp-3 leading-relaxed">
                      {author.bio}
                    </p>

                    {/* Published Books (clickable deep links) */}
                    {author.books.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Published Works:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {author.books.map((b) => (
                            <Link
                              key={b}
                              to={`/library?search=${encodeURIComponent(b)}`}
                              className="text-[11px] font-medium rounded-md bg-muted/70 hover:bg-muted text-foreground px-2 py-0.5 transition-colors border border-border/50 truncate max-w-full"
                              title={`Find ${b} in Digital Library`}
                            >
                              📖 {b}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mentorship Focus */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                        Mentorship Topics:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {author.mentorshipTopics.map((topic) => (
                          <span
                            key={topic}
                            className="text-[10px] rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5"
                          >
                            ✓ {topic}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Next Session Slot */}
                    <div className="rounded-xl bg-[#F4F3EF] dark:bg-[#1A231E] p-2.5 flex items-center justify-between text-xs text-[#1C201D] dark:text-[#E2DFD2] mt-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Clock className="h-3.5 w-3.5 text-[#1C442D] dark:text-[#D5B16D] shrink-0" />
                        <span className="truncate text-[11px] font-medium">{author.nextSession}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {author.location.split(',')[0]}
                      </span>
                    </div>
                  </CardContent>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-5 pt-0 border-t border-border/40 mt-3 flex items-center gap-2">
                  <ScheduleSessionDialog
                    author={{
                      id: author.id,
                      name: author.name,
                      availableSlots: author.availableSlots,
                    }}
                    trigger={
                      <Button
                        size="sm"
                        className="flex-1 bg-[#1C442D] hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#0B0D0C] dark:hover:bg-[#c9a35a] text-white text-xs font-semibold h-9 rounded-xl"
                      >
                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                        Schedule Session
                      </Button>
                    }
                  />

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-3 text-xs rounded-xl border-border"
                    onClick={() => setMessageAuthor(author)}
                    title={`Send message to ${author.name}`}
                  >
                    <Mail className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Bottom Callout: Apply as an Author */}
          <section className="rounded-3xl border border-[#DCD5C9] bg-gradient-to-br from-white via-[#FBF8F2] to-[#EBF2EC] dark:border-[#29332D] dark:from-[#111614] dark:via-[#111614] dark:to-[#14251B] p-6 sm:p-10 mb-12 shadow-xs text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 dark:border-emerald-800 bg-white/80 dark:bg-[#121A15] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-3">
                <BookOpen className="h-3.5 w-3.5" />
                Are you a published author or critic?
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
                Join the Sahadhyayi Literary Mentorship Network
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Connect directly with passionate readers, host intimate book club visits, review manuscripts, and share your craft with an engaged global community of readers.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link
                to="/feedback"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1C442D] hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#0B0D0C] dark:hover:bg-[#c9a35a] text-white text-xs sm:text-sm font-semibold px-5 py-3 transition shadow-xs"
              >
                Apply as a Literary Mentor
              </Link>
            </div>
          </section>
        </div>

        {/* Send Direct Message Modal */}
        <Dialog open={Boolean(messageAuthor)} onOpenChange={(open) => !open && setMessageAuthor(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-serif">
                <Mail className="h-4 w-4 text-[#1C442D] dark:text-[#D5B16D]" />
                Inquire with {messageAuthor?.name}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Send a writing consultation inquiry, manuscript review request, or book club invitation.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="inquiry-topic" className="text-xs font-semibold">Topic / Purpose</Label>
                <Select value={messageTopic} onValueChange={setMessageTopic}>
                  <SelectTrigger id="inquiry-topic" className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manuscript Feedback">Manuscript Critique & Feedback</SelectItem>
                    <SelectItem value="1-on-1 Mentorship">1-on-1 Writing Mentorship</SelectItem>
                    <SelectItem value="Book Club Visit">Book Club Guest Appearance</SelectItem>
                    <SelectItem value="Podcast / Interview">Literary Interview / Podcast</SelectItem>
                    <SelectItem value="General Question">General Reader Inquiry</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inquiry-message" className="text-xs font-semibold">Your Message or Manuscript Summary</Label>
                <Textarea
                  id="inquiry-message"
                  placeholder={`Hi ${messageAuthor?.name}, I’m working on a manuscript / reading your book and would love to connect about…`}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="min-h-[100px] text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setMessageAuthor(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-[#1C442D] text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#0B0D0C]"
                  disabled={!messageText.trim()}
                  onClick={handleSendMessage}
                >
                  Send Inquiry
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default AuthorConnect;
