import { useParams, Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, BookOpen, Users, Star, Globe, Calendar } from 'lucide-react';
import { useAuthorBySlug } from '@/hooks/useAuthorBySlug';
import SEO from '@/components/SEO';
import NotFound from '../NotFound';

const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const AuthorSlugPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: author, isLoading } = useAuthorBySlug(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">Loading author...</div>
    );
  }

  if (!author) {
    return <NotFound />;
  }

  const initials = author.name
    .split(' ')
    .map(n => n[0])
    .join('');

  const social = (author as any).social_links || {};

  return (
    <>
      <SEO
        title={`Author Profile - ${author.name} | Sahadhyayi`}
        description={author.bio || `Learn more about ${author.name}`}
        canonical={`https://sahadhyayi.com/authors/${slug}`}
        url={`https://sahadhyayi.com/authors/${slug}`}
        type="profile"
        author={author.name}
      />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-6">
            <Avatar className="w-32 h-32 mx-auto ring-4 ring-orange-200">
              <AvatarImage src={author.profile_image_url || ''} alt={author.name} />
              <AvatarFallback className="text-3xl font-bold bg-orange-500 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <h1 className="text-4xl font-bold mt-4 mb-2">{author.name}</h1>
            <p className="text-gray-700 max-w-2xl mx-auto mb-4">{author.bio}</p>
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {author.genres?.map(genre => (
                <Badge key={genre} variant="outline" className="border-orange-300 text-orange-700">
                  {genre}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm border-orange-200">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{author.location}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <BookOpen className="w-4 h-4" />
                  <span>{author.books_count} Books</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{author.followers_count.toLocaleString()} Followers</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span>{author.rating}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{author.upcoming_events} Upcoming Events</span>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm border-orange-200">
              <CardContent className="p-6 space-y-2">
                {social.goodreads && (
                  <a href={social.goodreads} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline text-sm">
                    <Globe className="w-4 h-4 text-orange-600" /> Goodreads
                  </a>
                )}
                {social.wikipedia && (
                  <a href={social.wikipedia} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline text-sm">
                    <Globe className="w-4 h-4 text-orange-600" /> Wikipedia
                  </a>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <Link to="/authors">
              <Button variant="outline">Back to Authors</Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthorSlugPage;
