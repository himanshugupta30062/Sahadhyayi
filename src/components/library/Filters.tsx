import { ChangeEvent } from 'react'

type Props = {
  lang: string | null
  setLang: (v: string | null) => void
  genres: string[] | null
  setGenres: (g: string[] | null) => void
  minPopularity: number | null
  setMinPopularity: (n: number | null) => void
  reset: () => void
}

const LANGS = ['English', 'Hindi']
const GENRES = ['Fiction', 'Non-fiction', 'Fantasy', 'History', 'Science']
const POPULARITY = [0, 10, 20, 50, 100]

export default function Filters({
  lang,
  setLang,
  genres,
  setGenres,
  minPopularity,
  setMinPopularity,
  reset,
}: Props) {
  const handleGenre = (e: ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions).map((o) => o.value)
    setGenres(values.length ? values : null)
  }

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div>
        <label className="block text-sm font-medium" htmlFor="lang-select">Language</label>
        <select
          id="lang-select"
          aria-label="Language filter"
          value={lang ?? ''}
          onChange={(e) => setLang(e.target.value || null)}
          className="border rounded px-2 py-1"
        >
          <option value="">All</option>
          {LANGS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="genre-select">Genres</label>
        <select
          id="genre-select"
          multiple
          aria-label="Genres filter"
          value={genres ?? []}
          onChange={handleGenre}
          className="border rounded px-2 py-1 h-24"
        >
          {GENRES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="pop-select">Popularity</label>
        <select
          id="pop-select"
          aria-label="Minimum popularity"
          value={minPopularity ?? ''}
          onChange={(e) => setMinPopularity(e.target.value ? Number(e.target.value) : null)}
          className="border rounded px-2 py-1"
        >
          <option value="">Any</option>
          {POPULARITY.map((p) => (
            <option key={p} value={p}>
              {p}+
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={reset}
        className="ml-auto px-3 py-1 border rounded"
      >
        Reset filters
      </button>
    </div>
  )
}
