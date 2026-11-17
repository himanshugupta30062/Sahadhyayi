import React from "react";
import { HeartHandshake, ShieldCheck, MessageCircle, Flag, Users, BookOpen, Lock, AlertTriangle, Printer, Mail } from "lucide-react";
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
  ["purpose", "1. Our community values"],
  ["respect", "2. Respectful participation"],
  ["content", "3. Content and discussion"],
  ["copyright", "4. Copyright and attribution"],
  ["safety", "5. Safety and prohibited conduct"],
  ["privacy", "6. Privacy and personal information"],
  ["messages", "7. Direct messages and reading spaces"],
  ["ai", "8. AI-generated and automated content"],
  ["report", "9. Reporting concerns"],
  ["enforcement", "10. Moderation and enforcement"],
  ["appeals", "11. Appeals and review"],
  ["updates", "12. Updates and contact"],
];

const CommunityGuidelines: React.FC = () => {
  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <>
      <SEO
        title="Community Guidelines - Sahadhyayi"
        description="Read Sahadhyayi's community standards for respectful discussions, reading groups, stories, reviews, messaging, safety and moderation."
        canonical="https://sahadhyayi.com/community-guidelines"
        url="https://sahadhyayi.com/community-guidelines"
        keywords={["Sahadhyayi community guidelines", "reader community rules", "safe reading groups", "content moderation", "report abuse"]}
        breadcrumbs={[
          { name: "Home", url: "https://sahadhyayi.com" },
          { name: "Community Guidelines", url: "https://sahadhyayi.com/community-guidelines" },
        ]}
      />
      <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#0B0D0C] text-[#1C201D] dark:text-[#F3F0E7] py-8 sm:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-7">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D9] dark:border-[#222B25] pb-4">
            <nav aria-label="Breadcrumb" className="inline-flex items-center gap-2 text-xs text-[#636B65] dark:text-[#A5ADA6]">
              <a href="/" className="hover:underline">Home</a><span>/</span><span>Community</span><span>/</span>
              <span className="font-semibold text-[#1C201D] dark:text-[#F3F0E7]">Guidelines</span>
            </nav>
            <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-xl">
              <Printer className="h-3.5 w-3.5 mr-1.5" /> Print / Save PDF
            </Button>
          </div>

          <nav aria-label="Legal policies" className="flex flex-wrap gap-2">
            {navLinks.map((link) => (
              <Button key={link.href} asChild variant={link.href === "/community-guidelines" ? "default" : "outline"} size="sm"
                className={link.href === "/community-guidelines" ? "rounded-xl bg-[#1C442D] text-white dark:bg-[#D5B16D] dark:text-[#0B0D0C]" : "rounded-xl border-[#E8E2D9] dark:border-[#29332D]"}>
                <a href={link.href}>{link.label}</a>
              </Button>
            ))}
          </nav>

          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-[#1C442D] text-white dark:bg-[#D5B16D] dark:text-[#0B0D0C]">A thoughtful space for readers</Badge>
              <Badge variant="outline">Safety • Respect • Curiosity</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">Community Guidelines</h1>
            <p className="text-sm text-[#636B65] dark:text-[#A5ADA6]">Last updated: November 17, 2026</p>
            <p className="max-w-3xl text-sm sm:text-base leading-relaxed text-[#636B65] dark:text-[#A5ADA6]">
              Sahadhyayi brings readers, writers, researchers and book lovers together. These guidelines help keep our shared spaces welcoming, useful and safe—whether you are publishing a story, reviewing a book, joining a reading room or sending a message.
            </p>
          </header>

          <Card className="rounded-2xl border-[#E8E2D9] dark:border-[#222B25] bg-white dark:bg-[#141A17] shadow-sm">
            <CardContent className="p-5 sm:p-6 flex gap-3">
              <HeartHandshake className="h-6 w-6 shrink-0 text-[#1C442D] dark:text-[#D5B16D]" />
              <div className="space-y-1 text-sm">
                <p className="font-bold">The simple rule</p>
                <p className="text-[#636B65] dark:text-[#A5ADA6]">Help make Sahadhyayi a place where people can disagree about ideas and books without attacking, intimidating or exposing one another. These rules apply to public and private interactions connected to the platform.</p>
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
            <section id="purpose" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">1. Our community values</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Respect:</strong> Treat members with dignity, regardless of experience, background, reading taste or point of view.</li>
                <li><strong>Curiosity:</strong> Discuss ideas, ask sincere questions and welcome thoughtful disagreement.</li>
                <li><strong>Integrity:</strong> Be honest about authorship, sources, reviews, endorsements and recommendations.</li>
                <li><strong>Safety:</strong> Protect people's boundaries, privacy and ability to participate without intimidation.</li>
              </ul>
            </section>

            <section id="respect" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">2. Respectful participation</h2>
              <p>Critique books, arguments and public ideas—not a person's worth or identity. We do not allow:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Harassment, bullying, threats, stalking, targeted humiliation or repeated unwanted contact.</li>
                <li>Hate speech, slurs or demeaning attacks against people or groups based on protected or personal characteristics.</li>
                <li>Sexual harassment, unwanted sexual content, coercion or exploitative behaviour.</li>
                <li>Impersonation, deceptive identity claims, doxxing or attempts to mobilise others to target a member.</li>
                <li>Encouragement of violence, self-harm, or illegal activity.</li>
              </ul>
              <p>Disagreement, negative reviews and good-faith criticism are welcome when expressed without abuse or threats.</p>
            </section>

            <section id="content" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">3. Content and discussion</h2>
              <p>Keep posts, comments, reviews, articles, stories, reading notes and group discussions relevant and constructive.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>No spam, repetitive promotion, engagement manipulation, fake giveaways, scams or misleading links.</li>
                <li>Do not publish malware, phishing links, malicious files or instructions intended to compromise accounts or devices.</li>
                <li>Do not present fabricated quotations, sources, credentials, reviews or research as genuine.</li>
                <li>Use clear titles and suitable content warnings where a discussion includes sensitive or potentially distressing material.</li>
                <li>Respect spoiler boundaries. Mark major plot reveals and avoid placing spoilers in titles or previews.</li>
                <li>Do not post graphic, sexually explicit or otherwise prohibited content. Content involving the sexual exploitation of minors is strictly prohibited and may be escalated to appropriate authorities.</li>
              </ul>
            </section>

            <section id="copyright" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">4. Copyright and attribution</h2>
              <p>Share only work you created, are licensed to share, have permission to use, or may lawfully use under an applicable exception. Do not upload pirated books, unauthorised scans, paid articles, copied stories or other infringing material.</p>
              <p>Credit creators and cite sources when quoting, adapting or discussing their work. Attribution does not replace permission where permission is required. For reporting and counter-notification information, see our <a href="/dmca" className="underline font-semibold">DMCA & Copyright Policy</a>.</p>
            </section>

            <section id="safety" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">5. Safety and prohibited conduct</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Do not solicit money, financial credentials, passwords, one-time passcodes or sensitive identity documents from members.</li>
                <li>Do not use the platform to coordinate fraud, unlawful sales, extremist recruitment or other illegal activity.</li>
                <li>Do not evade blocks, suspensions or moderation actions by creating replacement accounts.</li>
                <li>Do not exploit platform bugs, scrape private information, automate abusive activity or interfere with service availability.</li>
                <li>Do not share another person's private messages, contact details, precise location or personal documents without a lawful basis and appropriate consent.</li>
              </ul>
            </section>

            <section id="privacy" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">6. Privacy and personal information</h2>
              <p>Share thoughtfully. Avoid posting personal phone numbers, home addresses, private email addresses, identity documents, financial information or another person's location. Do not pressure members to reveal personal details.</p>
              <p>Use available privacy and visibility settings to control what you share. Do not assume that content shared with a group or another member will remain confidential if they are able to copy or disclose it. Review our <a href="/privacy-policy" className="underline font-semibold">Privacy Policy</a> for information about platform data handling.</p>
            </section>

            <section id="messages" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">7. Direct messages and reading spaces</h2>
              <p>Direct messages, buddy reads, reading groups, live reading rooms and other collaborative spaces are covered by these guidelines.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Respect consent and boundaries. Stop contacting someone if they ask you to stop.</li>
                <li>Do not send unsolicited explicit content, threats, repeated promotional messages or suspicious attachments.</li>
                <li>Respect group hosts' reasonable topic, participation and spoiler rules.</li>
                <li>Do not record, redistribute or publish private group conversations without appropriate permission, except where disclosure is necessary to report a safety concern or comply with law.</li>
                <li>Do not misuse reading rooms or group features to impersonate others, disrupt sessions or target participants.</li>
              </ul>
            </section>

            <section id="ai" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">8. AI-generated and automated content</h2>
              <p>AI tools may be used to help create, edit or translate content, but members remain responsible for what they publish. Do not use AI or automation to generate spam, fake engagement, fabricated citations, impersonations, deceptive reviews or targeted harassment.</p>
              <p>Where AI-generated material could reasonably be mistaken for a real person's statement, original reporting, a human-authored review or verified research, disclose its AI-generated or materially AI-assisted nature. Do not present invented quotations, sources or credentials as authentic.</p>
            </section>

            <section id="report" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">9. Reporting concerns</h2>
              <p>If you see content or behaviour that may violate these guidelines, use the in-product report option where available or email <a href={`mailto:${SAHADHYAYI_EMAIL}?subject=Community%20Safety%20Report`} className="underline font-semibold">{SAHADHYAYI_EMAIL}</a> with the subject <strong>Community Safety Report</strong>.</p>
              <p>Include the relevant username, link or location, a brief description, and supporting context. Share only information necessary to investigate. Do not publicly repost harmful content to draw attention to it.</p>
              <p>For immediate danger or suspected criminal activity, contact the appropriate local emergency service or law-enforcement authority. Platform reporting is not an emergency response service.</p>
            </section>

            <section id="enforcement" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">10. Moderation and enforcement</h2>
              <p>We review reports and may take action based on the seriousness, context, credibility and history of the behaviour. Actions may include:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Removing content or limiting its visibility.</li>
                <li>Issuing a warning or requiring changes before content is restored.</li>
                <li>Restricting posting, messaging, uploads, group participation or other features.</li>
                <li>Temporarily suspending or permanently disabling an account.</li>
                <li>Preserving relevant information or referring matters to appropriate authorities where required or permitted by law.</li>
              </ul>
              <p>We may take immediate action for credible threats, exploitation, serious privacy violations, illegal material or urgent risks. Not every case follows a fixed warning sequence. We aim to apply rules consistently while considering context and protecting affected members.</p>
            </section>

            <section id="appeals" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">11. Appeals and review</h2>
              <p>If you believe a moderation decision was made in error, you may request a review by emailing <a href={`mailto:${SAHADHYAYI_EMAIL}?subject=Community%20Moderation%20Appeal`} className="underline font-semibold">{SAHADHYAYI_EMAIL}</a> with the subject <strong>Community Moderation Appeal</strong>.</p>
              <p>Include the account name, decision or content involved, approximate date and a concise explanation. A review does not guarantee reversal. We may decline repetitive appeals that add no new information, and urgent safety restrictions may remain in place during review.</p>
            </section>

            <section id="updates" className="space-y-3">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C201D] dark:text-[#F3F0E7]">12. Updates and contact</h2>
              <p>We may revise these guidelines as Sahadhyayi's features, community needs and applicable laws evolve. The current version will be published on this page with its latest revision date. Continued use of the community features is subject to the current Terms of Service and applicable policies.</p>
              <div className="p-5 rounded-2xl bg-[#FAF7F2] dark:bg-[#0B0D0C] border border-[#E8E2D9] dark:border-[#222B25] space-y-2">
                <p className="font-bold flex items-center gap-2"><Mail className="h-4 w-4" /> Community support</p>
                <p><strong>Email:</strong> <a href={`mailto:${SAHADHYAYI_EMAIL}`} className="underline font-semibold">{SAHADHYAYI_EMAIL}</a></p>
                <p><strong>Subjects:</strong> Community Safety Report / Community Moderation Appeal / Guidelines Inquiry</p>
                <p className="text-xs text-[#636B65] dark:text-[#A5ADA6]">Please avoid sending passwords, one-time passcodes or unnecessary sensitive personal information.</p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
};

export default CommunityGuidelines;
