import cheerio from 'cheerio';

export function parseLibgenHtml(html) {
  try {
    const $ = cheerio.load(html);
    const books = [];
    $('table[border="1"] tr').each((index, row) => {
      if (index === 0) return;
      const cells = $(row).find('td');
      if (cells.length >= 10) {
        const title = $(cells[2]).text().trim();
        const author = $(cells[1]).text().trim();
        const publisher = $(cells[3]).text().trim();
        const year = $(cells[4]).text().trim();
        const size = $(cells[7]).text().trim();
        const format = $(cells[8]).text().trim();
        const mirrorLink = $(cells[9]).find('a').first().attr('href') || '';
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
      }
    });
    return books;
  } catch (err) {
    console.error('Error parsing Libgen HTML:', err);
    return [];
  }
}
