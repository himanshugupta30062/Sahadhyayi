import { describe, expect, it } from 'vitest';
import { parseLibgenHtml } from './libgenParser.js';

const makeRow = ({
  author = 'Jane Author',
  title = 'A Useful Book',
  publisher = 'Example Press',
  year = '2024',
  size = '2 MB',
  format = 'PDF',
  href = 'https://example.test/book',
} = {}) => {
  const cells = [
    '1', author, title, publisher, year, 'language', 'pages', size, format,
    href ? `<a href="${href}">GET</a>` : 'No mirror',
  ];
  return `<tr>${cells.map((cell) => `<td>${cell}</td>`).join('')}</tr>`;
};

describe('parseLibgenHtml', () => {
  it('returns an empty list for empty input and markup without rows', () => {
    expect(parseLibgenHtml('')).toEqual([]);
    expect(parseLibgenHtml('<table><tbody></tbody></table>')).toEqual([]);
  });

  it('skips the header row and maps valid result rows to book records', () => {
    const html = `<table><tr><th>header</th></tr>${makeRow({
      author: '<b>Jane Author</b>',
      title: '<i>A Useful Book</i>',
      publisher: 'Example Press',
      year: '2024',
      size: '2 MB',
      format: 'PDF',
      href: 'https://example.test/book?id=1',
    })}</table>`;

    expect(parseLibgenHtml(html)).toEqual([{
      id: 'libgen-1',
      title: 'A Useful Book',
      author: 'Jane Author',
      publisher: 'Example Press',
      year: '2024',
      format: 'PDF',
      size: '2 MB',
      mirrorLink: 'https://example.test/book?id=1',
      source: 'libgen',
    }]);
  });

  it('ignores rows with fewer than ten cells', () => {
    expect(parseLibgenHtml('<table><tr><th>header</th></tr><tr><td>only one cell</td></tr></table>')).toEqual([]);
  });

  it('does not return rows missing a title, author, or mirror link', () => {
    const html = `<table><tr><th>header</th></tr>
      ${makeRow({ title: '' })}
      ${makeRow({ author: '' })}
      ${makeRow({ href: '' })}
    </table>`;

    expect(parseLibgenHtml(html)).toEqual([]);
  });

  it('assigns IDs using the source row index when earlier rows are skipped', () => {
    const html = `<table><tr><th>header</th></tr>
      <tr><td>too short</td></tr>
      ${makeRow({ title: 'Second result' })}
    </table>`;

    expect(parseLibgenHtml(html)).toHaveLength(1);
    expect(parseLibgenHtml(html)[0]).toMatchObject({
      id: 'libgen-2',
      title: 'Second result',
    });
  });

  it('supports single-quoted and double-quoted mirror href attributes', () => {
    const html = `<table><tr><th>header</th></tr>
      ${makeRow({ title: 'Single quoted' }).replace('href="https://example.test/book"', "href='https://example.test/single'")}
      ${makeRow({ title: 'Double quoted', href: 'https://example.test/double' })}
    </table>`;

    expect(parseLibgenHtml(html).map((book) => book.mirrorLink)).toEqual([
      'https://example.test/single',
      'https://example.test/double',
    ]);
  });
});
