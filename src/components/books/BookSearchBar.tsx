import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sanitizeSearchQuery, isRateLimited } from '@/utils/validation';
import { useToast } from '@/hooks/use-toast';

interface BookSearchBarProps {
  onSearch: (searchTerm: string) => void;
  loading: boolean;
  onToggleExternal?: (value: boolean) => void;
}

const BookSearchBar: React.FC<BookSearchBarProps> = ({ onSearch, loading, onToggleExternal }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [useExternal, setUseExternal] = useState(true);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter a search term.",
        variant: "destructive"
      });
      return;
    }

    // Rate limiting check
    if (isRateLimited('book_search', 10, 60000)) { // 10 searches per minute
      toast({
        title: "Too Many Searches",
        description: "Please wait a moment before searching again.",
        variant: "destructive"
      });
      return;
    }

    // Sanitize the search query
    const sanitizedQuery = sanitizeSearchQuery(searchTerm);
    if (!sanitizedQuery) {
      toast({
        title: "Invalid Search",
        description: "Please enter a valid search term.",
        variant: "destructive"
      });
      return;
    }

    onSearch(sanitizedQuery);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Sanitize input as user types (basic sanitization)
    const value = e.target.value.replace(/[<>]/g, '');
    setSearchTerm(value);
  };

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setUseExternal(val);
    onToggleExternal?.(val);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder="Search for any book by title, author, or keyword (e.g., 'Harry Potter', 'Shakespeare', 'Python programming')"
          value={searchTerm}
          onChange={handleInputChange}
          className="pl-10 h-12 text-base"
          disabled={loading}
        />
      </div>
      <Button 
        type="submit" 
        disabled={loading || !searchTerm.trim()}
        className="h-12 px-6"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Searching...
          </>
        ) : (
          <>
            <Search className="w-4 h-4 mr-2" />
            Search
          </>
        )}
      </Button>
      {onToggleExternal && (
        <label className="flex items-center text-xs gap-2 pl-1">
          <input type="checkbox" checked={useExternal} onChange={handleToggle} />
          Search External Sources
        </label>
      )}
    </form>
  );
};

export default BookSearchBar;