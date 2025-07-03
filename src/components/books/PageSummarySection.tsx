
import React from 'react';
import EnhancedBookSummarySection from './EnhancedBookSummarySection';

interface PageSummarySectionProps {
  bookId: string;
  bookTitle: string;
}

const PageSummarySection = ({ bookId, bookTitle }: PageSummarySectionProps) => {
  return <EnhancedBookSummarySection bookId={bookId} bookTitle={bookTitle} />;
};

export default PageSummarySection;
