export type RowQuery = {
  range: (start: number, end: number) => Promise<{ data: unknown[] | null; error: unknown | null }>;
};

/**
 * Shared bounded pagination for the sitemap and prerender scripts.
 * Returns backend errors to callers so each build step can log its own context.
 */
export async function fetchPaginatedRows<T = Record<string, unknown>>(
  query: RowQuery,
  label: string,
  maxRows = 100000,
  onLimit?: (label: string, maxRows: number) => void,
  pageSize = 1000,
): Promise<{ data: T[] | null; error: unknown | null }> {
  const rows: T[] = [];
  for (let offset = 0; offset < maxRows; offset += pageSize) {
    const end = Math.min(offset + pageSize - 1, maxRows - 1);
    const { data, error } = await query.range(offset, end);
    if (error) return { data: null, error };
    rows.push(...((data || []) as T[]));
    if (!data || data.length < end - offset + 1) break;
  }
  if (rows.length >= maxRows) onLimit?.(label, maxRows);
  return { data: rows, error: null };
}

/** Keep generated author routes consistent with the client-side Unicode slug rules. */
export function slugify(value: unknown): string {
  if (!value) return '';
  const text = String(value);
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    || text.replace(/\s+/g, '-').toLowerCase();
}
