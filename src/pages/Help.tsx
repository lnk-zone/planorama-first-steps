
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  HelpCircle, 
  BookOpen, 
  MessageCircle, 
  Mail, 
  FileText,
  Video,
  Users,
  Search
} from 'lucide-react';

const Help = () => {
  const faqs = [
    {
      question: "How do I create my first project?",
      answer: "Click the 'New Project' button on your dashboard or projects page. Fill in the project title, select a type, and add a description. Your project will be created instantly."
    },
    {
      question: "What project types are supported?",
      answer: "We support Web Apps, Mobile Apps, SaaS Platforms, Desktop Apps, API/Backend projects, and custom 'Other' project types."
    },
    {
      question: "How do I collaborate with team members?",
      answer: "Team collaboration features are coming soon. Currently, projects are individual to each user account."
    },
    {
      question: "Can I export my project data?",
      answer: "Export functionality is planned for a future release. All your data is securely stored and accessible through the platform."
    },
    {
      question: "How do I delete a project?",
      answer: "Go to your Projects page, click the three dots menu on any project card, and select 'Delete'. Note that this action cannot be undone."
    }
  ];

  const resources = [
    {
      icon: <BookOpen className="h-5 w-5" />,
      title: "Documentation",
      description: "Comprehensive guides and tutorials",
      link: "#"
    },
    {
      icon: <Video className="h-5 w-5" />,
      title: "Video Tutorials",
      description: "Step-by-step video walkthroughs",
      link: "#"
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Community Forum",
      description: "Connect with other users and share tips",
      link: "#"
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "API Reference",
      description: "Technical documentation for developers",
      link: "#"
    }
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <HelpCircle className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
          </div>
          <p className="text-gray-600">
            Find answers to your questions and get the help you need
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search for help articles..."
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-8">
          {/* Quick Start */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Start Guide</CardTitle>
              <CardDescription>
                Get up and running in minutes with these essential steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Create Your Account</h4>
                    <p className="text-sm text-gray-600">Sign up with your email or use Google OAuth for quick access.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">Create Your First Project</h4>
                    <p className="text-sm text-gray-600">Click 'New Project' and fill in the basic information about your app idea.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">Start Planning</h4>
                    <p className="text-sm text-gray-600">Use the project detail page to plan features and track progress.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQs */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>
                Common questions and their answers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <h4 className="font-medium text-gray-900 mb-2">{faq.question}</h4>
                    <p className="text-sm text-gray-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Resources */}
          <Card>
            <CardHeader>
              <CardTitle>Resources</CardTitle>
              <CardDescription>
                Additional resources to help you succeed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resources.map((resource, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="text-primary">
                      {resource.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{resource.title}</h4>
                      <p className="text-sm text-gray-600">{resource.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <CardTitle>Contact Support</CardTitle>
              </div>
              <CardDescription>
                Can't find what you're looking for? Get in touch with our support team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="your@email.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" placeholder="How can we help?" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Describe your issue or question in detail..."
                    rows={4}
                  />
                </div>
                <Button className="w-full sm:w-auto">
                  <Mail className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Help;
