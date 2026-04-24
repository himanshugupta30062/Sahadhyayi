import React from 'react';
import DOMPurify from 'dompurify';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

/** Minimal markdown-to-HTML converter for article preview */
function markdownToHtml(md: string): string {
  // Track heading id collisions so anchors stay unique
  const seen = new Map<string, number>();
  const makeId = (raw: string): string => {
    const base = slugify(raw);
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  };

  let html = md
    // Code blocks (must be before inline code)
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    // Headings — emit IDs so the TOC can link to them
    .replace(/^### (.+)$/gm, (_m, t) => `<h3 id="${makeId(t)}">${t}</h3>`)
    .replace(/^## (.+)$/gm, (_m, t) => `<h2 id="${makeId(t)}">${t}</h2>`)
    .replace(/^# (.+)$/gm, (_m, t) => `<h1 id="${makeId(t)}">${t}</h1>`)
    // Horizontal rule
    .replace(/^---$/gm, '<hr />')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Bold & italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-lg max-w-full my-6" loading="lazy" />')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[hsl(var(--brand-primary))] underline">$1</a>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Paragraphs (double newlines)
    .replace(/\n\n/g, '</p><p>')
    // Single newlines to <br>
    .replace(/\n/g, '<br />');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*?<\/li>(?:<br \/>)?)+/g, (match) => {
    return '<ul class="list-disc pl-6 space-y-1 my-4">' + match.replace(/<br \/>/g, '') + '</ul>';
  });

  return '<p>' + html + '</p>';
}

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

const MarkdownPreview = ({ content, className = '' }: MarkdownPreviewProps) => {
  const html = DOMPurify.sanitize(markdownToHtml(content), {
    ADD_ATTR: ['id', 'target', 'rel', 'loading'],
  });

  return (
    <div
      className={`article-prose prose prose-lg max-w-none
        prose-headings:font-serif prose-headings:text-foreground prose-headings:tracking-tight
        prose-h1:text-4xl prose-h1:mt-12 prose-h1:mb-4
        prose-h2:text-3xl prose-h2:mt-10 prose-h2:mb-3
        prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-2
        prose-p:text-foreground/90 prose-p:leading-[1.8] prose-p:text-[1.125rem]
        prose-strong:text-foreground prose-strong:font-semibold
        prose-a:text-[hsl(var(--brand-primary))] prose-a:no-underline hover:prose-a:underline
        prose-blockquote:border-l-4 prose-blockquote:border-l-[hsl(var(--brand-primary))]
        prose-blockquote:bg-muted/30 prose-blockquote:not-italic prose-blockquote:font-serif
        prose-blockquote:text-lg prose-blockquote:text-foreground/80
        prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r
        prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
        prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border prose-pre:rounded-lg
        prose-img:rounded-xl prose-img:shadow-sm
        prose-hr:border-border ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default MarkdownPreview;
