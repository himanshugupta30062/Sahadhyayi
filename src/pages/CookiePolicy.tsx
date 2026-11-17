import React from "react";
import {
  Cookie,
  ShieldCheck,
  Printer,
  CheckCircle2,
  Settings,
  Database,
  Lock,
  Mail,
  Phone,
  HelpCircle,
  HardDrive,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SEO from "@/components/SEO";
import { SAHADHYAYI_PHONE, SAHADHYAYI_EMAIL } from "@/components/support/whatsappSupport";

const CookiePolicy: React.FC = () => {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const navLinks = [
    { label: "Privacy Policy", href: "/privacy-policy", active: false },
    { label: "Terms of Service", href: "/terms-of-service", active: false },
    { label: "Cookie Policy", href: "/cookie-policy", active: true },
    { label: "DMCA Policy", href: "/dmca", active: false },
    { label: "Community Guidelines", href: "/community-guidelines", active: false },
  ];

  const cookieInventory = [
    {
      name: "sb-<project-ref>-auth-token (when Supabase browser auth storage is enabled)",
      category: "Essential",
      provider: "Sahadhyayi / Supabase",
      purpose: "Stores the Supabase authentication session in browser storage; exact key and persistence depend on the configured project and auth client.",
      duration: "Until session expiry, sign-out, or storage is cleared (configuration-dependent)",
      type: "Local Storage (not necessarily an HTTP cookie)",
    },
    {
      name: "Theme preference keys",
      category: "Functional",
      provider: "Sahadhyayi",
      purpose: "Persists appearance and reading-theme preferences in browser local storage.",
      duration: "Until cleared by you or browser storage eviction",
      type: "Local Storage",
    },
    {
      name: "Feature-specific localStorage keys",
      category: "Functional",
      provider: "Sahadhyayi",
      purpose: "Features may persist reading progress, goals, recent searches, engagement, quotes, preferences, and session activity locally. Keys vary by feature and may be user-scoped.",
      duration: "Until cleared, removed by the feature, or browser storage eviction",
      type: "Local Storage",
    },
    {
      name: "Browser caches / IndexedDB (feature-dependent)",
      category: "Storage / Cache",
      provider: "Sahadhyayi",
      purpose: "May cache application assets or reading content where offline/cache features are enabled. Contents depend on the feature and browser.",
      duration: "Until cache cleanup, browser eviction, or you clear site data",
      type: "Cache Storage / IndexedDB (where used)",
    },
    {
      name: "cf_clearance",
      category: "Security & Performance",
      provider: "Cloudflare",
      purpose: "Cloudflare may set this challenge/security cookie when its security checks require it; it is not an advertising tracker. It does not itself accelerate content delivery.",
      duration: "Set by Cloudflare; varies with challenge and security configuration",
      type: "Third-Party Cookie",
    },
  ];

  return (
    <>
      <SEO
        title="Cookie Policy - Sahadhyayi"
        description="Learn about how Sahadhyayi uses cookies, local storage, and similar technologies to enhance your reading experience and protect your privacy."
        canonical="https://sahadhyayi.com/cookie-policy"
        url="https://sahadhyayi.com/cookie-policy"
        keywords={[
          "Sahadhyayi cookie policy",
          "reader cookies",
          "local storage",
          "offline reading cache",
          "cookie management",
        ]}
        breadcrumbs={[
          { name: "Home", url: "https://sahadhyayi.com" },
          { name: "Cookie Policy", url: "https://sahadhyayi.com/cookie-policy" },
        ]}
      />

      <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7] py-8 sm:py-12 transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
          {/* Breadcrumbs & Navigation Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D9] dark:border-[#222B25] pb-4">
            <nav aria-label="Breadcrumb" className="inline-flex items-center gap-2 text-xs text-[#636B65] dark:text-[#A5ADA6]">
              <a href="/" className="hover:text-[#1C442D] dark:hover:text-[#D5B16D] transition-colors">
                Home
              </a>
              <span>/</span>
              <span>Legal</span>
              <span>/</span>
              <span className="font-semibold text-[#1C201D] dark:text-[#F3F0E7]">Cookie Policy</span>
            </nav>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="text-xs h-8 rounded-xl border-[#E8E2D9] dark:border-[#29332D] text-[#636B65] dark:text-[#A5ADA6] hover:text-[#1C201D] dark:hover:text-[#F3F0E7]"
              >
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                Print / Save PDF
              </Button>
            </div>
          </div>

          {/* Legal Navigation Switcher Pills */}
          <div className="flex flex-wrap gap-2 pt-1 pb-2 overflow-x-auto">
            {navLinks.map((link) => (
              <Button
                key={link.href}
                asChild
                variant={link.active ? "default" : "outline"}
                size="sm"
                className={`text-xs rounded-xl h-8 font-medium transition-all ${
                  link.active
                    ? "bg-[#1C442D] text-white dark:bg-[#D5B16D] dark:text-[#0B0D0C] hover:bg-[#143221]"
                    : "border-[#E8E2D9] dark:border-[#29332D] hover:bg-white dark:hover:bg-[#141A17]"
                }`}
              >
                <a href={link.href}>{link.label}</a>
              </Button>
            ))}
          </div>

          {/* Header Title Banner */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-[#1C442D] text-white dark:bg-[#D5B16D] dark:text-[#0B0D0C] text-[11px] font-semibold">
                Transparency & Technology
              </Badge>
              <Badge variant="outline" className="border-[#1C442D]/30 text-[#1C442D] dark:border-[#D5B16D]/40 dark:text-[#D5B16D] text-[11px]">
                No Behavioural Ad Profiling
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#1C201D] dark:text-[#F3F0E7]">
              Cookie Policy
            </h1>
            <p className="text-sm text-[#636B65] dark:text-[#A5ADA6]">
              Last updated: November 17, 2026
            </p>
          </div>

          {/* Highlights Card */}
          <Card className="rounded-2xl border-[#E8E2D9] dark:border-[#222B25] bg-gradient-to-br from-amber-50/80 via-white to-amber-100/30 dark:from-[#111714] dark:via-[#141A17] dark:to-[#18221B] shadow-sm">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1C442D] dark:text-[#D5B16D]">
                <Cookie className="h-5 w-5" />
                <span>Cookie Commitments & Storage Philosophy</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs leading-relaxed">
                <div className="p-3 rounded-xl bg-white/80 dark:bg-[#0B0D0C]/80 border border-[#E8E2D9] dark:border-[#29332D] space-y-1">
                  <div className="font-semibold text-[#1C201D] dark:text-[#F3F0E7] flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    Essential Session Security
                  </div>
                  <p className="text-[#636B65] dark:text-[#A5ADA6]">
                    Tokens exist primarily to authenticate your private bookshelf and keep you logged into your reading sessions securely.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/80 dark:bg-[#0B0D0C]/80 border border-[#E8E2D9] dark:border-[#222B25] space-y-1">
                  <div className="font-semibold text-[#1C201D] dark:text-[#F3F0E7] flex items-center gap-1.5">
                    <HardDrive className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    Offline Reading Storage
                  </div>
                  <p className="text-[#636B65] dark:text-[#A5ADA6]">
                    Where supported and enabled, browser storage may cache reading assets or downloaded content for offline access. Browser eviction, device settings, storage limits or clearing site data may remove cached material.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/80 dark:bg-[#0B0D0C]/80 border border-[#E8E2D9] dark:border-[#222B25] space-y-1">
                  <div className="font-semibold text-[#1C201D] dark:text-[#F3F0E7] flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    Zero Behavioral Ad Trackers
                  </div>
                  <p className="text-[#636B65] dark:text-[#A5ADA6]">
                    We do not intend to use cookies for cross-site behavioural advertising. Third-party services embedded in or required by a feature may process technical information under their own terms; the live configuration can change, so this inventory should be checked periodically.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <nav aria-label="Cookie Policy contents" className="p-4 sm:p-5 rounded-2xl border border-[#E8E2D9] dark:border-[#222B25] bg-white dark:bg-[#141A17] space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#1C442D] dark:text-[#D5B16D]">On this page</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {["What Are Cookies?","How We Use Cookies","Types of Cookies We Use","Third-Party Cookies","Managing Cookies","Cookie Retention","Impact of Disabling Cookies","Updates to This Policy","Contact Us"].map((title, index) => (
                <a key={title} href={`#cookie-section-${index + 1}`} className="text-[#636B65] dark:text-[#A5ADA6] hover:underline">{index + 1}. {title}</a>
              ))}
            </div>
          </nav>

          {/* Main Legal Sections Container */}
          <div className="bg-white dark:bg-[#141A17] rounded-3xl border border-[#E8E2D9] dark:border-[#222B25] p-6 sm:p-10 shadow-sm space-y-10 text-sm sm:text-base leading-relaxed text-[#353D37] dark:text-[#D6DDD7]">
            {/* 1. What Are Cookies? */}
            <section id="cookie-section-1" className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                1. What Are Cookies?
              </h2>
              <p>
                Cookies are compact alphanumeric text files stored on your computer, tablet, or smartphone when you visit web applications. Along with similar web storage mechanisms (such as <em>localStorage</em>, <em>sessionStorage</em>, and <em>IndexedDB</em>), they enable websites to remember user state, personalize reading preferences, and ensure cryptographic session security.
              </p>
            </section>

            {/* 2. How We Use Cookies */}
            <section id="cookie-section-2" className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                2. How We Use Cookies
              </h2>
              <p>
                Sahadhyayi utilizes cookies and local browser storage strictly for legitimate, user-beneficial purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-1 text-xs sm:text-sm">
                <li>To keep you authenticated across browser reloads without repeated password prompts.</li>
                <li>To remember your font family, font size, margins, and daylight/sepia/dark reading themes.</li>
                <li>To synchronize reading page progress and personal bookmarks between multiple devices.</li>
                <li>To store downloaded book chapters locally for interruption-free offline reading during flights or low-connectivity commutes.</li>
                <li>To monitor platform health, detect bot spam, and protect our readers from malicious attacks.</li>
              </ul>
            </section>

            {/* 3. Types of Cookies We Use */}
            <section id="cookie-section-3" className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                3. Types of Cookies We Use
              </h2>
              <div className="space-y-4 text-xs sm:text-sm">
                <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#0B0D0C] border border-[#E8E2D9] dark:border-[#222B25] space-y-1">
                  <h3 className="font-bold text-sm text-[#1C201D] dark:text-[#F3F0E7]">A. Essential Cookies (Strictly Necessary)</h3>
                  <p>
                    Technologies in this category support sign-in, session integrity, security and core site functions. Blocking them may prevent account features from working. Some authentication state may be stored in local or session storage rather than an HTTP cookie.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#0B0D0C] border border-[#E8E2D9] dark:border-[#222B25] space-y-1">
                  <h3 className="font-bold text-sm text-[#1C201D] dark:text-[#F3F0E7]">B. Functional & Preference Storage</h3>
                  <p>
                    These files remember choices you have made, including your chosen reading theme (Night, Sepia, Daylight), audio preferences in silent Pomodoro rooms, and reading speed preferences.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#0B0D0C] border border-[#E8E2D9] dark:border-[#222B25] space-y-1">
                  <h3 className="font-bold text-sm text-[#1C201D] dark:text-[#F3F0E7]">C. Performance & Reliability Telemetry</h3>
                  <p>
                    Where enabled, operational diagnostics may record technical events such as errors, performance or network information to maintain and improve reliability. The data collected, aggregation and retention depend on the active analytics and hosting configuration.
                  </p>
                </div>
              </div>

              {/* Itemized Cookie Inventory Table */}
              <div className="pt-2 space-y-2">
                <h3 className="font-bold text-sm text-[#1C201D] dark:text-[#F3F0E7]">
                  Storage Inventory (representative identifiers)
                </h3>
                <p className="text-xs text-[#636B65] dark:text-[#A5ADA6]">This is a representative inventory, not an exhaustive list of every dynamically generated key, browser cache entry, or provider cookie. Names and lifetimes can vary by browser, authentication configuration, and enabled feature. We will update this page as the implementation changes.</p>
                <div className="overflow-x-auto rounded-2xl border border-[#E8E2D9] dark:border-[#222B25]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#FAF7F2] dark:bg-[#0F1411] border-b border-[#E8E2D9] dark:border-[#222B25] text-[#1C201D] dark:text-[#F3F0E7]">
                        <th className="p-3 font-semibold">Identifier</th>
                        <th className="p-3 font-semibold">Category</th>
                        <th className="p-3 font-semibold">Purpose</th>
                        <th className="p-3 font-semibold">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E2D9] dark:divide-[#222B25]">
                      {cookieInventory.map((item) => (
                        <tr key={item.name} className="hover:bg-amber-50/30 dark:hover:bg-[#18201A] transition-colors">
                          <td className="p-3 font-mono font-medium text-[#1C442D] dark:text-[#D5B16D] whitespace-nowrap">
                            {item.name}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <Badge variant="outline" className="text-[10px] rounded-md font-normal">
                              {item.category}
                            </Badge>
                          </td>
                          <td className="p-3 text-[#4A524D] dark:text-[#C5CDC6]">
                            {item.purpose}
                          </td>
                          <td className="p-3 whitespace-nowrap text-[#636B65] dark:text-[#A5ADA6]">
                            {item.duration}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* 4. Third-Party Cookies */}
            <section id="cookie-section-4" className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                4. Third-Party Cookies
              </h2>
              <p>
                We minimize external dependencies to prevent third-party profiling. Any third-party cookies present on Sahadhyayi are strictly limited to foundational infrastructure providers:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-1 text-xs sm:text-sm">
                <li><strong>Supabase Auth:</strong> Manages cryptographically secure identity tokens for user authentication.</li>
                <li><strong>Cloudflare Edge CDN:</strong> Issues security tokens (e.g. <code>cf_clearance</code>) to verify human traffic and prevent malicious DDoS attacks.</li>
                <li><strong>Mappls Web SDK:</strong> Serves map tiles and geography layers for the interactive reader discovery map.</li>
              </ul>
              <p className="text-xs text-[#636B65] dark:text-[#A5ADA6]">
                We do not intend to use third-party advertising cookies or retargeting pixels to build advertising profiles from reading activity. Infrastructure, map, analytics or embedded services may use their own technologies; consult the relevant provider notices and the current inventory for details.
              </p>
            </section>

            {/* 5. Managing Cookies */}
            <section id="cookie-section-5" className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                5. Managing Cookies
              </h2>
              <p>
                You can review, block or clear cookies and site storage through your browser or device settings. Blocking essential storage may affect sign-in, preferences, offline reading and other features. Browser controls do not necessarily provide a per-purpose preference centre, and clearing storage may sign you out or remove locally cached content:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-3.5 rounded-xl border border-[#E8E2D9] dark:border-[#222B25] bg-[#FAF7F2] dark:bg-[#0B0D0C] space-y-1">
                  <strong>Google Chrome:</strong> Settings &gt; Privacy and Security &gt; Third-party cookies &gt; Clear browsing data.
                </div>
                <div className="p-3.5 rounded-xl border border-[#E8E2D9] dark:border-[#222B25] bg-[#FAF7F2] dark:bg-[#0B0D0C] space-y-1">
                  <strong>Apple Safari (Mac & iOS):</strong> Settings &gt; Safari &gt; Advanced &gt; Privacy &gt; Block all cookies / Website Data.
                </div>
                <div className="p-3.5 rounded-xl border border-[#E8E2D9] dark:border-[#222B25] bg-[#FAF7F2] dark:bg-[#0B0D0C] space-y-1">
                  <strong>Mozilla Firefox:</strong> Preferences &gt; Privacy &amp; Security &gt; Cookies and Site Data &gt; Clear Data.
                </div>
                <div className="p-3.5 rounded-xl border border-[#E8E2D9] dark:border-[#222B25] bg-[#FAF7F2] dark:bg-[#0B0D0C] space-y-1">
                  <strong>Microsoft Edge:</strong> Settings &gt; Cookies and site permissions &gt; Manage and delete cookies.
                </div>
              </div>
            </section>

            {/* 6. Cookie Retention */}
            <section id="cookie-section-6" className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                6. Cookie Retention
              </h2>
              <div className="space-y-3 text-xs sm:text-sm">
                <p>
                  <strong>Session technologies:</strong> Some session cookies expire when the browser session ends. Other session or authentication values may persist according to the provider and authentication-client configuration.
                </p>
                <p>
                  <strong>Persistent technologies:</strong> Cookies and browser-storage entries remain until their configured expiry, sign-out, feature-specific deletion, browser eviction or manual clearing. We do not promise a universal retention period; actual lifetimes vary by key, provider and configuration.
                </p>
              </div>
            </section>

            {/* 7. Impact of Disabling Cookies */}
            <section id="cookie-section-7" className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                7. Impact of Disabling Cookies
              </h2>
              <p>
                You can browse public catalog pages with cookies disabled. However, disabling essential cookies will prevent you from signing in to your personal account, saving reading bookmarks across devices, or caching books for offline reading.
              </p>
            </section>

            {/* 8. Updates to This Policy */}
            <section id="cookie-section-8" className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                8. Updates to This Policy
              </h2>
              <p>
                We may periodically update this Cookie Policy to account for architectural enhancements or new statutory guidance under Indian and international privacy laws. We will notify members of notable revisions by updating the date on this page.
              </p>
            </section>

            {/* 9. Contact Us */}
            <section id="cookie-section-9" className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                9. Contact Us
              </h2>
              <p>
                If you have any questions or require clarification regarding our use of cookies or local storage, please contact our team:
              </p>
              <div className="p-5 rounded-2xl bg-[#FAF7F2] dark:bg-[#0B0D0C] border border-[#E8E2D9] dark:border-[#222B25] space-y-2 text-xs sm:text-sm">
                <p><strong>Entity:</strong> Sahadhyayi Reading Community</p>
                <p><strong>Email:</strong> <a href={`mailto:${SAHADHYAYI_EMAIL}`} className="text-[#1C442D] dark:text-[#D5B16D] underline">{SAHADHYAYI_EMAIL}</a></p>
                <p><strong>Phone Helpline:</strong> {SAHADHYAYI_PHONE}</p>
                <p><strong>Location:</strong> New Delhi, India</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default CookiePolicy;
