import React, { useState, useEffect, useRef } from 'react';
import { PhoneCall, LifeBuoy, X, ExternalLink, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SAHADHYAYI_PHONE_RAW,
  SAHADHYAYI_EMAIL,
  SUPPORT_TOPICS,
  openSahadhyayiWhatsApp,
} from './whatsappSupport';

export const WhatsAppIcon = ({ className = 'w-6 h-6' }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
    <path d="M16.04 3C9.4 3 4 8.4 4 15.04c0 2.12.56 4.2 1.62 6.03L4 29l8.13-1.6a12 12 0 0 0 3.9.65h.01C22.68 28.05 28 22.65 28 16.01 28 8.4 22.68 3 16.04 3Zm0 22.98h-.01a9.95 9.95 0 0 1-5.07-1.39l-.36-.21-4.82.95.98-4.7-.24-.38a9.9 9.9 0 0 1-1.52-5.21c0-5.5 4.48-9.98 10.04-9.98 5.53 0 9.96 4.47 9.96 9.98 0 5.5-4.47 9.94-9.96 9.94Zm5.46-7.44c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
  </svg>
);

export const WhatsAppCallCenterFab: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>('general');
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleStartWhatsApp = (msgOverride?: string) => {
    const topic = SUPPORT_TOPICS.find((t) => t.id === selectedTopic);
    const msg = msgOverride || topic?.message || 'Namaste Sahadhyayi! I would like assistance.';
    openSahadhyayiWhatsApp(msg);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Action Button - Positioned right above Book Expert AI */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label="Call Center and WhatsApp Support"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        data-testid="whatsapp-callcenter-fab"
        className={cn(
          'group fixed z-40 flex items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          // Mobile: Exactly 12px above Book Expert (bottom: 16px, height: 48px -> top is 64px + 12px = 76px)
          'bottom-[76px] right-4 h-11 w-11 bg-[#1C442D] text-[#D5B16D] border border-[#D5B16D]/50 hover:bg-[#153422] hover:border-[#D5B16D] focus-visible:ring-[#D5B16D]',
          // Desktop sm: Exactly 14px above Book Expert (bottom: 20px, height: 56px -> top is 76px + 14px = 90px)
          'sm:bottom-[90px] sm:right-5 sm:h-12 sm:w-12',
          // Desktop lg: 16px above Book Expert (bottom: 24px, height: 56px -> top is 80px + 16px = 96px)
          'lg:bottom-[96px] lg:right-6'
        )}
      >
        {/* Radar ping ring */}
        <span
          className="pointer-events-none absolute inset-0 rounded-full bg-[#D5B16D]/25 opacity-40 animate-ping [animation-duration:2.8s]"
          aria-hidden="true"
        />
        {/* Support / Help Icon */}
        <LifeBuoy className="relative h-5 w-5 sm:h-5.5 sm:w-5.5 transition-transform group-hover:scale-110" aria-hidden="true" />

        {/* Desktop Tooltip */}
        <span
          className={cn(
            'pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-full bg-[#111614] px-3 py-1.5 text-xs font-medium text-stone-100 shadow-md border border-white/10 transition-all duration-200 sm:block',
            showTooltip && !isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
          )}
        >
          Call Center & WhatsApp Support
        </span>
      </button>

      {/* Quick Call Center & WhatsApp Card */}
      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Close support overlay"
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[1px] sm:bg-transparent border-0 cursor-default p-0 m-0 w-full h-full"
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Sahadhyayi Support & Call Center"
            className="fixed bottom-[130px] right-4 left-4 sm:left-auto sm:right-5 sm:bottom-[150px] lg:right-6 lg:bottom-[160px] z-50 w-auto sm:w-[380px] overflow-hidden rounded-2xl border border-[#D5B16D]/30 bg-background/98 p-0 text-foreground shadow-2xl shadow-black/25 backdrop-blur-md transition-all animate-in fade-in-0 zoom-in-95 duration-200"
          >
            {/* Header */}
            <div className="relative border-b border-border/70 bg-[#111614] p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1C442D] text-[#D5B16D] border border-[#D5B16D]/30 shadow-sm">
                    <LifeBuoy className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-semibold leading-tight text-white">
                      Sahadhyayi Helpline
                    </h3>
                    <p className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#25D366] animate-pulse" />
                      Live Support · Mon–Sat 9am–9pm
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close helpline menu"
                  className="rounded-lg p-1.5 text-stone-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-4 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect directly with the Sahadhyayi support desk for book requests, reading circle questions, or author assistance.
              </p>

              {/* Quick Topic Selector */}
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Select Inquiry Topic
                </span>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  {SUPPORT_TOPICS.map((topic) => {
                    const isSelected = selectedTopic === topic.id;
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => setSelectedTopic(topic.id)}
                        className={cn(
                          'rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium transition-colors',
                          isSelected
                            ? 'border-[#D5B16D] bg-[#D5B16D]/10 text-foreground font-semibold'
                            : 'border-border/80 hover:bg-muted text-muted-foreground'
                        )}
                      >
                        {topic.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleStartWhatsApp()}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white py-2.5 px-4 text-sm font-semibold shadow-sm transition-all hover:shadow"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  <span>Chat on WhatsApp</span>
                  <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-70" />
                </button>

                <a
                  href={`tel:${SAHADHYAYI_PHONE_RAW}`}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-card hover:bg-muted py-2.5 px-4 text-sm font-medium text-foreground transition-colors"
                >
                  <PhoneCall className="h-4 w-4 text-[#D5B16D]" />
                  <span>Call Support Helpline</span>
                </a>
              </div>

              {/* Footer detail */}
              <div className="border-t border-border/70 pt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Quick response guaranteed
                </span>
                <a
                  href={`mailto:${SAHADHYAYI_EMAIL}`}
                  className="text-primary hover:underline"
                >
                  {SAHADHYAYI_EMAIL}
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default WhatsAppCallCenterFab;
