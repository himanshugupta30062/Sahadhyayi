import React from 'react';
import {
  Star,
  Quote as QuoteIcon,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Swords,
  Layers,
  Heart,
  TrendingUp,
  Bookmark,
} from 'lucide-react';
import {
  CreatorPostState,
  SlideData,
  ASPECT_RATIO_CONFIG,
  TEMPLATE_DEFINITIONS,
  BackgroundTexture,
  FontPairing,
} from '@/types/creatorStudio';

interface StudioCanvasProps {
  state: CreatorPostState;
  activeSlide: SlideData;
  canvasRef?: React.RefObject<HTMLDivElement>;
}

function getTextureOverlay(texture?: BackgroundTexture): React.ReactNode {
  switch (texture) {
    case 'parchment':
      return (
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#8C2D19_1px,transparent_1px)] [background-size:14px_14px] pointer-events-none" />
      );
    case 'dots':
      return (
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000000_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      );
    case 'linen':
      return (
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,#000000_25%,transparent_25%),linear-gradient(-45deg,#000000_25%,transparent_25%)] [background-size:20px_20px] pointer-events-none" />
      );
    case 'gradient':
      return (
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
      );
    default:
      return null;
  }
}

function getFontPairingClasses(pairing?: FontPairing) {
  switch (pairing) {
    case 'literary':
      return {
        display: 'font-serif tracking-normal leading-tight',
        body: 'font-serif',
      };
    case 'modern':
      return {
        display: 'font-sans font-bold tracking-tight',
        body: 'font-sans',
      };
    case 'heritage':
      return {
        display: 'font-serif font-black tracking-wide',
        body: 'font-sans',
      };
    case 'bold':
      return {
        display: 'font-sans font-black tracking-tighter uppercase',
        body: 'font-sans font-medium',
      };
    case 'editorial':
    default:
      return {
        display: 'font-serif tracking-tight font-bold',
        body: 'font-sans',
      };
  }
}

