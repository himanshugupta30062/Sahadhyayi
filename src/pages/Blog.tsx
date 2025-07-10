
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, ArrowRight, BookOpen, Users, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '@/components/SEO';

const Blog = () => {
  const blogPosts = [
    {
      id: '1',
      title: 'The Science Behind Deep Reading: Why It Matters More Than Ever',
      excerpt: 'Discover how deep reading transforms your brain, improves focus, and enhances critical thinking in our digital age.',
      author: 'Dr. Sarah Chen',
      date: '2024-07-08',
      category: 'Reading Science',
      readTime: '8 min read',
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop',
      featured: true
    },
    {
      id: '2',
      title: 'Building Reading Communities: A Guide for Book Lovers',
      excerpt: 'Learn how to create and nurture thriving reading communities that engage readers and foster meaningful discussions.',
      author: 'Michael Rodriguez',
      date: '2024-07-05',
      category: 'Community',
      readTime: '6 min read',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop'
    },
    {
      id: '3',
      title: 'Digital vs Physical Books: Finding Your Perfect Reading Balance',
      excerpt: 'Explore the benefits of both digital and physical reading formats and how to optimize your reading experience.',
      author: 'Emma Thompson',
      date: '2024-07-03',
      category: 'Reading Tips',
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&h=400&fit=crop'
    },
    {
      id: '4',
      title: 'How AI is Revolutionizing the Reading Experience',
      excerpt: 'Discover how artificial intelligence is transforming how we discover, read, and engage with books.',
      author: 'Tech Team',
      date: '2024-07-01',
      category: 'Technology',
      readTime: '7 min read',
      image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop'
    },
    {
      id: '5',
      title: 'Creating Your Ideal Reading Environment at Home',
      excerpt: 'Tips and tricks for designing the perfect reading nook that enhances focus and reading pleasure.',
      author: 'Lisa Park',
      date: '2024-06-28',
      category: 'Lifestyle',
      readTime: '4 min read',
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop'
    },
    {
      id: '6',
      title: 'The Psychology of Reading Habits: Building Consistency',
      excerpt: 'Understanding the psychological factors that influence reading habits and how to build lasting routines.',
      author: 'Dr. James Wilson',
      date: '2024-06-25',
      category: 'Psychology',
      readTime: '9 min read',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop'
    }
  ];

  const categories = ['All', 'Reading Science', 'Community', 'Reading Tips', 'Technology', 'Lifestyle', 'Psychology'];
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  const filteredPosts = selectedCategory === 'All' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  const featuredPost = blogPosts.find(post => post.featured);
  const regularPosts = blogPosts.filter(post => !post.featured);

  return (
    <>
      <SEO
        title="Reading Blog - Insights, Tips & Community Stories | Sahadhyayi"
        description="Explore our blog for reading insights, community stories, book recommendations, and tips to enhance your reading journey. Join the conversation with fellow book lovers."
        canonical="https://sahadhyayi.com/blog"
        keywords={['reading blog', 'book insights', 'reading tips', 'book community', 'reading habits', 'literature discussion']}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Reading Insights & Community Stories
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the latest insights on reading science, community building, and tips to enhance your reading journey.
            </p>
          </div>

          {/* Featured Post */}
          {featuredPost && (
            <div className="mb-12">
              <Card className="overflow-hidden bg-white/80 backdrop-blur-sm border-orange-200 hover:shadow-xl transition-all duration-300">
                <div className="md:flex">
                  <div className="md:w-1/2">
                    <img
                      src={featuredPost.image}
                      alt={featuredPost.title}
                      className="w-full h-64 md:h-full object-cover"
                    />
                  </div>
                  <div className="md:w-1/2 p-8">
                    <Badge className="mb-4 bg-orange-100 text-orange-800">
                      Featured
                    </Badge>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                      {featuredPost.title}
                    </h2>
                    <p className="text-gray-600 mb-6 text-lg">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {featuredPost.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(featuredPost.date).toLocaleDateString()}
                      </div>
                      <Badge variant="outline">{featuredPost.category}</Badge>
                    </div>
                    <Button className="bg-orange-600 hover:bg-orange-700">
                      Read Full Article
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category 
                  ? "bg-orange-600 hover:bg-orange-700" 
                  : "border-orange-200 text-orange-600 hover:bg-orange-50"
                }
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Blog Posts Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {filteredPosts.filter(post => !post.featured).map(post => (
              <Card key={post.id} className="overflow-hidden bg-white/80 backdrop-blur-sm border-orange-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="relative">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                  <Badge className="absolute top-3 left-3 bg-white/90 text-gray-800">
                    {post.category}
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900 hover:text-orange-600 cursor-pointer">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {post.author}
                    </div>
                    <span>{post.readTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {new Date(post.date).toLocaleDateString()}
                    </span>
                    <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
                      Read More
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Newsletter Signup */}
          <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Stay Updated with Reading Insights</h3>
            <p className="text-lg opacity-90 mb-6">
              Get the latest articles, reading tips, and community stories delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="px-4 py-2 rounded-lg text-gray-900 flex-1"
              />
              <Button variant="secondary" className="px-6">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Blog;
