
import { useState } from "react";
import { Search, SortAsc } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

interface AuthorSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortOption: string;
  setSortOption: (option: string) => void;
}

const AuthorSearch = ({ searchTerm, setSearchTerm, sortOption, setSortOption }: AuthorSearchProps) => {
  const isMobile = useIsMobile();

  return (
    <section className={`${isMobile ? 'mb-8' : 'mb-16'}`}>
      <div className="text-center mb-10">
        <h2 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold text-gray-900 mb-6`}>Find Your Favorite Authors</h2>
        <p className={`${isMobile ? 'text-lg' : 'text-xl'} text-gray-600 max-w-3xl mx-auto`}>
          Search through our community of talented writers and discover new voices in literature
        </p>
      </div>
      
      <div className={`relative ${isMobile ? 'max-w-full' : 'max-w-2xl'} mx-auto`}>
        <Search className={`absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
        <Input
          type="text"
          placeholder="Search authors, genres, or books..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`${isMobile ? 'pl-12 h-12 text-base' : 'pl-14 h-16 text-lg'} bg-white border-2 border-orange-200 focus:border-orange-400 rounded-2xl shadow-lg`}
        />
      </div>
      
      <div className="mt-6 flex justify-center">
        <div className="flex items-center gap-2">
          <SortAsc className="w-5 h-5 text-gray-400" />
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className={`${isMobile ? 'w-40' : 'w-48'}`}>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="followers">Most Followers</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
};

export default AuthorSearch;
