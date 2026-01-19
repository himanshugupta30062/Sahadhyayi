import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  Users, 
  Swords, 
  Trophy, 
  Copy, 
  Check,
  Search,
  Loader2,
  Send,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Friend {
  id: string;
  full_name: string;
  username: string;
  profile_photo_url: string | null;
  status: 'online' | 'offline' | 'playing';
  total_points?: number;
}

interface Challenge {
  id: string;
  challenger_name: string;
  challenger_photo: string | null;
  book_title: string;
  status: 'pending' | 'accepted' | 'completed';
  created_at: string;
}

interface FriendChallengeProps {
  onStartChallenge: (friendId: string, bookId: string) => void;
  onAcceptChallenge: (challengeId: string) => void;
}

export default function FriendChallenge({ onStartChallenge, onAcceptChallenge }: FriendChallengeProps) {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'friends' | 'challenges'>('friends');
  const [challengeCode, setChallengeCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchChallenges();
      generateChallengeCode();
    }
  }, [user]);

  const fetchFriends = async () => {
    try {
      // Mock data for now - replace with actual friends query
      const mockFriends: Friend[] = [
        { id: '1', full_name: 'Alex Johnson', username: 'alexj', profile_photo_url: null, status: 'online', total_points: 12500 },
        { id: '2', full_name: 'Sarah Chen', username: 'sarahc', profile_photo_url: null, status: 'playing', total_points: 18200 },
        { id: '3', full_name: 'Mike Peters', username: 'mikep', profile_photo_url: null, status: 'offline', total_points: 8900 },
      ];
      setFriends(mockFriends);
    } catch (err) {
      console.error('Error fetching friends:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChallenges = async () => {
    // Mock pending challenges
    const mockChallenges: Challenge[] = [
      { 
        id: '1', 
        challenger_name: 'Sarah Chen', 
        challenger_photo: null, 
        book_title: 'The Great Gatsby', 
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ];
    setChallenges(mockChallenges);
  };

  const generateChallengeCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setChallengeCode(code);
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(challengeCode);
    setCopied(true);
    toast.success('Challenge code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredFriends = friends.filter(f => 
    f.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: Friend['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'playing': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Multiplayer
          </CardTitle>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mt-3">
          <Button
            variant={activeTab === 'friends' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('friends')}
            className="flex-1"
          >
            <Users className="h-4 w-4 mr-1" />
            Friends
          </Button>
          <Button
            variant={activeTab === 'challenges' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('challenges')}
            className="flex-1 relative"
          >
            <Swords className="h-4 w-4 mr-1" />
            Challenges
            {challenges.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {challenges.length}
              </span>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <AnimatePresence mode="wait">
          {activeTab === 'friends' ? (
            <motion.div
              key="friends"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search friends..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Challenge Code */}
              <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-muted">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Your Challenge Code</p>
                  <p className="font-mono font-bold text-lg">{challengeCode}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={copyCode}
                  className="shrink-0"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              {/* Friends List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredFriends.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No friends found</p>
                  </div>
                ) : (
                  filteredFriends.map((friend) => (
                    <motion.div
                      key={friend.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={friend.profile_photo_url || undefined} />
                          <AvatarFallback>
                            {friend.full_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className={cn(
                          'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background',
                          getStatusColor(friend.status)
                        )} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{friend.full_name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {friend.status === 'playing' ? '🎮 Playing now' : `${friend.total_points?.toLocaleString()} pts`}
                          </span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0"
                        disabled={friend.status === 'offline'}
                        onClick={() => onStartChallenge(friend.id, '')}
                      >
                        <Swords className="h-4 w-4 mr-1" />
                        Challenge
                      </Button>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="challenges"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Pending Challenges */}
              {challenges.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Swords className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No pending challenges</p>
                  <p className="text-xs mt-1">Challenge a friend to start!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {challenges.map((challenge) => (
                    <motion.div
                      key={challenge.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 rounded-xl border bg-gradient-to-r from-primary/5 to-transparent"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={challenge.challenger_photo || undefined} />
                          <AvatarFallback>
                            {challenge.challenger_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{challenge.challenger_name}</p>
                          <p className="text-xs text-muted-foreground">
                            challenged you on "{challenge.book_title}"
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          2h ago
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          className="flex-1 bg-gradient-to-r from-primary to-primary/80"
                          onClick={() => onAcceptChallenge(challenge.id)}
                        >
                          Accept Challenge
                        </Button>
                        <Button variant="outline" className="flex-1">
                          Decline
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Join with Code */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">Join with Code</p>
                <div className="flex gap-2">
                  <Input placeholder="Enter challenge code..." />
                  <Button size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
