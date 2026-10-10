'use client';

import { useEffect, useState } from 'react';
import useDebouncedValue from '@/lib/useDebouncedValue';
import type { Language, SortOption } from '@/lib/types';

export interface FilterState {
  genres: string[];
  language?: Language;
  price?: 'free' | 'paid';
  yearRange: [number | undefined, number | undefined];
  sort: SortOption;
}

interface Props {
  query: string;
  onQueryChange: (value: string) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const GENRES = ['Fiction', 'Nonfiction', 'Poetry', 'History', 'Science'];

export default function SearchAndFilters({
  query,
  onQueryChange,
  filters,
  onFiltersChange,
}: Props) {
  const [internalQuery, setInternalQuery] = useState(query);
  const debouncedQuery = useDebouncedValue(internalQuery, 300);

  useEffect(() => {
    onQueryChange(debouncedQuery);
  }, [debouncedQuery, onQueryChange]);

  useEffect(() => {
    setInternalQuery(query);
  }, [query]);

  const update = (partial: Partial<FilterState>) =>
    onFiltersChange({ ...filters, ...partial });

  return (
    <div className="flex flex-wrap items-end gap-4">
      <input
        type="search"
        value={internalQuery}
        onChange={(e) => setInternalQuery(e.target.value)}
        placeholder="Search by title, author, tags..."
        aria-label="Search books"
        className="flex-1 rounded border px-2 py-1"
      />
      <select
        multiple
        value={filters.genres}
        onChange={(e) => {
          const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
          update({ genres: opts });
        }}
        className="rounded border px-2 py-1"
        aria-label="Filter by genre"
      >
        {GENRES.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>
      <select
        value={filters.language ?? ''}
        onChange={(e) =>
          update({ language: e.target.value ? (e.target.value as Language) : undefined })
        }
        className="rounded border px-2 py-1"
        aria-label="Filter by language"
      >
        <option value="">All languages</option>
        <option value="EN">English</option>
        <option value="HI">Hindi</option>
      </select>
      <select
        value={filters.price ?? ''}
        onChange={(e) =>
          update({ price: e.target.value ? (e.target.value as 'free' | 'paid') : undefined })
        }
        className="rounded border px-2 py-1"
        aria-label="Filter by price"
      >
        <option value="">All</option>
        <option value="free">Free</option>
        <option value="paid">Paid</option>
      </select>
      <div className="flex gap-1">
       <input
          type="number"
          value={filters.yearRange[0] ?? ''}
          onChange={(e) =>
            update({
              yearRange: [
                e.target.value ? Number(e.target.value) : undefined,
                filters.yearRange[1],
              ],
            })
          }
          className="w-20 rounded border px-2 py-1"
          placeholder="From"
          aria-label="From year"
        />
       <input
          type="number"
          value={filters.yearRange[1] ?? ''}
          onChange={(e) =>
            update({
              yearRange: [
                filters.yearRange[0],
                e.target.value ? Number(e.target.value) : undefined,
              ],
            })
          }
          className="w-20 rounded border px-2 py-1"
          placeholder="To"
          aria-label="To year"
        />
      </div>
      <select
        value={filters.sort}
        onChange={(e) => update({ sort: e.target.value as SortOption })}
        className="rounded border px-2 py-1"
        aria-label="Sort books"
      >
        <option value="newest">Newest</option>
        <option value="popularity">Popularity</option>
        <option value="az">A→Z</option>
        <option value="za">Z→A</option>
      </select>
    </div>
  );
}
