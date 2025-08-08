
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Phone, Shield, Users, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client-universal';
import { toast } from 'sonner';

interface WhatsAppContact {
  id: string;
  contact_phone: string;
  contact_name: string | null;
  is_on_platform: boolean;
  platform_user_id: string | null;
}

export const WhatsAppIntegration = () => {
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [hidePhoneNumber, setHidePhoneNumber] = useState(true);
  const [allowWhatsAppDiscovery, setAllowWhatsAppDiscovery] = useState(true);
  const [inviteMessage, setInviteMessage] = useState('');
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchWhatsAppContacts();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profile')
        .select('phone_number, phone_verified, hide_phone_number, allow_whatsapp_discovery, whatsapp_invite_message')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setPhoneNumber(data.phone_number || '');
        setIsPhoneVerified(data.phone_verified || false);
        setHidePhoneNumber(data.hide_phone_number ?? true);
        setAllowWhatsAppDiscovery(data.allow_whatsapp_discovery ?? true);
        setInviteMessage(data.whatsapp_invite_message || 'Join me on Sahadhyayi - the ultimate reading community! Download the app and discover amazing books together.');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchWhatsAppContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .eq('user_id', user?.id)
        .order('contact_name');

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const sendVerificationCode = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }

    setIsLoading(true);
    try {
      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const { error } = await supabase
        .from('phone_verifications')
        .insert({
          user_id: user?.id,
          phone_number: phoneNumber,
          verification_code: code,
          expires_at: expiresAt.toISOString()
        });

      if (error) throw error;

      // In a real app, you'd send SMS via a service like Twilio
      console.log('Verification code:', code);
      toast.success('Verification code sent! (Check console for demo)');
      setIsVerifying(true);
    } catch (error) {
      console.error('Error sending verification:', error);
      toast.error('Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPhone = async () => {
    if (!verificationCode.trim()) {
      toast.error('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('phone_verifications')
        .select('*')
        .eq('user_id', user?.id)
        .eq('phone_number', phoneNumber)
        .eq('verification_code', verificationCode)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        toast.error('Invalid or expired verification code');
        return;
      }

      // Mark as verified
      await supabase
        .from('phone_verifications')
        .update({ verified: true, verified_at: new Date().toISOString() })
        .eq('id', data.id);

      // Update user profile
      await supabase
        .from('user_profile')
        .upsert({
          id: user?.id,
          phone_number: phoneNumber,
          phone_verified: true
        });

      setIsPhoneVerified(true);
      setIsVerifying(false);
      toast.success('Phone number verified successfully!');
    } catch (error) {
      console.error('Error verifying phone:', error);
      toast.error('Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePrivacySettings = async (field: string, value: boolean) => {
    try {
      const { error } = await supabase
        .from('user_profile')
        .upsert({
          id: user?.id,
          [field]: value
        });

      if (error) throw error;
      toast.success('Privacy settings updated');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const updateInviteMessage = async () => {
    try {
      const { error } = await supabase
        .from('user_profile')
        .upsert({
          id: user?.id,
          whatsapp_invite_message: inviteMessage
        });

      if (error) throw error;
      toast.success('Invite message updated');
    } catch (error) {
      console.error('Error updating message:', error);
      toast.error('Failed to update message');
    }
  };

  const syncContacts = async () => {
    // In a real app, this would use the WhatsApp Business API or similar
    // For demo purposes, we'll simulate contact syncing
    setIsLoading(true);
    try {
      const mockContacts = [
        { phone: '+1234567890', name: 'John Doe' },
        { phone: '+0987654321', name: 'Jane Smith' },
        { phone: '+1122334455', name: 'Bob Johnson' }
      ];

      for (const contact of mockContacts) {
        await supabase
          .from('whatsapp_contacts')
          .upsert({
            user_id: user?.id,
            contact_phone: contact.phone,
            contact_name: contact.name,
            is_on_platform: Math.random() > 0.5 // Random for demo
          });
      }

      await fetchWhatsAppContacts();
      toast.success('Contacts synced successfully!');
    } catch (error) {
      console.error('Error syncing contacts:', error);
      toast.error('Failed to sync contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const inviteContact = async (contact: WhatsAppContact) => {
    try {
      const { error } = await supabase
        .from('whatsapp_invitations')
        .upsert({
          sender_id: user?.id,
          recipient_phone: contact.contact_phone,
          recipient_name: contact.contact_name,
          invitation_message: inviteMessage
        });

      if (error) throw error;

      // In a real app, this would send a WhatsApp message
      const whatsappUrl = `https://wa.me/${contact.contact_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(inviteMessage)}`;
      window.open(whatsappUrl, '_blank');
      
      toast.success(`Invitation sent to ${contact.contact_name || contact.contact_phone}`);
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
    }
  };

  return (
    <div className="space-y-6">
      {/* Phone Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Phone Verification
          </CardTitle>
          <CardDescription>
            Verify your phone number to connect with WhatsApp contacts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isPhoneVerified ? (
            <>
              {!isVerifying ? (
                <div className="flex gap-2">
                  <Input
                    type="tel"
                    placeholder="+1234567890"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={sendVerificationCode} disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Verify'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit code sent to {phoneNumber}
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="123456"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      maxLength={6}
                      className="flex-1"
                    />
                    <Button onClick={verifyPhone} disabled={isLoading}>
                      {isLoading ? 'Verifying...' : 'Confirm'}
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                ✓ Verified
              </Badge>
              <span className="text-sm">{phoneNumber}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      {isPhoneVerified && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Hide Phone Number</Label>
                <p className="text-sm text-muted-foreground">
                  Don't show your phone number to other users
                </p>
              </div>
              <Switch
                checked={hidePhoneNumber}
                onCheckedChange={(checked) => {
                  setHidePhoneNumber(checked);
                  updatePrivacySettings('hide_phone_number', checked);
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Allow WhatsApp Discovery</Label>
                <p className="text-sm text-muted-foreground">
                  Let friends find you via WhatsApp contacts
                </p>
              </div>
              <Switch
                checked={allowWhatsAppDiscovery}
                onCheckedChange={(checked) => {
                  setAllowWhatsAppDiscovery(checked);
                  updatePrivacySettings('allow_whatsapp_discovery', checked);
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* WhatsApp Contacts */}
      {isPhoneVerified && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              WhatsApp Contacts
            </CardTitle>
            <CardDescription>
              Find and invite your WhatsApp contacts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={syncContacts} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Syncing...' : 'Sync Contacts'}
            </Button>

            {contacts.length > 0 && (
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{contact.contact_name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">{contact.contact_phone}</p>
                      {contact.is_on_platform && (
                        <Badge variant="secondary" className="mt-1">
                          On Sahadhyayi
                        </Badge>
                      )}
                    </div>
                    {!contact.is_on_platform && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => inviteContact(contact)}
                        className="flex items-center gap-1"
                      >
                        <Send className="w-4 h-4" />
                        Invite
                      </Button>
                    )}
                    {contact.is_on_platform && (
                      <Button
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Message
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Invite Message Customization */}
      {isPhoneVerified && (
        <Card>
          <CardHeader>
            <CardTitle>Invite Message</CardTitle>
            <CardDescription>
              Customize the message sent to your WhatsApp contacts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              placeholder="Your invitation message..."
              rows={3}
            />
            <Button onClick={updateInviteMessage}>
              Update Message
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
