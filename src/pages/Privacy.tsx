
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Shield, Lock, Eye, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" asChild className="gap-2">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              Last updated: June 14, 2024
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            This Privacy Policy describes how we collect, use, and protect your information 
            when you use Planorama.
          </p>
        </div>

        <div className="space-y-8">
          {/* Privacy Overview */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Shield className="h-5 w-5" />
                Your Privacy Rights
              </CardTitle>
            </CardHeader>
            <CardContent className="text-green-800">
              <ul className="space-y-2 text-sm">
                <li>• We only collect information necessary to provide our service</li>
                <li>• You own and control your project data and content</li>
                <li>• We use encryption to protect your data in transit and at rest</li>
                <li>• You can request deletion of your data at any time</li>
                <li>• We never sell your personal information to third parties</li>
                <li>• We comply with GDPR, CCPA, and other privacy regulations</li>
              </ul>
            </CardContent>
          </Card>

          {/* Privacy Sections */}
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Database className="h-6 w-6" />
                1. Information We Collect
              </h2>
              <div className="prose max-w-none text-gray-700 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Information you provide directly:</h3>
                  <ul>
                    <li><strong>Account Information:</strong> Email address, name, profile picture</li>
                    <li><strong>Project Data:</strong> Project names, descriptions, mindmaps, and generated content</li>
                    <li><strong>Communication:</strong> Messages you send us for support or feedback</li>
                    <li><strong>Payment Information:</strong> Billing details (processed securely by our payment processors)</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Information collected automatically:</h3>
                  <ul>
                    <li><strong>Usage Data:</strong> How you interact with our service, features used, time spent</li>
                    <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
                    <li><strong>Cookies:</strong> Essential cookies for functionality, analytics cookies (with consent)</li>
                    <li><strong>Log Data:</strong> Server logs for troubleshooting and security purposes</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="h-6 w-6" />
                2. How We Use Your Information
              </h2>
              <div className="prose max-w-none text-gray-700">
                <p>We use the information we collect to:</p>
                <ul>
                  <li><strong>Provide and improve our service:</strong> Process your projects, generate AI content, save your work</li>
                  <li><strong>Account management:</strong> Create and maintain your account, authenticate access</li>
                  <li><strong>Communication:</strong> Send important updates, respond to support requests</li>
                  <li><strong>Security:</strong> Detect and prevent fraud, abuse, and security threats</li>
                  <li><strong>Analytics:</strong> Understand usage patterns to improve our service (aggregated data only)</li>
                  <li><strong>Legal compliance:</strong> Meet legal obligations and enforce our terms</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Information Sharing and Disclosure</h2>
              <div className="prose max-w-none text-gray-700">
                <p>We do not sell, trade, or rent your personal information. We may share information only in these limited circumstances:</p>
                <ul>
                  <li><strong>Service Providers:</strong> Trusted third parties who help us operate our service (hosting, payment processing, email delivery)</li>
                  <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
                  <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                  <li><strong>Consent:</strong> When you explicitly authorize us to share your information</li>
                  <li><strong>Safety:</strong> To protect the rights, property, or safety of Planorama, users, or others</li>
                </ul>
                
                <div className="bg-blue-50 p-4 rounded-lg mt-4">
                  <p className="text-blue-800 font-medium">AI Processing Note:</p>
                  <p className="text-blue-700 text-sm">
                    When you use AI features, your project content may be processed by third-party AI services 
                    (like OpenAI) to generate PRDs and prompts. This data is processed securely and not used 
                    to train AI models unless you explicitly opt-in.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="h-6 w-6" />
                4. Data Security and Protection
              </h2>
              <div className="prose max-w-none text-gray-700">
                <p>We implement industry-standard security measures to protect your information:</p>
                <ul>
                  <li><strong>Encryption:</strong> All data is encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
                  <li><strong>Access Controls:</strong> Strict access controls and authentication for our systems</li>
                  <li><strong>Regular Security Audits:</strong> Regular security assessments and vulnerability testing</li>
                  <li><strong>Secure Infrastructure:</strong> Hosted on secure, compliant cloud infrastructure</li>
                  <li><strong>Data Backups:</strong> Regular encrypted backups with secure storage</li>
                  <li><strong>Incident Response:</strong> Established procedures for security incident response</li>
                </ul>
                
                <div className="bg-amber-50 p-4 rounded-lg mt-4">
                  <p className="text-amber-800 font-medium">Important:</p>
                  <p className="text-amber-700 text-sm">
                    While we implement strong security measures, no system is 100% secure. 
                    You are responsible for keeping your account credentials secure and reporting any suspected unauthorized access.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Privacy Rights and Choices</h2>
              <div className="prose max-w-none text-gray-700">
                <p>Depending on your location, you may have the following rights:</p>
                <ul>
                  <li><strong>Access:</strong> Request a copy of the personal information we have about you</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal requirements)</li>
                  <li><strong>Portability:</strong> Request your data in a portable format</li>
                  <li><strong>Restriction:</strong> Request that we limit how we use your information</li>
                  <li><strong>Objection:</strong> Object to certain uses of your information</li>
                  <li><strong>Withdraw Consent:</strong> Withdraw consent for processing based on consent</li>
                </ul>
                
                <p>To exercise these rights, contact us at <strong>privacy@planorama.ai</strong></p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
              <div className="prose max-w-none text-gray-700">
                <p>We retain your information for as long as necessary to provide our service and comply with legal obligations:</p>
                <ul>
                  <li><strong>Account Data:</strong> Retained while your account is active plus 90 days after deletion</li>
                  <li><strong>Project Data:</strong> Retained while your account is active, with 30-day export period after account deletion</li>
                  <li><strong>Usage Analytics:</strong> Aggregated and anonymized data may be retained indefinitely</li>
                  <li><strong>Legal Requirements:</strong> Some data may be retained longer to comply with legal obligations</li>
                </ul>
                
                <p>You can request immediate deletion of your data by contacting us, subject to legal retention requirements.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. International Data Transfers</h2>
              <div className="prose max-w-none text-gray-700">
                <p>
                  Your information may be transferred to and processed in countries other than your own. 
                  When we transfer data internationally, we ensure appropriate safeguards are in place, including:
                </p>
                <ul>
                  <li>Standard Contractual Clauses approved by regulatory authorities</li>
                  <li>Adequacy decisions by relevant data protection authorities</li>
                  <li>Other legally approved transfer mechanisms</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children's Privacy</h2>
              <div className="prose max-w-none text-gray-700">
                <p>
                  Our service is not intended for children under 18 years of age. We do not knowingly collect 
                  personal information from children under 18. If you are a parent or guardian and believe 
                  your child has provided us with personal information, please contact us immediately.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Changes to This Privacy Policy</h2>
              <div className="prose max-w-none text-gray-700">
                <p>
                  We may update this Privacy Policy from time to time. When we make changes, we will:
                </p>
                <ul>
                  <li>Update the "Last updated" date at the top of this policy</li>
                  <li>Notify you through the service or by email for significant changes</li>
                  <li>Provide additional notice for changes that materially affect your rights</li>
                </ul>
                
                <p>
                  Your continued use of the service after changes become effective constitutes acceptance 
                  of the new Privacy Policy.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Us</h2>
              <div className="prose max-w-none text-gray-700">
                <p>
                  If you have any questions about this Privacy Policy or our privacy practices, please contact us:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>Privacy Officer:</strong> privacy@planorama.ai</p>
                  <p><strong>General Support:</strong> support@planorama.ai</p>
                  <p><strong>Mailing Address:</strong><br />
                  Planorama Privacy Department<br />
                  123 Innovation Drive<br />
                  San Francisco, CA 94105<br />
                  United States</p>
                </div>
                
                <p className="text-sm text-gray-600 mt-4">
                  <strong>Response Time:</strong> We aim to respond to privacy-related inquiries within 30 days, 
                  or sooner as required by applicable law.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
