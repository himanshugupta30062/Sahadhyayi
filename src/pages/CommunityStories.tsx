
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserContentEditor from '@/components/content/UserContentEditor';
import UserContentFeed from '@/components/content/UserContentFeed';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, PenTool, Heart } from 'lucide-react';
import SEO from '@/components/SEO';
import { Link } from 'react-router-dom';
import SignInLink from '@/components/SignInLink';
import { Button } from '@/components/ui/button';

const CommunityStories = () => {
  const { user } = useAuth();

  return (
    <>
      <SEO
        title="Community Stories - Share Your Creative Writing | Sahadhyayi"
        description="Share your creative stories, alternative book endings, and chapter reimaginings with the Sahadhyayi community. Read and vote on stories from fellow readers."
        canonical="https://sahadhyayi.com/community-stories"
        keywords={['community stories', 'creative writing', 'user generated content', 'book community', 'alternative endings', 'story sharing']}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 pt-16">
        {/* Improved Header */}
        <div className="bg-white/90 backdrop-blur-md border-b border-purple-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Community Stories
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Share your creative interpretations, alternative endings, and story continuations. 
                Connect with fellow readers through the power of storytelling.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {!user ? (
            <div className="text-center mb-12">
              <Card className="max-w-2xl mx-auto bg-white/90 backdrop-blur-sm border-purple-200 shadow-xl rounded-2xl">
                <CardContent className="p-8">
                  <Heart className="w-16 h-16 mx-auto mb-4 text-purple-600" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Join Our Creative Community
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Sign in to share your own stories and connect with fellow creative readers.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <SignInLink>
                      <Button className="bg-purple-600 hover:bg-purple-700 shadow-lg">
                        Sign In
                      </Button>
                    </SignInLink>
                    <Link to="/signup">
                      <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Tabs defaultValue="browse" className="mb-8">
              <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 bg-white/90 backdrop-blur-sm border border-purple-200 rounded-2xl p-1 shadow-lg">
                <TabsTrigger 
                  value="browse" 
                  className="flex items-center gap-2 py-3 px-4 rounded-xl transition-all duration-200 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800 data-[state=active]:shadow-md"
                >
                  <BookOpen className="w-4 h-4" />
                  Browse Stories
                </TabsTrigger>
                <TabsTrigger 
                  value="create" 
                  className="flex items-center gap-2 py-3 px-4 rounded-xl transition-all duration-200 data-[state=active]:bg-pink-100 data-[state=active]:text-pink-800 data-[state=active]:shadow-md"
                >
                  <PenTool className="w-4 h-4" />
                  Create Story
                </TabsTrigger>
              </TabsList>

              <TabsContent value="browse">
                <div className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Community Stories & Creations
                    </h2>
                    <p className="text-gray-600">
                      Discover creative stories, alternative chapters, and continuations from our community.
                    </p>
                  </div>
                  
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-purple-200 shadow-lg p-6">
                    <UserContentFeed />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="create">
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Share Your Creative Story
                    </h2>
                    <p className="text-gray-600">
                      Create alternative chapters, endings, or continuations. Let your imagination flow!
                    </p>
                  </div>
                  
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-pink-200 shadow-lg p-6">
                    <UserContentEditor 
                      bookId="" 
                      onSuccess={() => {
                        // Switch to browse tab after successful submission
                        const browseTab = document.querySelector('[value="browse"]') as HTMLElement;
                        browseTab?.click();
                      }}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* Community Guidelines */}
          <Card className="mt-12 bg-white/90 backdrop-blur-sm border-purple-200 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-gray-900">
                Community Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="font-semibold text-gray-900 mb-2">Respectful Content</h3>
                  <p className="text-sm text-gray-600">
                    Share stories that are respectful, creative, and appropriate for all readers.
                  </p>
                </div>
                <div className="text-center">
                  <PenTool className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="font-semibold text-gray-900 mb-2">Original Work</h3>
                  <p className="text-sm text-gray-600">
                    Share your own creative interpretations and original writing inspired by books.
                  </p>
                </div>
                <div className="text-center">
                  <Heart className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="font-semibold text-gray-900 mb-2">Supportive Community</h3>
                  <p className="text-sm text-gray-600">
                    Engage positively with others' work through constructive feedback and encouragement.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default CommunityStories;
