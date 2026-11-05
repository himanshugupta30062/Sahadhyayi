import React, { useEffect, useState, useMemo } from 'react';
import { List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { slugify } from '@/utils/slugify';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface Props {
  /** Markdown content to parse for headings */
  content: string;
  className?: string;
}

const TableOfContents: React.FC<Props> = ({ content, className }) => {
  const [activeId, setActiveId] = useState<string>('');

  const headings: Heading[] = useMemo(() => {
    const lines = content.split('\n');
    const out: Heading[] = [];
    const seen = new Map<string, number>();
    for (const line of lines) {
      const trimmed = line.trim();
      let level = 0;
      while (level < 3 && trimmed[level] === '#') {
        level++;
      }
      if (level > 0 && trimmed[level] === ' ') {
        const text = trimmed.slice(level).trim();
        if (text) {
          let id = slugify(text).slice(0, 80);
          const count = seen.get(id) || 0;
          if (count > 0) id = `${id}-${count}`;
          seen.set(id, count + 1);
          out.push({ id, text, level });
        }
      }
    }
    return out;
  }, [content]);

  // Track which heading is currently in view
  useEffect(() => {
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top);
        if (visible[0]) setActiveId((visible[0].target as HTMLElement).id);
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav className={cn('text-sm', className)} aria-label="Table of contents">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">
        <List className="w-3.5 h-3.5" />
        On this page
      </div>
      <ul className="space-y-1.5 border-l border-border">
        {headings.map((h) => (
          <li
            key={h.id}
            style={{ paddingLeft: `${(h.level - 1) * 12 + 12}px` }}
          >
            <a
              href={`#${h.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(h.id);
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  history.replaceState(null, '', `#${h.id}`);
                }
              }}
              className={cn(
                '-ml-px block border-l-2 pl-3 py-0.5 transition-colors leading-snug',
                activeId === h.id
                  ? 'border-[hsl(var(--brand-primary))] text-[hsl(var(--brand-primary))] font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default TableOfContents;
