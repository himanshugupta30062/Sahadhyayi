import React, { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  X,
  Sparkles,
  BookOpen,
  Compass,
  Bot,
  Dna,
  Feather,
  HelpCircle,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Mail,
  Phone,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Radio,
  BookMarked,
  Library,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import SEO from "@/components/SEO";
import ContactFormDialog from "@/components/ContactFormDialog";
import { openSahadhyayiWhatsApp, SAHADHYAYI_PHONE, SAHADHYAYI_EMAIL } from "@/components/support/whatsappSupport";
import { toast } from "sonner";

interface FAQItem {
  id: string;
  category: string;
  categoryLabel: string;
  question: string;
  answer: string;
  tags: string[];
  recommendedLink?: {
    label: string;
    href: string;
  };
}

interface GuideStep {
  title: string;
  description: string;
}

interface FeatureGuide {
  id: string;
  title: string;
  category: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  steps: GuideStep[];
  cta: {
    label: string;
    href: string;
  };
}

const CATEGORIES = [
  {
    id: "all",
    label: "All Topics",
    icon: HelpCircle,
    description: "Browse our entire library of help articles and FAQs",
  },
  {
    id: "getting-started",
    label: "Getting Started",
    icon: Sparkles,
    description: "Account creation, profile setup, and essential first steps",
  },
  {
    id: "library-reader",
    label: "Library & Reader",
    icon: BookOpen,
    description: "Reading digital books, PDF viewer, offline cache, and bookmarks",
  },
  {
    id: "social-map",
    label: "Social Map & Community",
    icon: Compass,
    description: "Reader exploration, location privacy, Ghost Mode, and book spots",
  },
  {
    id: "ai-companion",
    label: "AI Companion & Expert",
    icon: Bot,
    description: "Sahadhyayi Book Expert, RAG questions, summaries, and vocab assistance",
  },
  {
    id: "reading-dna",
    label: "Reading DNA & Co-Reading",
    icon: Dna,
    description: "Taste matching, reading rooms, Pomodoro sprints, and spoiler-safe threads",
  },
  {
    id: "authors-publishing",
    label: "Authors & Publishing",
    icon: Feather,
    description: "Submitting manuscripts, author profiles, and research publication",
  },
] as const;

const POPULAR_SEARCH_TAGS = [
  "Offline Reading",
  "Ghost Mode",
  "AI Companion",
  "Reading DNA",
  "PDF Upload",
  "Reading Rooms",
  "Book Submissions",
] as const;

const FEATURE_GUIDES: FeatureGuide[] = [
  {
    id: "guide-library",
    title: "Master the Digital Reader & Offline Storage",
    category: "library-reader",
    badge: "Digital Library",
    icon: BookOpen,
    description: "Get distraction-free reading with page caching, custom font sizes, and margin notes.",
    steps: [
      { title: "Browse the Catalogue", description: "Explore over 12,500 curated public-domain and open-access titles in the Library." },
      { title: "Personalize Viewer Settings", description: "Toggle night or sepia mode, select reading typography, and adjust line height." },
      { title: "Annotate with Marginalia", description: "Highlight passages and write thoughts into private notes or public discussion margins." },
      { title: "Read Offline", description: "Pages cache automatically in your browser so you never lose your place during signal drops." },
    ],
    cta: { label: "Explore Library", href: "/library" },
  },
  {
    id: "guide-map",
    title: "Connect on the Social Map with Complete Privacy",
    category: "social-map",
    badge: "Social Map",
    icon: Compass,
    description: "Discover nearby readers, iconic Indian libraries, indie bookstores, and literary cafes.",
    steps: [
      { title: "Opt-In with Consent", description: "Location sharing is 100% voluntary; you can turn on Ghost Mode anytime." },
      { title: "Customize Your Pin", description: "Personalize your Bitmoji character or upload your reading avatar." },
      { title: "Filter Public Spots", description: "Explore curated libraries, bookshops, and literary events within your city." },
      { title: "Say Hello", description: "Connect with kindred readers who are actively exploring the same book." },
    ],
    cta: { label: "Open Social Map", href: "/map" },
  },
  {
    id: "guide-ai",
    title: "Deep Comprehension with the AI Book Companion",
    category: "ai-companion",
    badge: "AI Reading Companion",
    icon: Bot,
    description: "Unpack complex chapters, classical roots, and character arcs without reading spoilers.",
    steps: [
      { title: "Highlight Any Passage", description: "Select difficult phrases or classical terms right on the page while reading." },
      { title: "Ask Questions in Context", description: "Request historical background, chapter summaries, or philosophical breakdowns." },
      { title: "Enjoy Spoiler-Safe Answers", description: "Our AI is bounded strictly up to your current reading milestone." },
      { title: "Log to Reading Journal", description: "Save memorable insights and reflections to your personal reading log." },
    ],
    cta: { label: "Try Book Expert", href: "/book-expert" },
  },
  {
    id: "guide-rooms",
    title: "Join Live Reading Rooms & Silent Sprints",
    category: "reading-dna",
    badge: "Live Sprints",
    icon: Radio,
    description: "Build a lasting reading habit with synchronized Pomodoro sprints and global companions.",
    steps: [
      { title: "Select a Silent Room", description: "Choose a 25-minute or 50-minute Pomodoro block tailored to your schedule." },
      { title: "Enable Ambient Sounds", description: "Tune into gentle rain, crackling hearths, or quiet Indian library soundscapes." },
      { title: "Focus Deeply", description: "Read distraction-free alongside fellow community members across time zones." },
      { title: "Share Sprint Milestones", description: "Log completed pages, celebrate streaks, and exchange book recommendations." },
    ],
    cta: { label: "Join Reading Rooms", href: "/social?tab=rooms" },
  },
];

const FAQS: FAQItem[] = [
  // Getting Started
  {
    id: "faq-signup",
    category: "getting-started",
    categoryLabel: "Getting Started",
    question: "How do I create an account and personalize my reading profile?",
    answer: "Click 'Sign In' or 'Join Sahadhyayi' in the top navigation bar. You can sign up using your email address or Google authentication. After creating your account, visit your Profile page to select your favorite genres (Philosophy, Heritage, Fiction, Science, Poetry), set your annual reading goals, and customize your personal reading avatar.",
    tags: ["account", "signup", "profile", "onboarding"],
    recommendedLink: { label: "Go to Profile", href: "/profile" },
  },
  {
    id: "faq-free",
    category: "getting-started",
    categoryLabel: "Getting Started",
    question: "Is Sahadhyayi completely free to use?",
    answer: "Yes, Sahadhyayi provides free access to our digital public domain library, silent co-reading rooms, Reading DNA matching, social book discovery map, and core AI reading companion features. We are dedicated to democratizing deep reading and literary heritage.",
    tags: ["pricing", "free", "subscription", "access"],
  },
  {
    id: "faq-pwa",
    category: "getting-started",
    categoryLabel: "Getting Started",
    question: "Can I install Sahadhyayi as an app on my phone or tablet?",
    answer: "Yes! Sahadhyayi is built as a progressive web application (PWA). On iOS Safari, tap the 'Share' button and choose 'Add to Home Screen'. On Android Chrome, open the browser menu and select 'Install App' or 'Add to Home screen'. The app provides fullscreen distraction-free reading and fast offline caching.",
    tags: ["pwa", "mobile", "install", "ios", "android"],
  },

  // Library & Reader
  {
    id: "faq-offline",
    category: "library-reader",
    categoryLabel: "Library & Reader",
    question: "How does the digital reader work, and can I read offline?",
    answer: "Our reader includes night, sepia, and daylight themes, font size scaling, and automatic page syncing. When you open a book, pages are cached in local browser memory so you can continue reading uninterrupted on flights, metro commutes, or during network disruptions.",
    tags: ["offline", "reader", "pdf", "cache", "themes"],
    recommendedLink: { label: "Open Digital Library", href: "/library" },
  },
  {
    id: "faq-marginalia",
    category: "library-reader",
    categoryLabel: "Library & Reader",
    question: "How do I add bookmarks, highlights, and margin notes (Marginalia)?",
    answer: "While reading any title in the reader, highlight any sentence or paragraph. An action menu will appear allowing you to highlight, look up definitions, or attach a margin note. You can keep your marginalia strictly private or publish it to the community page margins for others reading the same edition.",
    tags: ["marginalia", "highlights", "bookmarks", "notes"],
  },
  {
    id: "faq-pdf-contribute",
    category: "library-reader",
    categoryLabel: "Library & Reader",
    question: "How can I contribute or upload a book PDF to Sahadhyayi?",
    answer: "Sign in, open Library, and choose 'Contribute a PDF'. Search for an existing catalogue entry or submit a new title, then upload an unencrypted PDF (up to 50 MB). The PDF stays private until an administrator opens its preview and approves it. Approval adds the PDF to the public Library in the same action; rejection keeps it out of the Library. File integrity and malware-safety checks remain in place.",
    tags: ["contribute", "pdf", "upload", "copyright", "review"],
    recommendedLink: { label: "Browse Library Catalogue", href: "/library" },
  },

  // Social Map & Community
  {
    id: "faq-map-privacy",
    category: "social-map",
    categoryLabel: "Social Map & Community",
    question: "What is the Social Map, and how is my location kept private?",
    answer: "The Social Map allows you to discover nearby readers reading the same books, as well as literary spots like historic libraries, independent bookstores, and book cafes. Location sharing is 100% voluntary and bilateral. We never track your background location without explicit consent, and your exact coordinates are never exposed to other users.",
    tags: ["map", "location", "privacy", "readers", "safety"],
    recommendedLink: { label: "Explore Social Map", href: "/map" },
  },
  {
    id: "faq-ghost-mode",
    category: "social-map",
    categoryLabel: "Social Map & Community",
    question: "What is Ghost Mode and how do I enable it?",
    answer: "Ghost Mode instantly makes your pin invisible to all other readers and friends on the map, while still allowing you to view nearby reading spots, bookstores, and events. You can toggle Ghost Mode on or off at any moment via the shield switch located in the top map HUD.",
    tags: ["ghost mode", "privacy", "invisibility", "stealth"],
  },
  {
    id: "faq-avatar-bitmoji",
    category: "social-map",
    categoryLabel: "Social Map & Community",
    question: "How do I customize my Bitmoji or map avatar?",
    answer: "Click the avatar button on the map HUD or navigate to your profile settings. You can use our Bitmoji Creator to style hairstyles, spectacles, expressions, and accessories, or upload your own square photo avatar to represent your pin on the map.",
    tags: ["avatar", "bitmoji", "character", "customization"],
  },
  {
    id: "faq-reading-groups",
    category: "social-map",
    categoryLabel: "Social Map & Community",
    question: "What are Reading Groups and how do I join or create one?",
    answer: "Reading Groups are community book clubs focused on specific books, genres, or themes. Members read along a shared timetable, hold discussions, and organize co-reading sprints. Navigate to Social > Reading Groups to browse active clubs, or click 'Create Group' to start your own with custom privacy settings.",
    tags: ["groups", "book club", "discussions", "community"],
    recommendedLink: { label: "Browse Reading Groups", href: "/social?tab=groups" },
  },

  // AI Companion & Expert
  {
    id: "faq-ai-how",
    category: "ai-companion",
    categoryLabel: "AI Companion & Expert",
    question: "How does the Sahadhyayi AI Reading Companion work?",
    answer: "Our AI Companion uses Retrieval-Augmented Generation (RAG) strictly grounded in the verified text of the book you are reading. You can ask for philosophical explanations, historical context, character relationship trees, or vocabulary breakdowns, and the assistant responds with cited chapter references.",
    tags: ["ai", "assistant", "rag", "book expert", "comprehension"],
    recommendedLink: { label: "Visit Sahadhyayi Book Expert", href: "/book-expert" },
  },
  {
    id: "faq-ai-spoilers",
    category: "ai-companion",
    categoryLabel: "AI Companion & Expert",
    question: "Will the AI Companion spoil future plot twists?",
    answer: "No. The AI Companion is engineered with milestone-aware context boundaries. It only references information from the chapters you have reached, ensuring you can freely ask about confusing events without accidentally discovering later plot reveals.",
    tags: ["spoilers", "safety", "plot", "ai protection"],
  },
  {
    id: "faq-sanskrit-vocab",
    category: "ai-companion",
    categoryLabel: "AI Companion & Expert",
    question: "Can the AI Companion explain Sanskrit, Hindi, and archaic literary terms?",
    answer: "Yes! Sahadhyayi has dedicated lexical embeddings for Indian classical literature, Sanskrit etymologies, and regional idioms. Highlight any archaic word to receive root meanings, contextual translations, and historical notes in English and Hindi.",
    tags: ["sanskrit", "hindi", "heritage", "vocabulary", "etymology"],
  },

  // Reading DNA & Co-Reading
  {
    id: "faq-reading-dna",
    category: "reading-dna",
    categoryLabel: "Reading DNA & Co-Reading",
    question: "What is Reading DNA and how is my literary compatibility calculated?",
    answer: "Reading DNA is a multidimensional profile built from your completed books, favorite authors, reading speed, and annotations. It calculates a literary affinity score with other readers, helping you discover kindred book lovers whose literary taste resonates with yours.",
    tags: ["reading dna", "compatibility", "taste", "matching"],
    recommendedLink: { label: "View Reading DNA", href: "/social?tab=dna" },
  },
  {
    id: "faq-reading-rooms",
    category: "reading-dna",
    categoryLabel: "Reading DNA & Co-Reading",
    question: "What are Live Reading Rooms and Silent Sprints?",
    answer: "Live Reading Rooms are virtual study spaces designed for distraction-free focus. Members join timed 25-minute or 50-minute Pomodoro sessions accompanied by ambient soundscapes (library murmur, monsoon rain, temple bells). In-room chat is muted during sprints and opens during 5-minute break intervals.",
    tags: ["reading rooms", "pomodoro", "sprints", "focus", "habit"],
    recommendedLink: { label: "Explore Live Rooms", href: "/social?tab=rooms" },
  },
  {
    id: "faq-spoiler-threads",
    category: "reading-dna",
    categoryLabel: "Reading DNA & Co-Reading",
    question: "What are Chapter-Locked Spoiler-Safe Threads?",
    answer: "Discussion threads on Sahadhyayi can be tagged to specific chapters or milestones. If you have not yet reached that chapter in your reading progress, the thread is shielded behind a spoiler warning veil, allowing readers to share raw reactions safely.",
    tags: ["spoiler-free", "threads", "discussions", "chapter-locked"],
  },

  // Authors & Publishing
  {
    id: "faq-verified-author",
    category: "authors-publishing",
    categoryLabel: "Authors & Publishing",
    question: "How can published authors get a verified profile on Sahadhyayi?",
    answer: "Authors can visit our Authors portal and click 'Apply for Verification'. Once approved, your profile displays a verified author badge, gives you access to reader analytics and book engagement statistics, and allows you to host virtual Q&A sessions and reader conferences.",
    tags: ["authors", "verification", "publishing", "analytics"],
    recommendedLink: { label: "Visit Authors Portal", href: "/authors" },
  },
  {
    id: "faq-research-papers",
    category: "authors-publishing",
    categoryLabel: "Authors & Publishing",
    question: "How do I submit an article or academic research paper?",
    answer: "Visit the Articles or Research portal and select 'Submit Paper'. Fill in the abstract, methodology, references, and upload your manuscript in PDF or Markdown format. Submissions undergo open peer review before being indexed into the Sahadhyayi citation network.",
    tags: ["research", "academic", "papers", "peer review"],
    recommendedLink: { label: "Explore Research Portal", href: "/research-papers" },
  },
];

const QUICK_FEATURE_LINKS = [
  {
    title: "Digital Library",
    description: "Browse 12,500+ curated classical and modern books",
    href: "/library",
    icon: Library,
    badge: "12,500+ Books",
  },
  {
    title: "Social Map",
    description: "Discover local readers, bookstores, and quiet reading spots",
    href: "/map",
    icon: Compass,
    badge: "Interactive Map",
  },
  {
    title: "AI Book Expert",
    description: "Grounded RAG assistance, summaries, and chapter analysis",
    href: "/book-expert",
    icon: Bot,
    badge: "RAG Powered",
  },
  {
    title: "Reading DNA",
    description: "Match your literary taste and find reading soulmates",
    href: "/social?tab=dna",
    icon: Dna,
    badge: "Taste Match",
  },
  {
    title: "Live Reading Rooms",
    description: "Silent Pomodoro co-reading sprints with ambient audio",
    href: "/social?tab=rooms",
    icon: Radio,
    badge: "Focus Sprints",
  },
  {
    title: "Author Hub",
    description: "Connect with verified writers and attend virtual conferences",
    href: "/authors",
    icon: Feather,
    badge: "Verified Authors",
  },
] as const;

const HelpCenter: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [helpfulFeedback, setHelpfulFeedback] = useState<Record<string, "yes" | "no">>({});

  // Filter FAQs based on search and category
  const filteredFaqs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return FAQS.filter((faq) => {
      const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!query) return true;

      const inQuestion = faq.question.toLowerCase().includes(query);
      const inAnswer = faq.answer.toLowerCase().includes(query);
      const inTags = faq.tags.some((tag) => tag.toLowerCase().includes(query));
      const inCategory = faq.categoryLabel.toLowerCase().includes(query);

      return inQuestion || inAnswer || inTags || inCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Filter guides by active category if not "all"
  const activeGuides = useMemo(() => {
    if (selectedCategory === "all") return FEATURE_GUIDES;
    const matching = FEATURE_GUIDES.filter((g) => g.category === selectedCategory);
    return matching.length > 0 ? matching : FEATURE_GUIDES;
  }, [selectedCategory]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const handleHelpfulVote = useCallback((faqId: string, vote: "yes" | "no") => {
    setHelpfulFeedback((prev) => ({ ...prev, [faqId]: vote }));
    if (vote === "yes") {
      toast.success("Thank you for your feedback! We are glad this helped.");
    } else {
      toast.info("Thank you for the feedback. We will refine this explanation.");
    }
  }, []);

  const handleTagClick = useCallback((tag: string) => {
    setSearchQuery(tag);
  }, []);

  const handleWhatsAppClick = useCallback(() => {
    openSahadhyayiWhatsApp("Namaste Sahadhyayi Support! I have a question regarding the platform.");
  }, []);

  // JSON-LD structured data for FAQPage SEO
  const faqSchema = useMemo(() => {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQS.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    };
  }, []);

  return (
    <>
      <SEO
        title="Help Center & Knowledge Base — Sahadhyayi"
        description="Comprehensive user guides, FAQs, and support for the Sahadhyayi digital library, social reader map, AI companion, reading rooms, and author publishing."
        canonical="https://sahadhyayi.com/help-center"
        url="https://sahadhyayi.com/help-center"
        keywords={[
          "Sahadhyayi help",
          "reading app FAQs",
          "digital library support",
          "social reader map help",
          "reading DNA guide",
          "book expert assistant",
          "offline reading guide",
        ]}
        breadcrumbs={[
          { name: "Home", url: "https://sahadhyayi.com" },
          { name: "Help Center", url: "https://sahadhyayi.com/help-center" },
        ]}
        schema={faqSchema}
      />

      <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7] transition-colors duration-200">
        {/* Top Hero Section */}
        <section className="relative overflow-hidden border-b border-[#E8E2D9] dark:border-[#222B25] bg-gradient-to-b from-amber-50/60 via-[#FAF7F2] to-[#FAF7F2] dark:from-[#111714] dark:via-[#0B0D0C] dark:to-[#0B0D0C] py-12 md:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(#1C442D_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] dark:opacity-[0.08] pointer-events-none" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 text-center space-y-6">
            {/* Breadcrumb & Status Pill */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
              <nav aria-label="Breadcrumb" className="inline-flex items-center gap-1.5 text-[#636B65] dark:text-[#A5ADA6]">
                <Link to="/" className="hover:text-[#1C442D] dark:hover:text-[#D5B16D] transition-colors">
                  Home
                </Link>
                <span>/</span>
                <span className="font-semibold text-[#1C201D] dark:text-[#F3F0E7]">Help Center</span>
              </nav>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                All Systems Operational · AI Assistant Online
              </span>
            </div>

            {/* Main Title & Subtitle */}
            <div className="max-w-3xl mx-auto space-y-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#1C201D] dark:text-[#F3F0E7]">
                How can we help your reading journey?
              </h1>
              <p className="text-base sm:text-lg text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
                Find clear answers, interactive guides, and direct support for the digital library, social map, AI reading companion, and community features.
              </p>
            </div>

            {/* Search Box */}
            <div className="max-w-2xl mx-auto relative">
              <div className="relative flex items-center shadow-sm rounded-2xl bg-white dark:bg-[#141A17] border border-[#DCD5C9] dark:border-[#29332D] focus-within:ring-2 focus-within:ring-[#1C442D] dark:focus-within:ring-[#D5B16D] transition-all">
                <Search className="absolute left-4 h-5 w-5 text-[#8A928C] dark:text-[#6E7770]" aria-hidden="true" />
                <Input
                  type="text"
                  placeholder="Search articles, e.g. 'offline reading', 'ghost mode', 'reading DNA'..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-10 h-14 bg-transparent border-0 text-base rounded-2xl focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[#8A928C] dark:placeholder:text-[#6E7770]"
                  aria-label="Search help articles and FAQs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    aria-label="Clear search input"
                    className="absolute right-3 p-1.5 rounded-full text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Popular Search Tags */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-3 text-xs text-[#636B65] dark:text-[#A5ADA6]">
                <span className="font-medium text-[#1C201D] dark:text-[#F3F0E7]">Popular searches:</span>
                {POPULAR_SEARCH_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagClick(tag)}
                    className="rounded-full bg-white/80 dark:bg-[#161D19] border border-[#E8E2D9] dark:border-[#29332D] px-2.5 py-1 text-[11px] font-medium text-[#1C201D] dark:text-[#F3F0E7] hover:border-[#1C442D] dark:hover:border-[#D5B16D] hover:bg-amber-50/50 dark:hover:bg-[#1C2620] transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Content Container */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-14">
          {/* Category Navigation Grid */}
          <section aria-labelledby="browse-by-topic-heading" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 id="browse-by-topic-heading" className="text-xl sm:text-2xl font-bold tracking-tight">
                Browse by Topic
              </h2>
              {selectedCategory !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategory("all")}
                  className="text-xs text-[#1C442D] dark:text-[#D5B16D] hover:underline self-start sm:self-auto h-8 px-2"
                >
                  Reset category filter
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = selectedCategory === cat.id;
                const count = cat.id === "all" ? FAQS.length : FAQS.filter((f) => f.category === cat.id).length;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    aria-label={`Category: ${cat.label}`}
                    data-testid={`category-filter-${cat.id}`}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex flex-col text-left p-3.5 sm:p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? "border-[#1C442D] bg-[#1C442D]/5 ring-2 ring-[#1C442D] dark:border-[#D5B16D] dark:bg-[#D5B16D]/10 dark:ring-[#D5B16D]"
                        : "border-[#E8E2D9] bg-white hover:border-[#1C442D]/40 dark:border-[#222B25] dark:bg-[#141A17] dark:hover:border-[#D5B16D]/50 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className={`p-2 rounded-xl ${isSelected ? "bg-[#1C442D] text-white dark:bg-[#D5B16D] dark:text-[#0B0D0C]" : "bg-[#FAF7F2] text-[#1C442D] dark:bg-[#1C2620] dark:text-[#D5B16D]"}`}>
                        <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <span className="text-[11px] font-semibold text-[#8A928C] dark:text-[#6E7770]">
                        {count} articles
                      </span>
                    </div>
                    <span className="text-sm font-bold text-[#1C201D] dark:text-[#F3F0E7]">
                      {cat.label}
                    </span>
                    <p className="text-[11px] text-[#636B65] dark:text-[#A5ADA6] line-clamp-2 mt-1 leading-snug">
                      {cat.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Interactive Feature Guides (Replaces Rick Astley iframes) */}
          <section aria-labelledby="interactive-guides-heading" className="space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-[#1C442D]/30 text-[#1C442D] dark:border-[#D5B16D]/40 dark:text-[#D5B16D]">
                  Visual Walkthroughs
                </Badge>
              </div>
              <h2 id="interactive-guides-heading" className="text-xl sm:text-2xl font-bold tracking-tight mt-1">
                Interactive Feature Guides
              </h2>
              <p className="text-sm text-[#636B65] dark:text-[#A5ADA6]">
                Clear step-by-step walkthroughs to get the most out of Sahadhyayi's core features.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {activeGuides.map((guide) => {
                const GuideIcon = guide.icon;
                return (
                  <Card
                    key={guide.id}
                    className="rounded-2xl border-[#E8E2D9] dark:border-[#222B25] bg-white dark:bg-[#141A17] flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">
                          <GuideIcon className="h-4 w-4" />
                          {guide.badge}
                        </span>
                      </div>
                      <CardTitle className="text-lg font-bold leading-tight">
                        {guide.title}
                      </CardTitle>
                      <CardDescription className="text-xs text-[#636B65] dark:text-[#A5ADA6] pt-1">
                        {guide.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3 pt-0">
                      <div className="space-y-2 rounded-xl bg-[#FAF7F2] dark:bg-[#0F1411] p-3 border border-[#EFECE6] dark:border-[#1E2721]">
                        {guide.steps.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1C442D] text-[10px] font-bold text-white dark:bg-[#D5B16D] dark:text-[#0B0D0C]">
                              {idx + 1}
                            </span>
                            <div className="space-y-0.5">
                              <span className="font-semibold text-[#1C201D] dark:text-[#F3F0E7]">
                                {step.title}
                              </span>
                              <p className="text-[11px] text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
                                {step.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2">
                        <Button
                          asChild
                          size="sm"
                          className="w-full rounded-xl bg-[#1C442D] hover:bg-[#143221] text-white dark:bg-[#D5B16D] dark:text-[#0B0D0C] dark:hover:bg-[#C29E57] font-semibold text-xs h-9"
                        >
                          <Link to={guide.cta.href}>
                            {guide.cta.label}
                            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Frequently Asked Questions Section */}
          <section aria-labelledby="faqs-heading" className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E8E2D9] dark:border-[#222B25] pb-3">
              <div>
                <h2 id="faqs-heading" className="text-xl sm:text-2xl font-bold tracking-tight">
                  Frequently Asked Questions
                </h2>
                <p className="text-xs sm:text-sm text-[#636B65] dark:text-[#A5ADA6]">
                  {searchQuery ? `Showing ${filteredFaqs.length} results for "${searchQuery}"` : `Showing ${filteredFaqs.length} articles in ${selectedCategory === "all" ? "all topics" : selectedCategory}`}
                </p>
              </div>

              {searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearSearch}
                  className="text-xs rounded-xl h-8 self-start sm:self-auto"
                >
                  Clear search
                </Button>
              )}
            </div>

            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-[#DCD5C9] dark:border-[#29332D] bg-white dark:bg-[#141A17] space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 dark:bg-[#1C2620] text-[#1C442D] dark:text-[#D5B16D]">
                  <HelpCircle className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#1C201D] dark:text-[#F3F0E7]">
                    No answers found for "{searchQuery}"
                  </h3>
                  <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] max-w-md mx-auto">
                    Try checking for typos, clearing your search query, or reaching out directly to our live support team.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={handleClearSearch} className="rounded-xl text-xs h-9">
                    Clear Search Query
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleWhatsAppClick}
                    className="rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs h-9"
                  >
                    <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                    Ask on WhatsApp
                  </Button>
                </div>
              </div>
            ) : (
              <Accordion type="single" collapsible className="space-y-3">
                {filteredFaqs.map((faq) => {
                  const vote = helpfulFeedback[faq.id];
                  return (
                    <AccordionItem
                      key={faq.id}
                      value={faq.id}
                      className="rounded-2xl border border-[#E8E2D9] dark:border-[#222B25] bg-white dark:bg-[#141A17] px-4 sm:px-5 shadow-sm transition-all"
                    >
                      <AccordionTrigger className="text-left font-semibold text-sm sm:text-base py-4 hover:no-underline gap-3">
                        <div className="flex items-center gap-2.5 flex-1 pr-2">
                          <span className="flex-1 text-[#1C201D] dark:text-[#F3F0E7]">
                            {faq.question}
                          </span>
                          <Badge
                            variant="secondary"
                            className="hidden sm:inline-flex text-[10px] font-normal rounded-lg bg-[#FAF7F2] dark:bg-[#1F2722] text-[#636B65] dark:text-[#A5ADA6] border border-[#E8E2D9] dark:border-[#29332D]"
                          >
                            {faq.categoryLabel}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 pt-1 space-y-4 text-xs sm:text-sm text-[#4A524D] dark:text-[#C5CDC6] leading-relaxed border-t border-[#F2EFE9] dark:border-[#1E2520]">
                        <p>{faq.answer}</p>

                        {/* Optional Direct Feature Link */}
                        {faq.recommendedLink && (
                          <div className="pt-1">
                            <Button
                              asChild
                              variant="link"
                              size="sm"
                              className="p-0 h-auto font-semibold text-xs text-[#1C442D] dark:text-[#D5B16D] hover:underline"
                            >
                              <Link to={faq.recommendedLink.href}>
                                {faq.recommendedLink.label}
                                <ArrowRight className="h-3 w-3 ml-1 inline" />
                              </Link>
                            </Button>
                          </div>
                        )}

                        {/* Was this answer helpful? rating */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F2EFE9] dark:border-[#1E2520] text-xs">
                          <span className="text-[#8A928C] dark:text-[#6E7770]">
                            Was this answer helpful?
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleHelpfulVote(faq.id, "yes")}
                              disabled={Boolean(vote)}
                              aria-label="Yes, this answer was helpful"
                              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium border transition-colors ${
                                vote === "yes"
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                                  : "border-[#E8E2D9] dark:border-[#29332D] hover:bg-[#FAF7F2] dark:hover:bg-[#1C2620]"
                              }`}
                            >
                              <ThumbsUp className="h-3 w-3" />
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => handleHelpfulVote(faq.id, "no")}
                              disabled={Boolean(vote)}
                              aria-label="No, this answer was not helpful"
                              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium border transition-colors ${
                                vote === "no"
                                  ? "bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300"
                                  : "border-[#E8E2D9] dark:border-[#29332D] hover:bg-[#FAF7F2] dark:hover:bg-[#1C2620]"
                              }`}
                            >
                              <ThumbsDown className="h-3 w-3" />
                              No
                            </button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </section>

          {/* Quick Feature Jump Cards */}
          <section aria-labelledby="quick-jump-heading" className="space-y-4">
            <h2 id="quick-jump-heading" className="text-xl sm:text-2xl font-bold tracking-tight">
              Direct Feature Shortcuts
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {QUICK_FEATURE_LINKS.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="flex flex-col justify-between p-4 rounded-2xl border border-[#E8E2D9] dark:border-[#222B25] bg-white dark:bg-[#141A17] hover:border-[#1C442D] dark:hover:border-[#D5B16D] hover:shadow-md transition-all group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-xl bg-[#FAF7F2] dark:bg-[#1C2620] text-[#1C442D] dark:text-[#D5B16D] group-hover:scale-105 transition-transform">
                          <ItemIcon className="h-4 w-4" />
                        </div>
                        <Badge variant="secondary" className="text-[10px] rounded-md font-medium">
                          {item.badge}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-sm text-[#1C201D] dark:text-[#F3F0E7] flex items-center justify-between">
                        {item.title}
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D] transition-all" />
                      </h3>
                      <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Omni-Channel Direct Support Section */}
          <section aria-labelledby="support-options-heading" className="space-y-4">
            <Card className="rounded-3xl border-[#E8E2D9] dark:border-[#222B25] bg-gradient-to-br from-amber-50/70 via-white to-amber-100/30 dark:from-[#111714] dark:via-[#141A17] dark:to-[#162019] shadow-sm p-6 sm:p-8">
              <div className="max-w-2xl mx-auto text-center space-y-3 mb-8">
                <Badge className="bg-[#1C442D] hover:bg-[#1C442D] text-white dark:bg-[#D5B16D] dark:text-[#0B0D0C] text-[11px]">
                  Here to Help
                </Badge>
                <h2 id="support-options-heading" className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Still have questions or need guidance?
                </h2>
                <p className="text-sm text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
                  Our dedicated community team is on hand to help with books, author submissions, bug reports, or reading circle setups.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. WhatsApp Instant Helpline */}
                <div className="flex flex-col justify-between p-4 rounded-2xl bg-white dark:bg-[#0B0D0C] border border-[#E8E2D9] dark:border-[#222B25] space-y-3">
                  <div className="space-y-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-sm">WhatsApp Helpline</h3>
                    <p className="text-[11px] text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
                      Instant chat with our advisory team for book recommendations and quick support.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleWhatsAppClick}
                    className="w-full rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold text-xs h-9"
                  >
                    Chat on WhatsApp
                  </Button>
                </div>

                {/* 2. In-App Contact Dialog */}
                <div className="flex flex-col justify-between p-4 rounded-2xl bg-white dark:bg-[#0B0D0C] border border-[#E8E2D9] dark:border-[#222B25] space-y-3">
                  <div className="space-y-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                      <Mail className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-sm">Send a Message</h3>
                    <p className="text-[11px] text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
                      Submit an in-app support message directly to our resolution desk.
                    </p>
                  </div>
                  <ContactFormDialog
                    trigger={
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full rounded-xl font-semibold text-xs h-9 border-[#1C442D]/40 text-[#1C442D] dark:border-[#D5B16D]/50 dark:text-[#D5B16D]"
                      >
                        Open Message Form
                      </Button>
                    }
                  />
                </div>

                {/* 3. Direct Email */}
                <div className="flex flex-col justify-between p-4 rounded-2xl bg-white dark:bg-[#0B0D0C] border border-[#E8E2D9] dark:border-[#222B25] space-y-3">
                  <div className="space-y-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                      <Mail className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-sm">Email Support</h3>
                    <p className="text-[11px] text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
                      Reach us at {SAHADHYAYI_EMAIL} for formal queries or partnership proposals.
                    </p>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="w-full rounded-xl font-semibold text-xs h-9"
                  >
                    <a href={`mailto:${SAHADHYAYI_EMAIL}?subject=Sahadhyayi%20Help%20Center%20Inquiry`}>
                      Send Email
                    </a>
                  </Button>
                </div>

                {/* 4. Bug Report / Feedback */}
                <div className="flex flex-col justify-between p-4 rounded-2xl bg-white dark:bg-[#0B0D0C] border border-[#E8E2D9] dark:border-[#222B25] space-y-3">
                  <div className="space-y-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-sm">Feedback & Bugs</h3>
                    <p className="text-[11px] text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
                      Suggest a new feature, report a technical bug, or leave an app review.
                    </p>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="w-full rounded-xl font-semibold text-xs h-9"
                  >
                    <Link to="/feedback?type=bug">
                      Report an Issue
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Turnaround Assurance */}
              <div className="mt-6 pt-5 border-t border-[#E8E2D9]/80 dark:border-[#222B25] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#636B65] dark:text-[#A5ADA6] text-center sm:text-left">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#1C442D] dark:text-[#D5B16D]" />
                  Average email response time: within 24 hours · WhatsApp chat: typically within a few hours.
                </span>
                <span className="font-mono text-[11px]">
                  Phone helpline: {SAHADHYAYI_PHONE}
                </span>
              </div>
            </Card>
          </section>
        </div>
      </div>
    </>
  );
};

export default HelpCenter;
