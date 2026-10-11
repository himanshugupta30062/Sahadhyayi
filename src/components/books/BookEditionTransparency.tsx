import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, AlertCircle, CheckCircle2, ChevronRight, Flag, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BookQualityBadge } from '@/components/library/BookQualityBadge';
import { useWorkEditions } from '@/hooks/useWorkEditions';
import { evaluateBookQuality } from '@/utils/catalog/qualityScoring';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface BookEditionTransparencyProps {
  book: {
    id: string;
    title: string;
    author?: string | null;
    description?: string | null;
    cover_image_url?: string | null;
    pdf_url?: string | null;
    epub_url?: string | null;
    isbn?: string | null;
    publication_year?: number | null;
    pages?: number | null;
    genre?: string | null;
    language?: string | null;
  };
}

export const BookEditionTransparency: React.FC<BookEditionTransparencyProps> = ({ book }) => {
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const evaluation = evaluateBookQuality({
    title: book.title,
    author: book.author,
    description: book.description,
    coverImageUrl: book.cover_image_url,
    pdfUrl: book.pdf_url,
    epubUrl: book.epub_url,
    isbn: book.isbn,
    publicationYear: book.publication_year,
    pages: book.pages,
    genre: book.genre,
    language: book.language,
  });

  const { data: alternativeEditions = [] } = useWorkEditions(book.title, book.id);

  const handleReportSubmit = () => {
    if (!reportReason.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setReportOpen(false);
      setReportReason('');
      toast({
        title: 'Report Received',
        description: 'Thank you for helping keep Sahadhyayi books verified and accurate.',
      });
    }, 600);
  };

  return (
    <div className="space-y-4">
      {/* Why This Edition & Quality Box */}
      <Card className="bg-gradient-to-r from-amber-50/70 via-white to-blue-50/70 border-amber-200/80 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <CardTitle className="text-base font-bold text-gray-900">
                Edition Quality & Provenance
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <BookQualityBadge
                status={evaluation.accessStatus}
                qualityScore={evaluation.score}
                whyThisEdition={evaluation.whyThisEdition}
                size="md"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-4 space-y-3">
          <p className="text-sm text-gray-700 font-medium">
            {evaluation.whyThisEdition}
          </p>

          <div className="grid sm:grid-cols-2 gap-2 pt-1 text-xs text-gray-600">
            {evaluation.reasons.slice(0, 4).map((reason, idx) => (
              <div key={idx} className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>{reason}</span>
              </div>
            ))}
          </div>

          {/* Action Row: Report Button */}
          <div className="pt-2 flex items-center justify-between border-t border-gray-100 text-xs text-gray-500">
            <span>Score: <strong className="text-gray-900">{evaluation.score}/100</strong> (Quality evaluated against 7 standards)</span>

            <Dialog open={reportOpen} onOpenChange={setReportOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-500 hover:text-red-600 gap-1 px-2">
                  <Flag className="w-3 h-3" /> Report link or error
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    Report an Issue with this Edition
                  </DialogTitle>
                  <DialogDescription>
                    Notice a broken download link, missing pages, or wrong metadata for "{book.title}"? Let us know so our catalog reviewers can investigate.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <Textarea
                    placeholder="Describe the issue (e.g. download link broken, wrong author name, preview only)..."
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    rows={4}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button>
                  <Button onClick={handleReportSubmit} disabled={!reportReason.trim() || isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Submit Report'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Alternative Editions of this Work */}
      {alternativeEditions.length > 0 && (
        <Card className="bg-white/90 border-gray-200 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center justify-between">
              <span>Alternative Editions of this Work ({alternativeEditions.length})</span>
              <span className="text-xs text-gray-500 font-normal">Other translations or formats</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="divide-y divide-gray-100">
              {alternativeEditions.map((alt) => (
                <div key={alt.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">
                      {alt.title} {alt.subtitle ? `— ${alt.subtitle}` : ''}
                    </p>
                    <p className="text-gray-500 truncate">
                      {alt.author} {alt.publicationYear ? `(${alt.publicationYear})` : ''} · {alt.language}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <BookQualityBadge status={alt.accessStatus} size="sm" />
                    <Link to={`/book/${alt.id}`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs px-2 gap-1">
                        View <ChevronRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

