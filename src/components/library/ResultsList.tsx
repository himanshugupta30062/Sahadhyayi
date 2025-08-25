import DOMPurify from 'dompurify'
import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { BookSearchRow } from '@/lib/searchLibrary'

interface Props {
  results: BookSearchRow[]
  loading: boolean
  error: Error | null
}

export default function ResultsList({ results, loading, error }: Props) {
  const parentRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
  })

  const sanitize = (html: string) =>
    DOMPurify.sanitize(html, { ALLOWED_TAGS: ['mark', 'b', 'i', 'em', 'strong', 'u'] })

  if (error) {
    return <div role="alert">Error: {error.message}</div>
  }

  if (!loading && results.length === 0) {
    return <div className="p-4 text-center">No results. Try fewer filters or check spelling.</div>
  }

  return (
    <div ref={parentRef} style={{ height: '60vh', overflow: 'auto' }}>
      <div
        style={{ height: rowVirtualizer.getTotalSize(), position: 'relative', width: '100%' }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const book = results[virtualRow.index]
          return (
            <div
              key={book.id}
              ref={rowVirtualizer.measureElement}
              className="flex gap-4 border-b p-4"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`
              }}
            >
              {book.cover_url && (
                <img src={book.cover_url} alt="" className="w-16 h-24 object-cover" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold">
                  {book.title}
                  {book.author && <span className="ml-2 text-sm text-gray-500">{book.author}</span>}
                </h3>
                <div className="flex flex-wrap gap-1 my-1 text-xs">
                  {book.genres?.map((g) => (
                    <span key={g} className="px-1 bg-gray-100 rounded">
                      {g}
                    </span>
                  ))}
                  {book.language && (
                    <span className="px-1 bg-gray-100 rounded">{book.language}</span>
                  )}
                </div>
                <div
                  className="text-sm" dangerouslySetInnerHTML={{ __html: sanitize(book.snippet) }}
                />
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-xs bg-amber-100 px-2 py-0.5 rounded">{book.popularity}</span>
                <button className="text-sm px-2 py-1 border rounded">Add to shelf</button>
              </div>
            </div>
          )
        })}
        {loading && (
          <div className="p-4">Loading…</div>
        )}
      </div>
    </div>
  )
}