export const StudioCanvas: React.FC<StudioCanvasProps> = ({
  state,
  activeSlide,
  canvasRef,
}) => {
  const template = TEMPLATE_DEFINITIONS[state.templateId] || TEMPLATE_DEFINITIONS.minimalist_editorial;
  const aspectConfig = ASPECT_RATIO_CONFIG[state.aspectRatio] || ASPECT_RATIO_CONFIG.portrait;
  const fonts = getFontPairingClasses(state.fontPairing);

  const totalSlides = state.slides.length;
  const currentSlideIndex = state.activeSlideIndex;

  return (
    <div className="relative w-full flex items-center justify-center p-2 sm:p-4">
      {/* Outer constraint box so the canvas scales gracefully on mobile & desktop */}
      <div className="w-full max-w-[420px] sm:max-w-[460px] shadow-2xl rounded-2xl overflow-hidden transition-all duration-300 ring-1 ring-black/10">
        <div
          ref={canvasRef}
          data-testid="studio-canvas"
          className={`relative w-full ${aspectConfig.displayAspect} ${template.containerClass} flex flex-col justify-between p-6 sm:p-8 select-none overflow-hidden transition-colors duration-300`}
        >
          {/* Aesthetic Texture Overlays */}
          {getTextureOverlay(state.backgroundTexture)}

          {/* Template-specific subtle decorative touches */}
          {state.templateId === 'dark_academia' && (
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
          )}
          {state.templateId === 'indian_heritage' && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full pointer-events-none" />
          )}
          {state.templateId === 'pastel_aesthetic' && (
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-pink-300/20 rounded-full blur-2xl pointer-events-none" />
          )}

          {/* Top Bar: Brand Watermark & Slide Counter */}
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
            {/* 1. SINGLE BOOK REVIEW POST */}
            {state.postType === 'review' && (
              <div className="flex flex-col items-center text-center gap-3">
                {/* Book Cover / Poster */}
                <div className="relative group mx-auto mb-1">
                  {activeSlide.coverImageUrl ? (
                    <img
                      src={activeSlide.coverImageUrl}
                      alt={activeSlide.bookTitle || 'Book cover'}
                      crossOrigin="anonymous"
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
                    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-black/85 text-amber-400 px-2 py-0.5 rounded-full shadow text-[10px] whitespace-nowrap">
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
                  <h3 className={`text-base sm:text-lg font-bold line-clamp-2 ${fonts.display}`}>
                    {activeSlide.bookTitle || 'Book Title'}
                  </h3>
                  <p className={`text-xs opacity-75 font-medium ${fonts.body}`}>
                    {activeSlide.author ? `by ${activeSlide.author}` : 'Author Name'}
                  </p>
                </div>

                {/* Hook Line */}
                {activeSlide.hookLine && (
                  <p className={`text-xs sm:text-sm font-semibold italic mt-1 px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 max-w-sm ${fonts.body}`}>
                    &ldquo;{activeSlide.hookLine}&rdquo;
                  </p>
                )}

                {/* Review Body */}
                {activeSlide.reviewBody && (
                  <p className={`text-[11px] sm:text-xs opacity-90 line-clamp-4 leading-relaxed max-w-sm px-2 ${fonts.body}`}>
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

            {/* 2. QUOTE CARD POST */}
            {state.postType === 'quote' && (
              <div className="flex flex-col items-center justify-center text-center px-4 py-2 space-y-4">
                <div className="w-10 h-10 rounded-full bg-current/5 flex items-center justify-center mx-auto">
                  <QuoteIcon className="w-5 h-5 opacity-60 text-current" />
                </div>
                <blockquote className={`text-sm sm:text-base font-medium italic leading-relaxed max-w-xs sm:max-w-sm ${fonts.display}`}>
                  &ldquo;{activeSlide.quote || 'Enter a quote from your Reading Journal or notes...'}&rdquo;
                </blockquote>
                <div className="space-y-0.5 pt-2 border-t border-current/10 w-36 mx-auto">
                  <p className={`text-xs font-bold ${fonts.body}`}>
                    {activeSlide.author || 'Author'}
                  </p>
                  <p className="text-[10px] opacity-75 truncate">
                    {activeSlide.bookTitle ? `${activeSlide.bookTitle}` : 'Literary Quote'}
                    {activeSlide.quoteAttribution ? ` • ${activeSlide.quoteAttribution}` : ''}
                  </p>
                </div>
              </div>
            )}

            {/* 3. BOOK RECOMMENDATION (IF YOU LOVED X, READ Y) */}
            {state.postType === 'recommendation' && (
              <div className="flex flex-col text-center space-y-3 px-2">
                <div className="space-y-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${template.badgeClass}`}>
                    Book Recommendations
                  </span>
                  <h3 className={`text-base sm:text-lg font-bold ${fonts.display}`}>
                    {activeSlide.recommendationPrompt || `If you loved "${activeSlide.bookTitle || 'this book'}"`}
                  </h3>
                </div>

                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-current/10 space-y-2 text-left">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="text-xs font-semibold">You will also adore:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5 border border-current/5">
                      <span className="text-[11px] font-bold block truncate">
                        {activeSlide.recommendedBooks?.[0]?.title || '1. Add companion book'}
                      </span>
                      <span className="text-[9px] opacity-70 block truncate">
                        {activeSlide.recommendedBooks?.[0]?.author || 'Select from library or enter title'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5 border border-current/5">
                      <span className="text-[11px] font-bold block truncate">
                        {activeSlide.recommendedBooks?.[1]?.title || '2. Add companion book'}
                      </span>
                      <span className="text-[9px] opacity-70 block truncate">
                        {activeSlide.recommendedBooks?.[1]?.author || 'Select from library or enter title'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. BOOK VS BOOK (THIS OR THAT) */}
            {state.postType === 'versus' && (
              <div className="flex flex-col text-center space-y-3 px-2">
                <div className="flex items-center justify-center gap-1.5">
                  <Swords className="w-4 h-4 text-amber-500" />
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${template.badgeClass}`}>
                    Book Battle / Versus
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 items-center">
                  <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-current/10 text-center space-y-1">
                    <span className="text-[9px] font-bold uppercase text-amber-500 block">Book A</span>
                    <h4 className="text-xs font-bold truncate">{activeSlide.bookTitle || 'Select Book A'}</h4>
                    <span className="text-[10px] opacity-75 truncate block">{activeSlide.author || 'Author A'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-current/10 text-center space-y-1">
                    <span className="text-[9px] font-bold uppercase text-rose-500 block">Book B</span>
                    <h4 className="text-xs font-bold truncate">
                      {activeSlide.versus?.bookB?.title || 'Select Book B'}
                    </h4>
                    <span className="text-[10px] opacity-75 truncate block">
                      {activeSlide.versus?.bookB?.author || 'Add opponent author'}
                    </span>
                  </div>
                </div>
                <p className={`text-xs italic opacity-90 px-2 ${fonts.body}`}>
                  &ldquo;{activeSlide.hookLine || 'Which of these had a stronger resonance for you? Vote in the comments!'}&rdquo;
                </p>
              </div>
            )}

            {/* 5. TBR LIST GRAPHIC */}
            {state.postType === 'tbr' && (
              <div className="flex flex-col text-center space-y-3 px-2">
                <div className="space-y-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${template.badgeClass}`}>
                    Reading List
                  </span>
                  <h3 className={`text-base sm:text-lg font-bold ${fonts.display}`}>
                    Current To-Be-Read Stack
                  </h3>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="flex flex-col items-center p-2 rounded-lg bg-black/5 dark:bg-white/5 border border-current/5"
                    >
                      <div className="w-16 h-24 bg-black/10 dark:bg-white/10 rounded shadow flex items-center justify-center text-[10px] font-bold text-center p-1 overflow-hidden">
                        {item === 1 && activeSlide.bookTitle ? (
                          activeSlide.coverImageUrl ? (
                            <img
                              src={activeSlide.coverImageUrl}
                              alt=""
                              crossOrigin="anonymous"
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <span className="line-clamp-2">{activeSlide.bookTitle}</span>
                          )
                        ) : (
                          `TBR #${item}`
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

            {/* 6. MONTHLY READING WRAP-UP */}
            {state.postType === 'wrapup' && (
              <div className="flex flex-col text-center space-y-3 px-2">
                <div className="flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className={`text-base sm:text-lg font-bold ${fonts.display}`}>
                    {activeSlide.wrapupMonth || 'Monthly'} Reading Wrap-Up
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-left">
                  <div className="p-2.5 rounded-lg bg-black/5 dark:bg-white/5 border border-current/5">
                    <span className="text-[10px] opacity-70 block">Books Read</span>
                    <span className="text-lg font-bold">
                      {activeSlide.wrapupBooksCount ?? 0} Books
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/5 dark:bg-white/5 border border-current/5">
                    <span className="text-[10px] opacity-70 block">Pages Turned</span>
                    <span className="text-lg font-bold">
                      {activeSlide.wrapupPagesCount ? activeSlide.wrapupPagesCount.toLocaleString() : '0'}
                    </span>
                  </div>
                </div>
                {activeSlide.bookTitle && (
                  <div className="p-2.5 rounded-lg bg-black/5 dark:bg-white/5 border border-current/5 flex items-center gap-2 text-left">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div className="truncate">
                      <span className="text-[9px] uppercase tracking-wider font-semibold opacity-60 block">
                        Top Favorite of the Month
                      </span>
                      <span className="text-xs font-bold truncate block">{activeSlide.bookTitle}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 7. STRUCTURED MULTI-SLIDE CAROUSEL STAGES */}
            {state.postType === 'carousel' && (
              <div className="flex flex-col items-center text-center space-y-3 px-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${template.badgeClass}`}>
                  Slide {currentSlideIndex + 1}: {activeSlide.carouselStage || 'Review Breakdown'}
                </span>

                {/* Stage 1: Hook & Cover */}
                {(!activeSlide.carouselStage || activeSlide.carouselStage === 'hook') && (
                  <div className="flex flex-col items-center space-y-2">
                    {activeSlide.coverImageUrl && (
                      <img
                        src={activeSlide.coverImageUrl}
                        alt=""
                        crossOrigin="anonymous"
                        className="w-20 h-32 object-cover rounded shadow ring-1 ring-black/10"
                      />
                    )}
                    <h3 className={`text-base font-bold ${fonts.display}`}>{activeSlide.bookTitle || 'Book Title'}</h3>
                    <p className="text-xs opacity-75">{activeSlide.author || 'Author Name'}</p>
                    {activeSlide.hookLine && (
                      <p className="text-xs font-semibold italic mt-1">&ldquo;{activeSlide.hookLine}&rdquo;</p>
                    )}
                  </div>
                )}

                {/* Stage 2: Premise / Synopsis */}
                {activeSlide.carouselStage === 'premise' && (
                  <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-current/10 space-y-2 text-left">
                    <h4 className="text-xs font-bold uppercase tracking-wider opacity-80">The Premise (Spoiler-Free)</h4>
                    <p className={`text-xs opacity-90 leading-relaxed ${fonts.body}`}>
                      {activeSlide.synopsis || 'Enter your spoiler-free summary of the book premise...'}
                    </p>
                  </div>
                )}

                {/* Stage 3: Standout Quote */}
                {activeSlide.carouselStage === 'quotes' && (
                  <div className="space-y-3">
                    <QuoteIcon className="w-6 h-6 opacity-40 mx-auto" />
                    <blockquote className={`text-xs sm:text-sm italic font-medium ${fonts.display}`}>
                      &ldquo;{activeSlide.quote || 'Add a standout quote from this book...'}&rdquo;
                    </blockquote>
                    <p className="text-[10px] font-bold opacity-75">— {activeSlide.author || 'Author'}</p>
                  </div>
                )}

                {/* Stage 4: Rating Breakdown */}
                {activeSlide.carouselStage === 'breakdown' && (
                  <div className="w-full space-y-1.5 text-left p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-current/10">
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-2">Pillars of the Story</h4>
                    {[
                      {
                        label: 'Plot & Intrigue',
                        score: `${activeSlide.ratingBreakdown?.plot ?? activeSlide.rating ?? 5}/5`,
                      },
                      {
                        label: 'Character Depth',
                        score: `${activeSlide.ratingBreakdown?.characters ?? activeSlide.rating ?? 5}/5`,
                      },
                      {
                        label: 'Pacing & Rhythm',
                        score: `${activeSlide.ratingBreakdown?.pacing ?? activeSlide.rating ?? 4.5}/5`,
                      },
                      {
                        label: 'Emotional Resonance',
                        score: `${activeSlide.ratingBreakdown?.emotionalImpact ?? activeSlide.rating ?? 5}/5`,
                      },
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs py-0.5 border-b border-current/5">
                        <span className="opacity-80">{item.label}</span>
                        <span className="font-bold">{item.score}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Stage 5: Verdict & CTA */}
                {activeSlide.carouselStage === 'verdict' && (
                  <div className="space-y-3">
                    {activeSlide.rating > 0 && (
                      <div className="flex items-center justify-center gap-1 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < activeSlide.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-zinc-500'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    <p className={`text-xs sm:text-sm font-bold ${fonts.display}`}>
                      {activeSlide.customHeadline ||
                        (activeSlide.rating === 5
                          ? 'Final Verdict: A 5-Star Favorite'
                          : activeSlide.rating >= 4
                          ? 'Final Verdict: Highly Recommended Read'
                          : 'Final Verdict & Thoughts')}
                    </p>
                    <div className="p-2.5 rounded-lg bg-black/5 dark:bg-white/5 border border-current/10 text-xs">
                      <p className="font-semibold">Join the discussion:</p>
                      <p className="opacity-80 text-[11px] mt-0.5">
                        {activeSlide.discussionQuestion || 'Have you read this book? What did it make you feel?'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 8. CUSTOM POST */}
            {state.postType === 'custom' && (
              <div className="flex flex-col items-center justify-center text-center space-y-3 px-3">
                <h3 className={`text-lg sm:text-xl font-bold ${fonts.display}`}>
                  {activeSlide.customHeadline || 'Literary Thoughts'}
                </h3>
                {activeSlide.customSubtitle && (
                  <p className="text-xs font-semibold opacity-80">
                    {activeSlide.customSubtitle}
                  </p>
                )}
                <p className={`text-xs opacity-90 leading-relaxed max-w-sm ${fonts.body}`}>
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
