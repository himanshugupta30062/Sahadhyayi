
import SEO from "@/components/SEO";

const TermsOfService = () => {
  return (
    <>
      <SEO
        title="Terms of Service - Sahadhyayi"
        description="Read Sahadhyayi's terms of service to understand the rules and guidelines for using our reading community platform."
      />
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">Terms of Service</h1>
            <p className="text-gray-600 mb-8">Last updated: January 2024</p>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-700 leading-relaxed">
                  By accessing and using Sahadhyayi ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
                <p className="text-gray-700 leading-relaxed">
                  Sahadhyayi is a digital reading community platform that provides access to books, reading groups, author connections, and AI-powered reading assistance. We reserve the right to modify, suspend, or discontinue the service at any time.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">
                    To access certain features of the Service, you must register for an account. You agree to:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Provide accurate and complete information</li>
                    <li>Maintain the security of your account credentials</li>
                    <li>Notify us immediately of any unauthorized use</li>
                    <li>Take responsibility for all activities under your account</li>
                    <li>Not create multiple accounts or share your account</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 leading-relaxed">You agree not to:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-2">
                    <li>Use the service for any illegal or unauthorized purpose</li>
                    <li>Post content that is harmful, offensive, or inappropriate</li>
                    <li>Harass, abuse, or harm other users</li>
                    <li>Attempt to gain unauthorized access to our systems</li>
                    <li>Interfere with the proper functioning of the service</li>
                    <li>Copy, distribute, or modify our content without permission</li>
                    <li>Use automated tools to access or scrape our service</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Content and Intellectual Property</h2>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">User Content</h3>
                  <p className="text-gray-700 leading-relaxed">
                    You retain ownership of content you post on Sahadhyayi. However, by posting content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content on our platform.
                  </p>
                  
                  <h3 className="text-lg font-medium text-gray-900">Platform Content</h3>
                  <p className="text-gray-700 leading-relaxed">
                    All content provided by Sahadhyayi, including but not limited to text, graphics, logos, and software, is protected by intellectual property laws and remains our property or that of our licensors.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Privacy</h2>
                <p className="text-gray-700 leading-relaxed">
                  Your privacy is important to us. Please review our Privacy Policy, which governs how we collect, use, and protect your information when you use our service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Termination</h2>
                <p className="text-gray-700 leading-relaxed">
                  We may terminate or suspend your account and access to the service immediately, without prior notice, if you breach these Terms of Service. You may also terminate your account at any time by contacting us.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Disclaimers</h2>
                <p className="text-gray-700 leading-relaxed">
                  The service is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted, secure, or error-free. Your use of the service is at your own risk.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Limitation of Liability</h2>
                <p className="text-gray-700 leading-relaxed">
                  To the maximum extent permitted by law, Sahadhyayi shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to Terms</h2>
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the service. Continued use of the service after changes constitutes acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Information</h2>
                <p className="text-gray-700 leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">
                    <strong>Email:</strong> gyan@sahadhyayi.com<br />
                    <strong>Address:</strong> Sahadhyayi Reading Community
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TermsOfService;
