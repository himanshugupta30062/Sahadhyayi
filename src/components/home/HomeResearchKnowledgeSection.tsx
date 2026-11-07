import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Microscope,
  FileText,
  Search,
  BookmarkCheck,
  Upload,
  ArrowRight,
  BookMarked,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

const FEATURED_RESEARCH_AREAS = [
  {
    topic: 'Comparative Literature & Translation',
    description: 'Studies on cultural transposition, syntactic fidelity, and the transmission of Asian & European classics.',
    count: '3,200+ Papers',
  },
  {
    topic: 'Cognitive Science & Reading Psychology',
    description: 'Research into how deep linear reading reshapes neural pathways, comprehension, and human empathy.',
    count: '1,800+ Papers',
  },
  {
    topic: 'Historical Linguistics & Epigraphy',
    description: 'Scholarly papers on ancient Sanskrit, Prakrit, and Indo-European linguistic etymology.',
    count: '2,400+ Papers',
  },
  {
    topic: 'Philosophy of Mind & Ethics',
    description: 'Peer-reviewed treatises bridging classical Indian darshanas with contemporary Western ethics.',
    count: '4,100+ Papers',
  },
];

export const HomeResearchKnowledgeSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/research-papers?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/research-papers');
    }
  };

  return (
    <section
      className="home-research-knowledge relative isolate py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7] border-t border-[#E8E8E3] dark:border-[#222824] transition-colors duration-300"
      aria-label="Research & Knowledge"
    >
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 sm:mb-14">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-[#8F681C] dark:text-[#D5B16D] mb-3">
              <span aria-hidden="true" className="h-px w-7 bg-[#8F681C] dark:bg-[#D5B16D]" />
              <span>10 / Academic literature</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#1C201D] dark:text-[#F3F0E7] tracking-tight">
              Research & scholarly knowledge
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-[#636B65] dark:text-[#A5ADA6] leading-relaxed">
              Beyond popular fiction and casual reading — explore peer-reviewed open-access research papers, submit academic treatises, save citations, and compare evidence across disciplines.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-end">
            <Link
              to="/research-papers"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1C442D] hover:bg-[#143221] dark:bg-[#D5B16D] dark:hover:bg-[#e4c688] text-white dark:text-stone-950 font-semibold text-xs sm:text-sm transition-all shadow-sm group"
            >
              <span>Explore research catalogue</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Search Bar Shortcut */}
        <form onSubmit={handleSearchSubmit} className="mb-10 max-w-3xl">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-[#8F681C] dark:text-[#D5B16D]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scholarly papers by keyword, author, DOI or topic..."
              className="w-full pl-12 pr-28 py-3.5 rounded-2xl border border-[#DDE5D8] dark:border-[#28352D] bg-[#FAFAF8] dark:bg-[#121815] text-[#1C201D] dark:text-[#F3F0E7] text-sm focus:outline-none focus:ring-2 focus:ring-[#1C442D] dark:focus:ring-[#D5B16D]"
            />
            <button
              type="submit"
              className="absolute right-2 px-4 py-2 rounded-xl bg-[#1C442D] text-white dark:bg-[#D5B16D] dark:text-stone-950 text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Search
            </button>
          </div>
        </form>

        {/* 4 Research Discipline Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {FEATURED_RESEARCH_AREAS.map((area) => (
            <div
              key={area.topic}
              className="group flex flex-col justify-between rounded-2xl bg-[#FAFAF8] dark:bg-[#111413] border border-[#E8E8E3] hover:border-[#BDA56B]/60 dark:border-[#222824] dark:hover:border-[#D5B16D]/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#EBF2EC] dark:bg-[#19221C] text-[#1C442D] dark:text-[#D5B16D] border border-[#D4E3D6] dark:border-[#2D3A31] flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                  <Microscope className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-base font-bold text-[#1C201D] dark:text-[#F3F0E7] group-hover:text-[#1C442D] dark:group-hover:text-[#D5B16D] transition-colors leading-tight">
                  {area.topic}
                </h3>
                <p className="text-xs text-[#636B65] dark:text-[#A5ADA6] mt-2 leading-relaxed">
                  {area.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#E8E8E3] dark:border-[#222824] flex items-center justify-between text-[11px] font-semibold text-[#8F681C] dark:text-[#D5B16D]">
                <span>{area.count}</span>
                <span className="group-hover:underline flex items-center gap-0.5">
                  Browse <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Research Workflow Bar */}
        <div className="p-6 rounded-2xl bg-[#F8F7F3] dark:bg-[#141A17] border border-[#E8E2D9] dark:border-[#28352D] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BookmarkCheck className="w-6 h-6 text-[#1C442D] dark:text-[#D5B16D] shrink-0" />
            <div>
              <p className="text-sm font-bold text-[#1C201D] dark:text-[#F3F0E7]">
                Scholarly Workspace & Open Submissions
              </p>
              <p className="text-xs text-[#636B65] dark:text-[#A5ADA6]">
                Organize your citations in My Saved Research or submit a paper to Sahadhyayi’s open scholarly repository.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <Link
              to="/my-saved-research"
              className="w-full sm:w-auto text-center px-4 py-2 rounded-xl border border-[#C9D2CA] dark:border-[#2E3C32] bg-white dark:bg-[#1B231F] text-xs font-semibold text-[#1C442D] dark:text-[#D5B16D] hover:bg-[#EBF2EC] dark:hover:bg-[#232F28] transition-colors"
            >
              My Saved Research
            </Link>
            <Link
              to="/research-papers/submit?kind=publish"
              className="w-full sm:w-auto text-center px-4 py-2 rounded-xl bg-[#1C442D] hover:bg-[#143221] text-white text-xs font-semibold transition-colors"
            >
              Submit a Paper
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeResearchKnowledgeSection;

