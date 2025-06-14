
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Shield, Users, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Terms = () => {
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
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            These terms govern your use of Planorama and describe the rights and responsibilities
            that apply to both you and us.
          </p>
        </div>

        <div className="space-y-8">
          {/* Quick Summary */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Shield className="h-5 w-5" />
                Quick Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800">
              <ul className="space-y-2 text-sm">
                <li>• You retain ownership of your content and projects</li>
                <li>• We provide the service "as is" with reasonable care</li>
                <li>• Both parties can terminate the agreement with notice</li>
                <li>• Disputes are resolved through binding arbitration</li>
                <li>• We respect your privacy and follow data protection laws</li>
              </ul>
            </CardContent>
          </Card>

          {/* Terms Sections */}
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <div className="prose max-w-none text-gray-700">
                <p>
                  By accessing and using Planorama ("the Service"), you accept and agree to be bound by the terms 
                  and provisions of this agreement ("Terms of Service"). If you do not agree to abide by the above, 
                  please do not use this service.
                </p>
                <p>
                  These Terms of Service, along with our Privacy Policy, constitute the entire agreement between 
                  you and Planorama regarding your use of the Service.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
              <div className="prose max-w-none text-gray-700">
                <p>
                  Planorama is an AI-powered app planning platform that helps users transform ideas into structured 
                  development plans through visual mindmaps, automated PRD generation, and development prompt creation.
                </p>
                <p>
                  The Service includes but is not limited to:
                </p>
                <ul>
                  <li>Project management and organization tools</li>
                  <li>AI-powered content generation features</li>
                  <li>Collaboration and sharing capabilities</li>
                  <li>Export and integration functionalities</li>
                  <li>User account management and authentication</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts and Responsibilities</h2>
              <div className="prose max-w-none text-gray-700">
                <p>
                  To access certain features of the Service, you must create an account. You are responsible for:
                </p>
                <ul>
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Providing accurate and complete information</li>
                  <li>Promptly updating your account information when necessary</li>
                  <li>Immediately notifying us of any unauthorized use of your account</li>
                </ul>
                <p>
                  You must be at least 18 years old to create an account and use the Service.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use Policy</h2>
              <div className="prose max-w-none text-gray-700">
                <p>You agree not to use the Service to:</p>
                <ul>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe upon the rights of others</li>
                  <li>Distribute harmful, offensive, or illegal content</li>
                  <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
                  <li>Interfere with or disrupt the Service or servers</li>
                  <li>Use the Service for commercial purposes without authorization</li>
                  <li>Reverse engineer, decompile, or attempt to extract source code</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Intellectual Property Rights</h2>
              <div className="prose max-w-none text-gray-700">
                <p>
                  You retain all rights to your content, including projects, documents, and any materials you create 
                  or upload to the Service. By using the Service, you grant us a limited, non-exclusive license to 
                  use your content solely for the purpose of providing and improving the Service.
                </p>
                <p>
                  The Service, including its original content, features, and functionality, is owned by Planorama 
                  and is protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Privacy and Data Protection</h2>
              <div className="prose max-w-none text-gray-700">
                <p>
                  Your privacy is important to us. Our collection and use of personal information is governed by our 
                  Privacy Policy, which is incorporated into these Terms by reference.
                </p>
                <p>
                  We implement appropriate security measures to protect your data, but cannot guarantee absolute security. 
                  You are responsible for maintaining the security of your account credentials.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Service Availability and Modifications</h2>
              <div className="prose max-w-none text-gray-700">
                <p>
                  We strive to maintain high availability of the Service but do not guarantee uninterrupted access. 
                  The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control.
                </p>
                <p>
                  We reserve the right to modify, suspend, or discontinue any part of the Service at any time with 
                  reasonable notice to users.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <div className="prose max-w-none text-gray-700">
                <p>
                  The Service is provided "as is" without warranties of any kind, either express or implied. 
                  In no event shall Planorama be liable for any indirect, incidental, special, consequential, 
                  or punitive damages, including without limitation, loss of profits, data, use, goodwill, 
                  or other intangible losses.
                </p>
                <p>
                  Our total liability for any claims arising from or related to the Service shall not exceed 
                  the amount you paid us in the twelve months preceding the claim.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Termination</h2>
              <div className="prose max-w-none text-gray-700">
                <p>
                  Either party may terminate this agreement at any time with or without cause. Upon termination:
                </p>
                <ul>
                  <li>Your access to the Service will be immediately suspended</li>
                  <li>You may export your data within 30 days of termination</li>
                  <li>We may delete your account and data after the export period</li>
                  <li>All provisions that should survive termination will remain in effect</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Dispute Resolution</h2>
              <div className="prose max-w-none text-gray-700">
                <p>
                  Any disputes arising from these Terms or your use of the Service will be resolved through 
                  binding arbitration rather than in court, except that you may assert claims in small claims court 
                  if your claims qualify.
                </p>
                <p>
                  The arbitration will be conducted by a single arbitrator and governed by the rules of the 
                  American Arbitration Association.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to Terms</h2>
              <div className="prose max-w-none text-gray-700">
                <p>
                  We reserve the right to modify these Terms at any time. When we make changes, we will provide 
                  notice through the Service or by email. Your continued use of the Service after such notice 
                  constitutes acceptance of the new Terms.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Information</h2>
              <div className="prose max-w-none text-gray-700">
                <p>
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p><strong>Email:</strong> legal@planorama.ai</p>
                  <p><strong>Address:</strong> Planorama Legal Department<br />
                  123 Innovation Drive<br />
                  San Francisco, CA 94105</p>
                </div>
              </div>
            </section>
          </div>

          {/* Warning Notice */}
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <AlertTriangle className="h-5 w-5" />
                Important Notice
              </CardTitle>
            </CardHeader>
            <CardContent className="text-amber-800 text-sm">
              <p>
                These terms include important information about your rights and responsibilities. 
                Please read them carefully. By using Planorama, you agree to these terms in their entirety.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Terms;
