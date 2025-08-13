-- Restrict whatsapp_contacts access to contact owner only
ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own WhatsApp contacts" ON public.whatsapp_contacts;
DROP POLICY IF EXISTS "Users can manage their own WhatsApp contacts" ON public.whatsapp_contacts;

CREATE POLICY "contact owner access only" ON public.whatsapp_contacts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
