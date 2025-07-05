import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const nearbyReaders = [
  { id: 1, name: 'Priya', city: 'Delhi' },
  { id: 2, name: 'Tom', city: 'London' },
  { id: 3, name: 'Luisa', city: 'Madrid' },
  { id: 4, name: 'Chen', city: 'Beijing' },
];

const recommendedGroups = [
  { id: 1, name: 'Mystery Lovers', members: 324 },
  { id: 2, name: 'Historical Fiction Fans', members: 201 },
];

const trendingBooks = [
  { id: 1, title: 'Project Hail Mary', author: 'Andy Weir' },
  { id: 2, title: 'Educated', author: 'Tara Westover' },
  { id: 3, title: 'The Midnight Library', author: 'Matt Haig' },
];

export const RightSidebar = () => {
  return (
    <div className="space-y-6">
      <Card className="bg-white/90 backdrop-blur-sm border-amber-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-gray-900">People Near You</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {nearbyReaders.map((p) => (
            <div key={p.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-amber-500 text-white text-xs">
                    {p.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium text-gray-900 leading-none">{p.name}</p>
                  <p className="text-gray-500 text-xs">{p.city}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="border-amber-300 text-amber-700">
                Connect
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-white/90 backdrop-blur-sm border-amber-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-gray-900">Recommended Groups</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recommendedGroups.map((g) => (
            <div key={g.id} className="flex items-center justify-between">
              <p className="text-sm text-gray-900">{g.name}</p>
              <Badge variant="outline" className="border-gray-300 text-gray-700 text-xs">
                {g.members} members
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-white/90 backdrop-blur-sm border-amber-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-gray-900">Trending Books</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {trendingBooks.map((b) => (
            <div key={b.id} className="text-sm">
              <p className="font-medium text-gray-900 leading-none">{b.title}</p>
              <p className="text-gray-500 text-xs">{b.author}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
