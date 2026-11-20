import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';
import { BookQualityBadge } from './BookQualityBadge';
import { TooltipProvider } from '@/components/ui/tooltip';

const renderBadge = (props: React.ComponentProps<typeof BookQualityBadge>) => {
  return render(
    <TooltipProvider>
      <BookQualityBadge {...props} />
    </TooltipProvider>
  );
};

describe('BookQualityBadge', () => {
  it('renders public domain status correctly', () => {
    renderBadge({ status: 'public_domain', qualityScore: 92 });
    expect(screen.getByText('Public Domain')).toBeInTheDocument();
    expect(screen.getByText('92')).toBeInTheDocument();
  });

  it('renders carefully edited status with explanation', () => {
    renderBadge({
      status: 'carefully_edited',
      whyThisEdition: 'Includes restored original illustrations and footnotes.',
    });
    expect(screen.getByText('Carefully Edited')).toBeInTheDocument();
  });

  it('renders open textbook, scholarly OA, and verified full text statuses', () => {
    const { rerender } = renderBadge({ status: 'open_textbook' });
    expect(screen.getByText('Open Textbook')).toBeInTheDocument();

    rerender(
      <TooltipProvider>
        <BookQualityBadge status="scholarly_oa" />
      </TooltipProvider>
    );
    expect(screen.getByText('Scholarly OA')).toBeInTheDocument();

    rerender(
      <TooltipProvider>
        <BookQualityBadge status="verified_full_text" />
      </TooltipProvider>
    );
    expect(screen.getByText('Verified Full Text')).toBeInTheDocument();
  });

  it('renders preview only and metadata only statuses', () => {
    const { rerender } = renderBadge({ status: 'preview_only' });
    expect(screen.getByText('Preview Only')).toBeInTheDocument();

    rerender(
      <TooltipProvider>
        <BookQualityBadge status="metadata_only" />
      </TooltipProvider>
    );
    expect(screen.getByText('Metadata Only')).toBeInTheDocument();
  });

  it('falls back to default open access status when status is undefined', () => {
    renderBadge({});
    expect(screen.getByText('Open Access')).toBeInTheDocument();
  });
});
