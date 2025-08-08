import { load } from 'cheerio';

export function parseLibgenHtml(html) {
  const $ = load(html);
  const rows = $('table[border="1"] tr');
  const books = [];
  rows.slice(1).each((index, row) => {
    const cells = $(row).find('td');
    if (cells.length >= 10) {
      const title = $(cells[2]).text().trim() || 'Unknown Title';
      const author = $(cells[1]).text().trim() || 'Unknown Author';
      const publisher = $(cells[3]).text().trim() || '';
      const year = $(cells[4]).text().trim() || '';
      const format = $(cells[8]).text().trim() || '';
      const size = $(cells[7]).text().trim() || '';
      const mirrorLink = $(cells[9]).find('a').first().attr('href') || '';
      if (mirrorLink) {
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
    }
  });
  return books;
}
