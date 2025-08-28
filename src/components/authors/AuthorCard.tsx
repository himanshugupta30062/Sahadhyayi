import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BookOpen, Calendar } from 'lucide-react';
import type { Author } from '@/hooks/useAuthors';
import type { Book } from '@/hooks/useLibraryBooks';

interface AuthorCardProps {
  author: Author;
  books: Book[];
  featured?: boolean;
}

const AuthorCard = ({ author, books, featured }: AuthorCardProps) => {
  const [open, setOpen] = useState(false);

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full text-left focus:outline-none">
          <Card className={`group overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white/90 backdrop-blur-sm border-gray-200 ${featured ? 'ring-2 ring-orange-300' : ''}`}>
            <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
              <Avatar className="w-24 h-24 border-2 border-orange-200">
                <AvatarImage src={author.profile_image_url || ''} alt={author.name} />
                <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-500 text-white font-semibold">
                  {getInitials(author.name)}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-lg text-gray-900">{author.name}</h3>
              {author.bio && (
                <p className="text-sm text-gray-600 line-clamp-3">{author.bio}</p>
              )}
              {author.genres.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center">
                  {author.genres.slice(0, 2).map((genre, index) => (
                    <Badge key={index} variant="outline" className="text-xs border-orange-200 text-orange-700">
                      {genre}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{author.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {author.bio && <p className="text-sm text-gray-700">{author.bio}</p>}
          {books.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Books
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {books.map((book) => (
                  <li key={book.id}>{book.title}</li>
                ))}
              </ul>
            </div>
          )}
          {author.upcoming_events > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Upcoming Q&A Events
              </h4>
              <ul className="list-disc list-inside text-sm text-gray-700">
                <li>
                  {author.upcoming_events} event{author.upcoming_events > 1 ? 's' : ''} scheduled
                </li>
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthorCard;
