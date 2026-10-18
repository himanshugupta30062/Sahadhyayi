import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, MessageCircle, User, Mail, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  message: z.string().trim().min(1, "Message is required").max(2000),
});

interface ContactFormDialogProps {
  trigger?: React.ReactNode;
}

const ContactFormDialog = ({ trigger }: ContactFormDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }

    setLoading(true);
    const subject = encodeURIComponent(`[Contact] Message from ${parsed.data.name} (Sahadhyayi)`);
    const body = encodeURIComponent(
      `Name: ${parsed.data.name}\nEmail: ${parsed.data.email}\n\nMessage:\n${parsed.data.message}`
    );
    const mailtoUrl = `mailto:gyan@sahadhyayi.com?subject=${subject}&body=${body}`;

    try {
      const { error: dbError } = await supabase.from('contact_messages').insert({
        name: parsed.data.name,
        email: parsed.data.email,
        message: parsed.data.message,
      });
      if (dbError) console.warn("contact_messages insert failed:", dbError);

      let edgeSent = false;
      try {
        const { error: emailError } = await supabase.functions.invoke('send-contact-email', {
          body: { name: parsed.data.name, email: parsed.data.email, message: parsed.data.message },
        });
        if (!emailError) {
          edgeSent = true;
        } else {
          console.warn('Email notification failed:', emailError);
        }
      } catch (invokeErr) {
        console.warn('Edge invocation error:', invokeErr);
      }

      if (!edgeSent) {
        // Fallback: trigger mailto redirect directly
        window.location.href = mailtoUrl;
      }

      toast.success(
        edgeSent
          ? "Message sent to gyan@sahadhyayi.com! We'll get back to you soon."
          : "Message saved! Opening email client to deliver to gyan@sahadhyayi.com directly."
      );
      setForm({ name: '', email: '', message: '' });
      setOpen(false);
    } catch {
      window.location.href = mailtoUrl;
      toast.error("Opening your email client to reach gyan@sahadhyayi.com directly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            className="fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 p-0 bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/30 hover:shadow-orange-600/50 transition-all hover:scale-110 active:scale-95"
            aria-label="Contact Us"
          >
            <MessageCircle className="w-6 h-6" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-white dark:bg-zinc-900 border-[#E8E2D9] dark:border-zinc-700/50 text-[#1C201D] dark:text-white sm:max-w-md p-0 overflow-hidden shadow-2xl">
        {/* Header with gradient accent */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Get in Touch</DialogTitle>
            <DialogDescription className="text-orange-100/90 text-sm">
              We'd love to hear from you. Send us a message!
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6 pt-4 bg-white dark:bg-zinc-900">
          <div className="space-y-2">
            <Label htmlFor="contact-name" className="text-stone-700 dark:text-gray-300 text-xs uppercase tracking-wider font-medium">Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-gray-500" />
              <Input
                id="contact-name"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                className="bg-[#FAF7F2] dark:bg-zinc-800/80 border-[#E8E2D9] dark:border-zinc-700 text-[#1C201D] dark:text-white placeholder:text-stone-400 dark:placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20 pl-10"
                required
                maxLength={100}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email" className="text-stone-700 dark:text-gray-300 text-xs uppercase tracking-wider font-medium">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-gray-500" />
              <Input
                id="contact-email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                className="bg-[#FAF7F2] dark:bg-zinc-800/80 border-[#E8E2D9] dark:border-zinc-700 text-[#1C201D] dark:text-white placeholder:text-stone-400 dark:placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20 pl-10"
                required
                maxLength={255}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-message" className="text-stone-700 dark:text-gray-300 text-xs uppercase tracking-wider font-medium">Message</Label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-stone-400 dark:text-gray-500" />
              <Textarea
                id="contact-message"
                placeholder="Tell us what's on your mind..."
                value={form.message}
                onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                className="bg-[#FAF7F2] dark:bg-zinc-800/80 border-[#E8E2D9] dark:border-zinc-700 text-[#1C201D] dark:text-white placeholder:text-stone-400 dark:placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20 min-h-[120px] pl-10"
                required
                maxLength={2000}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-semibold py-3 transition-all hover:shadow-lg hover:shadow-orange-600/20 active:scale-[0.98]"
            >
              <Send className="w-4 h-4 mr-2" />
              {loading ? "Sending..." : "Send Message"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const subject = encodeURIComponent(`[Contact] Message from ${form.name || "Reader"} (Sahadhyayi)`);
                const body = encodeURIComponent(
                  `Name: ${form.name || ""}\nEmail: ${form.email || ""}\n\nMessage:\n${form.message || ""}`
                );
                window.location.href = `mailto:gyan@sahadhyayi.com?subject=${subject}&body=${body}`;
              }}
              className="border-[#E8E2D9] dark:border-zinc-700 text-[#2E3430] dark:text-zinc-300 hover:text-[#1C201D] dark:hover:text-white hover:bg-[#F4EFEA] dark:hover:bg-zinc-800"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email App
            </Button>
          </div>
          <p className="text-xs text-stone-500 dark:text-gray-500 text-center">
            Your message will be sent to our team at{" "}
            <a href="mailto:gyan@sahadhyayi.com" className="text-orange-600 dark:text-orange-400 hover:underline font-medium">
              gyan@sahadhyayi.com
            </a>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactFormDialog;
