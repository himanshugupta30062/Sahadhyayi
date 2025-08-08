export function parseLibgenHtml(html) {
  const books = [];
  const tableMatch = html.match(/<table[^>]*border=["']?1["']?[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) return books;
  const rows = tableMatch[1].split(/<tr[^>]*>/i).slice(2); // skip header row
  for (const row of rows) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m => m[1]);
    if (cells.length < 10) continue;
    const strip = (str) => str.replace(/<[^>]+>/g, '').trim();
    const mirrorMatch = cells[9].match(/href=["']([^"']+)/i);
    if (!mirrorMatch) continue;
    books.push({
      id: `libgen-${books.length}`,
      title: strip(cells[2]) || 'Unknown Title',
      author: strip(cells[1]) || 'Unknown Author',
      publisher: strip(cells[3]) || '',
      year: strip(cells[4]) || '',
      format: strip(cells[8]) || '',
      size: strip(cells[7]) || '',
      mirrorLink: mirrorMatch[1],
      source: 'libgen'
    });
  }
  return books;
}
