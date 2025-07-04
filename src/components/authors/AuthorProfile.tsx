
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, MessageSquare, Star, Users, BookOpen, Clock } from "lucide-react";

interface AuthorProfileProps {
  author: {
    id: number;
    name: string;
    genre: string;
    books: string[];
    rating: number;
    followers: number;
    bio: string;
    image: string;
    availableSlots: string[];
    nextSession: string;
  };
}

const AuthorProfile = ({ author }: AuthorProfileProps) => {
  return (
    <Card className="group bg-white/95 backdrop-blur-sm border-orange-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 hover:border-orange-300 rounded-2xl overflow-hidden">
      <CardHeader className="text-center pb-6">
        <Avatar className="w-28 h-28 mx-auto mb-6 ring-4 ring-orange-200 group-hover:ring-orange-400 transition-all">
          <AvatarImage src={author.image} alt={`${author.name} profile`} />
          <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-orange-500 to-amber-500 text-white">
            {author.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <h3 className="text-2xl text-gray-900 mb-3 font-semibold">{author.name}</h3>
        <Badge variant="secondary" className="bg-orange-100 text-orange-800 mb-4 px-4 py-2 text-sm font-medium">
          {author.genre}
        </Badge>
        <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold text-lg">{author.rating}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span className="font-semibold text-lg">{author.followers.toLocaleString()}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 px-6 pb-6">
        <p className="text-gray-700 leading-relaxed line-clamp-4">{author.bio}</p>
        
        <div>
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-orange-600" />
            Featured Books
          </h4>
          <div className="flex flex-wrap gap-2">
            {author.books.map((book, index) => (
              <Badge key={index} variant="outline" className="text-sm border-orange-200 text-orange-700 hover:bg-orange-50">
                {book}
              </Badge>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-5 rounded-xl border border-orange-100">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-orange-600" />
            <span className="font-semibold text-orange-900">Next Available Session</span>
          </div>
          <p className="text-orange-800 font-medium">{author.nextSession}</p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button 
            size="lg" 
            className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Session
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="flex-1 border-2 border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 transition-all"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Message
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthorProfile;
