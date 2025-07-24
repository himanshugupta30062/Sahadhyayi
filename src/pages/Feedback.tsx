import FeedbackForm from '@/components/FeedbackForm';
import SEO from '@/components/SEO';

const Feedback = () => {
  return (
    <>
      <SEO
        title="Send Feedback - Sahadhyayi"
        description="Share your thoughts, suggestions, and feedback about Sahadhyayi. Help us improve your reading experience."
      />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 py-8">
        <div className="max-w-2xl mx-auto px-4 space-y-6">
          <div className="text-center mb-4">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Send Feedback</h1>
            <p className="text-xl text-gray-600">Your thoughts matter! Help us improve Sahadhyayi.</p>
          </div>
          <FeedbackForm />
          <div className="bg-blue-50 border-blue-200 p-4 rounded-lg text-sm text-blue-800 mt-6">
            <strong>Privacy Note:</strong> We value your privacy and will only use this information to improve our services and respond to your feedback.
          </div>
        </div>
      </div>
    </>
  );
};

export default Feedback;
