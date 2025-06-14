import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Target, Users, TrendingUp, Heart, Globe, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const About = () => {
  const values = [
    {
      icon: BookOpen,
      title: "Deep Reading",
      description: "We believe in the power of focused, immersive reading that builds concentration and critical thinking skills."
    },
    {
      icon: Users,
      title: "Community",
      description: "Reading is better together. We connect readers globally to share insights and build lasting intellectual relationships."
    },
    {
      icon: Heart,
      title: "Health-Conscious",
      description: "We promote reading habits that are better for your eyes, mind, and overall well-being compared to passive content consumption."
    },
    {
      icon: Globe,
      title: "Global Impact",
      description: "Starting in India, we aim to revive reading culture worldwide and create a more thoughtful, knowledge-driven society."
    }
  ];

  const stats = [
    { icon: Target, number: "1M+", label: "Books to Discover" },
    { icon: Users, number: "50K+", label: "Active Readers" },
    { icon: BookOpen, number: "500+", label: "Reading Groups" },
    { icon: TrendingUp, number: "95%", label: "User Satisfaction" }
  ];

  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.message) {
      toast({
        title: "Missing fields",
        description: "Please fill out all fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    // For actual email delivery, connect to Supabase function, EmailJS, Zapier, etc.
    setTimeout(() => {
      toast({
        title: "Message sent!",
        description: "Thank you for reaching out. We will respond soon.",
      });
      setForm({ name: "", email: "", message: "" });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <img 
              src="/lovable-uploads/fff3e49f-a95f-4fcf-ad47-da2dc6626f29.png" 
              alt="Sahadhyayi Logo" 
              className="w-20 h-20" 
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">About Sahadhyayi</h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
            We're on a mission to revive the lost art of deep reading and build a global community 
            that values knowledge, focus, and meaningful intellectual growth.
          </p>
        </div>

        {/* Vision Section */}
        <section className="mb-16">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Our Vision</h2>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Why Reading Matters More Than Ever</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  In an age of short-form content, infinite scrolling, and passive consumption, we're losing our ability to engage deeply with ideas. 
                  Videos and podcasts, while convenient, often strain our eyes and ears while providing only surface-level understanding.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Reading, on the other hand, strengthens focus, enhances comprehension, and promotes mental clarity. 
                  It's active learning that builds lasting knowledge and critical thinking skills.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Reading vs. Passive Content</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Focus Duration</span>
                    <span className="text-green-600 font-medium">4x Longer</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Information Retention</span>
                    <span className="text-green-600 font-medium">3x Better</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Eye Strain</span>
                    <span className="text-green-600 font-medium">70% Less</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Critical Thinking</span>
                    <span className="text-green-600 font-medium">5x Enhanced</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Our Core Values</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="bg-white/70 backdrop-blur-sm border-amber-200">
                  <CardHeader>
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-amber-600" />
                    </div>
                    <CardTitle className="text-xl text-gray-900">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Stats Section */}
        <section className="mb-16">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-amber-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Growing Impact</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="text-3xl font-bold text-amber-600 mb-1">{stat.number}</div>
                    <div className="text-gray-700 font-medium text-sm">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Future Plans */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Building the Future</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-gradient-to-br from-amber-100 to-orange-100 border-amber-200">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Physical Reading Centers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  We envision establishing physical reading centers in major cities across India and globally. 
                  These spaces will host book clubs, author events, and provide quiet reading environments 
                  for our community members to meet and connect offline.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-100 to-red-100 border-amber-200">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Global Knowledge Network</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  Our platform will evolve into a comprehensive knowledge-sharing ecosystem, 
                  connecting readers, authors, educators, and thought leaders to create a more 
                  informed and intellectually curious global community.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Founder Section */}
        <section className="mb-16">
          <Card className="bg-white/90 border-amber-200">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 flex flex-row items-center gap-3">
                <span>Meet the Founder</span>
                <span role="img" aria-label="sparkles">✨</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-start gap-8">
                {/* Founder Image & Info column */}
                <div className="flex-shrink-0 w-full md:w-56 flex flex-col items-center md:block">
                  <img
                    src="/lovable-uploads/3f0d5de6-4956-4feb-937f-90f70f359001.png"
                    alt="Himanshu Gupta Founder"
                    className="rounded-xl shadow-lg w-40 h-40 object-cover border-2 border-amber-200 mb-4 md:mb-6"
                  />
                  {/* Info below image */}
                  <div className="text-center md:text-left space-y-2">
                    <div className="font-semibold text-lg text-amber-700">Himanshu Gupta</div>
                    <div className="text-gray-700 text-base">Founder, Sahadhyayi</div>
                    <div className="flex items-center justify-center md:justify-start text-gray-700 text-base gap-1">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="#fb923c" strokeWidth="2"/>
                        <path d="M15 13C15 14.1046 13.6569 15 12 15C10.3431 15 9 14.1046 9 13" stroke="#fb923c" strokeWidth="2"/>
                        <circle cx="9" cy="10" r="1" fill="#fb923c"/>
                        <circle cx="15" cy="10" r="1" fill="#fb923c"/>
                      </svg>
                      <span className="ml-2">
                        <span className="text-gray-800 font-medium">Phone:</span>
                        <a href="tel:8264135459" className="underline decoration-dotted hover:text-orange-600 ml-1">8264135459</a>
                      </span>
                    </div>
                    <div className="flex items-center justify-center md:justify-start text-gray-700 text-base gap-1">
                      <Mail className="w-4 h-4 text-amber-600" />
                      <span className="ml-2">
                        <span className="text-gray-800 font-medium">Email:</span>
                        <a href="mailto:himanshugupta30062@gmail.com" className="underline decoration-dotted hover:text-orange-600 ml-1">himanshugupta30062@gmail.com</a>
                      </span>
                    </div>
                  </div>
                </div>
                {/* Contact form column */}
                <div className="flex-1 mt-6 md:mt-0">
                  <form className="space-y-4" onSubmit={handleContactSubmit}>
                    <div>
                      <label htmlFor="contact_name" className="block text-gray-800 mb-1">Your Name</label>
                      <Input
                        id="contact_name"
                        name="name"
                        placeholder="Enter your name"
                        value={form.name}
                        onChange={handleFormChange}
                        disabled={loading}
                        autoComplete="name"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="contact_email" className="block text-gray-800 mb-1">Your Email</label>
                      <Input
                        id="contact_email"
                        name="email"
                        type="email"
                        placeholder="Enter your email address"
                        value={form.email}
                        onChange={handleFormChange}
                        disabled={loading}
                        autoComplete="email"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="contact_message" className="block text-gray-800 mb-1">Message</label>
                      <Textarea
                        id="contact_message"
                        name="message"
                        placeholder="Write your message"
                        value={form.message}
                        onChange={handleFormChange}
                        disabled={loading}
                        required
                        rows={4}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full mt-2"
                      variant="default"
                      size="lg"
                      disabled={loading}
                    >
                      {loading ? "Sending..." : "Send Message"}
                    </Button>
                    <div className="text-xs text-gray-400 pt-2">
                      Your message will be sent directly to Himanshu Gupta’s email.
                      <br />
                      {/* For real email delivery, connect the form to Supabase Edge Functions, EmailJS, or similar service. */}
                    </div>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section className="text-center">
          <Card className="bg-gradient-to-r from-amber-600 to-orange-600 text-white border-0">
            <CardContent className="p-8">
              <h2 className="text-3xl font-bold mb-4">Join Our Mission</h2>
              <p className="text-xl mb-6 opacity-90">
                Be part of the movement to revive deep reading culture and build a healthier, more focused world.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/library">
                  <Button size="lg" variant="secondary" className="px-8 py-3 text-lg">
                    Start Reading
                  </Button>
                </Link>
                <Link to="/groups">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-amber-600 px-8 py-3 text-lg">
                    Join Community
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default About;
