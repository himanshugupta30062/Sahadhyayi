/**
 * Shared bounded pagination for the sitemap and prerender scripts.
 * Returns backend errors to callers so each build step can log its own context.
 */
export async function fetchPaginatedRows(
  query,
  label,
  maxRows = 100000,
  onLimit,
  pageSize = 1000,
) {
  const rows = [];
  for (let offset = 0; offset < maxRows; offset += pageSize) {
    const end = Math.min(offset + pageSize - 1, maxRows - 1);
    const { data, error } = await query.range(offset, end);
    if (error) return { data: null, error };
    rows.push(...(data || []));
    if (!data || data.length < end - offset + 1) break;
  }
  if (rows.length >= maxRows) onLimit?.(label, maxRows);
  return { data: rows, error: null };
}

/** Keep generated author routes consistent with the client-side Unicode slug rules. */
export function slugify(value) {
  if (!value) return '';
  const text = String(value);
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    || text.replace(/\s+/g, '-').toLowerCase();
}
