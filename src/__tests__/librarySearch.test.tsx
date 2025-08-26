import { describe, vi, it, expect, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
vi.mock('@/lib/searchLibrary', () => ({
  searchLibrary: vi.fn().mockResolvedValue([]),
}))
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: () => ({
    getVirtualItems: () => [{ index: 0, start: 0, measureElement: () => {} }],
    getTotalSize: () => 120,
  }),
}))

import ResultsList from '@/components/library/ResultsList'
import { useLibrarySearch } from '@/hooks/useLibrarySearch'
import * as api from '@/lib/searchLibrary'

describe('useLibrarySearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debounces search', async () => {
    vi.useFakeTimers()
    const spy = vi.spyOn(api, 'searchLibrary').mockResolvedValue([])

    const Test = () => {
      const { setQuery } = useLibrarySearch()
      ;(window as any).setQuery = setQuery
      return null
    }

    render(
      <MemoryRouter>
        <Test />
      </MemoryRouter>
    )

    act(() => {
      ;(window as any).setQuery('hello')
    })
    expect(spy).not.toHaveBeenCalled()
    await act(async () => {
      vi.advanceTimersByTime(300)
    })
    expect(spy).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('syncs query param to state', () => {
    const Test = () => {
      const { query } = useLibrarySearch()
      return <div data-testid="q">{query}</div>
    }
    render(
      <MemoryRouter initialEntries={['/library?q=test']}>
        <Test />
      </MemoryRouter>
    )
    expect(screen.getByTestId('q')).toHaveTextContent('test')
  })
})

describe('ResultsList', () => {
  it('sanitizes snippet and keeps mark', () => {
    const data = [{
      id: '1',
      title: 't',
      author: 'a',
      genre: 'fiction',
      language: 'en',
      cover_url: '',
      popularity: 1,
      snippet: '<mark>hi</mark><script>alert(1)</script>',
      rank: 1,
    }]
    render(<ResultsList results={data as any} loading={false} error={null} />)
    const item = screen.getByText('hi')
    expect(item.tagName).toBe('MARK')
    expect(screen.queryByText('alert')).toBeNull()
  })

  it('renders empty and error states', () => {
    const { rerender } = render(<ResultsList results={[]} loading={false} error={null} />)
    expect(screen.getByText(/No results/)).toBeInTheDocument()
    rerender(<ResultsList results={[]} loading={false} error={new Error('boom')} />)
    expect(screen.getByRole('alert')).toHaveTextContent('boom')
  })
})

it('SQL smoke test', async () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return
  vi.doUnmock('@/lib/searchLibrary')
  const real = await import('@/lib/searchLibrary')
  const rows = await real.searchLibrary('harry potter', { genres: ['fantasy'] })
  expect(Array.isArray(rows) ? rows.length : 0).toBeGreaterThan(0)
  expect(rows[0].rank).toBeGreaterThan(0)
})
