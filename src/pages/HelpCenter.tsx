
import { useState } from "react";
import { Search, ChevronDown, ChevronUp, Mail, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import SEO from "@/components/SEO";

const HelpCenter = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "How do I create an account on Sahadhyayi?",
      answer: "Click the 'Sign Up' button in the top navigation, fill in your details, and verify your email address to get started with your reading journey."
    },
    {
      question: "How can I add books to my personal library?",
      answer: "Browse our digital library, click on any book you're interested in, and use the 'Add to Library' button to save it to your personal collection."
    },
    {
      question: "What are Reading Groups and how do I join them?",
      answer: "Reading Groups are community discussions around specific books. Navigate to the Groups section, browse available groups, and click 'Join' to participate in discussions."
    },
    {
      question: "How does the AI Reading Assistant work?",
      answer: "Our AI companion helps you understand complex passages, provides context, and answers questions about what you're reading. Simply highlight text while reading and ask questions."
    },
    {
      question: "Can I connect with authors on the platform?",
      answer: "Yes! Visit the Authors section to browse featured authors, schedule Q&A sessions, and participate in live discussions and conferences."
    },
    {
      question: "How do I track my reading progress?",
      answer: "Your reading progress is automatically tracked as you read. Visit your Dashboard to see detailed statistics, reading goals, and progress charts."
    },
    {
      question: "Is Sahadhyayi free to use?",
      answer: "Yes, Sahadhyayi offers free access to our core features including the digital library, reading groups, and basic AI assistance."
    },
    {
      question: "How can I find readers near me?",
      answer: "Use our Reader Map feature to discover other readers in your local area and connect with nearby book communities."
    }
  ];

  const categories = [
    {
      title: "Getting Started",
      description: "New to Sahadhyayi? Learn the basics",
      icon: "📚"
    },
    {
      title: "Reading & Library",
      description: "Managing your books and reading experience",
      icon: "📖"
    },
    {
      title: "Community Features",
      description: "Groups, discussions, and social features",
      icon: "👥"
    },
    {
      title: "Technical Support",
      description: "Troubleshooting and technical issues",
      icon: "⚙️"
    }
  ];

  const tutorialVideos = [
    {
      title: 'Getting Started with Sahadhyayi',
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    {
      title: 'Joining Reading Groups',
      url: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    }
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <SEO
        title="Help Center - Sahadhyayi"
        description="Get help with Sahadhyayi features, find answers to frequently asked questions, and learn how to make the most of your reading experience."
      />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
            <p className="text-xl text-gray-600 mb-8">
              Find answers to your questions and get the most out of Sahadhyayi
            </p>
            
            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for help..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-lg"
              />
          </div>
        </div>

        {/* Tutorial Videos */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Tutorial Videos</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {tutorialVideos.map((video, idx) => (
              <div key={idx} className="aspect-w-16 aspect-h-9">
                <iframe
                  src={video.url}
                  title={video.title}
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                />
              </div>
            ))}
          </div>
        </div>

          {/* Categories */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {categories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <h3 className="text-lg font-semibold">{category.title}</h3>
                      <p className="text-sm text-gray-600 font-normal">{category.description}</p>
                    </div>
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {filteredFaqs.map((faq, index) => (
                <Card key={index}>
                  <Collapsible
                    open={openFaq === index}
                    onOpenChange={() => setOpenFaq(openFaq === index ? null : index)}
                  >
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                        <CardTitle className="flex items-center justify-between text-left">
                          <span className="text-lg font-medium">{faq.question}</span>
                          {openFaq === index ? (
                            <ChevronUp className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          )}
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>
          </div>

          {/* Contact Support */}
          <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
            <CardHeader>
              <CardTitle className="text-center text-xl">Still need help?</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => window.location.href = 'mailto:gyan@sahadhyayi.com'}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email Support
                </Button>
                <Button variant="outline" className="border-orange-300 text-orange-600">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Live Chat
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default HelpCenter;
