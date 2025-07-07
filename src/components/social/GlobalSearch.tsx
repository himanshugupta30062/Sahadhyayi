
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, BookOpen, Users, MessageCircle, UsersIcon } from 'lucide-react';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockSearchResults = {
  books: [
    { id: '1', title: 'Atomic Habits', author: 'James Clear', readers: 1250 },
    { id: '2', title: 'The Seven Husbands of Evelyn Hugo', author: 'Taylor Jenkins Reid', readers: 890 }
  ],
  users: [
    { id: '1', name: 'Sarah Johnson', username: 'sarah_reads', mutualFriends: 5 },
    { id: '2', name: 'Mike Chen', username: 'bookworm_mike', mutualFriends: 3 }
  ],
  groups: [
    { id: '1', name: 'Mystery Book Club', members: 324, privacy: 'public' },
    { id: '2', name: 'Historical Fiction Fans', members: 201, privacy: 'public' }
  ],
  posts: [
    { id: '1', user: 'Sarah Johnson', content: 'Just finished reading...', likes: 24 },
    { id: '2', user: 'Mike Chen', content: 'Starting my reading challenge...', likes: 18 }
  ]
};

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-96 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Global Search
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Search books, users, groups, or posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Search className="w-4 h-4" />
            </Button>
          </div>

          <Tabs defaultValue="books" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="books" className="text-xs">Books</TabsTrigger>
              <TabsTrigger value="users" className="text-xs">Users</TabsTrigger>
              <TabsTrigger value="groups" className="text-xs">Groups</TabsTrigger>
              <TabsTrigger value="posts" className="text-xs">Posts</TabsTrigger>
            </TabsList>

            <div className="max-h-64 overflow-y-auto">
              <TabsContent value="books" className="space-y-3">
                {mockSearchResults.books.map((book) => (
                  <div key={book.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-amber-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">{book.title}</h4>
                        <p className="text-sm text-gray-500">by {book.author}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {book.readers} readers
                    </Badge>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="users" className="space-y-3">
                {mockSearchResults.users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-gray-900">{user.name}</h4>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {user.mutualFriends} mutual
                    </Badge>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="groups" className="space-y-3">
                {mockSearchResults.groups.map((group) => (
                  <div key={group.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <UsersIcon className="w-5 h-5 text-blue-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">{group.name}</h4>
                        <p className="text-sm text-gray-500">{group.members} members</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {group.privacy}
                    </Badge>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="posts" className="space-y-3">
                {mockSearchResults.posts.map((post) => (
                  <div key={post.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-gray-900">{post.user}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{post.content}</p>
                    <Badge variant="outline" className="text-xs">
                      {post.likes} likes
                    </Badge>
                  </div>
                ))}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
