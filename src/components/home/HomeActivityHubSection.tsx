import React from 'react';
import { Link } from 'react-router-dom';
import {
  Gamepad2,
  Trophy,
  Users,
  Calendar,
  ArrowRight,
  Flame,
  CheckCircle,
  Sparkles,
  Clock,
  MapPin,
} from 'lucide-react';
import { CURATED_LITERARY_EVENTS } from '@/data/curatedEvents';
import { useGroups } from '@/hooks/useGroupManagement';

export const HomeActivityHubSection: React.FC = () => {
  const { data: rawGroups = [] } = useGroups();
  const upcomingEvents = CURATED_LITERARY_EVENTS.slice(0, 2);
  const activeGroups = (rawGroups as any[]).slice(0, 2);

  return (
    <section
      className="home-activity-hub relative isolate py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#F4F3EF] dark:bg-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7] transition-colors duration-300"
      aria-label="Activity Hub"
    >
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 sm:mb-14">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-[#8F681C] dark:text-[#D5B16D] mb-3">
              <span aria-hidden="true" className="h-px w-7 bg-[#8F681C] dark:bg-[#D5B16D]" />
              <span>09 / Interactive reading</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#1C201D] dark:text-[#F3F0E7] tracking-tight">
              Activity Hub: Games, challenges & meetups
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
              Reading comes alive through interactive challenges, trivia games, genre book circles, and live literary festivals.
            </p>
          </div>

          <Link
            to="/activity"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#1C442D] hover:text-[#2D5A40] dark:text-[#D5B16D] dark:hover:text-[#e4c688] transition-colors self-start md:self-end group"
          >
            <span>Explore all activities</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* 4 Core Activity Destination Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* 1. Games & Quizzes */}
          <Link
            to="/games"
            className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-[#111413] border border-[#E8E8E3] hover:border-[#BDA56B]/60 dark:border-[#222824] dark:hover:border-[#D5B16D]/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#1C201D] dark:text-[#F3F0E7] group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D] transition-colors">
                Book Games & Trivia
              </h3>
              <p className="text-xs font-semibold text-[#8F681C] dark:text-[#D5B16D] mt-0.5 mb-2">
                Literary Quizzes
              </p>
              <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
                Test your knowledge of classic plots, famous quotes, author biographies, and literary trivia.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#E8E8E3] dark:border-[#222824] flex items-center text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">
              <span>Play book quizzes</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* 2. Reading Challenges */}
          <Link
            to="/activity?tab=challenges"
            className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-[#111413] border border-[#E8E8E3] hover:border-[#BDA56B]/60 dark:border-[#222824] dark:hover:border-[#D5B16D]/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#1C201D] dark:text-[#F3F0E7] group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D] transition-colors">
                Reading Challenges
              </h3>
              <p className="text-xs font-semibold text-[#8F681C] dark:text-[#D5B16D] mt-0.5 mb-2">
                Streaks & Milestones
              </p>
              <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
                Set yearly reading goals, embark on 30-day literary sprints, track your streaks, and unlock milestones.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#E8E8E3] dark:border-[#222824] flex items-center text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">
              <span>Join a challenge</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* 3. Reading Groups */}
          <Link
            to="/social?tab=groups"
            className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-[#111413] border border-[#E8E8E3] hover:border-[#BDA56B]/60 dark:border-[#222824] dark:hover:border-[#D5B16D]/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#1C201D] dark:text-[#F3F0E7] group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D] transition-colors">
                Reading Groups
              </h3>
              <p className="text-xs font-semibold text-[#8F681C] dark:text-[#D5B16D] mt-0.5 mb-2">
                Discussion Circles
              </p>
              <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
                Join book clubs dedicated to your favorite genres, philosophy, poetry, history, or start your own reading group.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#E8E8E3] dark:border-[#222824] flex items-center text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">
              <span>Explore reading circles</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* 4. Events & Festivals */}
          <Link
            to="/events"
            className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-[#111413] border border-[#E8E8E3] hover:border-[#BDA56B]/60 dark:border-[#222824] dark:hover:border-[#D5B16D]/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[#1C201D] dark:text-[#F3F0E7] group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D] transition-colors">
                Events & Festivals
              </h3>
              <p className="text-xs font-semibold text-[#8F681C] dark:text-[#D5B16D] mt-0.5 mb-2">
                Literature Festivals & Meets
              </p>
              <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
                Discover upcoming literature festivals, author Q&A sessions, book launches, and local reader meetups.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-[#E8E8E3] dark:border-[#222824] flex items-center text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D]">
              <span>View event calendar</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>

        {/* Dynamic Activity Spotlight: Upcoming Event Banner */}
        {upcomingEvents.length > 0 && (
          <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#111413] border border-[#E8E8E3] dark:border-[#222824] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#EBF2EC] dark:bg-[#1E2721] text-[#1C442D] dark:text-[#D5B16D] border border-[#C8DBCB] dark:border-[#2B352E] flex flex-col items-center justify-center shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 mb-1.5">
                  <Sparkles className="w-3 h-3" /> Featured Upcoming Festival
                </div>
                <h4 className="text-base sm:text-lg font-bold text-[#1C201D] dark:text-[#F3F0E7]">
                  {upcomingEvents[0].title}
                </h4>
                <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] mt-0.5 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(upcomingEvents[0].start_at || upcomingEvents[0].date || '').toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  {(upcomingEvents[0].city || upcomingEvents[0].location) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {upcomingEvents[0].city || upcomingEvents[0].location}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
              <Link
                to={`/events/${upcomingEvents[0].id}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#1C442D] hover:bg-[#143221] text-white font-semibold text-xs transition-colors"
              >
                <span>RSVP & View Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeActivityHubSection;

