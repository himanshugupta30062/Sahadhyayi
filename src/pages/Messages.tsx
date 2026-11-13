import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MessageCircle, Send, CheckCheck, Users, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import SEO from '@/components/SEO';
import Breadcrumb from '@/components/Breadcrumb';
import { useAuth } from '@/contexts/authHelpers';
import {
  usePrivateMessages,
  useSendPrivateMessage,
  useUnreadMessages,
  useMarkMessagesAsRead,
} from '@/hooks/useMessages';
import { useFriends } from '@/hooks/useFriends';
import { supabase } from '@/integrations/supabase/client-universal';
import { safeFormatDistanceToNow } from '@/lib/dateUtils';

interface RecipientProfile {
  id: string;
  full_name: string;
  username?: string;
  profile_photo_url?: string;
}

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const recipientFromUrl = searchParams.get('recipient') || '';

  const [activeRecipientId, setActiveRecipientId] = useState<string>(recipientFromUrl);
  const [recipientProfile, setRecipientProfile] = useState<RecipientProfile | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: friends = [], isLoading: isLoadingFriends } = useFriends();
  const { data: unreadMessages = [] } = useUnreadMessages();
  const { data: conversation = [], isLoading: isLoadingChat } = usePrivateMessages(activeRecipientId);
  const sendMessageMutation = useSendPrivateMessage();
  const markMessagesAsRead = useMarkMessagesAsRead();

  // Sync state with URL recipient param
  useEffect(() => {
    if (recipientFromUrl) {
      setActiveRecipientId(recipientFromUrl);
    }
  }, [recipientFromUrl]);

  // Load profile for selected recipient
  useEffect(() => {
    if (!activeRecipientId) {
      setRecipientProfile(null);
      return;
    }

    // Try finding in friends list first
    const friendMatch = friends.find(
      (f) => f.friend_profile?.id === activeRecipientId || f.user1_id === activeRecipientId || f.user2_id === activeRecipientId
    );

    if (friendMatch?.friend_profile) {
      setRecipientProfile({
        id: friendMatch.friend_profile.id,
        full_name: friendMatch.friend_profile.full_name || 'Reader',
        username: friendMatch.friend_profile.username,
        profile_photo_url: friendMatch.friend_profile.profile_photo_url,
      });
      return;
    }

    // If not in friends list, fetch directly from Supabase profiles
    let isCancelled = false;
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, username, profile_photo_url')
        .eq('id', activeRecipientId)
        .maybeSingle();

      if (!isCancelled && data) {
        setRecipientProfile(data);
      }
    };
    void fetchProfile();

    return () => {
      isCancelled = true;
    };
  }, [activeRecipientId, friends]);

  // Mark messages as read when active conversation changes
  useEffect(() => {
    if (activeRecipientId && user?.id) {
      markMessagesAsRead.mutate(activeRecipientId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRecipientId, user?.id, conversation.length]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [conversation]);

  const handleSelectRecipient = (id: string) => {
    setActiveRecipientId(id);
    setSearchParams({ recipient: id });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = messageText.trim();
    if (!content || !activeRecipientId || sendMessageMutation.isPending) return;

    setMessageText('');
    await sendMessageMutation.mutateAsync({
      receiverId: activeRecipientId,
      content,
    });
  };

  // Compile active conversations / contacts list
  const contactMap = new Map<string, RecipientProfile>();
  friends.forEach((f) => {
    if (f.friend_profile?.id) {
      contactMap.set(f.friend_profile.id, {
        id: f.friend_profile.id,
        full_name: f.friend_profile.full_name || 'Reader',
        username: f.friend_profile.username,
        profile_photo_url: f.friend_profile.profile_photo_url,
      });
    }
  });

  unreadMessages.forEach((m) => {
    if (m.sender_profile?.id && !contactMap.has(m.sender_profile.id)) {
      contactMap.set(m.sender_profile.id, {
        id: m.sender_profile.id,
        full_name: m.sender_profile.full_name || 'Reader',
        profile_photo_url: m.sender_profile.profile_photo_url,
      });
    }
  });

  if (recipientProfile && !contactMap.has(recipientProfile.id)) {
    contactMap.set(recipientProfile.id, recipientProfile);
  }

  const contacts = Array.from(contactMap.values()).filter((c) =>
    c.full_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.username?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <>
      <SEO
        title="Messages - Sahadhyayi"
        description="Connect and chat directly with friends and book lovers on Sahadhyayi."
        canonical="https://sahadhyayi.com/messages"
        url="https://sahadhyayi.com/messages"
      />
      <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Breadcrumb
          items={[
            { name: 'Home', path: '/' },
            { name: 'Messages', path: '/messages', current: true },
          ]}
          className="mb-6"
        />

        <Card className="overflow-hidden border-border/80 shadow-sm bg-card grid grid-cols-1 md:grid-cols-12 min-h-[640px]">
          {/* Left column: Conversations / Contacts list */}
          <div
            className={`md:col-span-4 lg:col-span-4 border-r border-border/60 flex flex-col bg-muted/10 ${
              activeRecipientId ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="p-3.5 border-b border-border/60">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-serif font-bold text-foreground">Direct Messages</h1>
              </div>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search contacts..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border/40">
              {isLoadingFriends ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  Loading contacts...
                </div>
              ) : contacts.length === 0 ? (
                <div className="p-6 text-center">
                  <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">No contacts found</p>
                  <p className="text-[11px] text-muted-foreground/80 mt-1">
                    Connect with fellow readers from the{' '}
                    <Link to="/map" className="text-primary hover:underline">
                      Reader Map
                    </Link>{' '}
                    or{' '}
                    <Link to="/social?tab=friends" className="text-primary hover:underline">
                      Friends Feed
                    </Link>
                    .
                  </p>
                </div>
              ) : (
                contacts.map((contact) => {
                  const isSelected = activeRecipientId === contact.id;
                  const unreadCountForContact = unreadMessages.filter(
                    (m) => m.sender_id === contact.id
                  ).length;

                  return (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => handleSelectRecipient(contact.id)}
                      className={`flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted/60 ${
                        isSelected ? 'bg-primary/10 border-l-2 border-primary' : ''
                      }`}
                    >
                      <Avatar className="h-10 w-10 shrink-0 border border-border/60">
                        <AvatarImage src={contact.profile_photo_url || ''} alt={contact.full_name} />
                        <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white font-medium text-xs">
                          {contact.full_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="truncate text-xs font-semibold text-foreground">
                            {contact.full_name}
                          </p>
                          {unreadCountForContact > 0 && (
                            <span className="h-4 min-w-4 px-1 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                              {unreadCountForContact}
                            </span>
                          )}
                        </div>
                        {contact.username && (
                          <p className="truncate text-[11px] text-muted-foreground">
                            @{contact.username}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right column: Chat conversation window */}
          <div
            className={`md:col-span-8 lg:col-span-8 flex flex-col ${
              !activeRecipientId ? 'hidden md:flex' : 'flex'
            }`}
          >
            {activeRecipientId ? (
              <>
                {/* Chat Header */}
                <div className="p-3.5 border-b border-border/60 flex items-center gap-3 bg-muted/20">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setActiveRecipientId('');
                      setSearchParams({});
                    }}
                    className="md:hidden h-8 w-8 p-0"
                    aria-label="Back to contacts"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>

                  <Avatar className="h-9 w-9 shrink-0 border border-border/60">
                    <AvatarImage
                      src={recipientProfile?.profile_photo_url || ''}
                      alt={recipientProfile?.full_name || 'Reader'}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-white font-medium text-xs">
                      {(recipientProfile?.full_name || 'R').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-semibold text-foreground truncate">
                      {recipientProfile?.full_name || 'Reader'}
                    </h2>
                    {recipientProfile?.username && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        @{recipientProfile.username}
                      </p>
                    )}
                  </div>
                </div>

                {/* Chat Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/5 max-h-[500px]">
                  {isLoadingChat ? (
                    <div className="py-12 text-center text-xs text-muted-foreground">
                      Loading messages...
                    </div>
                  ) : conversation.length === 0 ? (
                    <div className="py-16 text-center text-xs text-muted-foreground">
                      <MessageCircle className="mx-auto mb-2 h-8 w-8 opacity-40" />
                      <p className="font-medium text-foreground">No messages yet</p>
                      <p className="mt-0.5">Send a message to start reading together!</p>
                    </div>
                  ) : (
                    conversation.map((msg) => {
                      const isMe = msg.sender_id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-xs sm:text-sm shadow-sm ${
                              isMe
                                ? 'bg-primary text-primary-foreground rounded-br-none'
                                : 'bg-card border border-border/70 text-foreground rounded-bl-none'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            <div
                              className={`mt-1 flex items-center gap-1 text-[10px] ${
                                isMe ? 'text-primary-foreground/70 justify-end' : 'text-muted-foreground justify-start'
                              }`}
                            >
                              <span>
                                {safeFormatDistanceToNow(msg.created_at, { addSuffix: true })}
                              </span>
                              {isMe && (
                                <CheckCheck className="h-3 w-3 inline" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-border/60 flex items-center gap-2 bg-background"
                >
                  <Input
                    type="text"
                    placeholder="Type your message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1 h-10 text-xs sm:text-sm"
                    autoFocus
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!messageText.trim() || sendMessageMutation.isPending}
                    className="h-10 px-4 gap-1.5"
                  >
                    <Send className="h-4 w-4" />
                    <span className="hidden sm:inline">Send</span>
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/5">
                <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <MessageCircle className="h-7 w-7" />
                </div>
                <h3 className="text-base font-serif font-bold text-foreground">
                  Your Reader Inbox
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-sm">
                  Select a contact from the list or meet new readers to share insights, notes, and recommendations.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <Button asChild variant="outline" size="sm" className="text-xs">
                    <Link to="/map">Explore Reader Map</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="text-xs">
                    <Link to="/social?tab=rooms">Join Reading Rooms</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
};

export default MessagesPage;
