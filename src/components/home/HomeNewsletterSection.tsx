import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, AlertCircle, Loader2, BookOpen, Sparkles, ShieldCheck } from 'lucide-react';
import { subscribeToNewsletter } from '@/services/newsletterService';

export const HomeNewsletterSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | 'duplicate' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setStatusMessage(null);
    setStatusType(null);
    setLoading(true);

    try {
      const result = await subscribeToNewsletter(email);
      setStatusMessage(result.message);

      if (result.success) {
        setStatusType('success');
        setEmail('');
      } else if (result.duplicate) {
        setStatusType('duplicate');
      } else {
        setStatusType('error');
      }
    } catch {
      setStatusType('error');
      setStatusMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="home-newsletter relative isolate py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF9F5] dark:bg-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7] transition-colors duration-300"
      aria-label="Newsletter Subscription"
    >
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-br from-[#FBF8F3] via-[#F6F1E8] to-[#EFE7D8] dark:from-[#151A17] dark:via-[#111613] dark:to-[#0C100E] border border-[#E8E2D9] dark:border-[#253229] p-8 sm:p-12 lg:p-16 shadow-lg shadow-[#1C442D]/5 dark:shadow-black/40">
          {/* Subtle Ambient Decorative Circles */}
          <div
            className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#8F681C]/5 dark:bg-[#D5B16D]/10 blur-[100px]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#1C442D]/5 dark:bg-[#2F4D38]/10 blur-[100px]"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left side: Heading, Description & Value Props */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-[#1A221D] border border-[#E8E2D9] dark:border-[#2A372E] text-[11px] font-bold uppercase tracking-[0.22em] text-[#8F681C] dark:text-[#D5B16D] shadow-2xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>The Sahadhyayi Dispatch</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-[#1C201D] dark:text-[#F3F0E7] tracking-tight leading-[1.15]">
                Stay Inspired. Stay Curious.
              </h2>

              <p className="text-sm sm:text-base md:text-lg text-[#636B65] dark:text-[#A5ADA6] leading-relaxed max-w-xl">
                Get thoughtful reading recommendations, new book discoveries, inspiring stories and updates from Sahadhyayi delivered straight to your inbox.
              </p>

              {/* Small Benefits */}
              <div className="pt-2 flex flex-wrap gap-y-2 gap-x-6 text-xs text-[#525B54] dark:text-[#A8B2A9]">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#8F681C] dark:text-[#D5B16D] shrink-0" />
                  <span>Curated book insights</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#1C442D] dark:text-[#88C697] shrink-0" />
                  <span>Zero spam, unsubscribe anytime</span>
                </div>
              </div>
            </div>

            {/* Right side: Email Subscription Form Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-white/90 dark:bg-[#18201B]/95 p-6 sm:p-8 border border-[#E8E2D9] dark:border-[#28352C] shadow-md backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="homepage-newsletter-email"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#1C201D] dark:text-[#E8E5DD]"
                    >
                      Your Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8A938C] dark:text-[#7A857D]">
                        <Mail className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <input
                        id="homepage-newsletter-email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (statusMessage) {
                            setStatusMessage(null);
                            setStatusType(null);
                          }
                        }}
                        placeholder="Enter your email address"
                        disabled={loading}
                        required
                        className="block w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-[#DCD5C9] dark:border-[#2F3D32] bg-[#FAF8F5] dark:bg-[#121714] text-[#1C201D] dark:text-[#F3F0E7] placeholder:text-[#9EA79F] focus:outline-none focus:ring-2 focus:ring-[#1C442D] dark:focus:ring-[#D5B16D] focus:border-transparent transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#1C442D] hover:bg-[#143221] dark:bg-[#D5B16D] dark:hover:bg-[#E4C688] text-white dark:text-stone-950 font-semibold text-sm shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Subscribing…</span>
                      </>
                    ) : (
                      <span>Subscribe</span>
                    )}
                  </button>

                  {/* Feedback Message */}
                  {statusMessage && (
                    <div
                      role="alert"
                      className={`flex items-start gap-2.5 p-3.5 rounded-xl text-xs leading-relaxed transition-all animate-in fade-in ${
                        statusType === 'success'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                          : statusType === 'duplicate'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800'
                          : 'bg-red-50 dark:bg-red-950/60 text-red-900 dark:text-red-200 border border-red-200 dark:border-red-800'
                      }`}
                    >
                      {statusType === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                      )}
                      <span>{statusMessage}</span>
                    </div>
                  )}

                  {/* Privacy Note */}
                  <p className="text-[11px] leading-relaxed text-[#737C75] dark:text-[#909B92] pt-1">
                    By subscribing, you agree to receive occasional updates from Sahadhyayi. You can unsubscribe anytime.{' '}
                    <Link
                      to="/privacy-policy"
                      className="underline underline-offset-2 hover:text-[#1C201D] dark:hover:text-[#F3F0E7] transition-colors"
                    >
                      Privacy Policy
                    </Link>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeNewsletterSection;
