#!/usr/bin/env node

/**
 * Sahadhyayi Ebook Link Auditor
 *
 * Scans public library books with a `pdf_url` in `public.books_library`:
 * - Validates HTTP response headers and status
 * - Verifies %PDF- magic signature (first 1024 bytes)
 * - Detects HTML landing pages masquerading as PDF links
 * - Checks CORS and proxy accessibility
 * - Outputs structured audit report: scripts/ebook-links-audit-report.json
 */

import { writeFileSync } from 'node:fs';
import path from 'node:path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://rknxtatvlzunatpyqxro.supabase.co';
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbnh0YXR2bHp1bmF0cHlxeHJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzI0MjUsImV4cCI6MjA2NTUwODQyNX0.NXIWEwm8NlvzHnxf55cgdsy1ljX2IbFKQL7OS8xlb-U';

const ALLOWED_PROXY_SUFFIXES = [
  'gutenberg.org',
  'archive.org',
  'wikisource.org',
  'wikimedia.org',
  'standardebooks.org',
  'openlibrary.org',
  'loc.gov',
  'sahadhyayi.com',
  'supabase.co',
  'oapen.org',
  'google.com',
  'googleusercontent.com',
  'ncert.nic.in',
  'gitapress.org',
  'umn.edu',
  'edu',
];

function cleanLog(value, maxLength = 240) {
  if (value === null || value === undefined) return '';
  // Remove CRLF and control characters to prevent forged or flooded logs.
  return String(value)
    .replace(/[\r\n]/g, '')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

// Keep terminal output single-line and bounded to prevent log injection / log flooding.
function isProxyable(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_PROXY_SUFFIXES.some((s) => host === s || host.endsWith('.' + s));
  } catch {
    return false;
  }
}

async function fetchLibraryBooks() {
  const safeSupabaseUrl = String(SUPABASE_URL).replace(/[\r\n]/g, '').slice(0, 300);
  console.log(`[audit] Fetching library books with pdf_url from ${safeSupabaseUrl}...`);
  const endpoint = `${SUPABASE_URL}/rest/v1/books_library?pdf_url=not.is.null&select=id,title,author,pdf_url,publication_year&limit=100`;
  const res = await fetch(endpoint, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to query books_library: ${res.status} ${res.statusText}`);
  }

  const books = await res.json();
  const count = Array.isArray(books) ? books.length : 0;
  const safeCount = String(count).replace(/[\r\n]/g, '');
  console.log(`[audit] Found ${safeCount} library books to audit.`);
  return books;
}

async function verifyPdfUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Range: 'bytes=0-1023',
        'User-Agent': 'Mozilla/5.0 (compatible; SahadhyayiAudit/1.0)',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const status = res.status;

    if (!res.ok && status !== 206) {
      return {
        status: 'UNREACHABLE',
        httpStatus: status,
        error: `HTTP ${status}`,
      };
    }

    const buffer = await res.arrayBuffer();
    const textHeader = new TextDecoder('utf-8', { fatal: false }).decode(buffer.slice(0, 100));

    if (textHeader.includes('<!DOCTYPE') || textHeader.includes('<html') || contentType.includes('text/html')) {
      return {
        status: 'HTML_LANDING_PAGE',
        httpStatus: status,
        contentType,
        error: 'URL returns HTML landing page instead of PDF bytes',
      };
    }

    if (textHeader.startsWith('%PDF-')) {
      return {
        status: 'VALID_PDF',
        httpStatus: status,
        contentType,
        signature: textHeader.slice(0, 8).trim(),
        canProxy: isProxyable(url),
      };
    }

    return {
      status: 'INVALID_SIGNATURE',
      httpStatus: status,
      contentType,
      signature: textHeader.slice(0, 15),
      error: 'Does not start with %PDF- magic signature',
    };
  } catch (err) {
    clearTimeout(timeout);
    return {
      status: 'FETCH_ERROR',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function run() {
  try {
    const books = await fetchLibraryBooks();
    const auditResults = [];

    let validCount = 0;
    let htmlCount = 0;
    let brokenCount = 0;

    const safeTotal = String(books.length).replace(/[\r\n]/g, '');
    for (const [index, book] of books.entries()) {
      const sanitizedTitle = String(book?.title || 'Untitled').replace(/[\r\n]/g, '').slice(0, 30);
      const safeIndex = String(index + 1).replace(/[\r\n]/g, '');
      process.stdout.write(`[${safeIndex}/${safeTotal}] Auditing "${sanitizedTitle}"... `);
      const result = await verifyPdfUrl(book.pdf_url);
      const auditEntry = {
        bookId: book.id,
        title: book.title,
        author: book.author,
        pdfUrl: book.pdf_url,
        ...result,
      };
      auditResults.push(auditEntry);

      if (result.status === 'VALID_PDF') {
        validCount++;
        const safeSignature = String(result.signature || 'ok').replace(/[\r\n]/g, '').slice(0, 30);
        console.log(`✅ VALID PDF (${safeSignature})`);
      } else if (result.status === 'HTML_LANDING_PAGE') {
        htmlCount++;
        console.log(`⚠️ HTML PAGE`);
      } else {
        brokenCount++;
        const safeStatus = String(result.status || '').replace(/[\r\n]/g, '').slice(0, 40);
        const safeError = String(result.error || '').replace(/[\r\n]/g, '').slice(0, 180);
        console.log(`❌ ${safeStatus} (${safeError})`);
      }
    }

    const summary = {
      totalAudited: books.length,
      validPdf: validCount,
      htmlLandingPages: htmlCount,
      brokenOrUnreachable: brokenCount,
      timestamp: new Date().toISOString(),
    };

    const outPath = path.resolve('scripts/ebook-links-audit-report.json');
    writeFileSync(outPath, JSON.stringify({ summary, results: auditResults }, null, 2), 'utf8');

    const safeTotalAudited = String(summary.totalAudited).replace(/[\r\n]/g, '');
    const safeValidPdf = String(summary.validPdf).replace(/[\r\n]/g, '');
    const safeHtml = String(summary.htmlLandingPages).replace(/[\r\n]/g, '');
    const safeBroken = String(summary.brokenOrUnreachable).replace(/[\r\n]/g, '');
    const safePath = String(outPath).replace(/[\r\n]/g, '');

    console.log('\n--- Audit Summary ---');
    console.log(`Total Audited:         ${safeTotalAudited}`);
    console.log(`Valid PDFs:            ${safeValidPdf}`);
    console.log(`HTML Landing Pages:    ${safeHtml}`);
    console.log(`Broken / Unreachable:  ${safeBroken}`);
    console.log(`Report written to:     ${safePath}`);
  } catch (err) {
    const errorMsg = String(err instanceof Error ? err.message : err).replace(/[\r\n]/g, '').slice(0, 240);
    console.error('[audit] Error during link audit:', errorMsg);
    process.exit(1);
  }
}

run().catch((err) => {
  const fatalMsg = String(err instanceof Error ? err.message : err).replace(/[\r\n]/g, '').slice(0, 240);
  console.error('[audit] Fatal error during link audit:', fatalMsg);
  process.exit(1);
});
