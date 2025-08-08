import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Users, X } from 'lucide-react';
import { useGroupMessages, useSendMessage, useGroupMembers } from '@/hooks/useGroupMessaging';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { sanitizeHTML, sanitizeInput } from '@/utils/validation';

interface GroupMessagingProps {
  groupId: string;
  groupName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  message_type: string;
  sender?: {
    id: string;
    full_name: string;
    profile_photo_url?: string;
    username?: string;
  };
}

const GroupMessaging: React.FC<GroupMessagingProps> = ({
  groupId,
  groupName,
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showMemberList, setShowMemberList] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: initialMessages } = useGroupMessages(groupId);
  const { data: members } = useGroupMembers(groupId);
  const sendMessage = useSendMessage();

  // Set up real-time subscription for messages
  useEffect(() => {
    if (!groupId) return;

    const channel = supabase
      .channel(`group-messages-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`
        },
        async (payload) => {
          // Fetch the complete message with sender details
          const { data: newMessage } = await supabase
            .from('group_messages')
            .select(`
              *,
              sender:profiles!sender_id(id, full_name, profile_photo_url, username)
            `)
            .eq('id', payload.new.id)
            .single();

          if (newMessage) {
            setMessages(prev => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  // Load initial messages
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle @mention autocomplete
  useEffect(() => {
    if (!newMessage || !members) return;

    const cursorPos = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = newMessage.slice(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const searchTerm = mentionMatch[1].toLowerCase();
      const suggestions = members
        .filter(member => 
          member.user_profile?.username?.toLowerCase().includes(searchTerm) ||
          member.user_profile?.full_name?.toLowerCase().includes(searchTerm)
        )
        .slice(0, 5);

      setMentionSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
      setCursorPosition(cursorPos);
    } else {
      setShowSuggestions(false);
    }
  }, [newMessage, members, cursorPosition]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const sanitized = sanitizeInput(newMessage.trim());
      await sendMessage.mutateAsync({
        groupId,
        content: sanitized
      });
      setNewMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const insertMention = (member: any) => {
    const username = member.user_profile?.username || member.user_profile?.full_name;
    if (!username) return;

    const cursorPos = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = newMessage.slice(0, cursorPos);
    const textAfterCursor = newMessage.slice(cursorPos);
    
    // Find the @ symbol position
    const atIndex = textBeforeCursor.lastIndexOf('@');
    if (atIndex === -1) return;

    const newText = 
      textBeforeCursor.slice(0, atIndex) + 
      `@${username} ` + 
      textAfterCursor;

    setNewMessage(newText);
    setShowSuggestions(false);
    
    // Focus back to input and set cursor position
    setTimeout(() => {
      inputRef.current?.focus();
      const newCursorPos = atIndex + username.length + 2;
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    
    return mentions;
  };

  const renderMessage = (message: Message) => {
    const isOwnMessage = message.sender_id === user?.id;
    const mentions = extractMentions(message.content);

    // Sanitize and highlight mentions in message content
    let displayContent = sanitizeHTML(message.content);
    mentions.forEach(mention => {
      displayContent = displayContent.replace(
        new RegExp(`@${mention}`, 'g'),
        `<span class="text-primary font-semibold">@${mention}</span>`
      );
    });

    return (
      <div
        key={message.id}
        className={`flex gap-3 p-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
      >
        <Avatar className="w-8 h-8">
          <AvatarImage src={message.sender?.profile_photo_url} />
          <AvatarFallback>
            {message.sender?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className={`flex-1 ${isOwnMessage ? 'text-right' : ''}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">
              {isOwnMessage ? 'You' : (message.sender?.full_name || 'Unknown')}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </span>
          </div>
          
          <div
            className={`p-2 rounded-lg max-w-xs ${
              isOwnMessage
                ? 'bg-primary text-primary-foreground ml-auto'
                : 'bg-muted'
            }`}
            dangerouslySetInnerHTML={{ __html: displayContent }}
          />
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl h-[80vh] flex flex-col bg-background">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl">{groupName}</CardTitle>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {members?.length || 0} members
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMemberList(!showMemberList)}
            >
              <Users className="w-4 h-4 mr-1" />
              Members
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex gap-4 p-4">
          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-2">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map(renderMessage)
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="relative mt-4">
              {showSuggestions && (
                <div className="absolute bottom-full left-0 w-full mb-2 bg-background border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {mentionSuggestions.map((member) => (
                    <button
                      key={member.id}
                      className="w-full flex items-center gap-2 p-2 hover:bg-muted text-left"
                      onClick={() => insertMention(member)}
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={member.user_profile?.profile_photo_url} />
                        <AvatarFallback>
                          {member.user_profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">
                          {member.user_profile?.full_name}
                        </div>
                        {member.user_profile?.username && (
                          <div className="text-xs text-muted-foreground">
                            @{member.user_profile.username}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message... (use @ to mention someone)"
                  className="flex-1"
                  disabled={sendMessage.isPending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessage.isPending}
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Members Sidebar */}
          {showMemberList && (
            <div className="w-64 border-l pl-4">
              <h3 className="font-semibold mb-3">Members ({members?.length || 0})</h3>
              <ScrollArea className="h-full">
                <div className="space-y-2">
                  {members?.map((member) => (
                    <div key={member.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={member.user_profile?.profile_photo_url} />
                        <AvatarFallback>
                          {member.user_profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {member.user_profile?.full_name || 'Unknown'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {member.role === 'admin' ? 'Admin' : 'Member'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GroupMessaging;