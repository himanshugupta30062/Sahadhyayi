import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Library, Search, Users, MessageSquare, BookOpen, Star, Award,
  MapPin, List, Bookmark, Download, Accessibility, Cloud,
} from "lucide-react";

interface Capability {
  id: number;
  title: string;
  tagline: string;
  detail: string;
  metric: string;
  icon: React.ElementType;
}

const capabilities: Capability[] = [
  { id: 1, title: "Digital Book Library", tagline: "A universe of books, always within reach.", detail: "Access thousands of curated ebooks, audiobooks, and niche content in English, Hindi, and regional languages. Personalized collections help users discover hidden gems.", metric: "Readers find 3x more relevant books through our smart shelving and curation.", icon: Library },
  { id: 2, title: "Intelligent Book Discovery", tagline: "What to read next—without the guesswork.", detail: "Recommendations adapt based on your reading history, community trends, and similarity to books you've loved.", metric: "Users engage 40% longer when suggestions align with their evolving interests.", icon: Search },
  { id: 3, title: "Social Reading Circles", tagline: "Read together. Discuss deeper.", detail: "Join or create thematic reading circles, host timed group reads, and participate in guided discussions with integrated chat and shared highlights.", metric: "Monthly clubs drive 25% higher retention and repeat visits.", icon: Users },
  { id: 4, title: "Author Connect & Live Events", tagline: "Beyond the book—meet the minds behind it.", detail: "Live Q&As, AMAs, workshops, and exclusive author sessions to give readers first-hand insights and interactive experiences.", metric: "Authors report a 3x increase in follower interaction after live sessions.", icon: MessageSquare },
  { id: 5, title: "Personal Bookshelf & Tracker", tagline: "Organize, track, and celebrate your journey.", detail: "Save favorites, set reading goals, visualize streaks, and revisit your history with smart filters to keep momentum.", metric: "Goal setters complete 60% more books per quarter than casual readers.", icon: Bookmark },
  { id: 6, title: "Insight Sharing", tagline: "Capture thoughts. Spark conversations.", detail: "Highlight passages, annotate, and optionally share with your circle or the wider community to inspire and connect.", metric: "Shared highlights increase social engagement by 50%.", icon: BookOpen },
  { id: 7, title: "Community Reviews & Ratings", tagline: "Real voices, real opinions.", detail: "Browse weighted ratings, in-depth reviews, and expert lists to choose what’s worth reading next.", metric: "Books with community endorsements get 3x more clicks.", icon: Star },
  { id: 8, title: "Gamification & Rewards", tagline: "Progress feels good—and gets noticed.", detail: "Earn badges, unlock exclusives, and climb leaderboards through reading milestones and contributions.", metric: "Top contributors drive 30% of new user referrals through social sharing.", icon: Award },
  { id: 9, title: "Local Reader Discovery", tagline: "Find readers like you nearby.", detail: "See who’s reading the same book in your area, form local micro-clubs, and host in-person or hybrid meetups.", metric: "Local connections increase time-on-platform by 2x.", icon: MapPin },
  { id: 10, title: "Curated Reading Paths", tagline: "Reading made purposeful.", detail: "Follow themed lists curated by experts, authors, and community leaders for career growth, mood, or deep dives.", metric: "Users following curated paths finish 80% of list titles versus 45% randomly.", icon: List },
  { id: 11, title: "Offline Reading Mode", tagline: "Stay immersed even without internet.", detail: "Download books for offline access, with seamless sync when you're back online.", metric: "Offline readers complete 2x more chapters on commutes.", icon: Download },
  { id: 12, title: "Accessibility Tools", tagline: "Inclusive reading for everyone.", detail: "Customizable fonts, dyslexia-friendly modes, and screen reader support make reading accessible to all.", metric: "Accessible settings increase reading satisfaction by 35% among neurodiverse users.", icon: Accessibility },
  { id: 13, title: "Cloud Sync & Device Continuity", tagline: "Pick up right where you left.", detail: "Sync your progress and annotations across devices for a seamless reading experience anywhere.", metric: "Multi-device readers log 50% longer sessions.", icon: Cloud },
];

