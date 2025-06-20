
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Map, Users, MapPin, Search, BookOpen } from "lucide-react";
import { useState } from "react";

interface ReaderLocation {
  city: string;
  state: string;
  country: string;
  totalReaders: number;
  popularBooks: { title: string; readers: number }[];
}

const ReaderMap = () => {
  const [searchLocation, setSearchLocation] = useState("");
  const [selectedBook, setSelectedBook] = useState("All Books");

  const readerData: ReaderLocation[] = [
    {
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      totalReaders: 1250,
      popularBooks: [
        { title: "The Midnight Library", readers: 89 },
        { title: "Atomic Habits", readers: 156 },
        { title: "Sapiens", readers: 112 }
      ]
    },
    {
      city: "Delhi",
      state: "Delhi",
      country: "India", 
      totalReaders: 1850,
      popularBooks: [
        { title: "Atomic Habits", readers: 234 },
        { title: "Think Again", readers: 178 },
        { title: "Educated", readers: 145 }
      ]
    },
    {
      city: "Bangalore",
      state: "Karnataka",
      country: "India",
      totalReaders: 2100,
      popularBooks: [
        { title: "Sapiens", readers: 267 },
        { title: "The Psychology of Money", readers: 198 },
        { title: "Atomic Habits", readers: 189 }
      ]
    },
    {
      city: "Chennai",
      state: "Tamil Nadu", 
      country: "India",
      totalReaders: 890,
      popularBooks: [
        { title: "Educated", readers: 123 },
        { title: "The Midnight Library", readers: 98 },
        { title: "Think Again", readers: 87 }
      ]
    },
    {
      city: "Pune",
      state: "Maharashtra",
      country: "India",
      totalReaders: 720,
      popularBooks: [
        { title: "Atomic Habits", readers: 145 },
        { title: "Sapiens", readers: 98 },
        { title: "The Psychology of Money", readers: 76 }
      ]
    },
    {
      city: "Hyderabad",
      state: "Telangana",
      country: "India",
      totalReaders: 950,
      popularBooks: [
        { title: "Think Again", readers: 167 },
        { title: "The Midnight Library", readers: 134 },
        { title: "Educated", readers: 89 }
      ]
    }
  ];

  const allBooks = ["All Books", "The Midnight Library", "Atomic Habits", "Sapiens", "Think Again", "Educated", "The Psychology of Money"];

  const filteredData = readerData.filter(location => {
    const matchesSearch = searchLocation === "" || 
      location.city.toLowerCase().includes(searchLocation.toLowerCase()) ||
      location.state.toLowerCase().includes(searchLocation.toLowerCase());
    
    return matchesSearch;
  });

  const getBookReaders = (location: ReaderLocation, bookTitle: string) => {
    if (bookTitle === "All Books") return location.totalReaders;
    const book = location.popularBooks.find((b) => b.title === bookTitle);
    return book ? book.readers : 0;
  };

  const totalGlobalReaders = readerData.reduce((sum, location) => sum + location.totalReaders, 0);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Reader Map</h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Discover reading communities near you and connect with fellow book lovers worldwide.
          </p>
        </div>

        {/* Global Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">{totalGlobalReaders.toLocaleString()}</div>
              <div className="text-blue-800 font-medium">Total Readers</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">{readerData.length}</div>
              <div className="text-green-800 font-medium">Cities</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-amber-600 mb-2">6</div>
              <div className="text-amber-800 font-medium">States</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search by city or state..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="flex items-center text-sm text-gray-600 mr-2">
              <BookOpen className="w-4 h-4 mr-1" />
              Filter by book:
            </span>
            {allBooks.map((book) => (
              <Button
                key={book}
                variant={selectedBook === book ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedBook(book)}
                className={selectedBook === book ? "bg-amber-600 hover:bg-amber-700" : ""}
              >
                {book}
              </Button>
            ))}
          </div>
        </div>

        {/* Interactive Map Placeholder */}
        <Card className="mb-8 bg-white/70 backdrop-blur-sm border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Map className="w-6 h-6 mr-2 text-amber-600" />
              Interactive Reader Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center max-w-md">
                <Map className="w-16 h-16 text-amber-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Interactive Map Coming Soon</h3>
                <p className="text-gray-700 mb-4">
                  We're building an interactive map to help you visualize reading communities and connect with nearby readers.
                </p>
                <Badge className="bg-amber-100 text-amber-800">
                  Google Maps Integration in Progress
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((location, index) => (
            <Card key={index} className="bg-white/70 backdrop-blur-sm border-amber-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl text-gray-900 flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-amber-600" />
                      {location.city}
                    </CardTitle>
                    <p className="text-gray-600">{location.state}, {location.country}</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    {getBookReaders(location, selectedBook)} readers
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Readers:</span>
                  <span className="font-semibold text-gray-900">{location.totalReaders}</span>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 text-sm">Popular Books:</h4>
                  {location.popularBooks.slice(0, 3).map((book, bookIndex) => (
                    <div key={bookIndex} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 truncate flex-1 mr-2">{book.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {book.readers} readers
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <Button className="w-full bg-amber-600 hover:bg-amber-700" size="sm">
                    <Users className="w-4 h-4 mr-2" />
                    Connect with Readers
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">No locations found</h3>
            <p className="text-gray-500">Try adjusting your search criteria</p>
          </div>
        )}

        {/* Call to Action */}
        <Card className="mt-12 bg-gradient-to-r from-amber-600 to-orange-600 text-white border-0">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Can't Find Readers in Your Area?</h3>
            <p className="text-lg mb-6 opacity-90">
              Be the first to start a reading community in your city and inspire others to join!
            </p>
            <Button size="lg" variant="secondary" className="px-8 py-3">
              Start a Local Group
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReaderMap;
