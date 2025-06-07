
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, BookOpen, Users, Calendar } from "lucide-react";

const Reviews = () => {
  const [showReviewForm, setShowReviewForm] = useState(false);

  const reviews = [
    {
      id: 1,
      bookTitle: "The Midnight Library",
      author: "Matt Haig",
      reviewer: "Priya Sharma",
      rating: 5,
      date: "March 5, 2025",
      readingGroup: "Midnight Dreamers",
      review: "This book completely changed my perspective on life choices and regret. The concept of infinite parallel lives is beautifully explored, and the writing is both profound and accessible. Our reading group had amazing discussions about the philosophical implications. Highly recommend for anyone questioning their life path."
    },
    {
      id: 2,
      bookTitle: "Atomic Habits",
      author: "James Clear",
      reviewer: "Rajesh Kumar",
      rating: 5,
      date: "March 3, 2025",
      readingGroup: "Habit Builders",
      review: "Practical, actionable, and life-changing. Clear's approach to habit formation is scientific yet easy to implement. I've already started applying the 1% rule and seeing results. The reading group helped me stay accountable to the changes I wanted to make. Essential reading for personal development."
    },
    {
      id: 3,
      bookTitle: "Sapiens",
      author: "Yuval Noah Harari",
      reviewer: "Ananya Patel",
      rating: 4,
      date: "February 28, 2025",
      readingGroup: "History Enthusiasts",
      review: "Fascinating journey through human history with thought-provoking insights. Harari's ability to connect historical events to modern society is remarkable. Some sections felt dense, but the group discussions helped clarify complex concepts. A must-read for understanding humanity's trajectory."
    },
    {
      id: 4,
      bookTitle: "Educated",
      author: "Tara Westover",
      reviewer: "Vikram Singh",
      rating: 5,
      date: "February 25, 2025",
      readingGroup: "Education & Growth",
      review: "A powerful memoir that showcases the transformative power of education. Westover's journey from isolation to intellectual freedom is both heartbreaking and inspiring. The emotional depth and beautiful prose made this unputdownable. Our group had intense discussions about family, loyalty, and personal growth."
    },
    {
      id: 5,
      bookTitle: "The Psychology of Money",
      author: "Morgan Housel",
      reviewer: "Meera Reddy",
      rating: 4,
      date: "February 20, 2025",
      readingGroup: "Money Minds",
      review: "Eye-opening insights into how psychology affects financial decisions. Housel's storytelling approach makes complex financial concepts relatable. The book challenges conventional wisdom about wealth and success. Great for book club discussions about personal finance philosophy."
    },
    {
      id: 6,
      bookTitle: "Think Again",
      author: "Adam Grant",
      reviewer: "Arjun Gupta",
      rating: 4,
      date: "February 18, 2025",
      readingGroup: "Critical Thinkers",
      review: "Grant effectively challenges our tendency to stick to our beliefs. The book provides practical strategies for intellectual humility and changing minds. Some repetitive sections, but overall valuable lessons for personal and professional growth. Excellent discussion starter for our reading group."
    }
  ];

  const topBooks = [
    { title: "The Midnight Library", author: "Matt Haig", avgRating: 4.8, reviewCount: 156 },
    { title: "Atomic Habits", author: "James Clear", avgRating: 4.7, reviewCount: 203 },
    { title: "Educated", author: "Tara Westover", avgRating: 4.6, reviewCount: 134 },
    { title: "Sapiens", author: "Yuval Noah Harari", avgRating: 4.5, reviewCount: 189 },
    { title: "The Psychology of Money", author: "Morgan Housel", avgRating: 4.4, reviewCount: 98 }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${index < rating ? "text-yellow-500 fill-current" : "text-gray-300"}`}
      />
    ));
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Reviews & Ratings</h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            Read authentic reviews from our community of passionate readers. Share your thoughts and help others discover their next great read.
          </p>
          <Button 
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 text-lg"
          >
            Write a Review
          </Button>
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <Card className="mb-8 bg-white/70 backdrop-blur-sm border-amber-200">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">Write Your Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input placeholder="Book Title" />
                <Input placeholder="Author Name" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Rating:</span>
                <div className="flex space-x-1">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star key={index} className="w-6 h-6 text-gray-300 hover:text-yellow-500 cursor-pointer" />
                  ))}
                </div>
              </div>
              <Textarea placeholder="Share your thoughts about this book..." rows={4} />
              <div className="flex space-x-4">
                <Button className="bg-amber-600 hover:bg-amber-700">Submit Review</Button>
                <Button variant="outline" onClick={() => setShowReviewForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Reviews Feed */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Latest Reviews</h2>
            {reviews.map((review) => (
              <Card key={review.id} className="bg-white/70 backdrop-blur-sm border-amber-200 hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl text-gray-900">{review.bookTitle}</CardTitle>
                      <p className="text-gray-600">by {review.author}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1 mb-1">
                        {renderStars(review.rating)}
                      </div>
                      <p className="text-sm text-gray-500">{review.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="font-medium">Reviewed by {review.reviewer}</span>
                    <Badge variant="outline" className="text-amber-700 border-amber-300">
                      <Users className="w-3 h-3 mr-1" />
                      {review.readingGroup}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{review.review}</p>
                  <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500">
                    <button className="hover:text-amber-600 transition-colors">Helpful</button>
                    <button className="hover:text-amber-600 transition-colors">Reply</button>
                    <button className="hover:text-amber-600 transition-colors">Share</button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Rated Books */}
            <Card className="bg-white/70 backdrop-blur-sm border-amber-200">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900 flex items-center">
                  <Star className="w-5 h-5 text-yellow-500 mr-2" />
                  Top Rated Books
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {topBooks.map((book, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{book.title}</p>
                      <p className="text-gray-600 text-xs">by {book.author}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        {renderStars(Math.floor(book.avgRating))}
                        <span className="text-xs text-gray-500">({book.reviewCount})</span>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-amber-600">{book.avgRating}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Review Stats */}
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Community Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600">2,847</div>
                  <div className="text-gray-700">Total Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600">4.6</div>
                  <div className="text-gray-700">Average Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600">89%</div>
                  <div className="text-gray-700">Books Rated 4+ Stars</div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-white/70 backdrop-blur-sm border-amber-200">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900 flex items-center">
                  <Calendar className="w-5 h-5 text-amber-600 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium text-gray-900">Priya S. rated "The Midnight Library"</p>
                  <p className="text-gray-600">2 hours ago</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">Book Club discussed "Atomic Habits"</p>
                  <p className="text-gray-600">5 hours ago</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">New review for "Sapiens" published</p>
                  <p className="text-gray-600">1 day ago</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reviews;
