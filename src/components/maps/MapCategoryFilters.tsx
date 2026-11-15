import React from 'react';
import type { ExploreCategory } from '@/types/mapExplore';

interface MapCategoryFiltersProps {
  selectedCategory: ExploreCategory;
  onSelectCategory: (category: ExploreCategory) => void;
}

const CATEGORIES: { id: ExploreCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '🌟' },
  { id: 'library', label: 'Libraries', icon: '🏛️' },
  { id: 'bookstore', label: 'Bookstores', icon: '📖' },
  { id: 'cafe', label: 'Reading Cafes', icon: '☕' },
  { id: 'events', label: 'Literary Events', icon: '🎭' },
];

export const MapCategoryFilters: React.FC<MapCategoryFiltersProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-2 w-full max-w-4xl mx-auto pointer-events-auto select-none">
      {CATEGORIES.map((cat) => {
        const isActive = selectedCategory === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all shadow-xs cursor-pointer ${
              isActive
                ? 'bg-[#1C442D] text-white border border-[#1C442D] shadow-sm'
                : 'bg-white/90 dark:bg-[#111614]/90 text-[#3F4842] dark:text-[#CBD5CD] border border-[#E5DED2] dark:border-[#29332D] hover:bg-[#F3EFE7] dark:hover:bg-[#1C3024]'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
};
