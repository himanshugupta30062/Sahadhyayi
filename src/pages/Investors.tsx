
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TrendingUp, Users, BookOpen, Map, Target, DollarSign, Globe, Calendar } from "lucide-react";
import SEO from "@/components/SEO";

const Investors = () => {
  const marketStats = [
    {
      metric: "Global Book Market",
      value: "$143B",
      growth: "+2.4% annually",
      description: "Total addressable market worldwide"
    },
    {
      metric: "Indian Book Market",
      value: "$6.7B",
      growth: "+12% annually",
      description: "Fastest growing major market"
    },
    {
      metric: "Digital Reading Growth",
      value: "+18%",
      growth: "YoY in India",
      description: "Shift towards digital platforms"
    },
    {
      metric: "Target Demographics",
      value: "500M",
      growth: "English readers",
      description: "In India alone (ages 15-45)"
    }
  ];

  const competitiveAdvantages = [
    {
      icon: Users,
      title: "Community-First Approach",
      description: "Unlike traditional e-commerce platforms, we prioritize building reading communities over just selling books."
    },
    {
      icon: Map,
      title: "Hyperlocal Integration",
      description: "Connecting online discussions with local bookstores and offline reading groups in every major city."
    },
    {
      icon: BookOpen,
      title: "Author Ecosystem",
      description: "Direct author engagement platform creating new revenue streams through live sessions and exclusive content."
    },
    {
      icon: Globe,
      title: "Cultural Bridge",
      description: "Focusing on reviving reading culture in emerging markets, starting with India's massive English-speaking population."
    }
  ];

  const revenueStreams = [
    {
      stream: "Book Sales Commission",
      percentage: "40%",
      description: "15-20% commission on book sales through partner bookstores and publishers"
    },
    {
      stream: "Premium Memberships",
      percentage: "25%",
      description: "Monthly subscriptions for exclusive content, early access, and premium features"
    },
    {
      stream: "Author Sessions",
      percentage: "20%",
      description: "Revenue share from paid author workshops, masterclasses, and Q&A sessions"
    },
    {
      stream: "Corporate Partnerships",
      percentage: "15%",
      description: "Branded reading programs, employee engagement, and educational institution partnerships"
    }
  ];

  const milestones = [
    {
      phase: "Phase 1 (Months 1-6)",
      goal: "MVP & Early Traction",
      targets: ["1,000 active users", "10 reading groups", "5 author partnerships", "3 major cities"]
    },
    {
      phase: "Phase 2 (Months 7-18)",
      goal: "Scale & Expansion",
      targets: ["50,000 users", "500 reading groups", "100 authors", "15 cities", "Break-even"]
    },
    {
      phase: "Phase 3 (Months 19-36)",
      goal: "Market Leadership",
      targets: ["500,000 users", "Physical centers", "International expansion", "₹50Cr ARR"]
    }
  ];

  return (
    <>
      <SEO
        title="Invest in Sahadhyayi - Reading Community Platform"
        description="Learn about our market opportunity, growth plans, and how you can support Sahadhyayi's mission."
        canonical="https://sahadhyayi.com/investors"
        url="https://sahadhyayi.com/investors" />
      <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Invest in the Future of
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600"> Reading Culture</span>
          </h1>
          <p className="text-xl text-gray-700 max-w-4xl mx-auto mb-8">
            ReadTogether is revolutionizing how people discover, discuss, and engage with books. 
            We're building the world's largest community-driven reading platform, starting with India's 500M English readers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 text-lg">
              Download Pitch Deck
            </Button>
            <Button variant="outline" className="border-amber-600 text-amber-600 hover:bg-amber-50 px-8 py-3 text-lg">
              Schedule Meeting
            </Button>
          </div>
        </div>

        {/* Market Opportunity */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Market Opportunity</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {marketStats.map((stat, index) => (
              <Card key={index} className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 text-center">
                <CardContent className="p-6">
                  <div className="text-3xl font-bold text-amber-600 mb-2">{stat.value}</div>
                  <div className="text-lg font-semibold text-gray-900 mb-1">{stat.metric}</div>
                  <div className="text-sm font-medium text-green-600 mb-2">{stat.growth}</div>
                  <div className="text-sm text-gray-600">{stat.description}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Problem & Solution */}
        <section className="mb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">The Problem We're Solving</h2>
              <div className="space-y-4 text-gray-700">
                <p className="text-lg">
                  📱 <strong>Digital Distraction:</strong> Short-form content is replacing deep reading habits, 
                  particularly affecting young professionals and students.
                </p>
                <p className="text-lg">
                  📚 <strong>Isolated Reading:</strong> Traditional book retail lacks community engagement, 
                  making reading a solitary activity.
                </p>
                <p className="text-lg">
                  🏪 <strong>Bookstore Decline:</strong> Local bookstores are struggling against online giants, 
                  losing cultural and community value.
                </p>
                <p className="text-lg">
                  🇮🇳 <strong>Cultural Shift:</strong> India's reading culture is being overshadowed by 
                  digital entertainment and social media consumption.
                </p>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Solution</h2>
              <Card className="bg-white/70 backdrop-blur-sm border-amber-200">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Community-Driven Platform</h3>
                        <p className="text-gray-600">Book-specific discussion groups with local meetups</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Integrated Marketplace</h3>
                        <p className="text-gray-600">Support local bookstores while providing convenience</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Author Connections</h3>
                        <p className="text-gray-600">Live sessions, workshops, and exclusive content</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Competitive Advantages */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Competitive Advantages</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {competitiveAdvantages.map((advantage, index) => {
              const Icon = advantage.icon;
              return (
                <Card key={index} className="bg-white/70 backdrop-blur-sm border-amber-200">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-amber-600" />
                      </div>
                      <CardTitle className="text-xl text-gray-900">{advantage.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{advantage.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Revenue Model */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Revenue Streams</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {revenueStreams.map((revenue, index) => (
              <Card key={index} className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 text-center">
                <CardContent className="p-6">
                  <div className="text-4xl font-bold text-green-600 mb-2">{revenue.percentage}</div>
                  <div className="text-lg font-semibold text-gray-900 mb-3">{revenue.stream}</div>
                  <div className="text-sm text-gray-600">{revenue.description}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Growth Roadmap */}
        <section className="mb-16">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Growth Roadmap</h2>
          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <Card key={index} className="bg-white/70 backdrop-blur-sm border-amber-200">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center font-bold text-amber-600">
                      {index + 1}
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-gray-900">{milestone.phase}</CardTitle>
                      <p className="text-gray-600">{milestone.goal}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4">
                    {milestone.targets.map((target, targetIndex) => (
                      <div key={targetIndex} className="bg-amber-50 p-3 rounded-lg text-center">
                        <Target className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-900">{target}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Investment Ask */}
        <section className="mb-16">
          <Card className="bg-gradient-to-r from-amber-600 to-orange-600 text-white">
            <CardContent className="p-12 text-center">
              <h2 className="text-4xl font-bold mb-6">Investment Opportunity</h2>
              <div className="grid md:grid-cols-3 gap-8 mb-8">
                <div>
                  <div className="text-3xl font-bold mb-2">₹10 Crores</div>
                  <div className="opacity-90">Seed Funding</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">18 Months</div>
                  <div className="opacity-90">Runway</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">15-20%</div>
                  <div className="opacity-90">Equity Stake</div>
                </div>
              </div>
              <p className="text-xl mb-6 opacity-90">
                Join us in revolutionizing reading culture and building a sustainable, 
                community-driven platform with massive market potential.
              </p>
              <Button size="lg" variant="secondary" className="px-8 py-3 text-lg">
                Request Full Business Plan
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Contact Form */}
        <section>
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Get In Touch</h2>
          <Card className="max-w-2xl mx-auto bg-white/70 backdrop-blur-sm border-amber-200">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-gray-900">Contact Our Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input placeholder="Full Name" />
                <Input placeholder="Email Address" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Input placeholder="Company/Fund Name" />
                <Input placeholder="Investment Focus" />
              </div>
              <Textarea placeholder="Message or specific interests..." rows={4} />
              <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white">
                Send Message
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
    </>
  );
};

export default Investors;
