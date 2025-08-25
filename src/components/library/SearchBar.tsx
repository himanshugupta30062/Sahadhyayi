import { useEffect, useRef, useState } from 'react'

type Props = {
  query: string
  onChange: (q: string) => void
  onSubmit: () => void
}

const RECENT_KEY = 'library_recent_searches'

export default function SearchBar({ query, onChange, onSubmit }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSug, setShowSug] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') as string[]
    setSuggestions(stored)
  }, [])

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        onChange('')
        setShowSug(false)
      }
      if (showSug && suggestions.length) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setActiveIdx((i) => (i + 1) % suggestions.length)
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setActiveIdx((i) => (i - 1 + suggestions.length) % suggestions.length)
        }
        if (e.key === 'Enter' && activeIdx >= 0) {
          onChange(suggestions[activeIdx])
          setShowSug(false)
          onSubmit()
        }
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [showSug, suggestions, activeIdx, onChange, onSubmit])

  const handleSubmit = () => {
    if (!query.trim()) return
    const next = [query, ...suggestions.filter((s) => s !== query)].slice(0, 5)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    setSuggestions(next)
    setShowSug(false)
    onSubmit()
  }

  return (
    <div className="relative w-full max-w-xl">
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setShowSug(true)}
        onBlur={() => setTimeout(() => setShowSug(false), 100)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
        }}
        placeholder="Search books / किताबें खोजें…"
        aria-label="Search books"
        className="w-full border rounded px-3 py-2"
      />
      {query && (
        <button
          aria-label="Clear search"
          className="absolute right-2 top-2 text-sm"
          onClick={() => onChange('')}
        >
          ×
        </button>
      )}
      {showSug && suggestions.length > 0 && (
        <ul
          role="listbox"
          aria-label="Recent searches"
          className="absolute z-10 bg-white border w-full mt-1 rounded shadow"
        >
          {suggestions.map((s, i) => (
            <li
              key={s}
              role="option"
              aria-selected={activeIdx === i}
              className={`px-3 py-2 cursor-pointer ${activeIdx === i ? 'bg-gray-100' : ''}`}
              onMouseDown={() => {
                onChange(s)
                setShowSug(false)
                onSubmit()
              }}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
