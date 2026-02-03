import PublicLayout from '../components/layout/PublicLayout';
import SEOHead from '../components/seo/SEOHead';
import { Calendar } from 'lucide-react';

const Terms = () => {
  return (
    <PublicLayout>
      <SEOHead
        title="Terms of Service - TimeSnap.io"
        description="Read TimeSnap's Terms of Service to understand the rules and regulations for using our appointment booking platform."
        keywords="terms of service, terms and conditions, user agreement, legal terms"
      />

      <div className="min-h-screen bg-gradient-to-b from-background to-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Calendar className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold">TimeSnap.io</h1>
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">Terms of Service</h2>
            <p className="text-muted-foreground">
              Last updated: February 3, 2026
            </p>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 space-y-8">
            <section>
              <h3 className="text-2xl font-bold text-foreground mb-4">1. Acceptance of Terms</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                By accessing and using TimeSnap.io ("the Service"), you accept and agree to be bound by the terms
                and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
              <p className="text-gray-700 leading-relaxed">
                TimeSnap.io is currently in BETA testing. All features are provided free of charge during this period.
                We reserve the right to modify pricing and features after the beta period ends.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-foreground mb-4">2. Description of Service</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                TimeSnap.io provides online appointment booking and scheduling services for businesses and their clients.
                The Service includes but is not limited to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Calendar management and availability settings</li>
                <li>Appointment booking and management</li>
                <li>Email and SMS notifications</li>
                <li>Employee and service management</li>
                <li>Analytics and reporting tools</li>
                <li>QR code generation for booking pages</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-foreground mb-4">3. User Accounts</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                To use certain features of the Service, you must register for an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and update your information to keep it accurate and current</li>
                <li>Maintain the security of your password and account</li>
                <li>Accept all responsibility for activities that occur under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-foreground mb-4">4. Beta Testing Period</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                During the beta testing period:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>All services are provided free of charge</li>
                <li>Features may be added, modified, or removed without notice</li>
                <li>Service availability is not guaranteed and may be interrupted</li>
                <li>Data backup is your responsibility, though we make reasonable efforts to protect your data</li>
                <li>We may contact you for feedback and feature suggestions</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-foreground mb-4">5. Acceptable Use Policy</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Violate any laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit harmful or malicious code</li>
                <li>Spam, phish, or engage in fraudulent activities</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Attempt to gain unauthorized access to any systems</li>
                <li>Use the Service for any illegal or unauthorized purpose</li>
              </ul>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-foreground mb-4">6. Data and Privacy</h3>
              <p className="text-gray-700 leading-relaxed">
                Your use of the Service is also governed by our Privacy Policy. We collect and process personal data
                in accordance with applicable data protection laws. Please review our{' '}
                <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a> for more information.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-foreground mb-4">7. Intellectual Property</h3>
              <p className="text-gray-700 leading-relaxed">
                The Service and its original content, features, and functionality are owned by TimeSnap.io and are
                protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-foreground mb-4">8. Disclaimer of Warranties</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED,
                INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p className="text-gray-700 leading-relaxed">
                We do not warrant that the Service will be uninterrupted, timely, secure, or error-free, or that any
                defects will be corrected.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-foreground mb-4">9. Limitation of Liability</h3>
              <p className="text-gray-700 leading-relaxed">
                IN NO EVENT SHALL TIMESNAP.IO, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE
                FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION,
                LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE SERVICE.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-foreground mb-4">10. Termination</h3>
              <p className="text-gray-700 leading-relaxed">
                We may terminate or suspend your account and access to the Service immediately, without prior notice,
                for any reason, including if you breach these Terms. Upon termination, your right to use the Service
                will immediately cease.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-foreground mb-4">11. Changes to Terms</h3>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify users of any material changes
                via email or through the Service. Your continued use of the Service after changes constitutes acceptance
                of the modified Terms.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-foreground mb-4">12. Governing Law</h3>
              <p className="text-gray-700 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of North Macedonia,
                without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h3 className="text-2xl font-bold text-foreground mb-4">13. Contact Information</h3>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                <p className="text-gray-700">
                  <strong>Email:</strong> support@timesnap.io<br />
                  <strong>Address:</strong> Skopje, North Macedonia
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Terms;
