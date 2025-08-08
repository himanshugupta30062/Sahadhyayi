export function parseLibgenHtml(html) {
  const books = [];
  const rowRegex = /<tr[^>]*>(.*?)<\/tr>/gs;
  let match;
  let index = 0;
  while ((match = rowRegex.exec(html)) !== null) {
    const row = match[1];
    if (index === 0) { index++; continue; }
    const cellRegex = /<td[^>]*>(.*?)<\/td>/gs;
    const cells = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(row)) !== null) {
      cells.push(cellMatch[1]);
    }
    if (cells.length < 10) { index++; continue; }
    const strip = (str) => str.replace(/<[^>]+>/g, '').trim();
    const title = strip(cells[2]);
    const author = strip(cells[1]);
    const publisher = strip(cells[3]);
    const year = strip(cells[4]);
    const size = strip(cells[7]);
    const format = strip(cells[8]);
    const mirrorMatch = cells[9].match(/href=['"]([^'"]+)['"]/);
    const mirrorLink = mirrorMatch ? mirrorMatch[1] : '';
    if (title && author && mirrorLink) {
      books.push({
        id: `libgen-${index}`,
        title,
        author,
        publisher,
        year,
        format,
        size,
        mirrorLink,
        source: 'libgen'
      });
    }
    index++;
  }
  return books;
}
