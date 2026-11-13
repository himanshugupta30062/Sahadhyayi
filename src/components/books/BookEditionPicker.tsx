import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LazyImage } from '@/components/ui/LazyImage';
import { BookQualityBadge } from '@/components/library/BookQualityBadge';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Copy,
  ExternalLink,
  Globe,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';
import { formatIsbn } from '@/utils/catalog/bookSeriesAndEditions';
import { useBookEditions } from '@/hooks/useBookEditions';
import { toast } from '@/hooks/use-toast';

interface BookEditionPickerProps {
  book: {
    id: string;
    title: string;
    author?: string | null;
    isbn?: string | null;
    publication_year?: number | null;
    pages?: number | null;
    language?: string | null;
    publisher?: string | null;
    cover_image_url?: string | null;
    pdf_url?: string | null;
    epub_url?: string | null;
    genre?: string | null;
    description?: string | null;
  };
  triggerClassName?: string;
  triggerVariant?: 'default' | 'outline' | 'ghost' | 'secondary';
  triggerSize?: 'default' | 'sm' | 'lg';
}

export const BookEditionPicker: React.FC<BookEditionPickerProps> = ({
  book,
  triggerClassName = '',
  triggerVariant = 'outline',
  triggerSize = 'sm',
}) => {
  const [open, setOpen] = useState(false);
  const result = useBookEditions(book);

  if (!result) return null;

  const {
    currentEdition,
    alternativeEditions,
    allEditions,
    totalEditionsCount,
    readingContext,
  } = result;

  const handleCopyIsbn = (isbn?: string) => {
    if (!isbn) return;
    navigator.clipboard.writeText(isbn);
    toast({
      title: 'ISBN Copied',
      description: `${isbn} copied to clipboard`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          size={triggerSize}
          className={`gap-1.5 ${triggerClassName}`}
          aria-label={`View all ${totalEditionsCount} editions of ${book.title}`}
        >
          <Layers className="w-4 h-4 text-blue-600" />
          <span>
            {totalEditionsCount > 1
              ? `All Editions (${totalEditionsCount})`
              : 'Edition Details'}
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>Editions of {currentEdition.title}</span>
          </DialogTitle>
          <DialogDescription>
            Explore different formats, publications, and translations of this canonical work. Sahadhyayi preserves your reading history per edition.
          </DialogDescription>
        </DialogHeader>

        {/* Shelf Preservation Notice */}
        {readingContext.hasOtherShelvedEdition && readingContext.noticeMessage && (
          <Alert className="border-amber-200 bg-amber-50 text-amber-900">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <h5 className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                Reading History Preserved
              </h5>
              <AlertDescription className="text-xs text-amber-700 mt-0.5">
                {readingContext.noticeMessage}
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="space-y-6 pt-2">
          {/* Current Selected Edition Card */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Currently Viewing
              </span>
              <Badge className="bg-blue-600 text-white text-[11px] gap-1">
                <CheckCircle2 className="w-3 h-3" /> Active Edition
              </Badge>
            </div>

            <Card className="border-blue-200 bg-blue-50/40 shadow-xs">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-20 sm:w-24 aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden shrink-0 shadow-sm border border-gray-200">
                    {currentEdition.coverImageUrl ? (
                      <LazyImage
                        src={currentEdition.coverImageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <BookOpen className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div>
                      <h4 className="text-base font-bold text-gray-900 leading-snug">
                        {currentEdition.title}
                        {currentEdition.subtitle ? ` — ${currentEdition.subtitle}` : ''}
                      </h4>
                      <p className="text-xs text-gray-600">
                        by {currentEdition.author}
                      </p>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                      <div>
                        <span className="text-gray-500 block">Format</span>
                        <span className="font-semibold text-gray-900">
                          {currentEdition.format || (currentEdition.assets.length > 0 ? 'Digital eBook' : 'Print')}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-500 block">Publisher</span>
                        <span className="font-semibold text-gray-900 truncate block">
                          {currentEdition.publisher || 'Not specified'}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-500 block">Published</span>
                        <span className="font-semibold text-gray-900">
                          {currentEdition.publicationYear || 'Unknown'}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-500 block">Language</span>
                        <span className="font-semibold text-gray-900">
                          {currentEdition.language || 'English'}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-500 block">Pages</span>
                        <span className="font-semibold text-gray-900">
                          {currentEdition.pages ? `${currentEdition.pages} pages` : 'Unknown'}
                        </span>
                      </div>

                      <div>
                        <span className="text-gray-500 block">ISBN</span>
                        {currentEdition.isbn13 ? (
                          <button
                            type="button"
                            onClick={() => handleCopyIsbn(currentEdition.isbn13)}
                            className="font-mono text-xs text-blue-600 hover:underline flex items-center gap-1"
                            title="Click to copy ISBN-13"
                          >
                            <span>{formatIsbn(currentEdition.isbn13)}</span>
                            <Copy className="w-2.5 h-2.5 opacity-70" />
                          </button>
                        ) : currentEdition.isbn10 ? (
                          <button
                            type="button"
                            onClick={() => handleCopyIsbn(currentEdition.isbn10)}
                            className="font-mono text-xs text-blue-600 hover:underline flex items-center gap-1"
                            title="Click to copy ISBN-10"
                          >
                            <span>{formatIsbn(currentEdition.isbn10)}</span>
                            <Copy className="w-2.5 h-2.5 opacity-70" />
                          </button>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-blue-100">
                      <BookQualityBadge
                        status={currentEdition.accessStatus}
                        qualityScore={currentEdition.qualityScore}
                        size="sm"
                      />
                      <span className="text-[11px] text-gray-500">
                        Canonical Work ID: <span className="font-mono">{currentEdition.workId.slice(0, 16)}...</span>
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alternative Editions List */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">
              Other Editions of this Work ({alternativeEditions.length})
            </span>

            {alternativeEditions.length === 0 ? (
              <div className="p-4 rounded-lg border border-dashed border-gray-200 text-center text-xs text-gray-500">
                This is currently the only recorded edition of this work in our library.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg bg-white overflow-hidden">
                {alternativeEditions.map((alt) => (
                  <div
                    key={alt.id}
                    className="p-3.5 sm:p-4 flex items-center justify-between gap-4 hover:bg-gray-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-16 bg-gray-100 rounded overflow-hidden shrink-0 border border-gray-200">
                        {alt.coverImageUrl ? (
                          <LazyImage
                            src={alt.coverImageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <BookOpen className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {alt.title}
                          {alt.subtitle ? ` — ${alt.subtitle}` : ''}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {alt.publicationYear ? `${alt.publicationYear} · ` : ''}
                          {alt.language}
                          {alt.pages ? ` · ${alt.pages} pages` : ''}
                          {alt.isbn13 ? ` · ISBN: ${formatIsbn(alt.isbn13)}` : ''}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                            {alt.format || 'Digital Edition'}
                          </Badge>
                          <BookQualityBadge status={alt.accessStatus} size="sm" />
                        </div>
                      </div>
                    </div>

                    <Link to={`/book/${alt.id}`} onClick={() => setOpen(false)}>
                      <Button variant="outline" size="sm" className="gap-1 shrink-0 text-xs">
                        <span>Switch</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
