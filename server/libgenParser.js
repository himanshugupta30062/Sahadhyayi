export function parseLibgenHtml(html) {
  const books = [];
  if (!html || typeof html !== 'string') return books;
  const strip = (str) => {
    if (!str) return '';
    let result = '';
    let inTag = false;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (ch === '<') inTag = true;
      else if (ch === '>') inTag = false;
      else if (!inTag) result += ch;
    }
    return result.trim();
  };

  const rawRows = html.split(/<tr\b[^>]*>/i).slice(1);
  let index = 0;
  for (const rawRow of rawRows) {
    const endRowIdx = rawRow.indexOf('</tr>');
    const row = endRowIdx !== -1 ? rawRow.slice(0, endRowIdx) : rawRow;
    if (index === 0) { index++; continue; }

    const rawCells = row.split(/<td\b[^>]*>/i).slice(1);
    const cells = rawCells.map((rawCell) => {
      const endCellIdx = rawCell.indexOf('</td>');
      return endCellIdx !== -1 ? rawCell.slice(0, endCellIdx) : rawCell;
    });

    if (cells.length < 10) { index++; continue; }

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
