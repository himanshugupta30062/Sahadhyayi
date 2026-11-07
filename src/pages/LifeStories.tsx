import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  Compass,
  ExternalLink,
  Heart,
  Pause,
  Play,
  Plus,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Volume2,
} from 'lucide-react';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SuggestLifeStoryDialog } from '@/components/stories/SuggestLifeStoryDialog';
import { toast } from 'sonner';

type LifeStory = {
  slug: string;
  name: string;
  role: string;
  category: string;
  years: string;
  location: string;
  summary: string;
  story: string[];
  lesson: string;
  sourceLabel: string;
  sourceUrl: string;
  accent: string;
  initials: string;
  readingMinutes: number;
};

const stories: LifeStory[] = [
  {
    slug: 'kalpana-chawla',
    name: 'Kalpana Chawla',
    role: 'Astronaut and aerospace engineer',
    category: 'Science & discovery',
    years: '1962–2003',
    location: 'Karnal, Haryana, India · United States',
    summary: 'From a small city in Haryana to space, Kalpana Chawla helped make the universe feel closer to a generation of dreamers.',
    story: [
      'Kalpana Chawla grew up in Karnal, where an early fascination with aircraft and the night sky shaped her ambitions. She studied aeronautical engineering in India before moving to the United States for advanced studies in aerospace engineering.',
      'She joined NASA in 1994 and became the first woman of Indian origin to travel to space. Her first mission aboard Space Shuttle Columbia took place in 1997. In 2003, she flew again on STS-107, a research mission dedicated to science and experimentation.',
      'The Columbia crew did not return after the shuttle broke apart during re-entry. Kalpana’s work and journey continue to inspire students interested in science, engineering and exploration.',
    ],
    lesson: 'Let curiosity grow into skill, and let ambition travel beyond the boundaries of what seems familiar.',
    sourceLabel: 'NASA biography',
    sourceUrl: 'https://www.nasa.gov/people/kalpana-chawla/',
    accent: 'from-sky-950 via-blue-900 to-indigo-800',
    initials: 'KC',
    readingMinutes: 3,
  },
  {
    slug: 'arunima-sinha',
    name: 'Arunima Sinha',
    role: 'Mountaineer and former national volleyball player',
    category: 'Courage & resilience',
    years: 'Born 1988',
    location: 'Uttar Pradesh, India',
    summary: 'After losing a leg in a violent train robbery, Arunima rebuilt her life around an extraordinary mountaineering goal.',
    story: [
      'Arunima Sinha was a national-level volleyball player whose life changed dramatically in 2011 when she was thrown from a moving train during a robbery attempt. She lost a leg and faced a grueling period of recovery.',
      'During rehabilitation, she resolved to climb Mount Everest. Under the mentorship of Bachendri Pal and through disciplined physical conditioning with a prosthetic limb, she reached Everest’s summit in May 2013, becoming the first female amputee to do so.',
      'She subsequently scaled the highest peaks on all seven continents. Her journey is a testament to disciplined preparation, mental resilience, and choosing a forward path when life shifts unexpectedly.',
    ],
    lesson: 'A changed path can still lead to a meaningful summit; progress is built one difficult step at a time.',
    sourceLabel: 'Arunima Sinha official website',
    sourceUrl: 'https://arunimasinha.com/',
    accent: 'from-amber-950 via-orange-900 to-rose-800',
    initials: 'AS',
    readingMinutes: 3,
  },
  {
    slug: 'a-p-j-abdul-kalam',
    name: 'A. P. J. Abdul Kalam',
    role: 'Aerospace scientist and 11th President of India',
    category: 'Science & discovery',
    years: '1931–2015',
    location: 'Rameswaram, Tamil Nadu, India',
    summary: 'A scientist who shaped India’s space and missile programmes, then used the presidency to inspire young minds across the nation.',
    story: [
      'Avul Pakir Jainulabdeen Abdul Kalam was born in Rameswaram into a modest family. Distributing newspapers in his boyhood to support his studies, he earned a degree in aeronautical engineering from the Madras Institute of Technology.',
      'At ISRO, he served as the project director for SLV-III, India’s first indigenous satellite launch vehicle. He later directed critical defence missile programmes at DRDO and played a vital role in India’s scientific diplomacy.',
      'As India’s 11th President, Kalam broke formal ceremonial barriers to speak directly to millions of schoolchildren, championing knowledge, integrity, and social purpose.',
    ],
    lesson: 'Knowledge becomes truly powerful when it is shared and placed in the service of humanity.',
    sourceLabel: 'President of India — former presidents',
    sourceUrl: 'https://presidentofindia.nic.in/former-presidents',
    accent: 'from-emerald-950 via-teal-900 to-cyan-800',
    initials: 'AK',
    readingMinutes: 4,
  },
  {
    slug: 'sudha-murty',
    name: 'Sudha Murty',
    role: 'Author, educator, and philanthropist',
    category: 'Service & society',
    years: 'Born 1950',
    location: 'Karnataka, India',
    summary: 'An engineer who broke gender barriers in industry and became renowned for grassroots philanthropy and heartwarming storytelling.',
    story: [
      'Sudha Murty studied electrical engineering, graduating with a gold medal, and later completed a master’s in computer science from the Indian Institute of Science. Challenging a gender-biased recruitment postcard, she became TELCO’s first female engineer on the shop floor.',
      'She later spearheaded the Infosys Foundation, funding thousands of rural libraries, supporting healthcare initiatives, and constructing public amenities across India.',
      'Her stories, written in simple, heartfelt prose in Kannada and English, introduce millions of readers to value-based living, empathy, and everyday kindness.',
    ],
    lesson: 'Professional excellence and social compassion can reinforce one another throughout a lifetime.',
    sourceLabel: 'Infosys Foundation',
    sourceUrl: 'https://www.infosys.com/infosys-foundation/',
    accent: 'from-violet-950 via-purple-900 to-fuchsia-800',
    initials: 'SM',
    readingMinutes: 3,
  },
  {
    slug: 'mary-kom',
    name: 'Mary Kom',
    role: 'Six-time World Champion boxer and Olympic medalist',
    category: 'Courage & resilience',
    years: 'Born 1982',
    location: 'Manipur, India',
    summary: 'A champion boxer whose grit challenged expectations about women in combat sports and opened international doors for athletes from the Northeast.',
    story: [
      'Mangte Chungneijang Mary Kom grew up in a rural tenant farming family in Manipur. She took up boxing in secret, keeping it from her father until her name appeared in the newspaper after winning a state championship.',
      'Through relentless training, she won six World Boxing Championships and an Olympic medal at London 2012. After becoming a mother of twins, she returned to the ring and reclaimed world titles.',
      'She established an academy providing free training to underprivileged youth, proving that grit and discipline transcend every obstacle.',
    ],
    lesson: 'Talent matters, but sustained endurance and the courage to return after setbacks define a legendary journey.',
    sourceLabel: 'Olympics athlete profile',
    sourceUrl: 'https://olympics.com/en/athletes/mary-kom',
    accent: 'from-red-950 via-rose-900 to-orange-800',
    initials: 'MK',
    readingMinutes: 3,
  },
  {
    slug: 'dashrath-manjhi',
    name: 'Dashrath Manjhi',
    role: 'The Mountain Man of Gehlaur',
    category: 'Courage & resilience',
    years: '1934–2007',
    location: 'Gehlaur, Bihar, India',
    summary: 'Using only a hammer and chisel over 22 years, Dashrath carved a road through a mountain so his village could reach medical aid.',
    story: [
      'Dashrath Manjhi lived in Gehlaur, where an imposing ridge of quartzite hills isolated his village from the nearest town and hospital. After his wife Falguni died from lack of timely medical care, he resolved that no one else would suffer that fate.',
      'Day after day, while mocked by neighbors, he chipped away at the solid stone with simple hand tools. Over 22 continuous years from 1960 to 1982, he carved a passage 360 feet long and 30 feet wide.',
      'The path cut the travel distance between Atri and Wazirganj from 55 kilometers to just 15 kilometers, standing as an eternal monument to love and individual willpower.',
    ],
    lesson: 'Quiet dedication over decades can dismantle barriers that seem immovable.',
    sourceLabel: 'YourStory — Dashrath Manjhi',
    sourceUrl: 'https://yourstory.com/2015/01/dashrath-manjhi',
    accent: 'from-stone-950 via-stone-800 to-amber-800',
    initials: 'DM',
    readingMinutes: 4,
  },
  {
    slug: 'rabindranath-tagore',
    name: 'Rabindranath Tagore',
    role: 'Poet, philosopher, and Nobel Laureate in Literature',
    category: 'Literature & arts',
    years: '1861–1941',
    location: 'Kolkata & Santiniketan, West Bengal, India',
    summary: 'The bard of Bengal who reshaped Indian literature, composed national anthems for two nations, and founded Visva-Bharati.',
    story: [
      'Born into a prominent renaissance family in Calcutta, Rabindranath began composing verses as a child. He rejected orthodox schooling in favor of open-air learning and natural exploration.',
      'In 1913, his English translation of Gitanjali earned him the Nobel Prize in Literature, making him the first non-European laureate. His poetry, music (Rabindra Sangeet), novels, and essays revolutionized modern Bengali and Indian thought.',
      'He established Visva-Bharati at Santiniketan, where education blended arts, humanity, and global communion in nature, composing anthems that now represent India and Bangladesh.',
    ],
    lesson: 'True wisdom blossoms when education frees the mind and unites humanity across cultural boundaries.',
    sourceLabel: 'Nobel Prize Official Biography',
    sourceUrl: 'https://www.nobelprize.org/prizes/literature/1913/tagore/biographical/',
    accent: 'from-amber-950 via-amber-900 to-yellow-800',
    initials: 'RT',
    readingMinutes: 4,
  },
  {
    slug: 'srinivasa-ramanujan',
    name: 'Srinivasa Ramanujan',
    role: 'Mathematical genius and Fellow of the Royal Society',
    category: 'Science & discovery',
    years: '1887–1920',
    location: 'Kumbakonam, Tamil Nadu · Cambridge, UK',
    summary: 'A self-taught prodigy whose notebooks of thousands of theorems transformed number theory, infinite series, and continued fractions.',
    story: [
      'Srinivasa Ramanujan was born in Erode into an impoverished orthodox Brahmin family. With almost no formal university training in pure mathematics, he spent his youth filling notebooks with profound mathematical theorems.',
      'In 1913, he sent a letter containing over a hundred theorems to Cambridge mathematician G. H. Hardy, who recognized genius on a scale comparable to Euler and Jacobi. Hardy arranged for Ramanujan to travel to Trinity College, Cambridge.',
      'Despite failing health and harsh wartime conditions in England, Ramanujan produced breakthrough work on partition formulas, mock theta functions, and modular forms that continue to solve mysteries in quantum physics today.',
    ],
    lesson: 'Genius speaks in unexpected voices; give passion room to explore uncharted frontiers.',
    sourceLabel: 'MacTutor History of Mathematics — Ramanujan',
    sourceUrl: 'https://mathshistory.st-andrews.ac.uk/Biographies/Ramanujan/',
    accent: 'from-cyan-950 via-teal-900 to-blue-800',
    initials: 'SR',
    readingMinutes: 4,
  },
  {
    slug: 'savitribai-phule',
    name: 'Savitribai Phule',
    role: 'Pioneer of women’s education and social reformer',
    category: 'Service & society',
    years: '1831–1897',
    location: 'Naigaon & Pune, Maharashtra, India',
    summary: 'India’s first female teacher who opened the first indigenous school for girls in Pune and fought fearlessly against caste oppression.',
    story: [
      'Married at age nine to Jyotirao Phule, Savitribai was educated by her husband at home. Together, they founded the first school for girls at Bhide Wada in Pune in 1848.',
      'Orthodox townsfolk hurled mud, stones, and insults at her as she walked to school every morning, forcing her to carry a spare sari to change into once she arrived in class. She never paused.',
      'She opened shelter homes for widows and infants, established the Satyashodhak Samaj, and organized plague relief clinics during the 1897 epidemic, contracting the disease herself while nursing sick patients.',
    ],
    lesson: 'Courage is walking through hostility every morning so the next generation can learn in freedom.',
    sourceLabel: 'Savitribai Phule Pune University Biography',
    sourceUrl: 'http://www.unipune.ac.in/',
    accent: 'from-rose-950 via-pink-900 to-purple-800',
    initials: 'SP',
    readingMinutes: 4,
  },
  {
    slug: 'b-r-ambedkar',
    name: 'Dr. B. R. Ambedkar',
    role: 'Jurist, chief architect of the Constitution, and reformer',
    category: 'Service & society',
    years: '1891–1956',
    location: 'Mhow, Madhya Pradesh · Maharashtra · New Delhi',
    summary: 'Overcoming severe untouchability, Babasaheb earned doctorates from Columbia and the London School of Economics, shaping modern democratic India.',
    story: [
      'Bhimrao Ramji Ambedkar was forced to sit on a burlap sack on the classroom floor as a boy because of his Mahar caste. Driven by an insatiable thirst for books, he went on to earn doctorates from Columbia University and the London School of Economics.',
      'He led the Mahad Satyagraha for equal water rights, published papers demanding social democracy, and served as India’s first Minister of Law and Justice.',
      'As Chairman of the Constitution Drafting Committee, he anchored fundamental rights, gender equality, universal adult franchise, and social safeguards into the supreme law of the Republic of India.',
    ],
    lesson: 'Cultivate the mind, educate, agitate, and organize for equality and constitutional morality.',
    sourceLabel: 'Columbia University — Ambedkar 1927',
    sourceUrl: 'https://c250.columbia.edu/c250_celebrates/remarkable_columbians/bhimrao_ambedkar.html',
    accent: 'from-indigo-950 via-blue-900 to-slate-800',
    initials: 'BA',
    readingMinutes: 5,
  },
  {
    slug: 'vikram-sarabhai',
    name: 'Vikram Sarabhai',
    role: 'Physicist and father of the Indian space programme',
    category: 'Science & discovery',
    years: '1919–1970',
    location: 'Ahmedabad, Gujarat · Thumba, Kerala',
    summary: 'A visionary physicist who convinced the government that a developing India needed space technology for education, weather, and telecommunications.',
    story: [
      'Born into a prominent industrial family in Ahmedabad, Vikram Sarabhai earned his doctorate at Cambridge under C. V. Raman, investigating cosmic rays.',
      'He established the Physical Research Laboratory (PRL) at age 28 and persuaded Prime Minister Nehru to launch the Indian National Committee for Space Research (INCOSPAR), which evolved into ISRO.',
      'He launched India’s first rocket from a church in the coastal fishing village of Thumba, believing space technology was not a luxury for rich nations, but an essential tool to educate villages and empower farmers.',
    ],
    lesson: 'Science fulfills its highest purpose when applied to solve real human problems for the common person.',
    sourceLabel: 'ISRO — Dr. Vikram Sarabhai',
    sourceUrl: 'https://www.isro.gov.in/VikramSarabhai.html',
    accent: 'from-blue-950 via-cyan-900 to-slate-800',
    initials: 'VS',
    readingMinutes: 4,
  },
  {
    slug: 'anand-kumar',
    name: 'Anand Kumar',
    role: 'Mathematician and founder of Super 30',
    category: 'Service & society',
    years: 'Born 1973',
    location: 'Patna, Bihar, India',
    summary: 'A mathematician who missed Cambridge due to poverty, then coached hundreds of underprivileged students to clear the IIT-JEE for free.',
    story: [
      'Anand Kumar secured admission to the University of Cambridge, but the sudden death of his father and financial hardship prevented him from traveling. He supported his family by selling papads made by his mother on bicycle in Patna.',
      'In 2002, he launched the Super 30 programme: selecting 30 meritorious students from economically impoverished backgrounds, providing them free food, lodging, and intensive mathematics tutoring for the IIT-JEE.',
      'Over two decades, hundreds of students—children of landless laborers, rickshaw pullers, and clerks—cracked the entrance exam, breaking intergenerational cycles of poverty through education.',
    ],
    lesson: 'A setback is not a dead end; your own hardships can become the bridge that lifts others.',
    sourceLabel: 'Super 30 Official Portal',
    sourceUrl: 'http://www.super30.org/',
    accent: 'from-emerald-950 via-amber-900 to-stone-800',
    initials: 'AK',
    readingMinutes: 4,
  },
];

