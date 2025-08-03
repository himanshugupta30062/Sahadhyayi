
import React from 'react';
import { BookOpen, Search, Users, Mic, BarChart3, MessageSquare, Star, Trophy, MapPin, List } from 'lucide-react';

interface Capability {
  id: number;
  title: string;
  tagline: string;
  detail: string;
  metric: string;
  icon: React.ComponentType<any>;
  gradient: string;
}

const capabilities: Capability[] = [
  {
    id: 1,
    title: "Vast Digital Library",
    tagline: "A universe of books, always within reach.",
    detail: "Access thousands of curated ebooks, audiobooks, and niche content in English, Hindi, and regional languages. Personalized collections help users discover hidden gems.",
    metric: "Readers find 3x more relevant books through our smart shelving and curation.",
    icon: BookOpen,
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    id: 2,
    title: "Smart Recommendations",
    tagline: "What to read next—without the guesswork.",
    detail: "Recommendations adapt based on your reading history, community trends, and similarity to books you've loved.",
    metric: "Users engage 40% longer when suggestions align with their evolving interests.",
    icon: Search,
    gradient: "from-purple-500 to-pink-500"
  },
  {
    id: 3,
    title: "Community Reading Hubs",
    tagline: "Read together. Discuss deeper.",
    detail: "Join or create thematic reading circles, host timed group reads, and participate in guided discussions. Integrated chat and highlight-sharing keep everyone in sync.",
    metric: "Monthly clubs drive 25% higher retention and repeat visits.",
    icon: Users,
    gradient: "from-emerald-500 to-teal-500"
  },
  {
    id: 4,
    title: "Direct Author Engagement",
    tagline: "Beyond the book—meet the minds behind it.",
    detail: "Live Q&As, author AMAs, writing workshops, and feedback sessions. Readers get first-hand insights and exclusive content drops.",
    metric: "Authors report a 3x increase in follower interaction after live sessions.",
    icon: Mic,
    gradient: "from-orange-500 to-red-500"
  },
  {
    id: 5,
    title: "Your Reading Dashboard",
    tagline: "Organize, track, and celebrate your journey.",
    detail: "Save favorites, mark progress, set reading goals, and revisit past discoveries with smart filters. Visual streaks and history keep motivation high.",
    metric: "Goal setters complete 60% more books per quarter than casual readers.",
    icon: BarChart3,
    gradient: "from-indigo-500 to-purple-500"
  },
  {
    id: 6,
    title: "Insight Sharing",
    tagline: "Capture thoughts. Spark conversations.",
    detail: "Highlight passages, annotate, and optionally share with friends or public community feeds. Follow others' highlights to see why a book resonated.",
    metric: "Shared highlights increase social engagement by 50%.",
    icon: MessageSquare,
    gradient: "from-yellow-500 to-orange-500"
  },
  {
    id: 7,
    title: "Trusted Reader Feedback",
    tagline: "Real voices, real opinions.",
    detail: "Read nuanced reviews, upvote helpful takes, and browse expert-curated lists. Weighted ratings surface what matters to you.",
    metric: "Books with community endorsements get 3x more clicks.",
    icon: Star,
    gradient: "from-pink-500 to-rose-500"
  },
  {
    id: 8,
    title: "Read & Earn",
    tagline: "Progress feels good—and gets noticed.",
    detail: "Earn badges for milestones (first book, streaks, reviews), unlock exclusive previews, and climb leaderboards in themed challenges.",
    metric: "Top contributors drive 30% of new user referrals through social sharing.",
    icon: Trophy,
    gradient: "from-cyan-500 to-blue-500"
  },
  {
    id: 9,
    title: "Nearby Book Enthusiasts",
    tagline: "Find readers like you—in your city or neighborhood.",
    detail: "See who's reading the same book nearby, form micro-clubs, or host local meetups. Geo-aware suggestions help build real-world reading circles.",
    metric: "Local connections increase time-on-platform by 2x.",
    icon: MapPin,
    gradient: "from-teal-500 to-green-500"
  },
  {
    id: 10,
    title: "Expert & Community Lists",
    tagline: "Reading made purposeful.",
    detail: "Explore lists curated by authors, power readers, and Sahadhyayi editors—seasonal themes, mood-based picks, career growth reads, and more.",
    metric: "Users following curated paths finish 80% of list titles versus 45% of random picks.",
    icon: List,
    gradient: "from-violet-500 to-purple-500"
  }
];

const SahadhyayiCapabilities: React.FC = () => {
  return (
    <section className="py-20 bg-black text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,transparent_70%)]"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Explore <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Sahadhyayi's</span> Capabilities
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Discover how Sahadhyayi transforms reading into community, insight, and influence—bringing books, people, and ideas together in one intelligent ecosystem.
          </p>
        </div>

        {/* Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {capabilities.map((capability, index) => (
            <div
              key={capability.id}
              className="group relative bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800 hover:border-gray-600 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl"
              style={{
                animationDelay: `${index * 100}ms`
              }}
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${capability.gradient} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <capability.icon className="w-8 h-8 text-white" />
              </div>

              {/* Content */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors duration-300">
                  {capability.title}
                </h3>
                
                <p className="text-lg font-medium text-blue-300">
                  {capability.tagline}
                </p>
                
                <p className="text-gray-300 leading-relaxed">
                  {capability.detail}
                </p>
                
                {/* Metric */}
                <div className="pt-4 border-t border-gray-700">
                  <p className="text-sm font-medium text-cyan-400 italic">
                    {capability.metric}
                  </p>
                </div>
              </div>

              {/* Hover Effect Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-r ${capability.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300 pointer-events-none`}></div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <a
            href="/signup"
            className="inline-block px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-lg font-bold rounded-full shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-blue-500/25 focus:outline-none focus:ring-4 focus:ring-blue-400/50 transform hover:-translate-y-1"
          >
            Start Your Reading Journey
          </a>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full animate-pulse opacity-40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 3}s`,
            }}
          ></div>
        ))}
      </div>
    </section>
  );
};

export default SahadhyayiCapabilities;
