import SearchBar from '@/components/library/SearchBar'
import Filters from '@/components/library/Filters'
import ResultsList from '@/components/library/ResultsList'
import { useLibrarySearch } from '@/hooks/useLibrarySearch'

export default function Library() {
  const {
    query,
    setQuery,
    results,
    loading,
    error,
    slow,
    filters,
    setFilters,
    forceSearch,
    resetFilters,
  } = useLibrarySearch()

  return (
    <div className="p-4 space-y-4">
      <SearchBar query={query} onChange={setQuery} onSubmit={forceSearch} />
      <Filters
        lang={filters.lang}
        setLang={setFilters.setLang}
        genres={filters.genres}
        setGenres={setFilters.setGenres}
        minPopularity={filters.minPopularity}
        setMinPopularity={setFilters.setMinPopularity}
        reset={resetFilters}
      />
      <div aria-live="polite" className="text-sm text-gray-600">
        {results.length} results for "{query}"
        {slow && loading && <span className="ml-2">Still searching…</span>}
      </div>
      <ResultsList results={results} loading={loading} error={error} />
    </div>
  )
}
