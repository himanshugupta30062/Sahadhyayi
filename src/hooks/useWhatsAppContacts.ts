
import * as React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client-universal';

interface WhatsAppContact {
  id: string;
  contact_phone: string;
  contact_name: string | null;
  is_on_platform: boolean;
  platform_user_id: string | null;
  last_synced_at: string;
}

export const useWhatsAppContacts = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = React.useState<WhatsAppContact[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchContacts = React.useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('contact_name');

      if (error) throw error;
      setContacts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contacts');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const syncContacts = async (contactList: Array<{ phone: string; name: string }>) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check which contacts are on the platform
      const phoneNumbers = contactList.map(c => c.phone);
      const { data: existingUsers } = await supabase
        .from('user_profile')
        .select('id, phone_number')
        .in('phone_number', phoneNumbers)
        .eq('phone_verified', true);

      const existingPhoneMap = new Map(
        existingUsers?.map(u => [u.phone_number, u.id]) || []
      );

      // Insert/update contacts
      const contactsToUpsert = contactList.map(contact => ({
        user_id: user.id,
        contact_phone: contact.phone,
        contact_name: contact.name,
        is_on_platform: existingPhoneMap.has(contact.phone),
        platform_user_id: existingPhoneMap.get(contact.phone) || null,
        last_synced_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('whatsapp_contacts')
        .upsert(contactsToUpsert, { onConflict: 'user_id,contact_phone' });

      if (error) throw error;

      await fetchContacts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const inviteContact = async (contactId: string, message: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact || !user) return;

    try {
      // Record the invitation
      const { error } = await supabase
        .from('whatsapp_invitations')
        .upsert({
          sender_id: user.id,
          recipient_phone: contact.contact_phone,
          recipient_name: contact.contact_name,
          invitation_message: message
        });

      if (error) throw error;

      // Open WhatsApp with pre-filled message
      const whatsappUrl = `https://wa.me/${contact.contact_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
      return false;
    }
  };

  React.useEffect(() => {
    fetchContacts();
  }, [user, fetchContacts]);

  return {
    contacts,
    isLoading,
    error,
    fetchContacts,
    syncContacts,
    inviteContact
  };
};
