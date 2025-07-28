
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  MessageCircle, 
  Users, 
  ExternalLink,
  Search,
  Plus,
  Instagram,
  Send
} from 'lucide-react';

interface ReadingCirclePanelProps {
  book: {
    id: string;
    title: string;
    author: string;
    readingFriends: Array<{
      name: string;
      avatar: string;
      status: 'reading' | 'completed' | 'want_to_read';
    }>;
  };
}

const ReadingCirclePanel: React.FC<ReadingCirclePanelProps> = ({ book }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('members');
  
  // Mock data for additional readers
  const mockReaders = [
    { name: 'Alex Johnson', avatar: '/placeholder.svg', status: 'reading', phone: '+1234567890', instagram: '@alex_reads' },
    { name: 'Maria Garcia', avatar: '/placeholder.svg', status: 'completed', phone: '+1234567891', instagram: '@maria_books' },
    { name: 'David Chen', avatar: '/placeholder.svg', status: 'want_to_read', phone: '+1234567892', instagram: '@david_novels' },
    { name: 'Sophie Wilson', avatar: '/placeholder.svg', status: 'reading', phone: '+1234567893', instagram: '@sophie_stories' },
  ];

  const allReaders = [...book.readingFriends.map(friend => ({
    ...friend,
    phone: '+1234567890',
    instagram: '@' + friend.name.toLowerCase().replace(' ', '_')
  })), ...mockReaders];

  const filteredReaders = allReaders.filter(reader =>
    reader.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reading': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'want_to_read': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'reading': return 'Currently Reading';
      case 'completed': return 'Finished';
      case 'want_to_read': return 'Want to Read';
      default: return status;
    }
  };

  const openWhatsApp = (phone: string, bookTitle: string) => {
    const message = `Hey! I saw you're reading "${bookTitle}". Would love to chat about it! 📚`;
    const url = `https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const openInstagram = (username: string) => {
    const url = `https://instagram.com/${username.replace('@', '')}`;
    window.open(url, '_blank');
  };

  const openShelfTalk = (readerName: string) => {
    // Placeholder for in-app chat
    alert(`Opening ShelfTalk with ${readerName} - Feature coming soon!`);
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Reading Circle</h3>
        <p className="text-gray-600 text-sm">
          Connect with {allReaders.length} other readers of "{book.title}"
        </p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="members">
            <Users className="w-4 h-4 mr-2" />
            Members ({allReaders.length})
          </TabsTrigger>
          <TabsTrigger value="chat">
            <MessageCircle className="w-4 h-4 mr-2" />
            Group Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search readers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Reader List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredReaders.map((reader, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={reader.avatar} alt={reader.name} />
                    <AvatarFallback>{reader.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{reader.name}</h4>
                    <Badge className={getStatusColor(reader.status)}>
                      {getStatusText(reader.status)}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openWhatsApp(reader.phone, book.title)}
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openInstagram(reader.instagram)}
                    className="text-pink-600 border-pink-200 hover:bg-pink-50"
                  >
                    <Instagram className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openShelfTalk(reader.name)}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    ShelfTalk
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button className="w-full" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Invite More Readers
          </Button>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-lg text-center">
            <MessageCircle className="w-12 h-12 text-amber-600 mx-auto mb-2" />
            <h4 className="font-medium text-amber-800 mb-2">Group Chat Coming Soon!</h4>
            <p className="text-sm text-amber-700 mb-4">
              Start conversations with individual readers using WhatsApp, Instagram, or ShelfTalk for now.
            </p>
            <div className="flex gap-2 justify-center">
              <Button size="sm" variant="outline" className="text-green-600 border-green-200">
                WhatsApp Group
              </Button>
              <Button size="sm" variant="outline" className="text-blue-600 border-blue-200">
                ShelfTalk Room
              </Button>
            </div>
          </div>

          {/* Mock Chat Preview */}
          <div className="border rounded-lg p-4 bg-white">
            <h4 className="font-medium mb-3">Recent Discussions</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs">S</AvatarFallback>
                </Avatar>
                <div>
                  <span className="font-medium">Sarah M.</span>
                  <p className="text-gray-600">Just finished chapter 5, what a twist! 🤯</p>
                  <span className="text-xs text-gray-400">2 hours ago</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs">J</AvatarFallback>
                </Avatar>
                <div>
                  <span className="font-medium">John D.</span>
                  <p className="text-gray-600">I know right! Didn't see that coming at all.</p>
                  <span className="text-xs text-gray-400">1 hour ago</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReadingCirclePanel;
