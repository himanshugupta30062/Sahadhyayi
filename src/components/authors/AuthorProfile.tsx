
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, MessageSquare, Star, Users, BookOpen, Clock, Send, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScheduleSessionDialog } from "./ScheduleSessionDialog";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Author } from "@/hooks/useAuthors";
import { useAuthorFollowerCount } from "@/hooks/useAuthorFollowerCount";

interface AuthorProfileProps {
  author: Author & {
    genre?: string;
    books?: string[];
    image?: string;
    nextSession?: string;
  };
}

const AuthorProfile = ({ author }: AuthorProfileProps) => {
  const isMobile = useIsMobile();
  const [message, setMessage] = useState("");
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const { toast } = useToast();
  const { data: followerCount = 0 } = useAuthorFollowerCount(author.id);

  const handleSendMessage = () => {
    toast({
      title: "Message Sent Successfully",
      description: `Your message has been sent to ${author.name}. They will respond soon!`,
    });
    setMessage("");
    setIsMessageDialogOpen(false);
  };

  const handleCloseDialog = () => {
    setMessage("");
    setIsMessageDialogOpen(false);
  };

  return (
    <Card className="group bg-white/95 backdrop-blur-sm border-orange-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:border-orange-300 rounded-2xl overflow-hidden h-full flex flex-col">
      <CardHeader className={`text-center ${isMobile ? 'pb-4' : 'pb-6'}`}>
        <Avatar className={`${isMobile ? 'w-20 h-20' : 'w-28 h-28'} mx-auto ${isMobile ? 'mb-4' : 'mb-6'} ring-4 ring-orange-200 group-hover:ring-orange-400 transition-all`}>
          <AvatarImage src={author.profile_image_url || author.image || ""} alt={`${author.name} profile`} />
          <AvatarFallback className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold bg-gradient-to-br from-orange-500 to-amber-500 text-white`}>
            {author.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} text-gray-900 mb-3 font-semibold`}>{author.name}</h3>
        {author.genre && (
          <Badge variant="secondary" className={`bg-orange-100 text-orange-800 mb-4 ${isMobile ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm'} font-medium`}>
            {author.genre}
          </Badge>
        )}
        <div className={`flex items-center justify-center ${isMobile ? 'gap-6' : 'gap-8'} text-sm text-gray-600`}>
          <div className="flex items-center gap-2">
            <Star className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} fill-yellow-400 text-yellow-400`} />
            <span className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>{author.rating}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
            <span className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}>{followerCount.toLocaleString()}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className={`flex-1 flex flex-col space-y-6 ${isMobile ? 'px-4 pb-6' : 'px-6 pb-8'}`}>
        <p className={`text-gray-700 leading-relaxed line-clamp-4 ${isMobile ? 'text-sm' : ''}`}>{author.bio}</p>
        
        <div>
          <h4 className={`font-semibold text-gray-900 mb-4 flex items-center gap-2 ${isMobile ? 'text-sm' : ''}`}>
            <BookOpen className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-orange-600`} />
            Featured Books
          </h4>
          <div className="flex flex-wrap gap-2">
            {author.books?.map((book, index) => (
              <Badge key={index} variant="outline" className={`${isMobile ? 'text-xs' : 'text-sm'} border-orange-200 text-orange-700 hover:bg-orange-50`}>
                {book}
              </Badge>
            ))}
          </div>
        </div>

        {author.nextSession && (
          <div className={`bg-gradient-to-r from-orange-50 to-amber-50 ${isMobile ? 'p-4' : 'p-5'} rounded-xl border border-orange-100`}>
            <div className="flex items-center gap-2 mb-3">
              <Clock className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-orange-600`} />
              <span className={`font-semibold text-orange-900 ${isMobile ? 'text-sm' : ''}`}>Next Available Session</span>
            </div>
            <p className={`text-orange-800 font-medium ${isMobile ? 'text-sm' : ''}`}>{author.nextSession}</p>
          </div>
        )}

        {/* Fixed button layout with single messaging modal */}
        <div className="mt-auto pt-4">
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-2 gap-3'}`}>
            <ScheduleSessionDialog
              author={author}
              trigger={
                <Button 
                  size={isMobile ? "default" : "lg"}
                  className={`w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all ${isMobile ? 'h-11 text-sm' : 'h-12'}`}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Session
                </Button>
              }
            />
            
            {/* Single clean messaging modal */}
            <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  size={isMobile ? "default" : "lg"}
                  variant="outline" 
                  className={`w-full border-2 border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 transition-all ${isMobile ? 'h-11 text-sm' : 'h-12'}`}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md mx-4">
                <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <DialogTitle className="text-lg font-semibold">
                    Message {author.name}
                  </DialogTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCloseDialog}
                    className="h-6 w-6 p-0 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-sm font-medium">
                      Your Message
                    </Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={`Write your message to ${author.name}...`}
                      rows={5}
                      className="resize-none border-orange-200 focus:border-orange-400"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!message.trim()}
                      className="bg-orange-600 hover:bg-orange-700 flex-1"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleCloseDialog}
                      className="border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthorProfile;
