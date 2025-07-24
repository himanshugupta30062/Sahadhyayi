import FeedbackForm from "@/components/FeedbackForm";
import SEO from "@/components/SEO";

const Feedback = () => {
  return (
    <>
      <SEO
        title="Send Feedback - Sahadhyayi"
        description="Share your thoughts, suggestions, and feedback about Sahadhyayi. Help us improve your reading experience."
      />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Send Feedback</h1>
            <p className="text-xl text-gray-600">
              Your thoughts matter! Help us improve Sahadhyayi by sharing your experience and suggestions.
            </p>
          </div>
          <FeedbackForm />
          <div className="mt-6 bg-blue-50 border-blue-200 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Privacy Note:</strong> We value your privacy and will only use this information to improve our services.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Feedback;
