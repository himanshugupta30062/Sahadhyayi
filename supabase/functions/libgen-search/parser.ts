export interface LibgenBook {
  title: string;
  author: string;
  publisher?: string;
  year?: string;
  format?: string;
  size?: string;
  mirrorLink: string;
}

export function parseLibgenHtml(html: string): LibgenBook[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const rows = doc.querySelectorAll('table[border="1"] tr');
    const books: LibgenBook[] = [];
    rows.forEach((row, index) => {
      if (index === 0) return;
      const cells = row.querySelectorAll('td');
      if (cells.length >= 10) {
        const titleCell = cells[2];
        const authorCell = cells[1];
        const publisherCell = cells[3];
        const yearCell = cells[4];
        const formatCell = cells[8];
        const sizeCell = cells[7];
        const mirrorLink = cells[9]?.querySelector('a')?.getAttribute('href') || '';
        if (titleCell && authorCell && mirrorLink) {
          books.push({
            title: titleCell.textContent?.trim() || 'Unknown Title',
            author: authorCell.textContent?.trim() || 'Unknown Author',
            publisher: publisherCell?.textContent?.trim() || '',
            year: yearCell?.textContent?.trim() || '',
            format: formatCell?.textContent?.trim() || '',
            size: sizeCell?.textContent?.trim() || '',
            mirrorLink,
          });
        }
      }
    });
    return books;
  } catch (_e) {
    return [];
  }
}
