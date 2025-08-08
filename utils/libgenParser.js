import { load } from 'cheerio';

export function parseLibgenHtml(html) {
  const $ = load(html);
  const rows = $('table[border="1"] tr');
  const books = [];
  rows.each((i, row) => {
    if (i === 0) return; // skip header
    const cells = $(row).find('td');
    if (cells.length >= 10) {
      const title = $(cells[2]).text().trim();
      const author = $(cells[1]).text().trim();
      const publisher = $(cells[3]).text().trim();
      const year = $(cells[4]).text().trim();
      const size = $(cells[7]).text().trim();
      const format = $(cells[8]).text().trim();
      const mirrorLink = $(cells[9]).find('a').first().attr('href') || '';
      if (title && mirrorLink) {
        books.push({
          id: `libgen-${i}`,
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
    }
  });
  return books;
}
