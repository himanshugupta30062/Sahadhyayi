import React from "react";
import { Copyright, ShieldCheck, FileText, Scale, Printer, Mail, AlertTriangle, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SEO from "@/components/SEO";
import { SAHADHYAYI_EMAIL } from "@/components/support/whatsappSupport";

const navLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms-of-service" },
  { label: "Cookie Policy", href: "/cookie-policy" },
  { label: "DMCA Policy", href: "/dmca" },
  { label: "Community Guidelines", href: "/community-guidelines" },
];

const sections = [
  ["scope", "1. Scope and purpose"],
  ["rights", "2. Respect for copyright"],
  ["notice", "3. Submit a copyright notice"],
  ["review", "4. Review and action"],
  ["counter", "5. Counter-notification"],
  ["repeat", "6. Repeat infringement"],
  ["misuse", "7. Misrepresentation and misuse"],
  ["exceptions", "8. Copyright exceptions"],
  ["uploads", "9. User uploads and library content"],
  ["law", "10. Applicable law and platform role"],
  ["changes", "11. Policy updates"],
  ["contact", "12. Contact"],
];

const DmcaPolicy: React.FC = () => {
  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <>
      <SEO
        title="DMCA & Copyright Policy - Sahadhyayi"
        description="Learn how to report copyright infringement, submit a counter-notice, and understand Sahadhyayi's copyright review process."
        canonical="https://sahadhyayi.com/dmca"
        url="https://sahadhyayi.com/dmca"
        keywords={["Sahadhyayi DMCA policy", "copyright infringement notice", "copyright takedown", "counter notification", "India Copyright Act"]}
        breadcrumbs={[
          { name: "Home", url: "https://sahadhyayi.com" },
          { name: "DMCA & Copyright Policy", url: "https://sahadhyayi.com/dmca" },
        ]}
      />
      <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7] py-8 sm:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D9] dark:border-[#222B25] pb-4">
            <nav aria-label="Breadcrumb" className="inline-flex items-center gap-2 text-xs text-[#636B65] dark:text-[#A5ADA6]">
              <a href="/" className="hover:underline">Home</a><span>/</span><span>Legal</span><span>/</span>
              <span className="font-semibold text-[#1C201D] dark:text-[#F3F0E7]">DMCA & Copyright</span>
            </nav>
            <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-xl">
              <Printer className="h-3.5 w-3.5 mr-1.5" /> Print / Save PDF
            </Button>
          </div>

          <nav aria-label="Legal policies" className="flex flex-wrap gap-2">
            {navLinks.map((link) => (
              <Button key={link.href} asChild variant={link.href === "/dmca" ? "default" : "outline"} size="sm"
                className={link.href === "/dmca" ? "rounded-xl bg-[#1C442D] text-white dark:bg-[#D5B16D] dark:text-[#0B0D0C]" : "rounded-xl border-[#E8E2D9] dark:border-[#29332D]"}>
                <a href={link.href}>{link.label}</a>
              </Button>
            ))}
          </nav>

          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-[#1C442D] text-white dark:bg-[#D5B16D] dark:text-[#0B0D0C]">Copyright & creator rights</Badge>
              <Badge variant="outline">Reporting and review process</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">DMCA & Copyright Policy</h1>
            <p className="text-sm text-[#636B65] dark:text-[#A5ADA6]">Last updated: November 17, 2026</p>
            <p className="max-w-3xl text-sm sm:text-base leading-relaxed text-[#636B65] dark:text-[#A5ADA6]">
              Sahadhyayi supports readers, authors, researchers and literary communities. We respect creators' rights and expect members to share only material they own, have permission to use, or are legally entitled to share.
            </p>
          </header>

          <Card className="rounded-2xl border-[#E8E2D9] dark:border-[#222B25] bg-white dark:bg-[#141A17] shadow-sm">
            <CardContent className="p-5 sm:p-6 flex gap-3">
              <ShieldCheck className="h-6 w-6 shrink-0 text-[#1C442D] dark:text-[#D5B16D]" />
              <div className="space-y-1 text-sm">
                <p className="font-bold">Important distinction</p>
                <p className="text-[#636B65] dark:text-[#A5ADA6]">
                  The DMCA is a United States law. This page explains a DMCA-style notice process where applicable and our broader copyright response practices. It does not claim that Sahadhyayi is registered with the U.S. Copyright Office as a DMCA agent or that every DMCA safe-harbour requirement is satisfied. Indian law and other applicable local laws may also apply.
                </p>
              </div>
            </CardContent>
          </Card>

          <section className="p-4 sm:p-5 rounded-2xl border border-[#E8E2D9] dark:border-[#222B25] bg-white dark:bg-[#141A17] space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#1C442D] dark:text-[#D5B16D]">On this page</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              {sections.map(([id, title]) => <a key={id} href={`#${id}`} className="text-[#636B65] dark:text-[#A5ADA6] hover:underline">{title}</a>)}
            </div>
          </section>

          <div className="bg-white dark:bg-[#141A17] rounded-3xl border border-[#E8E2D9] dark:border-[#222B25] p-6 sm:p-10 shadow-sm space-y-10 text-sm sm:text-base leading-relaxed text-[#353D37] dark:text-[#D6DDD7]">
            <section id="scope" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">1. Scope and purpose</h2>
              <p>This policy applies to material made available through Sahadhyayi, including book and document listings, uploaded files, excerpts, articles, stories, images, profile content, reviews, comments, messages and other user submissions. It should be read with our <a className="underline font-semibold" href="/terms-of-service">Terms of Service</a> and <a className="underline font-semibold" href="/community-guidelines">Community Guidelines</a>.</p>
              <p>We may review a report even if the material is hosted by a third party or linked from Sahadhyayi. Our ability to remove or disable third-party material may be limited; we can review and remove or restrict the link or listing on our platform where appropriate.</p>
            </section>

            <section id="rights" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">2. Respect for copyright</h2>
              <p>Do not upload, distribute, reproduce, scan, share or link to copyrighted material unless you own the rights, have permission, or a valid legal exception applies. This includes complete books, paid course material, articles, research papers, illustrations, photographs, audiobook recordings and translations.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Credit or attribution alone does not create permission to reproduce a work.</li>
                <li>Buying or possessing a copy does not normally give you the right to upload or distribute it.</li>
                <li>Do not remove copyright notices, watermarks, digital rights information or other ownership details.</li>
                <li>Only share public-domain or openly licensed works in accordance with the applicable licence and its conditions.</li>
              </ul>
            </section>

            <section id="notice" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">3. Submit a copyright notice</h2>
              <p>If you are the copyright owner or authorised to act for one, send a written notice to <a className="underline font-semibold" href={`mailto:${SAHADHYAYI_EMAIL}?subject=Copyright%20Takedown%20Notice`}>{SAHADHYAYI_EMAIL}</a> with the subject <strong>Copyright Takedown Notice</strong>. Include as much of the following as applies:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Your full name and contact details, including a working email address.</li>
                <li>Identification of the copyrighted work. If multiple works are involved, provide a representative list.</li>
                <li>The exact URL(s) or clear location(s) of the material you believe is infringing, plus enough detail for us to find it.</li>
                <li>An explanation of your ownership or authority to act for the rights holder.</li>
                <li>A statement that you have a good-faith belief the disputed use is not authorised by the rights holder, its agent or the law.</li>
                <li>A statement that the information is accurate and, where the applicable legal procedure requires it, that you are authorised to act on behalf of the rights holder.</li>
                <li>Your physical or electronic signature.</li>
              </ol>
              <div className="rounded-xl border border-[#E8E2D9] dark:border-[#29332D] bg-[#FAF7F2] dark:bg-[#0B0D0C] p-4 space-y-2">
                <p className="font-bold flex items-center gap-2"><FileText className="h-4 w-4" /> Suggested email subject</p>
                <p className="font-mono text-xs">Copyright Takedown Notice – [work title] – [URL]</p>
                <p className="text-xs text-[#636B65] dark:text-[#A5ADA6]">Please do not send passwords, payment card details or unrelated sensitive personal information. We may request reasonable additional information to verify a report.</p>
              </div>
            </section>

            <section id="review" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">4. Review and action</h2>
              <p>We assess notices for completeness, credibility, jurisdiction and the location of the reported material. We may acknowledge receipt, ask for clarification, preserve relevant records, restrict access to the material while reviewing it, remove or disable access where appropriate, and notify the person who submitted it.</p>
              <p>Where lawful and appropriate, we may share the notice or relevant details with the uploader so they can understand and respond to the claim. We may withhold information where disclosure could create a safety, privacy or legal risk.</p>
              <p>We aim to handle complete notices promptly, but we do not promise a fixed review or removal time. The outcome depends on the facts, applicable law, completeness of the notice and any response received. A report is not automatically proof of infringement.</p>
            </section>

            <section id="counter" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">5. Counter-notification</h2>
              <p>If your material was restricted because of a copyright report and you believe the action resulted from a mistake, misidentification, licence or legal exception, contact us at <a className="underline font-semibold" href={`mailto:${SAHADHYAYI_EMAIL}?subject=Copyright%20Counter%20Notice`}>{SAHADHYAYI_EMAIL}</a> with the subject <strong>Copyright Counter-Notice</strong>.</p>
              <p>Explain what was removed or restricted, identify its former location, describe why you believe the action was mistaken or the use is authorised, and provide your name and a reliable contact email. Include supporting licence, permission or ownership evidence where available.</p>
              <p>For a formal counter-notification under U.S. DMCA Section 512(g), additional statutory statements, signature and consent-to-jurisdiction requirements may apply. We will explain any additional information needed for that process. Do not include a U.S. jurisdiction declaration unless you understand and can make it truthfully.</p>
              <p>We will review a counter-notice and may forward it to the original complainant where legally appropriate. Restoration is not automatic; it depends on the applicable legal process, any court action or other valid objection, and the circumstances of the case.</p>
            </section>

            <section id="repeat" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">6. Repeat infringement</h2>
              <p>We may apply proportionate measures to accounts that repeatedly submit infringing material or ignore valid copyright decisions. Depending on severity, history and applicable law, measures may include content removal, upload restrictions, feature limitations, temporary suspension or account termination.</p>
              <p>We consider the context and available evidence before taking account-level action. We may immediately restrict material or accounts in serious cases, including where necessary to protect users or comply with law.</p>
            </section>

            <section id="misuse" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">7. Misrepresentation and misuse</h2>
              <p>Copyright notices and counter-notices must be accurate and submitted in good faith. Knowingly submitting materially false or misleading claims may expose the sender to legal consequences, including under applicable law and, where relevant, DMCA Section 512(f). We may decline to act on abusive, fraudulent, threatening or clearly incomplete reports.</p>
              <p>Do not use the copyright process to silence criticism, reviews, lawful quotation, fair dealing or other protected expression.</p>
            </section>

            <section id="exceptions" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">8. Copyright exceptions</h2>
              <p>Some uses may be permitted without the copyright owner's permission under applicable exceptions or limitations. In India, the Copyright Act, 1957 includes specific fair-dealing and other permitted-use provisions; the scope depends on the work, purpose and circumstances. U.S. fair use is a separate legal doctrine and is not automatically interchangeable with Indian fair dealing.</p>
              <p>We consider relevant context and information provided by both parties. Sahadhyayi does not make a binding legal determination of copyright ownership or infringement.</p>
            </section>

            <section id="uploads" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">9. User uploads and library content</h2>
              <p>Submitting a file, book record, excerpt, review, story or link does not transfer ownership to Sahadhyayi. You remain responsible for ensuring you have the necessary rights and permissions. Any platform licence granted by you is governed by our Terms of Service and does not replace third-party permissions.</p>
              <p>Where a book or document is listed for discovery, users should check the source and licence before downloading or sharing it. A public URL, search result, library listing or availability on another website does not by itself establish that a work is public domain or lawfully distributable.</p>
            </section>

            <section id="law" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">10. Applicable law and platform role</h2>
              <p>Sahadhyayi operates from India. Copyright matters may be governed by the Indian Copyright Act, 1957, applicable rules and court orders, and the laws of other jurisdictions where relevant. Our response may also take account of applicable intermediary obligations, including the Information Technology Act, 2000 and rules in force.</p>
              <p>This policy is an operational explanation, not legal advice, a guarantee of intermediary safe-harbour status, or a waiver of any rights or defences available under law. Rights holders and users may wish to obtain independent legal advice.</p>
            </section>

            <section id="changes" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">11. Policy updates</h2>
              <p>We may update this policy to reflect changes in our services, moderation processes or applicable law. The revised version will be published here with an updated date. Material changes may also be communicated through an appropriate platform notice.</p>
            </section>

            <section id="contact" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">12. Contact</h2>
              <div className="p-5 rounded-2xl bg-[#FAF7F2] dark:bg-[#0B0D0C] border border-[#E8E2D9] dark:border-[#222B25] space-y-2">
                <p className="font-bold flex items-center gap-2"><Mail className="h-4 w-4" /> Copyright reports and questions</p>
                <p><strong>Email:</strong> <a className="underline font-semibold" href={`mailto:${SAHADHYAYI_EMAIL}`}>{SAHADHYAYI_EMAIL}</a></p>
                <p><strong>Suggested subjects:</strong> Copyright Takedown Notice / Copyright Counter-Notice / Copyright Policy Inquiry</p>
                <p className="text-xs text-[#636B65] dark:text-[#A5ADA6]">This email is the contact channel for copyright reports. It is not a representation that a DMCA agent has been registered with the U.S. Copyright Office.</p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
};

export default DmcaPolicy;
