import PublicLayout from '../components/layout/PublicLayout';
import SEOHead from '../components/seo/SEOHead';
import { Calendar, Shield } from 'lucide-react';

const Privacy = () => {
  return (
    <PublicLayout>
      <SEOHead
        title="Privacy Policy - TimeSnap.io"
        description="Read TimeSnap's Privacy Policy to understand how we collect, use, and protect your personal information."
        keywords="privacy policy, data protection, personal information, GDPR, data privacy"
      />

      <div className="min-h-screen bg-gradient-to-b from-background to-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Calendar className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold">TimeSnap.io</h1>
            </div>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">Privacy Policy</h2>
            </div>
            <p className="text-muted-foreground">
              Last updated: February 3, 2026
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 space-y-8">
            <section>
              <h3 className="text-2xl font-bold text-foreground mb-4">1. Introduction</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                At TimeSnap.io ("we", "us", or "our"), we take your privacy seriously. This Privacy Policy explains how
                we collect, use, disclose, and safeguard your information when you use our appointment booking service.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy,
                please do not access the service.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-foreground mb-4">2. Information We Collect</h3>

              <h4 className="text-xl font-semibold text-foreground mb-3 mt-6">2.1 Personal Information</h4>
              <p className="text-gray-700 leading-relaxed mb-4">
                We collect information that you provide directly to us when you:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Register for an account (name, email address, phone number)</li>
                <li>Create or manage appointments (client details, appointment information)</li>
                <li>Set up your business profile (business name, address, services)</li>
                <li>Contact our support team</li>
                <li>Subscribe to our newsletter</li>
              </ul>

              <h4 className="text-xl font-semibold text-foreground mb-3 mt-6">2.2 Automatically Collected Information</h4>
              <p className="text-gray-700 leading-relaxed mb-4">
                When you access our Service, we automatically collect certain information, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Log data (IP address, browser type, pages visited, time spent)</li>
                <li>Device information (device type, operating system, unique device identifiers)</li>
                <li>Usage data (features used, actions taken, appointment patterns)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>

              <h4 className="text-xl font-semibold text-foreground mb-3 mt-6">2.3 Information from Third Parties</h4>
              <p className="text-gray-700 leading-relaxed">
                We may receive information from third-party services you connect to your account, such as calendar
                integrations (Google Calendar, Outlook) and payment processors.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-foreground mb-4">3. How We Use Your Information</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Provide, maintain, and improve our Service</li>
                <li>Process and manage appointments</li>
                <li>Send appointment confirmations, reminders, and notifications</li>
                <li>Communicate with you about updates, security alerts, and support</li>
                <li>Analyze usage patterns to improve user experience</li>
                <li>Prevent fraud and ensure security</li>
                <li>Comply with legal obligations</li>
                <li>Send marketing communications (with your consent)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-foreground mb-4">4. Sharing Your Information</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We do not sell your personal information. We may share your information in the following circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>With your consent:</strong> When you authorize us to share information</li>
                <li><strong>Service providers:</strong> Third-party vendors who perform services on our behalf (hosting, email, analytics)</li>
                <li><strong>Business transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
                <li><strong>Legal requirements:</strong> To comply with laws, regulations, or legal processes</li>
                <li><strong>Protection of rights:</strong> To protect our rights, privacy, safety, or property</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-foreground mb-4">5. Data Security</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We implement appropriate technical and organizational security measures to protect your information, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and updates</li>
                <li>Access controls and authentication measures</li>
                <li>Secure data storage with trusted providers</li>
                <li>Employee training on data protection</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                However, no method of transmission over the internet is 100% secure. While we strive to protect your
                information, we cannot guarantee its absolute security.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-foreground mb-4">6. Data Retention</h3>
              <p className="text-gray-700 leading-relaxed">
                We retain your personal information for as long as necessary to provide our services and fulfill the
                purposes outlined in this Privacy Policy, unless a longer retention period is required by law. When we
                no longer need your information, we will securely delete or anonymize it.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-foreground mb-4">7. Your Rights and Choices</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Restriction:</strong> Request limitation on processing of your data</li>
                <li><strong>Object:</strong> Object to certain processing activities</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                To exercise these rights, please contact us at support@timesnap.io.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-foreground mb-4">8. Cookies and Tracking Technologies</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Remember your preferences and settings</li>
                <li>Analyze website traffic and usage patterns</li>
                <li>Provide personalized content</li>
                <li>Improve security and prevent fraud</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                You can control cookies through your browser settings. However, disabling cookies may affect your ability
                to use certain features of our Service.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-foreground mb-4">9. Third-Party Links</h3>
              <p className="text-gray-700 leading-relaxed">
                Our Service may contain links to third-party websites or services. We are not responsible for the privacy
                practices of these third parties. We encourage you to review their privacy policies before providing any
                personal information.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-foreground mb-4">10. Children's Privacy</h3>
              <p className="text-gray-700 leading-relaxed">
                Our Service is not intended for children under 16 years of age. We do not knowingly collect personal
                information from children. If you believe we have collected information from a child, please contact us
                immediately.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-foreground mb-4">11. International Data Transfers</h3>
              <p className="text-gray-700 leading-relaxed">
                Your information may be transferred to and processed in countries other than your country of residence.
                We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-foreground mb-4">12. Changes to This Privacy Policy</h3>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting
                the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this
                Privacy Policy periodically.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-foreground mb-4">13. Contact Us</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions or concerns about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="p-6 bg-gray-50 rounded-lg border">
                <p className="text-gray-700 leading-relaxed">
                  <strong>Email:</strong> support@timesnap.io<br />
                  <strong>Address:</strong> Skopje, North Macedonia<br />
                  <strong>Data Protection Officer:</strong> privacy@timesnap.io
                </p>
              </div>
            </section>

            <section className="border-t pt-8">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
                <h4 className="text-lg font-semibold text-blue-900 mb-2">🛡️ Your Privacy Matters</h4>
                <p className="text-blue-800 text-sm leading-relaxed">
                  We are committed to protecting your privacy and being transparent about our data practices.
                  If you have any questions or need clarification on any part of this policy, please don't hesitate
                  to reach out to our team.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Privacy;
