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

const SupportAgentIcon = ({ className = 'h-7 w-7' }: { className?: string }) => (
  <svg viewBox="0 0 42 32" className={className} fill="none" aria-hidden="true">
    {/* Headband and ear cups */}
    <path d="M4.5 15v-1.2a9.5 9.5 0 0 1 19 0V15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
    <rect x="2.5" y="13.5" width="6" height="10" rx="2.8" fill="currentColor" fillOpacity=".22" stroke="currentColor" strokeWidth="1.6"/>
    <rect x="20" y="13.5" width="6" height="10" rx="2.8" fill="currentColor" fillOpacity=".22" stroke="currentColor" strokeWidth="1.6"/>
    {/* Friendly agent face */}
    <path d="M8.5 13.5a5.5 5.5 0 0 1 11 0v4a5.5 5.5 0 0 1-11 0v-4Z" fill="currentColor" fillOpacity=".96"/>
    <path d="M11.2 17h.1m4.9 0h.1" stroke="#172333" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M12 19.4c1.2.8 2.4.8 3.6 0" stroke="#172333" strokeWidth="1.2" strokeLinecap="round"/>
    {/* Boom deliberately extends beyond the circular button edge */}
    <path d="M23.5 20.5c2.5 2.4 5.1 2.8 7.7 2.1 1.5-.4 2.3-1.4 3-2.8" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="32.2" y="16.5" width="8.2" height="5.3" rx="2.65" fill="#102235" stroke="currentColor" strokeWidth="1.5" transform="rotate(-18 32.2 16.5)"/>
    <path d="M35 17.9l.8 2.2m1.7-2.7.8 2.2" stroke="#34D399" strokeWidth="1.2" strokeLinecap="round"/>
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
          'group fixed z-40 flex items-center justify-center rounded-full shadow-[0_8px_28px_-8px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.04] hover:shadow-[0_12px_32px_-8px_rgba(15,23,42,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2',
          // Exactly matching Book Reader launcher dimensions: 48px (w-12 h-12) on mobile, 56px (sm:w-14 sm:h-14) on sm+
          'w-12 h-12 sm:w-14 sm:h-14',
          // Positioned directly above Book Reader: right-4 sm:right-5 lg:right-6 (vertically aligned)
          'bottom-[76px] right-4 sm:bottom-[88px] sm:right-5 lg:bottom-[96px] lg:right-6',
          // Deep emerald & radiant gold styling
          'bg-gradient-to-br from-[#263548] via-[#172333] to-[#101827] text-white border border-white/15 hover:from-[#33465d] hover:via-[#1d2d40] hover:to-[#152033]'
        )}
      >
        {/* Radar ping ring */}
        <span
          className="pointer-events-none absolute inset-0 rounded-full bg-[#D5B16D]/25 opacity-40 animate-ping [animation-duration:2.8s]"
          aria-hidden="true"
        />
        {/* Support / Help Icon matching Book Reader icon scale */}
        <span className="pointer-events-none absolute inset-[3px] rounded-full border border-white/[0.07]" aria-hidden="true" />\n        <SupportAgentIcon className="relative h-7 w-7 sm:h-8 sm:w-8 transition-transform duration-300 group-hover:scale-105" />\n        <span className="absolute bottom-[2px] right-[2px] flex h-[17px] w-[17px] items-center justify-center rounded-full border-[2.5px] border-[#172333] bg-emerald-500" aria-hidden="true"><span className="h-1.5 w-1.5 rounded-full bg-white" /></span>

        {/* Desktop Tooltip */}
        <span
          className={cn(
            'pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-full bg-[#111614] px-3 py-1.5 text-xs font-medium text-stone-100 shadow-md border border-white/10 transition-all duration-200 sm:block',
            showTooltip && !isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
          )}
        >
          Chat with a Support Agent
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
            className="fixed bottom-[136px] right-4 left-4 sm:left-auto sm:right-5 sm:bottom-[154px] lg:right-6 lg:bottom-[164px] z-50 w-auto sm:w-[380px] overflow-hidden rounded-2xl border border-[#D5B16D]/30 bg-background/98 p-0 text-foreground shadow-2xl shadow-black/25 backdrop-blur-md transition-all animate-in fade-in-0 zoom-in-95 duration-200"
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
