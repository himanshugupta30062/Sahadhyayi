import React from "react";
import {
  ShieldCheck,
  Lock,
  Eye,
  BookOpen,
  Compass,
  Bot,
  FileText,
  CheckCircle2,
  AlertCircle,
  Printer,
  Scale,
  Cookie,
  Mail,
  Phone,
  ArrowRight,
  Server,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SEO from "@/components/SEO";
import { SAHADHYAYI_PHONE, SAHADHYAYI_EMAIL } from "@/components/support/whatsappSupport";

const PrivacyPolicy: React.FC = () => {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const navLinks = [
    { label: "Privacy Policy", href: "/privacy-policy", active: true },
    { label: "Terms of Service", href: "/terms-of-service", active: false },
    { label: "Cookie Policy", href: "/cookie-policy", active: false },
    { label: "DMCA Policy", href: "/dmca", active: false },
    { label: "Community Guidelines", href: "/community-guidelines", active: false },
  ];

  const quickJumpSections = [
    { id: "intro", title: "1. Introduction" },
    { id: "collection", title: "2. Information We Collect" },
    { id: "usage", title: "3. How We Use Your Information" },
    { id: "social-map-privacy", title: "4. Social Map & Location Privacy" },
    { id: "sequel-privacy", title: "5. Sequel & Community Feedback Privacy" },
    { id: "sharing", title: "6. Information Sharing & Third Parties" },
    { id: "security", title: "7. Data Security & Storage" },
    { id: "rights", title: "8. Your Rights as a Data Principal" },
    { id: "ai-governance", title: "9. AI Assistant & Model Training (DPDP Act 2023)" },
    { id: "cookies", title: "10. Cookies & Tracking" },
    { id: "retention", title: "11. Data Retention & Account Deletion" },
    { id: "changes", title: "12. Changes to This Policy" },
    { id: "contact", title: "13. Grievance Redressal & Contact" },
  ];

  return (
    <>
      <SEO
        title="Privacy Policy - Sahadhyayi"
        description="Read Sahadhyayi's Privacy Policy to understand how we collect, use, and protect your personal data, location privacy on the Social Map, and compliance with the India DPDP Act 2023."
        canonical="https://sahadhyayi.com/privacy-policy"
        url="https://sahadhyayi.com/privacy-policy"
        keywords={[
          "Sahadhyayi privacy policy",
          "data protection DPDP 2023",
          "reader privacy",
          "location privacy map",
          "reading data protection",
          "digital library privacy",
        ]}
        breadcrumbs={[
          { name: "Home", url: "https://sahadhyayi.com" },
          { name: "Privacy Policy", url: "https://sahadhyayi.com/privacy-policy" },
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
              <span className="font-semibold text-[#1C201D] dark:text-[#F3F0E7]">Privacy Policy</span>
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
                Official Legal Document
              </Badge>
              <Badge variant="outline" className="border-[#1C442D]/30 text-[#1C442D] dark:border-[#D5B16D]/40 dark:text-[#D5B16D] text-[11px]">
                DPDP-aware privacy practices
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#1C201D] dark:text-[#F3F0E7]">
              Privacy Policy
            </h1>
            <p className="text-sm text-[#636B65] dark:text-[#A5ADA6]">
              Last updated: September 2026 · Revised & Harmonized: November 2026
            </p>
          </div>

          {/* Key Privacy Highlights / TL;DR Card */}
          <Card className="rounded-2xl border-[#E8E2D9] dark:border-[#222B25] bg-gradient-to-br from-amber-50/80 via-white to-amber-100/30 dark:from-[#111714] dark:via-[#141A17] dark:to-[#18221B] shadow-sm">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1C442D] dark:text-[#D5B16D]">
                <ShieldCheck className="h-5 w-5" />
                <span>Privacy at a Glance (Key Commitments)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs leading-relaxed">
                <div className="p-3 rounded-xl bg-white/80 dark:bg-[#0B0D0C]/80 border border-[#E8E2D9] dark:border-[#29332D] space-y-1">
                  <div className="font-semibold text-[#1C201D] dark:text-[#F3F0E7] flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    Zero Data Selling
                  </div>
                  <p className="text-[#636B65] dark:text-[#A5ADA6]">
                    We never sell, rent, or trade your reading records, annotations, or personal identity to third-party advertisers or data brokers.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/80 dark:bg-[#0B0D0C]/80 border border-[#E8E2D9] dark:border-[#222B25] space-y-1">
                  <div className="font-semibold text-[#1C201D] dark:text-[#F3F0E7] flex items-center gap-1.5">
                    <Compass className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    Bilateral Location Consent
                  </div>
                  <p className="text-[#636B65] dark:text-[#A5ADA6]">
                    Social Map location is 100% voluntary. We never track your background location, and Ghost Mode provides instant invisibility.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/80 dark:bg-[#0B0D0C]/80 border border-[#E8E2D9] dark:border-[#222B25] space-y-1">
                  <div className="font-semibold text-[#1C201D] dark:text-[#F3F0E7] flex items-center gap-1.5">
                    <Bot className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                    Private AI Processing
                  </div>
                  <p className="text-[#636B65] dark:text-[#A5ADA6]">
                    Conversations with our Book Expert and reading companions are never used for public model training without affirmative opt-in consent.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Jump Table of Contents */}
          <div className="p-4 sm:p-5 rounded-2xl border border-[#E8E2D9] dark:border-[#222B25] bg-white dark:bg-[#141A17] space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1C442D] dark:text-[#D5B16D]">
              Table of Contents
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {quickJumpSections.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="text-[#636B65] dark:text-[#A5ADA6] hover:text-[#1C442D] dark:hover:text-[#D5B16D] hover:underline truncate"
                >
                  {sec.title}
                </a>
              ))}
            </div>
          </div>

          {/* Main Legal Sections Container */}
          <div className="bg-white dark:bg-[#141A17] rounded-3xl border border-[#E8E2D9] dark:border-[#222B25] p-6 sm:p-10 shadow-sm space-y-10 text-sm sm:text-base leading-relaxed text-[#353D37] dark:text-[#D6DDD7]">
            {/* 1. Introduction */}
            <section id="intro" className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                1. Introduction
              </h2>
              <p>
                Welcome to Sahadhyayi ("we," "our," or "us"). Sahadhyayi is a digital sanctuary for readers, researchers, authors, and literary communities operated from India. We aim to protect personal information and design our practices around India's <strong>Digital Personal Data Protection Act, 2023</strong>, applicable provisions of the <strong>Information Technology Act, 2000</strong> and rules, and relevant privacy principles. This policy describes our stated practices; it is not a certification of legal compliance. Applicable provisions and commencement dates depend on the law and rules in force
              </p>
              <p>
                This Privacy Policy explains how we collect, process, safeguard, and respect your data when you visit our website (<strong>sahadhyayi.com</strong>), use our digital library, interact with fellow readers on the Social Map, or engage with our AI reading companions.
              </p>
            </section>

            {/* 2. Information We Collect */}
            <section id="collection" className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                2. Information We Collect
              </h2>
              <p>
                We adhere strictly to the principle of <em>Data Minimization</em>: we only collect the minimum data necessary to deliver and enrich your literary journey.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#0B0D0C] border border-[#E8E2D9] dark:border-[#222B25] space-y-2">
                  <h3 className="font-bold text-sm text-[#1C201D] dark:text-[#F3F0E7]">
                    A. Personal Information (Provided by You)
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
                    <li>Account profile data: Name, email address, bio, and profile avatar.</li>
                    <li>Reading preferences: Favorite literary genres, target reading pace, and custom avatars.</li>
                    <li>Community posts: Reading group discussions, book reviews, and public comments.</li>
                    <li>Direct inquiries: Messages sent via our support forms or helpline.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#0B0D0C] border border-[#E8E2D9] dark:border-[#222B25] space-y-2">
                  <h3 className="font-bold text-sm text-[#1C201D] dark:text-[#F3F0E7]">
                    B. Reading & Telemetry Data (Generated Through Use)
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
                    <li>Reading milestones: Progress percentage, page bookmarks, and reading streaks.</li>
                    <li>Marginalia: Highlighted text excerpts and notes (flagged as private or public).</li>
                    <li>Device & security telemetry: IP address (for fraud/security logging), browser type, and offline cache manifests.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 3. How We Use Your Information */}
            <section id="usage" className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                3. How We Use Your Information
              </h2>
              <ul className="list-disc list-inside space-y-2 pl-1">
                <li><strong>Service Delivery:</strong> To provide seamless digital PDF viewing, synchronize reading positions across devices, and manage your personal bookshelf.</li>
                <li><strong>Taste Matching (Reading DNA):</strong> To compute literary affinity percentages between kindred readers who share reading tastes.</li>
                <li><strong>Community Enablement:</strong> To facilitate silent Pomodoro sprint rooms, chapter discussions, and author Q&A conferences.</li>
                <li><strong>Platform Security:</strong> To prevent brute-force attacks, sanitize uploads, verify copyright adherence, and enforce community safety.</li>
              </ul>
            </section>

            {/* 4. Social Map & Location Privacy */}
            <section id="social-map-privacy" className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                4. Social Map & Location Privacy
              </h2>
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-900 dark:text-emerald-300">
                  <Compass className="h-4 w-4" />
                  <span>Strict Bilateral Location Protection</span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-950 dark:text-emerald-200">
                  The Sahadhyayi Social Map allows readers to discover nearby book lovers, historic libraries, bookstores, and literary events.
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-emerald-950/90 dark:text-emerald-200/90 pt-1">
                  <li><strong>Zero Automatic Tracking:</strong> We never query your device location without explicit, voluntary user opt-in.</li>
                  <li><strong>Approximate Coordinates:</strong> For mutual friends and fellow readers, we calculate approximate distances. Exact raw latitude and longitude are never exposed in client payloads or public endpoints.</li>
                  <li><strong>Ghost Mode:</strong> You can toggle Ghost Mode on at any time to instantly vanish from the map while maintaining full access to public spots and events.</li>
                </ul>
              </div>
            </section>

            {/* 5. Sequel & Community Feedback Privacy */}
            <section id="sequel-privacy" className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                5. Sequel & Community Feedback Privacy
              </h2>
              <p>
                To safeguard community trust, voting data on book sequels, edition preferences, and reader feedback is strictly decoupled from individual user identities:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-1 text-xs sm:text-sm">
                <li>Community sequel tallies and polling results are retrieved exclusively through aggregated, counts-only remote procedure calls (RPCs).</li>
                <li>Individual voting rows, comments, and private ratings are never exposed to public viewers or other community members.</li>
              </ul>
            </section>

            {/* 6. Information Sharing & Third Parties */}
            <section id="sharing" className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                6. Information Sharing & Third Parties
              </h2>
              <p>
                We do not sell, rent, monetize, or trade your personal information. Disclosures only occur under the following strict boundaries:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-1">
                <li><strong>With Your Consent:</strong> When you choose to make reading lists or marginalia public to the community.</li>
                <li><strong>Infrastructure Providers:</strong> With strictly vetted cloud hosting and database partners (such as Supabase and Cloudflare) under strict data protection agreements.</li>
                <li><strong>Legal Mandates:</strong> If required by a valid court order, subpoena, or statutory directive under Indian law.</li>
              </ul>
            </section>

            {/* 7. Data Security & Storage */}
            <section id="security" className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                7. Data Security & Storage
              </h2>
              <p>
                We implement industry-standard defense-in-depth security measures:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-1 text-xs sm:text-sm">
                <li><strong>Encryption:</strong> All web traffic is encrypted in transit via TLS 1.3. Stored database records are encrypted at rest with AES-256.</li>
                <li><strong>Row-Level Security (RLS):</strong> Database-level policies ensure that users can only access their own private data and authorized public collections.</li>
                <li><strong>Zero Password Exposure:</strong> Authentication credentials and passwords are encrypted using secure cryptographic hashing; plain-text passwords are never visible to our administrators.</li>
              </ul>
            </section>

            {/* 8. Your Rights as a Data Principal */}
            <section id="rights" className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                8. Your Rights as a Data Principal
              </h2>
              <p>
                Under the DPDP Act 2023, you hold comprehensive rights regarding your digital personal data:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-3 rounded-xl border border-[#E8E2D9] dark:border-[#222B25] bg-[#FAF7F2] dark:bg-[#0B0D0C]">
                  <strong>Right to Access:</strong> View all personal data, reading records, and notes associated with your account.
                </div>
                <div className="p-3 rounded-xl border border-[#E8E2D9] dark:border-[#222B25] bg-[#FAF7F2] dark:bg-[#0B0D0C]">
                  <strong>Right to Correction:</strong> Update outdated biographical details, reading preferences, or email credentials.
                </div>
                <div className="p-3 rounded-xl border border-[#E8E2D9] dark:border-[#222B25] bg-[#FAF7F2] dark:bg-[#0B0D0C]">
                  <strong>Right to Erasure:</strong> Delete your profile, personal library, and marginalia permanently from our systems.
                </div>
                <div className="p-3 rounded-xl border border-[#E8E2D9] dark:border-[#222B25] bg-[#FAF7F2] dark:bg-[#0B0D0C]">
                  <strong>Right to Grievance Redressal:</strong> Submit grievances directly to our appointed Grievance Officer for prompt resolution.
                </div>
              </div>
            </section>

            {/* 9. AI Assistant & Model Training */}
            <section id="ai-governance" className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                9. AI Assistant, Model Training & Data Protection (India DPDP Act 2023)
              </h2>
              <div className="space-y-3 leading-relaxed">
                <p>
                  Sahadhyayi offers an interactive AI reading assistant and Book Expert powered by retrieval-augmented generation (RAG). In alignment with India's <strong>Digital Personal Data Protection (DPDP) Act 2023</strong>:
                </p>
                <ul className="list-disc list-inside space-y-2 pl-1">
                  <li>
                    <strong>Explicit Consent for AI Training:</strong> Chat conversations and search queries are processed solely to fulfill your requests in real time. We do <em>not</em> store or use your chatbot interactions for AI model fine-tuning unless you have provided explicit, informed consent.
                  </li>
                  <li>
                    <strong>Opt-Out & Right to Withdraw:</strong> You maintain the unconditional right to withdraw consent at any time. When opted out, no prompts, completions, or book interaction logs are written to training repositories.
                  </li>
                  <li>
                    <strong>Purpose Limitation & Data Minimization:</strong> Any consented training samples are anonymized, stripped of direct identifiers, and utilized strictly for improving literary recommendations and contextual book assistance.
                  </li>
                  <li>
                    <strong>Right to Erasure & Grievance Redressal:</strong> In accordance with the DPDP Act 2023, you may request the deletion of any stored conversation logs or training records by contacting our Grievance Officer at <a href={`mailto:${SAHADHYAYI_EMAIL}`} className="text-[#1C442D] dark:text-[#D5B16D] font-semibold underline">{SAHADHYAYI_EMAIL}</a>.
                  </li>
                </ul>
              </div>
            </section>

            {/* 10. Cookies and Tracking */}
            <section id="cookies" className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                10. Cookies and Tracking
              </h2>
              <p>
                We use strictly necessary cookies for session authentication, functional storage for reading preferences (font size, reading theme), and anonymous telemetry to maintain platform reliability. For an itemized breakdown of cookies and browser management instructions, please review our comprehensive{" "}
                <a href="/cookie-policy" className="text-[#1C442D] dark:text-[#D5B16D] font-semibold underline">
                  Cookie Policy
                </a>.
              </p>
            </section>

            {/* 11. Data Retention & Account Deletion */}
            <section id="retention" className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                11. Data Retention & Account Deletion
              </h2>
              <p>
                We retain your account data for as long as your profile remains active. If you choose to delete your account, your personal profile, private bookmarks, notes, and avatars are permanently erased from our production databases within 30 days, subject only to necessary legal backup retention.
              </p>
            </section>

            {/* 12. Changes to This Policy */}
            <section id="changes" className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                12. Changes to This Policy
              </h2>
              <p>
                We may periodically update this Privacy Policy to reflect platform evolution or legal enhancements. Whenever material changes occur, we will notify you through an in-app announcement banner or email dispatch. Continued usage of Sahadhyayi after policy updates constitutes acknowledgement of the revised terms.
              </p>
            </section>

            {/* 13. Contact & Grievance Officer */}
            <section id="contact" className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                13. Grievance Redressal & Contact Us
              </h2>
              <p>
                In compliance with the <strong>Information Technology Act, 2000</strong> and the <strong>DPDP Act 2023</strong>, Sahadhyayi has designated a Grievance Redressal Officer to address any privacy or data concerns promptly:
              </p>
              <div className="p-5 rounded-2xl bg-[#FAF7F2] dark:bg-[#0B0D0C] border border-[#E8E2D9] dark:border-[#222B25] space-y-2 text-xs sm:text-sm">
                <p><strong>Designated Grievance Officer:</strong> Legal & Data Privacy Secretariat</p>
                <p><strong>Entity:</strong> Sahadhyayi Reading Community</p>
                <p><strong>Email:</strong> <a href={`mailto:${SAHADHYAYI_EMAIL}`} className="text-[#1C442D] dark:text-[#D5B16D] underline">{SAHADHYAYI_EMAIL}</a></p>
                <p><strong>Helpline:</strong> {SAHADHYAYI_PHONE}</p>
                <p><strong>Jurisdiction:</strong> New Delhi, India</p>
                <p className="text-[#636B65] dark:text-[#A5ADA6] text-xs pt-1">
                  We aim to acknowledge grievances within 24 hours and resolve them within 15 calendar days where practicable. Statutory timelines and escalation rights under applicable law prevail
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;
