
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Phone, Plus, Users, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WhatsAppContact {
  id: string;
  contact_name: string;
  contact_phone: string;
  is_on_platform: boolean;
  platform_user_id?: string;
}

export const WhatsAppTab = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const addWhatsAppContact = async () => {
    if (!phoneNumber.trim() || !contactName.trim()) {
      toast.error('Please enter both name and phone number');
      return;
    }

    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('whatsapp_contacts')
        .insert({
          user_id: user.id,
          contact_phone: phoneNumber.trim(),
          contact_name: contactName.trim(),
        });

      if (error) throw error;

      setPhoneNumber('');
      setContactName('');
      toast.success('Contact added successfully!');
      // You could refresh contacts here if you implement fetching
    } catch (error: any) {
      console.error('Error adding contact:', error);
      if (error.code === '23505') {
        toast.error('This contact already exists');
      } else {
        toast.error('Failed to add contact');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inviteToWhatsApp = (contact: WhatsAppContact) => {
    const message = encodeURIComponent(
      `Hi ${contact.contact_name}! Join me on Sahadhyayi - the ultimate reading community! Download the app and discover amazing books together. 📚✨`
    );
    const whatsappUrl = `https://wa.me/${contact.contact_phone.replace(/\D/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Add Contact Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Connect via WhatsApp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Input
              placeholder="Contact Name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="h-9"
            />
            <Input
              placeholder="Phone Number (with country code)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="h-9"
            />
          </div>
          <Button 
            onClick={addWhatsAppContact}
            disabled={isLoading || !phoneNumber.trim() || !contactName.trim()}
            size="sm"
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              'Adding...'
            ) : (
              <>
                <Plus className="w-3 h-3 mr-1" />
                Add Contact
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Mock Contacts Display */}
      <div className="space-y-3">
        {/* Sample contacts for demonstration */}
        {[
          { name: 'Sarah Johnson', phone: '+1234567890', isOnPlatform: true },
          { name: 'Mike Chen', phone: '+1234567891', isOnPlatform: false },
          { name: 'Emma Wilson', phone: '+1234567892', isOnPlatform: false },
        ].map((contact, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs bg-green-100 text-green-700">
                  {contact.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500">{contact.phone}</p>
                  {contact.isOnPlatform && (
                    <Badge variant="secondary" className="text-xs">
                      On Sahadhyayi
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              {contact.isOnPlatform ? (
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <MessageCircle className="w-4 h-4" />
                </Button>
              ) : (
                <Button 
                  onClick={() => inviteToWhatsApp({
                    id: String(index),
                    contact_name: contact.name,
                    contact_phone: contact.phone,
                    is_on_platform: contact.isOnPlatform
                  })}
                  size="sm" 
                  variant="outline" 
                  className="h-8 text-xs border-green-300 text-green-700 hover:bg-green-50"
                >
                  Invite
                </Button>
              )}
            </div>
          </div>
        ))}
        
        {contacts.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <Phone className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No WhatsApp contacts yet</p>
            <p className="text-xs">Add contacts to invite them to join Sahadhyayi</p>
          </div>
        )}
      </div>
    </div>
  );
};
