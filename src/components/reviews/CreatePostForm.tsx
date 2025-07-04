
import { useState } from "react";
import { Camera, MapPin, Hash, Book, X, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface CreatePostFormProps {
  onClose: () => void;
  onSubmit: (post: any) => void;
}

const genres = ['Fiction', 'Non-Fiction', 'Science', 'Biography', 'History', 'Philosophy', 'Self-Help', 'Mystery', 'Romance', 'Fantasy'];
const moods = ['Excited', 'Contemplative', 'Motivated', 'Emotional', 'Relaxed', 'Inspired', 'Nostalgic', 'Adventurous'];
const readingStatuses = [
  { value: 'reading', label: 'Currently Reading' },
  { value: 'finished', label: 'Just Finished' },
  { value: 'want-to-read', label: 'Want to Read' }
];

export const CreatePostForm = ({ onClose, onSubmit }: CreatePostFormProps) => {
  const [postText, setPostText] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [readingStatus, setReadingStatus] = useState('reading');
  const [location, setLocation] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAddCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags([...selectedTags, customTag.trim()]);
      setCustomTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = () => {
    if (!postText.trim() || !bookTitle.trim() || !bookAuthor.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const newPost = {
        id: Date.now(),
        username: "you",
        userLocation: location || "Your Location",
        bookCover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop",
        bookTitle,
        bookAuthor,
        genre: selectedGenre,
        mood: selectedMood,
        review: postText,
        likes: 0,
        comments: 0,
        shares: 0,
        liked: false,
        timeAgo: "Just now",
        readingStatus,
        nearbyReaders: Math.floor(Math.random() * 50) + 1,
        tags: selectedTags
      };

      onSubmit(newPost);
      setIsLoading(false);
      
      toast({
        title: "Post Created!",
        description: "Your reading update has been shared with the community.",
      });
      
      onClose();
    }, 1000);
  };

  return (
    <Card className="border-amber-200 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Share Your Reading Experience
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-8 h-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Book Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Book Title *
            </label>
            <Input
              placeholder="Enter book title"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              className="border-amber-200 focus:border-amber-400"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Author *
            </label>
            <Input
              placeholder="Enter author name"
              value={bookAuthor}
              onChange={(e) => setBookAuthor(e.target.value)}
              className="border-amber-200 focus:border-amber-400"
            />
          </div>
        </div>

        {/* Reading Status */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Reading Status
          </label>
          <Select value={readingStatus} onValueChange={setReadingStatus}>
            <SelectTrigger className="border-amber-200 focus:border-amber-400">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {readingStatuses.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Genre and Mood */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Genre
            </label>
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="border-amber-200 focus:border-amber-400">
                <SelectValue placeholder="Select genre" />
              </SelectTrigger>
              <SelectContent>
                {genres.map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Current Mood
            </label>
            <Select value={selectedMood} onValueChange={setSelectedMood}>
              <SelectTrigger className="border-amber-200 focus:border-amber-400">
                <SelectValue placeholder="How are you feeling?" />
              </SelectTrigger>
              <SelectContent>
                {moods.map((mood) => (
                  <SelectItem key={mood} value={mood}>
                    {mood}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Post Content */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Share Your Thoughts *
          </label>
          <Textarea
            placeholder="What are you thinking about this book? Share your experience..."
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            className="min-h-[100px] border-amber-200 focus:border-amber-400"
          />
        </div>

        {/* Custom Tags */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Tags
          </label>
          <div className="flex space-x-2 mb-2">
            <Input
              placeholder="Add custom tag"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTag()}
              className="flex-1 border-amber-200 focus:border-amber-400"
            />
            <Button
              type="button"
              onClick={handleAddCustomTag}
              size="sm"
              variant="outline"
            >
              <Hash className="w-4 h-4" />
            </Button>
          </div>
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="border-amber-300 text-amber-700 cursor-pointer"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Location */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Location (Optional)
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Where are you reading?"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10 border-amber-200 focus:border-amber-400"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 text-sm text-gray-500">
            <button className="flex items-center space-x-1 hover:text-amber-600 transition-colors">
              <Camera className="w-4 h-4" />
              <span>Add Photo</span>
            </button>
            <button className="flex items-center space-x-1 hover:text-amber-600 transition-colors">
              <Image className="w-4 h-4" />
              <span>Book Cover</span>
            </button>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-amber-600 hover:bg-amber-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Sharing..." : "Share Post"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
