import React from "react";
import {
  FileText,
  ShieldCheck,
  BookOpen,
  Printer,
  Scale,
  Users,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Mail,
  Phone,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SEO from "@/components/SEO";
import { SAHADHYAYI_PHONE, SAHADHYAYI_EMAIL } from "@/components/support/whatsappSupport";

const TermsOfService: React.FC = () => {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const navLinks = [
    { label: "Privacy Policy", href: "/privacy-policy", active: false },
    { label: "Terms of Service", href: "/terms-of-service", active: true },
    { label: "Cookie Policy", href: "/cookie-policy", active: false },
    { label: "DMCA Policy", href: "/dmca", active: false },
    { label: "Community Guidelines", href: "/community-guidelines", active: false },
  ];

  return (
    <>
      <SEO
        title="Terms of Service - Sahadhyayi"
        description="Read Sahadhyayi's terms of service to understand the rules and guidelines for using our reading community platform."
        canonical="https://sahadhyayi.com/terms-of-service"
        url="https://sahadhyayi.com/terms-of-service"
        keywords={[
          "Sahadhyayi terms of service",
          "reading community terms",
          "digital library rules",
          "user agreement",
          "community standards",
        ]}
        breadcrumbs={[
          { name: "Home", url: "https://sahadhyayi.com" },
          { name: "Terms of Service", url: "https://sahadhyayi.com/terms-of-service" },
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
              <span className="font-semibold text-[#1C201D] dark:text-[#F3F0E7]">Terms of Service</span>
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
                User Agreement
              </Badge>
              <Badge variant="outline" className="border-[#1C442D]/30 text-[#1C442D] dark:border-[#D5B16D]/40 dark:text-[#D5B16D] text-[11px]">
                Governed under Indian Jurisdiction
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#1C201D] dark:text-[#F3F0E7]">
              Terms of Service
            </h1>
            <p className="text-sm text-[#636B65] dark:text-[#A5ADA6]">
              Last updated: January 2024 · Comprehensive Revision: November 2026
            </p>
          </div>

          {/* Terms Highlights Card */}
          <Card className="rounded-2xl border-[#E8E2D9] dark:border-[#222B25] bg-gradient-to-br from-amber-50/80 via-white to-amber-100/30 dark:from-[#111714] dark:via-[#141A17] dark:to-[#18221B] shadow-sm">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1C442D] dark:text-[#D5B16D]">
                <Scale className="h-5 w-5" />
                <span>Key Terms Summary</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs leading-relaxed">
                <div className="p-3 rounded-xl bg-white/80 dark:bg-[#0B0D0C]/80 border border-[#E8E2D9] dark:border-[#29332D] space-y-1">
                  <div className="font-semibold text-[#1C201D] dark:text-[#F3F0E7] flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    Open Access & Heritage
                  </div>
                  <p className="text-[#636B65] dark:text-[#A5ADA6]">
                    Our digital library provides free access to public domain and creative commons titles for non-commercial educational reading.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/80 dark:bg-[#0B0D0C]/80 border border-[#E8E2D9] dark:border-[#222B25] space-y-1">
                  <div className="font-semibold text-[#1C201D] dark:text-[#F3F0E7] flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    Respectful Community
                  </div>
                  <p className="text-[#636B65] dark:text-[#A5ADA6]">
                    Harassment, hate speech, and unflagged plot spoilers are strictly prohibited in reading groups, margins, and discussions.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white/80 dark:bg-[#0B0D0C]/80 border border-[#E8E2D9] dark:border-[#222B25] space-y-1">
                  <div className="font-semibold text-[#1C201D] dark:text-[#F3F0E7] flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    Copyright Indemnity
                  </div>
                  <p className="text-[#636B65] dark:text-[#A5ADA6]">
                    Users who contribute PDFs or manuscripts certify they hold appropriate rights or that the material is in the public domain.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Legal Sections Container */}
          <div className="bg-white dark:bg-[#141A17] rounded-3xl border border-[#E8E2D9] dark:border-[#222B25] p-6 sm:p-10 shadow-sm space-y-10 text-sm sm:text-base leading-relaxed text-[#353D37] dark:text-[#D6DDD7]">
            {/* 1. Acceptance of Terms */}
            <section className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing, browsing, registering for, or using Sahadhyayi ("the Service," "Platform," "we," "our," or "us"), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service, along with our Privacy Policy and Community Guidelines.
              </p>
              <p>
                If you do not agree to abide by each and every provision set forth in this agreement, you must refrain from accessing or utilizing any features of the Service.
              </p>
            </section>

            {/* 2. Description of Service */}
            <section className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                2. Description of Service
              </h2>
              <p>
                Sahadhyayi is a digital social reading community platform engineered to foster deep reading, literary connection, and heritage preservation. Our suite of services includes:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-1 text-xs sm:text-sm">
                <li>A digital public-domain library viewer with customizable fonts, themes, and offline page caching.</li>
                <li>Social discovery features including the Social Map, mutual friend locations, and reading spot directories.</li>
                <li>Collaborative reading groups, chapter-locked discussion threads, and synchronized live silent sprint rooms.</li>
                <li>The Sahadhyayi AI Reading Companion and Book Expert for contextual queries and literary explanations.</li>
                <li>Author profiles, conference scheduling, and open academic research paper repositories.</li>
              </ul>
              <p className="text-xs text-[#636B65] dark:text-[#A5ADA6]">
                We reserve the right to evolve, update, or discontinue features of the platform to improve community safety, performance, or regulatory compliance.
              </p>
            </section>

            {/* 3. User Accounts */}
            <section className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                3. User Accounts
              </h2>
              <p>
                To access personalized shelves, Reading DNA matching, or social discussion threads, you must create a user account. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-1 text-xs sm:text-sm">
                <li>Provide accurate, truthful, and up-to-date registration details.</li>
                <li>Maintain the confidentiality of your login credentials and passwords.</li>
                <li>Promptly notify our support desk at <a href={`mailto:${SAHADHYAYI_EMAIL}`} className="text-[#1C442D] dark:text-[#D5B16D] underline">{SAHADHYAYI_EMAIL}</a> if you detect any unauthorized access.</li>
                <li>Accept full responsibility for all content, messages, and actions conducted under your registered account.</li>
                <li>Not operate automated bot accounts, impersonate other individuals, or transfer your account to another party without our prior written consent.</li>
              </ul>
            </section>

            {/* 4. Acceptable Use */}
            <section className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                4. Acceptable Use
              </h2>
              <p>
                Sahadhyayi is dedicated to respectful, thoughtful literary exchange. You explicitly agree not to:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-1 text-xs sm:text-sm">
                <li>Upload, link, or distribute commercial copyrighted books or works for which you lack statutory authorization or publisher permission.</li>
                <li>Engage in harassment, hate speech, defamation, stalking, or discriminatory conduct towards authors or fellow readers.</li>
                <li>Post unsolicited commercial advertisements, spam, affiliate promotions, or deceptive links in reading group discussions.</li>
                <li>Post unflagged major narrative plot spoilers in public feeds; discussions discussing late-stage plot twists must be enclosed in chapter-locked threads.</li>
                <li>Scrape, crawl, or harvest platform text, member profiles, or book indices using automated tools without our written authorization.</li>
                <li>Interfere with or compromise the security, integrity, or server infrastructure of the platform.</li>
              </ul>
            </section>

            {/* 5. Content and Intellectual Property */}
            <section className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                5. Content and Intellectual Property
              </h2>
              <div className="space-y-4 text-xs sm:text-sm">
                <div>
                  <h3 className="text-base font-bold text-[#1C201D] dark:text-[#F3F0E7] mb-1">User-Generated Content</h3>
                  <p>
                    You retain ownership of any original book reviews, margin notes, research articles, and discussions that you author on Sahadhyayi. By posting content publicly on our platform, you grant Sahadhyayi a non-exclusive, worldwide, royalty-free license to display, index, format, and distribute that content to other users on the platform in connection with the Service.
                  </p>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1C201D] dark:text-[#F3F0E7] mb-1">Platform Content & Trademarks</h3>
                  <p>
                    The Sahadhyayi name, logos, custom typography, application codebase, and design system are the exclusive intellectual property of Sahadhyayi and its founders. You may not copy, reverse-engineer, or commercially exploit any software or brand assets without prior written agreement.
                  </p>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1C201D] dark:text-[#F3F0E7] mb-1">Public Domain Works</h3>
                  <p>
                    Digitized classical texts, Sanskrit treatises, and public domain literature hosted on Sahadhyayi are made available for personal, scholarly, and educational enrichment.
                  </p>
                </div>
              </div>
            </section>

            {/* 6. Privacy */}
            <section className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                6. Privacy
              </h2>
              <p>
                Your privacy is paramount. Our collection and handling of personal information, Social Map locations, and AI reading companion queries are governed by our comprehensive{" "}
                <a href="/privacy-policy" className="text-[#1C442D] dark:text-[#D5B16D] font-semibold underline">
                  Privacy Policy
                </a>
                , which is incorporated into these Terms by reference.
              </p>
            </section>

            {/* 7. Termination */}
            <section className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                7. Termination
              </h2>
              <p>
                We reserve the right to suspend or terminate your account and revoke platform access immediately, with or without notice, if you breach any material provision of these Terms of Service or engage in malicious or harmful conduct. You may terminate your account at any time via your profile settings or by contacting our support desk.
              </p>
            </section>

            {/* 8. Disclaimers */}
            <section className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                8. Disclaimers
              </h2>
              <p>
                The Service is provided on an <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> basis without warranties of any kind, whether express or implied. Sahadhyayi makes no guarantees that:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-1 text-xs sm:text-sm">
                <li>The platform will operate completely uninterrupted, bug-free, or continuously accessible at all times.</li>
                <li>AI Companion summaries, character trees, or philosophical analyses are infallible or free from generative variance. AI insights are provided strictly as educational aids and do not constitute professional or historical legal advice.</li>
              </ul>
            </section>

            {/* 9. Limitation of Liability */}
            <section className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                9. Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by applicable law in India, Sahadhyayi, its creators, directors, and affiliates shall not be liable for any indirect, incidental, punitive, or consequential damages resulting from your use of or inability to use the platform, including any data loss, service interruptions, or third-party interactions.
              </p>
            </section>

            {/* 10. Changes to Terms */}
            <section className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                10. Changes to Terms
              </h2>
              <p>
                We reserve the right to revise or update these Terms of Service at our sole discretion. We will inform users of significant modifications by updating the effective date on this page and dispatching an in-app notice. Continued access to the platform following revised Terms signifies your binding acceptance.
              </p>
            </section>

            {/* 11. Contact Information */}
            <section className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7] pb-2 border-b border-[#F0ECE4] dark:border-[#222B25]">
                11. Contact Information
              </h2>
              <p>
                If you have questions, feedback, or legal inquiries regarding these Terms of Service, please contact our legal desk:
              </p>
              <div className="p-5 rounded-2xl bg-[#FAF7F2] dark:bg-[#0B0D0C] border border-[#E8E2D9] dark:border-[#222B25] space-y-2 text-xs sm:text-sm">
                <p><strong>Entity:</strong> Sahadhyayi Reading Community</p>
                <p><strong>Legal Inquiries:</strong> <a href={`mailto:${SAHADHYAYI_EMAIL}`} className="text-[#1C442D] dark:text-[#D5B16D] underline">{SAHADHYAYI_EMAIL}</a></p>
                <p><strong>Phone Helpline:</strong> {SAHADHYAYI_PHONE}</p>
                <p><strong>Governing Jurisdiction:</strong> New Delhi, India</p>
                <p><strong>Dispute Resolution:</strong> Subject to the exclusive jurisdiction of the competent courts in New Delhi, India.</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default TermsOfService;