const categories = [
  'All stories',
  'Saved',
  'Science & discovery',
  'Courage & resilience',
  'Service & society',
  'Literature & arts',
];

const LifeStories = () => {
  const { slug } = useParams<{ slug?: string }>();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All stories');
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Restore saved bookmarks from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sahadhyayi_saved_life_stories');
      if (stored) {
        setSavedSlugs(JSON.parse(stored));
      }
    } catch {
      // Ignore storage error
    }
  }, []);

  // Cleanup speech on story change or unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [slug]);

  const toggleBookmark = (storySlug: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSavedSlugs((prev) => {
      const exists = prev.includes(storySlug);
      const next = exists ? prev.filter((s) => s !== storySlug) : [...prev, storySlug];
      try {
        localStorage.setItem('sahadhyayi_saved_life_stories', JSON.stringify(next));
      } catch {
        // Ignore storage error
      }
      if (exists) {
        toast.info('Removed from saved stories.');
      } else {
        toast.success('Story saved to your collection!');
      }
      return next;
    });
  };

  const handleToggleVoice = (storyItem: LifeStory) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast.error('Voice narration is not supported on this browser.');
      return;
    }

    if (isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      return;
    }

    if (isSpeaking && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }

    window.speechSynthesis.cancel();
    const narrationText = `${storyItem.name}. ${storyItem.role}. ${storyItem.summary}. ${storyItem.story.join(' ')}. Lesson to carry forward: ${storyItem.lesson}`;
    const utterance = new SpeechSynthesisUtterance(narrationText);
    utterance.rate = 0.95;

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
    setIsPaused(false);
  };

  const handleShareStory = (storyItem: LifeStory) => {
    const url = `${window.location.origin}/life-stories/${storyItem.slug}`;
    if (navigator.share) {
      navigator.share({ title: `${storyItem.name} — Life Story`, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Story link copied to clipboard!');
    }
  };

  const selectedStory = slug ? stories.find((story) => story.slug === slug) : undefined;
  const currentIndex = slug ? stories.findIndex((s) => s.slug === slug) : -1;
  const prevStory = currentIndex > 0 ? stories[currentIndex - 1] : undefined;
  const nextStory = currentIndex >= 0 && currentIndex < stories.length - 1 ? stories[currentIndex + 1] : undefined;

  const filteredStories = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return stories.filter((story) => {
      const matchesCategory =
        activeCategory === 'All stories' ||
        (activeCategory === 'Saved'
          ? savedSlugs.includes(story.slug)
          : story.category === activeCategory);
      const matchesSearch =
        !term ||
        [story.name, story.role, story.category, story.location, story.summary].some((value) =>
          value.toLocaleLowerCase().includes(term)
        );
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory, savedSlugs]);

  if (slug) {
    if (!selectedStory) {
      return (
        <main className="min-h-[70vh] bg-[#FAF7F2] px-4 py-20 text-center dark:bg-[#0B0D0C]">
          <h1 className="font-serif text-3xl font-bold text-[#202820] dark:text-[#F3F0E7]">
            Story not found
          </h1>
          <p className="mt-3 text-sm text-[#687067] dark:text-[#A5ADA6]">
            This life story may have moved or is not available yet.
          </p>
          <Link
            to="/life-stories"
            className="mt-6 inline-flex items-center gap-2 font-semibold text-[#1C442D] dark:text-[#D5B16D]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Life Stories
          </Link>
        </main>
      );
    }

    const isSaved = savedSlugs.includes(selectedStory.slug);

    return (
      <>
        <SEO
          title={`${selectedStory.name} — Life Story | Sahadhyayi`}
          description={selectedStory.summary}
          canonical={`https://sahadhyayi.com/life-stories/${selectedStory.slug}`}
          keywords={[
            selectedStory.name,
            selectedStory.role,
            'biography',
            'Indian history',
            'real life journeys',
            'inspiration',
          ]}
        />
        <article className="min-h-screen bg-[#FAF7F2] text-[#202820] dark:bg-[#0B0D0C] dark:text-[#F3F0E7]">
          <header className={`relative isolate overflow-hidden bg-gradient-to-br ${selectedStory.accent} text-white`}>
            <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(rgba(255,255,255,0.8)_0.8px,transparent_0.8px)] [background-size:18px_18px]" />
            <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
              <div className="flex items-center justify-between">
                <Link
                  to="/life-stories"
                  className="inline-flex items-center gap-2 text-sm text-white/80 transition hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" /> All life stories
                </Link>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleVoice(selectedStory)}
                    className="rounded-full bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs gap-1.5 backdrop-blur-sm"
                  >
                    {isSpeaking ? (
                      isPaused ? (
                        <>
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Resume Voice</span>
                        </>
                      ) : (
                        <>
                          <Pause className="h-3.5 w-3.5 fill-current" />
                          <span>Pause Voice</span>
                        </>
                      )
                    ) : (
                      <>
                        <Volume2 className="h-3.5 w-3.5" />
                        <span>Listen to Story</span>
                      </>
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => toggleBookmark(selectedStory.slug)}
                    className={`rounded-full p-2 border transition ${
                      isSaved
                        ? 'border-amber-400 bg-amber-400 text-stone-950'
                        : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                    }`}
                    title={isSaved ? 'Saved to favorites' : 'Save to favorites'}
                    aria-label="Save story"
                  >
                    <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShareStory(selectedStory)}
                    className="rounded-full p-2 border border-white/20 bg-white/10 text-white hover:bg-white/20 transition"
                    title="Share story"
                    aria-label="Share story"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                  {selectedStory.category} · {selectedStory.years}
                </p>
                <span className="text-white/40">·</span>
                <span className="text-xs text-white/70">{selectedStory.readingMinutes} min read</span>
              </div>

              <h1 className="mt-4 max-w-3xl font-serif text-4xl font-bold leading-tight sm:text-6xl">
                {selectedStory.name}
              </h1>
              <p className="mt-4 text-lg text-white/85 font-medium">{selectedStory.role}</p>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/80">{selectedStory.summary}</p>
              <p className="mt-6 text-sm text-white/65 flex items-center gap-1.5">
                <Compass className="h-4 w-4" /> {selectedStory.location}
              </p>
            </div>
          </header>

          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:py-16">
            <div className="space-y-6">
              {selectedStory.story.map((paragraph, index) => (
                <p
                  key={index}
                  className="font-serif text-lg leading-9 text-[#414B43] dark:text-[#C8D0C8]"
                >
                  {paragraph}
                </p>
              ))}

              <section className="rounded-2xl border border-[#DCD5C9] bg-white p-6 dark:border-[#29332D] dark:bg-[#111614] shadow-xs">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#98733A] dark:text-[#D5B16D]">
                  <Sparkles className="h-4 w-4" /> A thought to carry forward
                </div>
                <p className="mt-3 font-serif text-xl leading-8 text-[#202820] dark:text-[#F3F0E7]">
                  {selectedStory.lesson}
                </p>
              </section>

              <div className="rounded-xl border border-[#DCD5C9] bg-[#F3EFE7] p-5 dark:border-[#29332D] dark:bg-[#111614]">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4 text-[#1C7A4A] dark:text-[#8EC9A4]" /> Read the verified source
                </div>
                <p className="mt-2 text-sm leading-6 text-[#687067] dark:text-[#A5ADA6]">
                  This introduction is curated by the Sahadhyayi editorial team. Explore the full biographical archives and official documents:
                </p>
                <a
                  href={selectedStory.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#1C442D] hover:underline dark:text-[#D5B16D]"
                >
                  {selectedStory.sourceLabel} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Prev / Next Story Navigation */}
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E8E2D9] dark:border-[#29332D] pt-6">
                {prevStory ? (
                  <Link
                    to={`/life-stories/${prevStory.slug}`}
                    className="flex flex-col items-start gap-1 text-left group"
                  >
                    <span className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-primary transition">
                      <ArrowLeft className="h-3.5 w-3.5" /> Previous Story
                    </span>
                    <span className="font-serif font-bold text-sm sm:text-base group-hover:underline">
                      {prevStory.name}
                    </span>
                  </Link>
                ) : (
                  <div />
                )}

                {nextStory && (
                  <Link
                    to={`/life-stories/${nextStory.slug}`}
                    className="flex flex-col items-end gap-1 text-right group ml-auto"
                  >
                    <span className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-primary transition">
                      Next Story <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                    <span className="font-serif font-bold text-sm sm:text-base group-hover:underline">
                      {nextStory.name}
                    </span>
                  </Link>
                )}
              </div>
            </div>

            <aside className="h-fit rounded-2xl border border-[#DCD5C9] bg-white p-5 dark:border-[#29332D] dark:bg-[#111614] space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#98733A] dark:text-[#D5B16D]">
                  At a glance
                </p>
                <p className="mt-2 font-serif text-xl font-bold">{selectedStory.name}</p>
                <p className="mt-1 text-sm text-[#687067] dark:text-[#A5ADA6]">{selectedStory.years}</p>
              </div>

              <div className="h-px bg-[#E9E3D9] dark:bg-[#29332D]" />

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#687067] dark:text-[#A5ADA6]">
                  Known for
                </p>
                <p className="mt-1 text-sm leading-6">{selectedStory.role}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#687067] dark:text-[#A5ADA6]">
                  From
                </p>
                <p className="mt-1 text-sm leading-6">{selectedStory.location}</p>
              </div>

              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleBookmark(selectedStory.slug)}
                  className="w-full rounded-xl gap-2 text-xs"
                >
                  <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-current text-amber-500' : ''}`} />
                  {isSaved ? 'Saved in Collection' : 'Save Story'}
                </Button>
              </div>

              <Link
                to="/life-stories"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#1C442D] hover:underline dark:text-[#D5B16D] pt-2"
              >
                Discover more stories <ArrowRight className="h-4 w-4" />
              </Link>
            </aside>
          </div>
        </article>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Life Stories — Real People, Remarkable Journeys | Sahadhyayi"
        description="Discover true stories of remarkable people from India and around the world: their lives, challenges, achievements, and the lessons they leave behind."
        canonical="https://sahadhyayi.com/life-stories"
        keywords={[
          'real life stories',
          'inspiring biographies',
          'Indian personalities',
          'human stories',
          'life journeys',
          'Rabindranath Tagore',
          'Kalpana Chawla',
          'Ramanujan',
          'Dr Ambedkar',
        ]}
      />
      <div className="min-h-screen bg-[#FAF7F2] text-[#202820] dark:bg-[#0B0D0C] dark:text-[#F3F0E7]">
        <section className="relative isolate overflow-hidden border-b border-[#29332D] bg-[#101711] text-white">
          <img
            src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=2400&q=85"
            alt=""
            aria-hidden="true"
            className="absolute right-0 top-0 z-0 h-full w-full object-cover object-[center_35%] sm:w-[65%] lg:w-[60%]"
            loading="eager"
          />
          {/* Mobile scrim for crisp text legibility */}
          <div
            aria-hidden="true"
            className="absolute inset-0 z-0 bg-gradient-to-b from-[#101711]/94 via-[#101711]/88 to-[#101711]/82 sm:hidden"
          />
          {/* Desktop gradient blend */}
          <div
            aria-hidden="true"
            className="hidden sm:block absolute inset-0 z-0 bg-gradient-to-r from-[#101711] via-[#101711]/88 to-[#101711]/20"
          />
          <div
            aria-hidden="true"
            className="hidden sm:block absolute inset-0 z-0 bg-gradient-to-t from-[#101711]/80 via-transparent to-transparent"
          />
          <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_80%_15%,rgba(213,177,109,0.22),transparent_42%),radial-gradient(ellipse_at_10%_90%,rgba(63,111,79,0.3),transparent_45%)]" />
          <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.12] [background-image:radial-gradient(rgba(255,255,255,0.65)_0.7px,transparent_0.7px)] [background-size:18px_18px]" />

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#D5B16D]/35 bg-white/5 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E8CC91]">
                <Heart className="h-3.5 w-3.5" /> Real lives. Real journeys.
              </div>
              <h1 className="mt-6 font-serif text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
                Every life has a story.
                <span className="block text-[#E4C17B]">Some change how we see the world.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/75 sm:text-lg">
                Meet people who questioned the impossible, stood through adversity, served their communities, and left the world a little different.
              </p>
              <div className="mt-8 flex flex-wrap gap-4 text-xs text-white/70">
                <span className="inline-flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#E4C17B]" /> 12 curated biographies
                </span>
                <span className="inline-flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-[#E4C17B]" /> Audio listen enabled
                </span>
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#E4C17B]" /> Verified source archives
                </span>
              </div>
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <section
            aria-label="Search and filter life stories"
            className="mb-9 rounded-2xl border border-[#E5DED2] bg-white p-4 shadow-sm dark:border-[#29332D] dark:bg-[#111614] sm:p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#788076]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search people, journeys, or themes…"
                  aria-label="Search life stories"
                  className="h-12 w-full rounded-xl border border-[#DCD5C9] bg-[#FAF7F2] pl-11 pr-4 text-sm text-[#202820] outline-none transition focus:border-[#1C442D] focus:ring-2 focus:ring-[#1C442D]/15 dark:border-[#34443A] dark:bg-[#0B0D0C] dark:text-[#F3F0E7]"
                />
              </div>

              <div
                className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                aria-label="Story categories"
              >
                {categories.map((category) => {
                  const isSavedTab = category === 'Saved';
                  const countLabel = isSavedTab && savedSlugs.length > 0 ? ` (${savedSlugs.length})` : '';
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setActiveCategory(category)}
                      aria-pressed={activeCategory === category}
                      className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                        activeCategory === category
                          ? 'border-[#1C442D] bg-[#1C442D] text-white dark:border-[#D5B16D] dark:bg-[#D5B16D] dark:text-[#101711]'
                          : 'border-[#DCD5C9] text-[#687067] hover:border-[#1C442D] dark:border-[#34443A] dark:text-[#A5ADA6]'
                      }`}
                    >
                      {category}
                      {countLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#98733A] dark:text-[#D5B16D]">
                The collection
              </p>
              <h2 className="mt-1 font-serif text-2xl font-bold sm:text-3xl">People worth knowing</h2>
            </div>
            <span className="text-xs text-[#788076] dark:text-[#A5ADA6]">
              {filteredStories.length} {filteredStories.length === 1 ? 'story' : 'stories'}
            </span>
          </div>

          {filteredStories.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredStories.map((story) => {
                const isSaved = savedSlugs.includes(story.slug);
                return (
                  <article
                    key={story.slug}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E5DED2] bg-white shadow-[0_6px_24px_rgba(28,32,29,0.035)] transition duration-300 hover:-translate-y-1 hover:border-[#B68A35]/50 hover:shadow-[0_18px_45px_rgba(28,32,29,0.09)] dark:border-[#29332D] dark:bg-[#111614] dark:shadow-none"
                  >
                    <div
                      className={`relative flex h-44 items-end overflow-hidden bg-gradient-to-br ${story.accent} p-5 text-white`}
                    >
                      <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full border border-white/15" />
                      <div className="absolute -right-1 -top-5 h-28 w-28 rounded-full border border-white/15" />

                      <span className="relative rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-2xl font-serif font-bold backdrop-blur-sm">
                        {story.initials}
                      </span>

                      <div className="relative ml-auto flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => toggleBookmark(story.slug, e)}
                          className={`rounded-full p-1.5 border transition ${
                            isSaved
                              ? 'border-amber-400 bg-amber-400 text-stone-950'
                              : 'border-white/20 bg-black/20 text-white hover:bg-black/40'
                          }`}
                          title={isSaved ? 'Saved' : 'Save story'}
                          aria-label="Save story"
                        >
                          <Bookmark className={`h-3.5 w-3.5 ${isSaved ? 'fill-current' : ''}`} />
                        </button>
                        <span className="rounded-full border border-white/25 bg-black/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide backdrop-blur-sm">
                          {story.years}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#98733A] dark:text-[#D5B16D]">
                          {story.category}
                        </p>
                        <span className="text-[10px] text-muted-foreground">{story.readingMinutes} min read</span>
                      </div>

                      <h3 className="mt-2 font-serif text-xl font-bold">{story.name}</h3>
                      <p className="mt-1 text-xs text-[#788076] dark:text-[#A5ADA6]">{story.role}</p>
                      <p className="mt-4 flex-1 text-sm leading-6 text-[#59635B] dark:text-[#B8C1B9]">
                        {story.summary}
                      </p>

                      <div className="mt-5 flex items-center justify-between border-t border-[#EDE7DE] pt-4 dark:border-[#29332D]">
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-[#788076] dark:text-[#A5ADA6]">
                          <Compass className="h-3.5 w-3.5" /> {story.location.split(',')[0]}
                        </span>
                        <Link
                          to={`/life-stories/${story.slug}`}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1C442D] transition group-hover:gap-2.5 dark:text-[#D5B16D]"
                        >
                          Read story <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#DCD5C9] px-5 py-16 text-center dark:border-[#34443A]">
              <Search className="mx-auto h-8 w-8 text-[#98733A]" />
              <h3 className="mt-4 font-serif text-xl font-bold">
                {activeCategory === 'Saved' ? 'No saved stories yet' : 'No stories found'}
              </h3>
              <p className="mt-2 text-sm text-[#788076] dark:text-[#A5ADA6]">
                {activeCategory === 'Saved'
                  ? 'Click the bookmark icon on any biography to save it for offline and quick reading.'
                  : 'Try another name or choose a different category.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setActiveCategory('All stories');
                }}
                className="mt-4 text-sm font-semibold text-[#1C442D] underline dark:text-[#D5B16D]"
              >
                Clear filters
              </button>
            </div>
          )}

          <section className="mt-12 rounded-2xl border border-[#DCD5C9] bg-[#F3EFE7] p-6 dark:border-[#29332D] dark:bg-[#111614] sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1C442D] text-[#F3E5C4] dark:bg-[#D5B16D] dark:text-[#101711]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold">A growing collection of human journeys</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-[#687067] dark:text-[#A5ADA6]">
                    Know someone whose courage, discoveries, or public service deserve to be preserved? Share your nomination with our editorial team.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setIsSuggestOpen(true)}
                className="shrink-0 rounded-xl gap-2 font-semibold bg-[#1C442D] text-white hover:bg-[#143221] dark:bg-[#D5B16D] dark:text-[#101711]"
              >
                <Plus className="h-4 w-4" /> Suggest a Story
              </Button>
            </div>
          </section>
        </main>
      </div>

      {/* Suggest Life Story Dialog */}
      <SuggestLifeStoryDialog
        open={isSuggestOpen}
        onOpenChange={setIsSuggestOpen}
      />
    </>
  );
};

export default LifeStories;
