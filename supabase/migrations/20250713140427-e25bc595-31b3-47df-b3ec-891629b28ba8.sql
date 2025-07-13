
-- Add WhatsApp platform to existing enum
ALTER TYPE social_platform ADD VALUE 'whatsapp';

-- Add WhatsApp-specific columns to user_profile table
ALTER TABLE public.user_profile 
ADD COLUMN phone_number TEXT,
ADD COLUMN phone_verified BOOLEAN DEFAULT false,
ADD COLUMN phone_verification_code TEXT,
ADD COLUMN phone_verification_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN hide_phone_number BOOLEAN DEFAULT true,
ADD COLUMN allow_whatsapp_discovery BOOLEAN DEFAULT true,
ADD COLUMN whatsapp_invite_message TEXT DEFAULT 'Join me on Sahadhyayi - the ultimate reading community! Download the app and discover amazing books together.';

-- Create WhatsApp contacts table
CREATE TABLE public.whatsapp_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_phone TEXT NOT NULL,
  contact_name TEXT,
  is_on_platform BOOLEAN DEFAULT false,
  platform_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, contact_phone)
);

-- Phone verification attempts tracking
CREATE TABLE public.phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  verified_at TIMESTAMP WITH TIME ZONE
);

-- WhatsApp invitation tracking
CREATE TABLE public.whatsapp_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  invitation_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMP WITH TIME ZONE,
  registered BOOLEAN DEFAULT false,
  registered_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(sender_id, recipient_phone)
);

-- Enable RLS
ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for WhatsApp contacts
CREATE POLICY "Users can view their own WhatsApp contacts" ON public.whatsapp_contacts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own WhatsApp contacts" ON public.whatsapp_contacts
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- RLS Policies for phone verifications
CREATE POLICY "Users can view their own phone verifications" ON public.phone_verifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own phone verifications" ON public.phone_verifications
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own phone verifications" ON public.phone_verifications
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for WhatsApp invitations
CREATE POLICY "Users can view their own WhatsApp invitations" ON public.whatsapp_invitations
  FOR SELECT USING (sender_id = auth.uid());

CREATE POLICY "Users can create WhatsApp invitations" ON public.whatsapp_invitations
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their own WhatsApp invitations" ON public.whatsapp_invitations
  FOR UPDATE USING (sender_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_whatsapp_contacts_user ON public.whatsapp_contacts(user_id);
CREATE INDEX idx_whatsapp_contacts_phone ON public.whatsapp_contacts(contact_phone);
CREATE INDEX idx_whatsapp_contacts_platform_user ON public.whatsapp_contacts(platform_user_id);
CREATE INDEX idx_phone_verifications_user ON public.phone_verifications(user_id);
CREATE INDEX idx_phone_verifications_phone ON public.phone_verifications(phone_number);
CREATE INDEX idx_whatsapp_invitations_sender ON public.whatsapp_invitations(sender_id);
CREATE INDEX idx_whatsapp_invitations_phone ON public.whatsapp_invitations(recipient_phone);

-- Add unique constraint on phone_number in user_profile to prevent duplicates
ALTER TABLE public.user_profile ADD CONSTRAINT unique_phone_number UNIQUE (phone_number);
