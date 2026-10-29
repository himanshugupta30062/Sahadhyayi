/**
 * Produce readable, compact text for search and social metadata.
 * Content can come from HTML-backed blog posts or Markdown-backed community articles.
 */
const decodeCommonEntities = (value: string): string =>
  value
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');

export function toSeoDescription(
  value: string | null | undefined,
  maxLength = 160,
): string {
  if (!value || maxLength < 1) return '';

  const plainText = decodeCommonEntities(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/(^|\s)[*_~`]{1,3}([^*_~`]+)[*_~`]{1,3}(?=\s|$)/g, '$2')
    .replace(/^\s*>\s?/gm, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .trim();

  if (plainText.length <= maxLength) return plainText;

  const excerpt = plainText.slice(0, maxLength - 1);
  const lastSpace = excerpt.lastIndexOf(' ');
  return (lastSpace > Math.floor(maxLength * 0.6) ? excerpt.slice(0, lastSpace) : excerpt).trimEnd() + '…';
}