const SahadhyayiCapabilities: React.FC = () => {
  const [windowCount, setWindowCount] = useState(3);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [gap, setGap] = useState(1.5);

  const updateWindowCount = useCallback(() => {
    const w = window.innerWidth;
    if (w < 640) { setWindowCount(1); setGap(1); }
    else if (w < 1024) { setWindowCount(2); setGap(1.5); }
    else { setWindowCount(3); setGap(1.5); }
  }, []);

  useEffect(() => {
    updateWindowCount();
    window.addEventListener("resize", updateWindowCount);
    return () => window.removeEventListener("resize", updateWindowCount);
  }, [updateWindowCount]);

  const maxStart = capabilities.length - windowCount;

  useEffect(() => {
    if (isHovered) return;
    const id = setInterval(() => {
      setCurrentIndex((p) => (p >= maxStart ? 0 : p + 1));
    }, 4000);
    return () => clearInterval(id);
  }, [isHovered, maxStart]);

  useEffect(() => {
    setCurrentIndex((p) => Math.min(p, maxStart));
  }, [maxStart]);

  return (
    <section
      className="py-12 sm:py-16 px-4 bg-black text-white overflow-visible"
      aria-label="Sahadhyayi capabilities carousel"
      role="region"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Explore Sahadhyayi's{" "}
            <span className="text-sky-400">Capabilities</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 max-w-4xl mx-auto">
            Discover how Sahadhyayi transforms reading into community, insight, and influence—bringing books, people, and ideas together in one intelligent ecosystem.
          </p>
        </div>

        <div
          className="relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* keep borders visible; no clipping on hover */}
          <div className="overflow-visible">
            <div
              className="flex items-stretch gap-4 sm:gap-6 transition-transform duration-700 will-change-transform"
              style={{
                transform: `translateX(calc(-${(currentIndex * 100) / windowCount}% - ${currentIndex * gap}rem))`,
              }}
            >
              {capabilities.map((cap) => {
                const Icon = cap.icon;
                return (
                  <div
                    key={cap.id}
                    style={{ flex: `0 0 ${100 / windowCount}%` }}
                    className="flex-shrink-0 px-0.5"
                  >
                    <div className="group relative h-full">
                      {/* Card: neutral black with thick single border */}
                      <Card
                        className={[
                          "h-full flex flex-col",
                          "rounded-2xl overflow-visible",
                          "border-[3px] border-white/25",
                          "bg-neutral-900",
                          "transition-colors duration-300",
                          "hover:border-white/80",
                          "shadow-[0_8px_28px_rgba(0,0,0,0.45)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.55)]",
                        ].join(" ")}
                      >
                        {/* Gradient overlay ONLY on hover (blue -> teal like reference) */}
                        <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-blue-600 via-sky-500 to-teal-400" />
                        </div>

                        <CardContent className="p-8 text-center flex flex-col h-full relative">
                          <div className="w-16 h-16 mx-auto mb-5 rounded-xl grid place-items-center bg-white/10 group-hover:bg-white/20 transition-colors">
                            <Icon className="w-8 h-8 text-white transition-colors" aria-hidden="true" />
                          </div>

                          {/* Heading: white in normal state; blue tint on hover (kept same) */}
                          <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-blue-300 transition-colors duration-300">
                            {cap.title}
                          </h3>

                          {/* Keep text gray in both states */}
                          <p className="text-sm mb-3 text-gray-300">
                            {cap.tagline}
                          </p>

                          <p className="text-sm leading-relaxed text-gray-300 flex-grow min-h-[80px]">
                            {cap.detail}
                          </p>

                          <div className="rounded-lg p-3 mt-4 border border-white/10 bg-white/[0.03] group-hover:bg-white/[0.08] group-hover:border-white/25 transition-colors">
                            <p className="text-xs font-medium text-white flex items-center gap-2">
                              <span aria-hidden="true">📊</span> {cap.metric}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* dots */}
          <div className="flex justify-center gap-3 mt-6" aria-label="Capability navigation">
            {Array.from({ length: maxStart + 1 }).map((_, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-3 h-3 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-teal-300 ${
                  idx === currentIndex ? "bg-teal-400 scale-125" : "bg-gray-600 hover:bg-gray-500"
                }`}
                aria-label={`View slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SahadhyayiCapabilities;
