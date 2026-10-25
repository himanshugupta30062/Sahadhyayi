import { describe, expect, it } from "vitest";
import { parseLibgenHtml } from "../../server/libgenParser.js";

const makeRow = (cells: string[]) =>
  "<tr>" + cells.map((cell) => "<td>" + cell + "</td>").join("") + "</tr>";

describe("parseLibgenHtml", () => {
  it("returns no books for empty input", () => {
    expect(parseLibgenHtml("")).toEqual([]);
  });

  it("skips header rows and malformed rows", () => {
    const html = makeRow(Array(10).fill("header")) + makeRow(["a", "b"]);
    expect(parseLibgenHtml(html)).toEqual([]);
  });

  it("extracts a book record from a valid row", () => {
    const header = makeRow(Array(10).fill("header"));
    const book = makeRow([
      "id", "<b>Author Name</b>", "<b>Book Title</b>", "Publisher", "2020",
      "unused", "unused", "1 MB", "epub", '<a href="/download">link</a>',
    ]);
    expect(parseLibgenHtml(header + book)).toEqual([{
      id: "libgen-1",
      title: "Book Title",
      author: "Author Name",
      publisher: "Publisher",
      year: "2020",
      format: "epub",
      size: "1 MB",
      mirrorLink: "/download",
      source: "libgen",
    }]);
  });

  it("ignores rows missing required book fields", () => {
    const header = makeRow(Array(10).fill("header"));
    const noTitle = makeRow(["id", "Author", "", "Publisher", "2020", "", "", "1 MB", "pdf", '<a href="/download">link</a>']);
    const noAuthor = makeRow(["id", "", "Title", "Publisher", "2020", "", "", "1 MB", "pdf", '<a href="/download">link</a>']);
    const noLink = makeRow(["id", "Author", "Title", "Publisher", "2020", "", "", "1 MB", "pdf", "none"]);
    expect(parseLibgenHtml(header + noTitle + noAuthor + noLink)).toEqual([]);
  });
});
