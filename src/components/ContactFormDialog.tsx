import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, MessageCircle } from "lucide-react";
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
    try {
      // Save to database
      const { error } = await supabase.from('contact_messages').insert({
        name: parsed.data.name,
        email: parsed.data.email,
        message: parsed.data.message,
      });
      if (error) throw error;

      // Send email notification
      const { error: emailError } = await supabase.functions.invoke('send-contact-email', {
        body: { name: parsed.data.name, email: parsed.data.email, message: parsed.data.message },
      });
      if (emailError) console.error('Email notification failed:', emailError);

      toast.success("Message sent! We'll get back to you soon.");
      setForm({ name: '', email: '', message: '' });
      setOpen(false);
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 z-50 rounded-full w-14 h-14 p-0 bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-600/30 hover:shadow-orange-600/50 transition-all hover:scale-105"
            aria-label="Contact Us"
          >
            <MessageCircle className="w-6 h-6" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Get in Touch</DialogTitle>
          <p className="text-sm text-gray-400">We'd love to hear from you. Send us a message!</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name" className="text-gray-300">Name</Label>
              <Input
                id="contact-name"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                className="bg-zinc-800 border-zinc-600 text-white placeholder:text-gray-500 focus:border-orange-500"
                required
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email" className="text-gray-300">Email</Label>
              <Input
                id="contact-email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                className="bg-zinc-800 border-zinc-600 text-white placeholder:text-gray-500 focus:border-orange-500"
                required
                maxLength={255}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-message" className="text-gray-300">Message</Label>
            <Textarea
              id="contact-message"
              placeholder="Tell us what's on your mind..."
              value={form.message}
              onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
              className="bg-zinc-800 border-zinc-600 text-white placeholder:text-gray-500 focus:border-orange-500 min-h-[120px]"
              required
              maxLength={2000}
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3"
          >
            <Send className="w-4 h-4 mr-2" />
            {loading ? "Sending..." : "Send Message"}
          </Button>
          <p className="text-xs text-gray-500 text-center">
            Your message will be sent to our team at gyan@sahadhyayi.com
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactFormDialog;
