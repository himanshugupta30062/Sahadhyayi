const PLACEHOLDER_DESCRIPTION = /^(?:no description(?: available)?|description unavailable|coming soon|n\/?a|unknown|test book)$/i;

function isValidIsbn(value) {
  const isbn = String(value ?? "").replace(/[\s-]/g, "").toUpperCase();
  if (/^\d{9}[\dX]$/.test(isbn)) {
    const sum = [...isbn].reduce((total, char, index) => total + (char === "X" ? 10 : Number(char)) * (10 - index), 0);
    return sum % 11 === 0;
  }
  if (/^\d{13}$/.test(isbn)) {
    const sum = [...isbn].reduce((total, char, index) => total + Number(char) * (index % 2 ? 3 : 1), 0);
    return sum % 10 === 0;
  }
  return false;
}

function normalized(value) {
  return String(value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Audit catalogue fields used by book landing pages. This is read-only: it
 * reports data quality issues and never edits catalogue records.
 */
export function auditBookSeoQuality(books = [], authors = [], currentYear = new Date().getFullYear()) {
  const authorsById = new Map(authors.filter((author) => author?.id).map((author) => [String(author.id), author]));
  const authorsByName = new Map(authors.filter((author) => normalized(author?.name)).map((author) => [normalized(author.name).toLowerCase(), author]));
  return books.map((book) => {
    const issues = [];
    const title = normalized(book?.title);
    const description = normalized(book?.description);
    const authorName = normalized(book?.author);
    const linkedAuthor = (book?.author_id && authorsById.get(String(book.author_id))) || authorsByName.get(authorName.toLowerCase());
    const cover = String(book?.cover_image_url ?? "").trim();
    const isbn = String(book?.isbn ?? "").trim();
    const year = Number(book?.publication_year);
    const pages = Number(book?.pages);
    const add = (code, severity, detail) => issues.push({ code, severity, detail });

    if (!title) add("missing_title", "critical", "Book title is missing.");
    if (!description) add("missing_description", "high", "Book description is missing.");
    else if (description.length < 45 || PLACEHOLDER_DESCRIPTION.test(description) || description.toLowerCase() === title.toLowerCase()) {
      add("weak_description", "high", "Description is too short or appears to be a placeholder.");
    }
    if (!cover) add("missing_cover", "high", "Cover image is missing.");
    else if (!/^https:\/\//i.test(cover)) add("invalid_cover_url", "medium", "Cover URL is not an HTTPS URL.");
    if (!authorName && !book?.author_id) add("missing_author", "high", "Author name and author link are both missing.");
    else if (!linkedAuthor) add("unlinked_author", "medium", "Author text exists but does not match an author profile.");
    if (!isbn) add("missing_isbn", "medium", "ISBN is not recorded.");
    else if (!isValidIsbn(isbn)) add("invalid_isbn", "medium", "ISBN does not pass ISBN-10 or ISBN-13 checksum validation.");
    if (!normalized(book?.genre)) add("missing_genre", "low", "Genre is not recorded.");
    if (!normalized(book?.language)) add("missing_language", "low", "Language is not recorded.");
    if (book?.publication_year != null && book.publication_year !== "" && (!Number.isInteger(year) || year < 1400 || year > currentYear + 1)) {
      add("invalid_publication_year", "low", "Publication year is outside the supported range.");
    }
    if (book?.pages != null && book.pages !== "" && (!Number.isInteger(pages) || pages <= 0)) {
      add("invalid_page_count", "low", "Page count must be a positive integer.");
    }

    // Only propose reversible whitespace cleanup. Missing or uncertain facts
    // remain manual research tasks and are never auto-filled.
    const suggestedChanges = [];
    for (const field of ["title", "author", "genre", "language", "isbn"]) {
      const original = book?.[field];
      if (typeof original === "string" && original !== original.trim() && original.trim()) {
        suggestedChanges.push({
          field,
          currentValue: original,
          proposedValue: original.trim(),
          reason: "Remove leading/trailing whitespace only; confirm before applying.",
          requiresHumanApproval: true,
        });
      }
    }
    const reviewActions = issues.map((issue) => ({
      issueCode: issue.code,
      action: issue.code === "missing_cover" || issue.code === "invalid_cover_url"
        ? "Find and verify the correct edition cover from a trusted source."
        : issue.code === "missing_description" || issue.code === "weak_description"
          ? "Add a factual description from a publisher, author, library catalogue, or book source."
          : issue.code === "missing_author" || issue.code === "unlinked_author"
            ? "Verify the author identity and link the correct author profile."
            : issue.code === "missing_isbn" || issue.code === "invalid_isbn"
              ? "Check the ISBN against a trusted bibliographic source; do not guess."
              : "Verify this field against a reliable bibliographic source.",
      status: "pending_review",
    }));

    const weights = { critical: 30, high: 15, medium: 8, low: 3 };
    const score = Math.max(0, 100 - issues.reduce((total, issue) => total + weights[issue.severity], 0));
    return {
      id: String(book?.id ?? ""),
      title: title || "(untitled book)",
      route: book?.id ? `/book/${encodeURIComponent(String(book.id))}` : null,
      score,
      grade: score >= 90 ? "A" : score >= 80 ? "B" : score >= 65 ? "C" : score >= 45 ? "D" : "F",
      issueCount: issues.length,
      issues,
      suggestedChanges,
      reviewActions,
      reviewStatus: issues.length || suggestedChanges.length ? "pending_review" : "no_action_needed",
      updatedAt: book?.updated_at ?? null,
    };
  }).sort((a, b) => a.score - b.score || a.title.localeCompare(b.title));
}

export function summarizeBookSeoAudit(records = []) {
  const summary = {
    total: records.length,
    averageScore: records.length ? Math.round(records.reduce((sum, record) => sum + record.score, 0) / records.length) : 0,
    grades: { A: 0, B: 0, C: 0, D: 0, F: 0 },
    issueCounts: {},
    needsAttention: records.filter((record) => record.issueCount > 0).length,
  };
  for (const record of records) {
    summary.grades[record.grade] = (summary.grades[record.grade] || 0) + 1;
    for (const issue of record.issues) summary.issueCounts[issue.code] = (summary.issueCounts[issue.code] || 0) + 1;
  }
  return summary;
}
