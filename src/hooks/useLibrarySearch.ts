import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { searchLibrary, BookSearchRow, SearchParams } from '@/lib/searchLibrary'

export function useLibrarySearch() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)

  const [query, setQuery] = useState<string>(params.get('q') || '')
  const [lang, setLang] = useState<string | null>(params.get('lang'))
  const [genres, setGenres] = useState<string[] | null>(params.get('genres')?.split(',') || null)
  const [minPopularity, setMinPopularity] = useState<number | null>(
    params.get('pop') ? Number(params.get('pop')) : null
  )

  const [results, setResults] = useState<BookSearchRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [slow, setSlow] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const slowTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastKey = useRef('')

  const filters: SearchParams = useMemo(
    () => ({ lang, genres, minPopularity }),
    [lang, genres, minPopularity]
  )

  const updateURL = useCallback(
    (q: string, f: SearchParams) => {
      const p = new URLSearchParams()
      if (q) p.set('q', q)
      if (f.lang) p.set('lang', f.lang)
      if (f.genres && f.genres.length) p.set('genres', f.genres.join(','))
      if (f.minPopularity != null) p.set('pop', String(f.minPopularity))
      navigate({ search: p.toString() }, { replace: true })
    },
    [navigate]
  )

  const runSearch = useCallback(
    async (q: string, f: SearchParams) => {
      if (!q.trim()) {
        setResults([])
        return
      }
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      setSlow(false)
      slowTimerRef.current = setTimeout(() => setSlow(true), 600)
      try {
        const data = await searchLibrary(q, f, { signal: controller.signal })
        setResults(data)
        setError(null)
        window.dispatchEvent(new CustomEvent('search:submit', { detail: { q, filters: f } }))
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err)
          setResults([])
        }
      } finally {
        if (slowTimerRef.current) clearTimeout(slowTimerRef.current)
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    const key = JSON.stringify({ query, ...filters })
    if (key === lastKey.current) return
    lastKey.current = key
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      updateURL(query, filters)
      runSearch(query, filters)
    }, 300)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query, filters, runSearch, updateURL])

  const forceSearch = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    updateURL(query, filters)
    runSearch(query, filters)
  }, [query, filters, runSearch, updateURL])

  const resetFilters = useCallback(() => {
    setLang(null)
    setGenres(null)
    setMinPopularity(null)
  }, [])

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    slow,
    filters: { lang, genres, minPopularity },
    setFilters: { setLang, setGenres, setMinPopularity },
    forceSearch,
    resetFilters,
  }
}
