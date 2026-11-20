import React from 'react';
import { Star, Quote as QuoteIcon, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';
import {
  CreatorPostState,
  SlideData,
  ASPECT_RATIO_CONFIG,
  TEMPLATE_DEFINITIONS,
} from '@/types/creatorStudio';

interface StudioCanvasProps {
  state: CreatorPostState;
  activeSlide: SlideData;
  canvasRef?: React.RefObject<HTMLDivElement>;
}

export const StudioCanvas: React.FC<StudioCanvasProps> = ({
  state,
  activeSlide,
  canvasRef,
}) => {
  const template = TEMPLATE_DEFINITIONS[state.templateId] || TEMPLATE_DEFINITIONS.minimalist_editorial;
  const aspectConfig = ASPECT_RATIO_CONFIG[state.aspectRatio] || ASPECT_RATIO_CONFIG.portrait;

  const totalSlides = state.slides.length;
  const currentSlideIndex = state.activeSlideIndex;

  return (
    <div className="relative w-full flex items-center justify-center p-2 sm:p-4">
      {/* Outer constraint box so the canvas scales gracefully on mobile & desktop */}
      <div
        className="w-full max-w-[420px] sm:max-w-[460px] shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 ring-1 ring-black/5"
      >
        <div
          ref={canvasRef}
          data-testid="studio-canvas"
          className={`relative w-full ${aspectConfig.displayAspect} ${template.containerClass} flex flex-col justify-between p-6 sm:p-8 select-none overflow-hidden transition-colors duration-300`}
        >
          {/* Subtle Aesthetic Background Overlays */}
          {state.templateId === 'dark_academia' && (
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          )}
          {state.templateId === 'indian_heritage' && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full pointer-events-none" />
          )}
          {state.templateId === 'pastel_aesthetic' && (
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-pink-300/20 rounded-full blur-2xl pointer-events-none" />
          )}

          {/* Canvas Top Bar: Brand Watermark & Slide Counter */}
          <div className="relative z-10 flex items-center justify-between text-xs font-medium opacity-90 border-b pb-3 mb-2 border-current/10">
            <div className="flex items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${template.badgeClass}`}>
                {template.badge}
              </span>
              {state.brandWatermarkEnabled && state.brandWatermarkText && (
                <span className="opacity-80 tracking-wide font-sans text-[11px] truncate max-w-[140px]">
                  {state.brandWatermarkText}
                </span>
              )}
            </div>

            {totalSlides > 1 && (
              <span className="text-[10px] font-semibold tracking-wider opacity-70 px-2 py-0.5 rounded bg-black/5 dark:bg-white/10">
                {currentSlideIndex + 1} / {totalSlides}
              </span>
            )}
          </div>

          {/* Canvas Middle: Dynamic Card Layouts based on postType */}
          <div className="relative z-10 flex-1 flex flex-col justify-center my-auto py-2">
            {state.postType === 'review' && (
              <div className="flex flex-col items-center text-center gap-3">
                {/* Book Cover / Poster */}
                <div className="relative group mx-auto mb-1">
                  {activeSlide.coverImageUrl ? (
                    <img
                      src={activeSlide.coverImageUrl}
                      alt={activeSlide.bookTitle || 'Book cover'}
                      className="w-24 h-36 sm:w-28 sm:h-40 object-cover rounded-md shadow-lg ring-1 ring-black/10 transform transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-24 h-36 sm:w-28 sm:h-40 bg-black/10 dark:bg-white/10 rounded-md shadow flex flex-col items-center justify-center p-2 text-center">
                      <BookOpen className="w-8 h-8 opacity-40 mb-1" />
                      <span className="text-[10px] font-semibold line-clamp-2 opacity-60">
                        {activeSlide.bookTitle || 'Select a Book'}
                      </span>
                    </div>
                  )}
                  {activeSlide.rating > 0 && (
                    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-black/80 dark:bg-zinc-900/90 text-amber-400 px-2 py-0.5 rounded-full shadow text-[10px] whitespace-nowrap">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-2.5 h-2.5 ${
                            i < activeSlide.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-500'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Book Title & Author */}
                <div className="mt-2 space-y-0.5 max-w-xs">
                  <h3 className={`text-base sm:text-lg font-bold line-clamp-2 ${template.fontDisplayClass}`}>
                    {activeSlide.bookTitle || 'Book Title'}
                  </h3>
                  <p className={`text-xs opacity-75 font-medium ${template.fontBodyClass}`}>
                    {activeSlide.author ? `by ${activeSlide.author}` : 'Author Name'}
                  </p>
                </div>

                {/* Hook Line */}
                {activeSlide.hookLine && (
                  <p className={`text-xs sm:text-sm font-semibold italic mt-1 px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 max-w-sm ${template.fontBodyClass}`}>
                    &ldquo;{activeSlide.hookLine}&rdquo;
                  </p>
                )}

                {/* Review Body */}
                {activeSlide.reviewBody && (
                  <p className={`text-[11px] sm:text-xs opacity-90 line-clamp-4 leading-relaxed max-w-sm px-2 ${template.fontBodyClass}`}>
                    {activeSlide.reviewBody}
                  </p>
                )}

                {/* Tropes / Tags */}
                {activeSlide.tags && activeSlide.tags.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    {activeSlide.tags.slice(0, 4).map((tag, idx) => (
                      <span
                        key={idx}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${template.tagClass}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {state.postType === 'quote' && (
              <div className="flex flex-col items-center justify-center text-center px-4 py-2 space-y-4">
                <QuoteIcon className="w-8 h-8 opacity-40 mx-auto text-current" />
                <blockquote className={`text-sm sm:text-base font-medium italic leading-relaxed ${template.fontDisplayClass}`}>
                  &ldquo;{activeSlide.quote || 'There is no friend as loyal as a book.'}&rdquo;
                </blockquote>
                <div className="space-y-0.5 pt-2 border-t border-current/10 w-32 mx-auto">
                  <p className={`text-xs font-bold ${template.fontBodyClass}`}>
                    {activeSlide.author || 'Ernest Hemingway'}
                  </p>
                  <p className="text-[10px] opacity-75 truncate">
                    {activeSlide.bookTitle ? `${activeSlide.bookTitle}` : 'Literary Quote'}
                    {activeSlide.quoteAttribution ? ` • ${activeSlide.quoteAttribution}` : ''}
                  </p>
                </div>
              </div>
            )}

            {state.postType === 'tbr' && (
              <div className="flex flex-col text-center space-y-3 px-2">
                <div className="space-y-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${template.badgeClass}`}>
                    Reading List
                  </span>
                  <h3 className={`text-base sm:text-lg font-bold ${template.fontDisplayClass}`}>
                    To Be Read / Current TBR
                  </h3>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="flex flex-col items-center p-2 rounded-lg bg-black/5 dark:bg-white/5 border border-current/5"
                    >
                      <div className="w-16 h-24 bg-black/10 dark:bg-white/10 rounded shadow flex items-center justify-center text-[10px] font-bold text-center p-1">
                        {item === 1 && activeSlide.bookTitle ? (
                          activeSlide.coverImageUrl ? (
                            <img src={activeSlide.coverImageUrl} alt="" className="w-full h-full object-cover rounded" />
                          ) : (
                            <span className="line-clamp-2">{activeSlide.bookTitle}</span>
                          )
                        ) : (
                          `Book #${item}`
                        )}
                      </div>
                      <span className="text-[9px] font-medium mt-1 truncate w-full text-center opacity-80">
                        {item === 1 && activeSlide.bookTitle ? activeSlide.bookTitle : `TBR Pick ${item}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {state.postType === 'wrapup' && (
              <div className="flex flex-col text-center space-y-3 px-2">
                <div className="flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className={`text-base sm:text-lg font-bold ${template.fontDisplayClass}`}>
                    Monthly Reading Wrap-Up
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-left">
                  <div className="p-2.5 rounded-lg bg-black/5 dark:bg-white/5 border border-current/5">
                    <span className="text-[10px] opacity-70 block">Books Read</span>
                    <span className="text-lg font-bold">4 Books</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/5 dark:bg-white/5 border border-current/5">
                    <span className="text-[10px] opacity-70 block">Pages Turned</span>
                    <span className="text-lg font-bold">1,420</span>
                  </div>
                </div>
                {activeSlide.bookTitle && (
                  <div className="p-2.5 rounded-lg bg-black/5 dark:bg-white/5 border border-current/5 flex items-center gap-2 text-left">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div className="truncate">
                      <span className="text-[9px] uppercase tracking-wider font-semibold opacity-60 block">Top Favorite</span>
                      <span className="text-xs font-bold truncate block">{activeSlide.bookTitle}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {state.postType === 'custom' && (
              <div className="flex flex-col items-center justify-center text-center space-y-3 px-3">
                <h3 className={`text-lg sm:text-xl font-bold ${template.fontDisplayClass}`}>
                  {activeSlide.customHeadline || 'Literary Thoughts'}
                </h3>
                {activeSlide.customSubtitle && (
                  <p className="text-xs font-semibold opacity-80">
                    {activeSlide.customSubtitle}
                  </p>
                )}
                <p className={`text-xs opacity-90 leading-relaxed max-w-sm ${template.fontBodyClass}`}>
                  {activeSlide.customBody || 'Add your custom notes, reading insights, or book discussion prompts here.'}
                </p>
              </div>
            )}
          </div>

          {/* Canvas Bottom Bar: Sahadhyayi Literary Footer */}
          <div className="relative z-10 flex items-center justify-between text-[10px] font-medium opacity-60 pt-3 border-t border-current/10">
            <span className="font-serif tracking-widest uppercase">Sahadhyayi</span>
            <span className="opacity-80">Book Creator Studio</span>
          </div>
        </div>
      </div>
    </div>
  );
};
