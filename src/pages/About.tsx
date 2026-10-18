import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Target,
  Users,
  TrendingUp,
  Heart,
  Globe,
  Mail,
  Sparkles,
  Phone,
  ArrowRight,
  ShieldCheck,
  Radio,
  Quote,
  Lock,
  Dna,
  Compass,
} from "lucide-react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client-universal";

const About = () => {
  const values = [
    {
      icon: BookOpen,
      title: "Deep, Sustained Reading",
      description:
        "We believe in the transformative power of focused, immersive reading that restores concentration and exercises critical thinking.",
    },
    {
      icon: Users,
      title: "Collaborative Community",
      description:
        "Reading is better together. We connect readers worldwide to annotate margins, debate chapters, and build intellectual companionships.",
    },
    {
      icon: Heart,
      title: "Mindful Digital Health",
      description:
        "We champion distraction-free reading environments that protect your eye health, calm mental clutter, and counter algorithmic dopamine loops.",
    },
    {
      icon: Globe,
      title: "Global Literary Commons",
      description:
        "Starting in India and expanding globally, we aim to revitalize deep reading culture and make timeless literature accessible to everyone.",
    },
  ];

  const stats = [
    { icon: Target, number: "12,500+", label: "Curated Books" },
    { icon: Sparkles, number: "Heritage", label: "Sanskrit Roots" },
    { icon: Radio, number: "Live Rooms", label: "Silent Sprints" },
    { icon: Quote, number: "Marginalia", label: "Shared Notes" },
  ];

  const pillars = [
    {
      icon: BookOpen,
      title: "Distraction-Free Reader",
      description: "Clean typography, night mode, and reading progress auto-saved across devices.",
      link: "/library",
      cta: "Explore Library",
      badge: "Library",
    },
    {
      icon: Radio,
      title: "Live Reading Rooms",
      description: "Silent co-reading sprints with Pomodoro focus timers alongside readers globally.",
      link: "/social?tab=rooms",
      cta: "Join a Room",
      badge: "Live",
    },
    {
      icon: Quote,
      title: "Public Marginalia",
      description: "Highlight lines and share margin notes that fellow readers can see right on the page.",
      link: "/social?tab=margins",
      cta: "Browse Margins",
      badge: "Community",
    },
    {
      icon: Lock,
      title: "Spoiler-Safe Threads",
      description: "Chapter-locked discussions so nobody ever gets spoiled on midway plot twists.",
      link: "/social?tab=threads",
      cta: "Explore Threads",
      badge: "Spoiler-Free",
    },
    {
      icon: Dna,
      title: "Reading DNA Matching",
      description: "Discover readers who share your literary taste, favorite genres, and reading cadence.",
      link: "/social?tab=dna",
      cta: "Match DNA",
      badge: "Taste Match",
    },
    {
      icon: Users,
      title: "Reading Groups",
      description: "Join or create book clubs, chat with fellow members, and invite friends via link.",
      link: "/social?tab=groups",
      cta: "Find Circles",
      badge: "Groups",
    },
  ];

  const faqs = [
    {
      question: "What does Sahadhyayi mean?",
      answer:
        "Sahadhyayi (सहाध्यायी) is an ancient Sanskrit word meaning 'fellow reader' or 'study companion.' It is formed by joining 'saha' (together) and 'adhyayi' (one who reads or studies). In classical Indian scholastic tradition, a Sahadhyayi was someone who learned alongside you, shared insights, and enriched your understanding of the text.",
    },
    {
      question: "How is Sahadhyayi different from other reading platforms?",
      answer:
        "Most reading apps treat books as solitary digital files or push algorithmic feeds. Sahadhyayi weaves books directly into a living community: synchronous silent reading rooms, public marginalia on shared pages, spoiler-protected chapter threads, and taste-matching literary DNA.",
    },
    {
      question: "Is Sahadhyayi completely free to use?",
      answer:
        "Yes! Sahadhyayi is free to explore, read, annotate, and connect. Our curated library of 12,500+ public-domain and indie books, distraction-free web reader, and community social hub are open to all readers.",
    },
    {
      question: "How does Sahadhyayi help me read more consistently?",
      answer:
        "Through social accountability and habit mechanics: synchronized silent sprints, progress tracking that saves on every page change, community reading circles, and reader matching that keeps you motivated to finish what you start.",
    },
    {
      question: "Can I connect directly with authors on Sahadhyayi?",
      answer:
        "Yes! Authors on Sahadhyayi can publish books, host reading rooms, answer questions in chapter threads, and connect with their most engaged readers directly without algorithmic gatekeeping.",
    },
  ];

  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const contactSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    message: z.string().min(1, "Message is required"),
  });

  type ContactFormValues = z.infer<typeof contactSchema>;

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", message: "" },
  });

  const handleContactSubmit = async (values: ContactFormValues) => {
    setLoading(true);
    setSuccess(false);

    let dbSaved = false;
    let dbErrorMsg: string | null = null;
    let emailSent = false;
    let emailErrorMsg: string | null = null;

    try {
      // 1. Record message in the database so no submission is lost
      const { error: dbError } = await supabase.from("contact_messages").insert([
        {
          name: values.name,
          email: values.email,
          message: values.message,
        },
      ]);

      if (dbError) {
        dbSaved = false;
        dbErrorMsg = dbError.message || "Database insert error";
        console.error("[About] Could not insert into contact_messages:", dbError);
      } else {
        dbSaved = true;
      }

      // 2. Dispatch email to gyan@sahadhyayi.com via the Supabase Edge Function
      try {
        const { data, error: emailError } = await supabase.functions.invoke("send-contact-email", {
          body: {
            name: values.name,
            email: values.email,
            message: values.message,
          },
        });

        if (emailError) {
          let parsedMsg = emailError.message;
          try {
            if ("context" in emailError && typeof (emailError as any).context?.json === "function") {
              const body = await (emailError as any).context.json();
              if (body?.error) parsedMsg = body.error;
            }
          } catch {
            // keep fallback
          }
          emailSent = false;
          emailErrorMsg = parsedMsg;
          console.error("[About] Edge email notification failed:", emailError);
        } else if (data && typeof data === "object" && data.success) {
          emailSent = true;
        } else {
          emailSent = false;
          emailErrorMsg = data?.error || "Email dispatch failed";
        }
      } catch (edgeErr: any) {
        emailSent = false;
        emailErrorMsg = edgeErr?.message || "Network error invoking email service";
        console.error("[About] Edge function invocation error:", edgeErr);
      }

      // 3. User feedback and state handling
      if (emailSent) {
        toast({
          title: "Message sent!",
          description: dbSaved
            ? "Thank you! Your message was delivered to gyan@sahadhyayi.com and recorded in our inbox."
            : "Thank you! Your message was delivered to gyan@sahadhyayi.com.",
        });
        form.reset();
        setSuccess(true);
      } else {
        // Email failed: preserve form inputs, do not fake success with mailto redirect
        if (dbSaved) {
          toast({
            title: "Message saved to inbox",
            description: `Your message was saved to our inbox, but email delivery to gyan@sahadhyayi.com failed (${emailErrorMsg || "Email error"}). You can also send directly via the Email App button below.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Failed to send message",
            description: emailErrorMsg || dbErrorMsg || "Please check your connection or send via your Email App below.",
            variant: "destructive",
          });
        }
      }
    } catch (err: any) {
      console.error("[About] Unexpected contact form error:", err);
      toast({
        title: "Submission Error",
        description: err?.message || "An unexpected error occurred. Please try again or use the Email App button.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDirectEmail = () => {
    const currentValues = form.getValues();
    const subject = encodeURIComponent(
      `Contact message from ${currentValues.name || "Reader"} (Sahadhyayi)`
    );
    const body = encodeURIComponent(
      `Name: ${currentValues.name || ""}\nEmail: ${currentValues.email || ""}\n\nMessage:\n${currentValues.message || ""}`
    );
    window.location.href = `mailto:gyan@sahadhyayi.com?subject=${subject}&body=${body}`;
  };

  const aboutSchema = {
    "@type": "AboutPage",
    name: "About Sahadhyayi - What Sahadhyayi Means & Founder Story",
    description:
      "Learn about Sahadhyayi's mission to revive reading culture. Discover what Sahadhyayi means in Sanskrit and meet founder Himanshu Gupta.",
    url: "https://sahadhyayi.com/about",
    mainEntity: {
      "@type": "Organization",
      name: "Sahadhyayi",
      description:
        "Sahadhyayi means 'fellow reader' in Sanskrit. Our digital platform is dedicated to reviving deep reading culture and connecting readers worldwide.",
      url: "https://sahadhyayi.com",
      foundingDate: "2024",
      founder: {
        "@type": "Person",
        name: "Himanshu Gupta",
        jobTitle: "Founder",
        email: "gyan@sahadhyayi.com",
        telephone: "8264135459",
      },
    },
  };

  const faqSchema = {
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [aboutSchema, faqSchema],
  };

  const aboutBreadcrumbs = [
    { name: "Home", url: "https://sahadhyayi.com" },
    { name: "About", url: "https://sahadhyayi.com/about" },
  ];

  return (
    <>
      <SEO
        title="About Sahadhyayi - Reviving Deep Reading Culture & Founder Story"
        description="Learn about Sahadhyayi's mission to revive deep reading and connect readers globally. Discover what Sahadhyayi means in Sanskrit and meet founder Himanshu Gupta."
        canonical="https://sahadhyayi.com/about"
        url="https://sahadhyayi.com/about"
        keywords={[
          "About Sahadhyayi",
          "Himanshu Gupta Founder",
          "Sahadhyayi meaning",
          "fellow reader in Sanskrit",
          "reading community",
          "digital library",
          "deep reading culture",
        ]}
        schema={structuredData}
        breadcrumbs={aboutBreadcrumbs}
      />

      <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-20">
          {/* ── 1. Hero Section ── */}
          <section className="text-center pt-4 sm:pt-8 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-xs sm:text-sm font-medium text-brand-primary mb-6 shadow-xs">
              <Sparkles className="w-4 h-4" />
              <span>सहाध्यायी · Fellow Reader &amp; Study Companion</span>
            </div>

            <div className="flex justify-center mb-6">
              <img
                src="/lovable-uploads/sahadhyayi-logo-digital-reading.png"
                alt="Sahadhyayi Logo - Fellow Reader in Sanskrit"
                className="w-20 h-20 sm:w-24 sm:h-24 drop-shadow-md"
              />
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-foreground mb-6 leading-tight">
              Reviving the Lost Art of <span className="text-brand-primary">Deep Reading</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              In an age of infinite scrolls and fleeting attention, Sahadhyayi is a quiet sanctuary.
              We unite readers worldwide to read thoughtfully, annotate openly, and grow as intellectual companions.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
              <Link to="/library">
                <Button size="lg" className="bg-brand-primary hover:bg-brand-primary/90 text-white gap-2 h-12 px-6 shadow-md shadow-brand-primary/20">
                  <BookOpen className="w-4 h-4" />
                  Explore Free Library
                </Button>
              </Link>
              <Link to="/social">
                <Button size="lg" variant="outline" className="border-border hover:bg-muted gap-2 h-12 px-6">
                  <Users className="w-4 h-4" />
                  Join the Community
                </Button>
              </Link>
            </div>
          </section>

          {/* ── 2. Sanskrit Roots & Etymology ── */}
          <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-brand-primary/8 via-card to-brand-secondary/8 p-8 sm:p-12 shadow-sm">
            <div className="grid md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-primary">
                  <Compass className="w-4 h-4" />
                  <span>The Story Behind Our Name</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
                  What is Sahadhyayi?
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Sahadhyayi (सहाध्यायी)</strong> is a classical Sanskrit compound word:
                </p>

                {/* Etymology Breakdown Pills */}
                <div className="grid sm:grid-cols-2 gap-3 py-2">
                  <div className="p-4 rounded-2xl bg-background/80 border border-border backdrop-blur-xs">
                    <div className="text-sm font-semibold text-brand-primary">सह (Saha)</div>
                    <div className="text-xs text-muted-foreground mt-0.5 font-medium">Together · Alongside · In Fellowship</div>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      Learning was never meant to be a competitive isolation, but a shared pursuit.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-background/80 border border-border backdrop-blur-xs">
                    <div className="text-sm font-semibold text-brand-primary">अध्यायी (Adhyayi)</div>
                    <div className="text-xs text-muted-foreground mt-0.5 font-medium">One Who Reads · Studies · Reflects</div>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      Someone who engages deeply with literature and ideas rather than skimming surfaces.
                    </p>
                  </div>
                </div>

                <p className="text-muted-foreground leading-relaxed text-sm">
                  In ancient Indian Gurukul tradition, your Sahadhyayi was the peer who debated verses with you, questioned your premises, and read by lantern light until understanding blossomed. Sahadhyayi brings this timeless bond into modern digital life.
                </p>
              </div>

              {/* Sanskrit Pronunciation Card */}
              <div className="md:col-span-5">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                  <div className="text-center pb-4 border-b border-border">
                    <div className="text-4xl font-serif font-bold text-brand-primary tracking-wide">सहाध्यायी</div>
                    <div className="text-xs text-muted-foreground mt-1 font-mono">[sə-hɑː-dʱjɑː-jiː]</div>
                    <div className="text-sm font-medium text-foreground mt-2">noun · Sanskrit · masculine/feminine</div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Literal Meaning</span>
                      <span className="font-semibold text-foreground">Fellow Reader / Study Companion</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Core Mission</span>
                      <span className="font-semibold text-foreground">Reviving Focused Reading</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Community Style</span>
                      <span className="font-semibold text-foreground">Book-Native &amp; Collaborative</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-muted-foreground">Founded In</span>
                      <span className="font-semibold text-foreground">India · Open Worldwide</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── 3. Meet the Founder (About Me) ── */}
          <section id="founder" className="scroll-mt-16">
            <Card className="border-border bg-card rounded-3xl overflow-hidden shadow-xs">
              <div className="bg-gradient-to-r from-brand-primary/10 via-brand-primary/5 to-transparent px-6 sm:px-10 py-6 border-b border-border">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-primary">
                    <Sparkles className="w-4 h-4" />
                    <span>Meet the Creator</span>
                  </div>
                  <Badge variant="outline" className="border-brand-primary/30 text-brand-primary bg-brand-primary/5">
                    Founder's Note
                  </Badge>
                </div>
              </div>

              <CardContent className="p-6 sm:p-10 space-y-10">
                <div className="grid lg:grid-cols-12 gap-8 items-start">
                  {/* Left: Founder Profile Card */}
                  <div className="lg:col-span-5 flex flex-col items-center sm:items-start gap-4">
                    <div className="relative group">
                      <img
                        src="/lovable-uploads/sahadhyayi-founder-photo.png"
                        alt="Himanshu Gupta - Founder of Sahadhyayi"
                        className="rounded-2xl shadow-lg w-44 h-44 sm:w-48 sm:h-48 object-cover border-4 border-card ring-2 ring-brand-primary/30"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-1.5 shadow-md" title="Active Founder">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="space-y-2 text-center sm:text-left w-full">
                      <h3 className="font-serif text-2xl font-bold text-foreground">Himanshu Gupta</h3>
                      <p className="text-sm text-brand-primary font-medium">Founder &amp; Chief Bibliophile, Sahadhyayi</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Independent product creator dedicated to building humane software that nurtures curiosity, patience, and lifelong reading habits.
                      </p>

                      <div className="pt-3 space-y-2 text-xs text-muted-foreground border-t border-border">
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <Mail className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                          <span>Direct Email:</span>
                          <a href="mailto:gyan@sahadhyayi.com" className="text-foreground hover:text-brand-primary font-medium underline decoration-dotted">
                            gyan@sahadhyayi.com
                          </a>
                        </div>
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <Phone className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                          <span>Phone / WhatsApp:</span>
                          <a href="tel:8264135459" className="text-foreground hover:text-brand-primary font-medium underline decoration-dotted">
                            +91 8264135459
                          </a>
                        </div>
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <Globe className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                          <span>Location:</span>
                          <span className="text-foreground font-medium">India · Serving Readers Worldwide</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Personal Story / Letter from Founder */}
                  <div className="lg:col-span-7 space-y-4">
                    <h4 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
                      "Why I Built Sahadhyayi"
                    </h4>

                    <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                      <p>
                        Like many of us, I watched my reading habits slowly erode over the past decade. Between endless notifications, micro-video feeds, and algorithmic outrage, sustained deep concentration felt like a superpower that was slipping away.
                      </p>
                      <p>
                        Books have been humanity’s most intimate technology for millennia. When you read a book, you borrow another consciousness for a few hours. Yet most online book platforms were either online bookstores pushing purchases or passive feeds flooded with ads.
                      </p>
                      <p>
                        I wanted to build something fundamentally different: <strong className="text-foreground">a distraction-free home for fellow readers</strong>. A place where you can open a classic, highlight a moving line in the margin, glance over to see what another reader in Tokyo or Delhi thought on page 42, and join a silent sprint room where everyone is reading together in quiet camaraderie.
                      </p>
                      <p>
                        Whether you read 10 pages a day or finish a book a week, you belong here. I read every message sent to this platform personally — please reach out below if you have thoughts, ideas, or book recommendations!
                      </p>
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                      <div className="text-xs font-semibold text-foreground">Warmly,</div>
                      <span className="text-xs italic text-brand-primary font-serif">— Himanshu Gupta</span>
                    </div>
                  </div>
                </div>

                {/* ── Contact the Founder Directly Form ── */}
                <div className="pt-8 border-t border-border">
                  <div className="max-w-2xl mx-auto space-y-6">
                    <div className="text-center space-y-1">
                      <h4 className="text-lg font-bold text-foreground">Send a Message Directly to Himanshu</h4>
                      <p className="text-xs text-muted-foreground">
                        Your message is saved to our community inbox and routed directly to <strong>gyan@sahadhyayi.com</strong>.
                      </p>
                    </div>

                    <form className="space-y-4" onSubmit={form.handleSubmit(handleContactSubmit)}>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="contact_name" className="block text-xs font-medium text-foreground mb-1">
                            Your Name <span className="text-destructive" aria-hidden="true">*</span>
                          </label>
                          <Input
                            id="contact_name"
                            {...form.register("name")}
                            placeholder="e.g. Aditi Sharma"
                            disabled={loading}
                            autoComplete="name"
                            aria-required="true"
                            aria-invalid={!!form.formState.errors.name}
                            className="bg-background border-border"
                          />
                          {form.formState.errors.name && (
                            <p className="text-xs text-destructive mt-1">
                              {form.formState.errors.name.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="contact_email" className="block text-xs font-medium text-foreground mb-1">
                            Your Email <span className="text-destructive" aria-hidden="true">*</span>
                          </label>
                          <Input
                            id="contact_email"
                            type="email"
                            {...form.register("email")}
                            placeholder="you@example.com"
                            disabled={loading}
                            autoComplete="email"
                            aria-required="true"
                            aria-invalid={!!form.formState.errors.email}
                            className="bg-background border-border"
                          />
                          {form.formState.errors.email && (
                            <p className="text-xs text-destructive mt-1">
                              {form.formState.errors.email.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="contact_message" className="block text-xs font-medium text-foreground mb-1">
                          Your Note or Feedback <span className="text-destructive" aria-hidden="true">*</span>
                        </label>
                        <Textarea
                          id="contact_message"
                          {...form.register("message")}
                          placeholder="Share your thoughts, suggestions, or what you're reading right now…"
                          disabled={loading}
                          rows={4}
                          aria-required="true"
                          aria-invalid={!!form.formState.errors.message}
                          className="bg-background border-border"
                        />
                        {form.formState.errors.message && (
                          <p className="text-xs text-destructive mt-1">
                            {form.formState.errors.message.message}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button
                          type="submit"
                          className="flex-1 bg-brand-primary hover:bg-brand-primary/90 text-white font-medium"
                          size="lg"
                          disabled={loading}
                        >
                          {loading ? "Sending..." : "Send Message"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          onClick={handleDirectEmail}
                          className="border-border hover:bg-muted text-foreground"
                        >
                          <Mail className="w-4 h-4 mr-2 text-brand-primary" />
                          Send via Email App
                        </Button>
                      </div>

                      {success && (
                        <Alert className="mt-3 border-emerald-500/40 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                          <AlertDescription className="space-y-1">
                            <p className="font-medium text-xs sm:text-sm">
                              Your message has been received and routed to <strong>gyan@sahadhyayi.com</strong>.
                            </p>
                            <p className="text-xs">
                              Need a quick reply? You can also{" "}
                              <a
                                href="mailto:gyan@sahadhyayi.com"
                                className="underline font-semibold hover:text-emerald-900 dark:hover:text-emerald-100"
                              >
                                email gyan@sahadhyayi.com directly
                              </a>.
                            </p>
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                        <span>Messages route directly to <strong>gyan@sahadhyayi.com</strong></span>
                        <a
                          href="mailto:gyan@sahadhyayi.com"
                          className="text-brand-primary hover:underline font-medium inline-flex items-center gap-1"
                        >
                          <Mail className="w-3.5 h-3.5" /> Email Direct
                        </a>
                      </div>
                    </form>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* ── 4. The Sahadhyayi Experience (Living Features) ── */}
          <section className="space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-primary">
                <Compass className="w-4 h-4" />
                <span>Book-Native Experience</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
                Everything Built Around the Book
              </h2>
              <p className="text-sm text-muted-foreground">
                Every tool is designed to deepen your engagement with the author’s words rather than distract you.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {pillars.map((pillar, idx) => {
                const Icon = pillar.icon;
                return (
                  <Card key={idx} className="border-border bg-card hover:border-brand-primary/40 hover:shadow-md transition-all flex flex-col justify-between">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                          <Icon className="w-5 h-5" />
                        </div>
                        <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                          {pillar.badge}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg font-bold text-foreground">{pillar.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-0">
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {pillar.description}
                      </p>
                      <Link to={pillar.link} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline">
                        <span>{pillar.cta}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* ── 5. Deep Reading vs Passive Content Comparison ── */}
          <section className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-xs space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
                Why Deep Reading Matters Today
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Passive media feeds consume your attention. Reading restores it.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-foreground">The Attention Crisis</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Research shows that continuous micro-content consumption trains our cognitive faculties to crave instant novelty, degrading working memory and reducing deep comprehension.
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Reading a full book requires sustained imagination: translating symbols into rich mental scenes, following intricate arguments, and developing empathy with minds across centuries.
                </p>
              </div>

              {/* Comparison Matrix */}
              <div className="rounded-2xl border border-border bg-background p-5 space-y-3 shadow-xs">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-2 border-b border-border">
                  Cognitive Impact Comparison
                </div>
                {[
                  { metric: "Focus & Attention Span", reading: "Sustained (4x higher)", passive: "Fragmented (10-30 sec)" },
                  { metric: "Retention & Comprehension", reading: "Long-term (3x stronger)", passive: "Fleeting novelty" },
                  { metric: "Visual & Mental Fatigue", reading: "Calm, reflective", passive: "Overstimulated by blue light" },
                  { metric: "Empathy & Perspective", reading: "Deep narrative immersion", passive: "Superficial impressions" },
                ].map((row, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-1.5 border-b border-border/50 gap-1">
                    <span className="font-medium text-foreground">{row.metric}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{row.reading}</span>
                      <span className="text-muted-foreground/60">vs</span>
                      <span className="text-muted-foreground">{row.passive}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── 6. Core Values ── */}
          <section className="space-y-8">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground text-center">
              What Sahadhyayi Stands For
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <Card key={index} className="border-border bg-card">
                    <CardHeader className="pb-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-2">
                        <Icon className="w-5 h-5 text-brand-primary" />
                      </div>
                      <CardTitle className="text-lg font-bold text-foreground">{value.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{value.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* ── 7. Stats & Impact ── */}
          <section className="rounded-3xl border border-border bg-card/60 p-8 sm:p-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center space-y-1">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center mx-auto mb-2">
                      <Icon className="w-5 h-5 text-brand-primary" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-brand-primary tracking-tight">{stat.number}</div>
                    <div className="text-xs sm:text-sm font-medium text-muted-foreground">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── 8. Collapsible FAQs ── */}
          <section className="max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-primary">
                <Compass className="w-3.5 h-3.5" />
                <span>Got Questions?</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
                Frequently Asked Questions
              </h2>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`} className="border-border">
                  <AccordionTrigger className="text-left font-medium text-sm sm:text-base text-foreground hover:text-brand-primary py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-xs sm:text-sm text-muted-foreground leading-relaxed pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* ── 9. Final Call to Action ── */}
          <section className="text-center">
            <Card className="bg-gradient-to-r from-brand-primary to-orange-600 text-white border-0 rounded-3xl shadow-xl overflow-hidden">
              <CardContent className="p-8 sm:p-12 space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center mx-auto">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-serif font-bold">
                  Become a Sahadhyayi Today
                </h2>
                <p className="text-base sm:text-lg max-w-xl mx-auto text-white/90 leading-relaxed">
                  Join fellow readers worldwide on a journey of deep reflection, shared notes, and intellectual companionship.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                  <Link to="/library">
                    <Button size="lg" variant="secondary" className="px-8 h-12 text-base font-semibold shadow-md">
                      <BookOpen className="w-5 h-5 mr-2" />
                      Browse Free Books
                    </Button>
                  </Link>
                  <Link to="/social">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white/40 text-white hover:bg-white/10 px-8 h-12 text-base font-semibold"
                    >
                      <Users className="w-5 h-5 mr-2" />
                      Join the Reading Hub
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </>
  );
};

export default About;
