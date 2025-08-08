
import { useState } from "react";
import { Send, Star, MessageSquare, Lightbulb, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client-universal";
import SEO from "@/components/SEO";

const Feedback = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    type: "",
    subject: "",
    message: "",
    rating: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const feedbackTypes = [
    { value: "general", label: "General Feedback", icon: MessageSquare },
    { value: "feature", label: "Feature Request", icon: Lightbulb },
    { value: "bug", label: "Bug Report", icon: Bug },
    { value: "review", label: "App Review", icon: Star }
  ];

  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.type || !formData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('feedback').insert({
        name: formData.name,
        email: formData.email,
        type: formData.type,
        subject: formData.subject,
        message: formData.message,
        rating: formData.rating || null
      });

      if (error) throw error;

      toast({
        title: 'Feedback Submitted!',
        description: "Thank you for your feedback. We'll review it and get back to you soon.",
      });

      setFormData({
        name: '',
        email: '',
        type: '',
        subject: '',
        message: '',
        rating: 0
      });
    } catch (err) {
      console.error(err);
      toast({ title: 'Failed to submit feedback', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEO
        title="Send Feedback - Sahadhyayi"
        description="Share your thoughts, suggestions, and feedback about Sahadhyayi. Help us improve your reading experience."
      />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Send Feedback</h1>
            <p className="text-xl text-gray-600">
              Your thoughts matter! Help us improve Sahadhyayi by sharing your experience and suggestions.
            </p>
          </div>

          {/* Feedback Types */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {feedbackTypes.map((type) => (
              <Card 
                key={type.value} 
                className={`cursor-pointer hover:shadow-lg transition-all ${
                  formData.type === type.value ? 'ring-2 ring-orange-500 bg-orange-50' : ''
                }`}
                onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
              >
                <CardContent className="flex items-center p-4">
                  <type.icon className="w-6 h-6 text-orange-600 mr-3" />
                  <span className="font-medium">{type.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Feedback Form */}
          <Card>
            <CardHeader>
              <CardTitle>Share Your Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Feedback Type *
                  </label>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select feedback type" />
                    </SelectTrigger>
                    <SelectContent>
                      {feedbackTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <Input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Brief summary of your feedback"
                  />
                </div>

                {formData.type === 'review' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rating
                    </label>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-8 h-8 cursor-pointer transition-colors ${
                            star <= formData.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300 hover:text-yellow-400'
                          }`}
                          onClick={() => handleRatingClick(star)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message *
                  </label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Please share your detailed feedback..."
                    rows={6}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Feedback
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-sm text-blue-800">
                <strong>Privacy Note:</strong> We value your privacy and will only use this information to improve our services and respond to your feedback. We will never share your personal information with third parties.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Feedback;
