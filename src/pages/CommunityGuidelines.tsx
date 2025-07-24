import SEO from '@/components/SEO';

const CommunityGuidelines = () => {
  return (
    <>
      <SEO title="Community Guidelines - Sahadhyayi" description="Learn about our community standards and expectations." />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">Community Guidelines</h1>
            <p className="text-gray-600 mb-8">Last updated: June 2024</p>
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Be Respectful</h2>
                <p className="text-gray-700 leading-relaxed">
                  Treat all members with respect. Harassment, hate speech, and personal attacks are not tolerated.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Keep Content Appropriate</h2>
                <p className="text-gray-700 leading-relaxed">
                  Avoid offensive language or imagery. Posts or messages containing inappropriate content may be removed and result in disciplinary action.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. No Spam</h2>
                <p className="text-gray-700 leading-relaxed">
                  Spamming or repeatedly posting the same content is prohibited.
                </p>
              </section>
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Progressive Discipline</h2>
                <p className="text-gray-700 leading-relaxed">
                  Violations may result in warnings, temporary suspensions, or permanent bans depending on severity and repetition.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommunityGuidelines;
