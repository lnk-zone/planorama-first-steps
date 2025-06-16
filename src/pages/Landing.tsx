
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, ArrowRight, CheckCircle2, Target, Zap, Shield, FileText, Wrench, Smartphone, Bot, Clock, Users, Star } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">Planorama</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Stop Getting Stuck with
            <span className="text-primary-600 block">AI App Builders</span>
          </h1>
          <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
            Get a clear plan first, then build your app successfully with any AI platform
          </p>
          <p className="text-lg text-gray-500 mb-8 max-w-3xl mx-auto">
            Tired of endless loops with Lovable, Bolt, or Cursor? Planorama creates a detailed plan for your app before you start building, so you know exactly what to ask for and never get stuck again.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link to="/register">
              <Button size="lg" className="px-8 py-3">
                Plan My App for Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="px-8 py-3">
              See How It Works
            </Button>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Most People Fail with AI App Builders
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
              <h3 className="font-semibold text-gray-900 mb-2">"I don't know what to ask for"</h3>
              <p className="text-gray-600">Vague descriptions lead to confusing results</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
              <h3 className="font-semibold text-gray-900 mb-2">"The AI keeps breaking my app"</h3>
              <p className="text-gray-600">Changes create new bugs you can't fix</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
              <h3 className="font-semibold text-gray-900 mb-2">"I'm stuck in endless loops"</h3>
              <p className="text-gray-600">AI can't solve complex problems without clear direction</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
              <h3 className="font-semibold text-gray-900 mb-2">"I don't understand the technical stuff"</h3>
              <p className="text-gray-600">Missing requirements cause project failures</p>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-xl font-medium text-primary-600">
              The solution isn't better AI - it's better planning.
            </p>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Plan First, Build Successfully
            </h2>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Describe Your App</h3>
              <p className="text-gray-600">Just tell us what you want to build in plain English. No technical knowledge required.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Get Your Complete Plan</h3>
              <p className="text-gray-600">Our AI creates a detailed feature list, user stories, and development roadmap tailored to your app.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Generate Platform Prompts</h3>
              <p className="text-gray-600">Get specific, copy-paste prompts optimized for Lovable, Bolt, Cursor, or any AI builder.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary-600">4</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Build with Confidence</h3>
              <p className="text-gray-600">Follow your plan step-by-step. No more guessing, no more getting stuck.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Finally Build the App You've Been Dreaming About
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">🎯 Clear Direction</h3>
              <p className="text-gray-600">Know exactly what features you need and in what order to build them.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">⚡ Save Weeks of Time</h3>
              <p className="text-gray-600">Stop wasting time on trial and error. Get it right the first time.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">🛡️ Avoid AI Doom Loops</h3>
              <p className="text-gray-600">Never get stuck in endless debugging cycles again.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">📋 Professional Documentation</h3>
              <p className="text-gray-600">Get a real Product Requirements Document like the pros use.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Wrench className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">🔧 Works with Any Platform</h3>
              <p className="text-gray-600">Use your plan with Lovable, Bolt, Cursor, Replit, or any AI builder.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">💡 No Technical Skills Needed</h3>
              <p className="text-gray-600">Built for non-technical founders and creators.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Join Hundreds of Successful App Builders
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center space-x-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <CardTitle className="text-lg">"Finally finished my SaaS app!"</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  "I was stuck for months with Lovable. Planorama gave me a clear roadmap and I launched in 3 weeks."
                </p>
                <p className="text-sm font-medium text-gray-900">- Sarah M., Startup Founder</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center space-x-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <CardTitle className="text-lg">"No more AI frustration"</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  "The prompts are so specific that Bolt understood exactly what I wanted. Game changer!"
                </p>
                <p className="text-sm font-medium text-gray-900">- Mike R., Small Business Owner</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center space-x-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <CardTitle className="text-lg">"Saved me from hiring a developer"</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  "I was about to hire a developer. Planorama helped me build it myself with AI instead."
                </p>
                <p className="text-sm font-medium text-gray-900">- Jennifer L., Entrepreneur</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center space-x-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <CardTitle className="text-lg">"Like having a product manager"</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  "It's like having a product manager whispering in my ear while I build."
                </p>
                <p className="text-sm font-medium text-gray-900">— Bolt user</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Plan and Build Successfully
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <Bot className="h-6 w-6 text-primary-600" />
                </div>
                <CardTitle>🤖 AI-Powered Planning</CardTitle>
                <CardDescription>
                  Describe your app and get a complete feature breakdown with user stories and dependencies.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary-600" />
                </div>
                <CardTitle>📄 Professional PRD Generation</CardTitle>
                <CardDescription>
                  Generate a detailed Product Requirements Document that any developer would understand.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary-600" />
                </div>
                <CardTitle>🎯 Platform-Specific Prompts</CardTitle>
                <CardDescription>
                  Get optimized prompts for Lovable, Bolt, Cursor, Replit, and more AI builders.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-primary-600" />
                </div>
                <CardTitle>🔗 Smart Dependencies</CardTitle>
                <CardDescription>
                  Understand what needs to be built first to avoid technical roadblocks.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <Wrench className="h-6 w-6 text-primary-600" />
                </div>
                <CardTitle>✏️ Easy Editing</CardTitle>
                <CardDescription>
                  Modify and customize your plan as your vision evolves.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-0 shadow-lg">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="h-6 w-6 text-primary-600" />
                </div>
                <CardTitle>📱 Mobile Friendly</CardTitle>
                <CardDescription>
                  Plan your app from anywhere, on any device.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple Pricing for Every Builder
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-gray-200">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Free Plan</CardTitle>
                <div className="text-4xl font-bold text-gray-900 mt-4">$0<span className="text-lg font-normal text-gray-500">/month</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />1 app plan per month</li>
                  <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />Basic feature generation</li>
                  <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />Standard prompts</li>
                  <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />Community support</li>
                </ul>
                <p className="text-sm text-gray-600 mb-4">Perfect for trying out your first app idea</p>
                <Link to="/register">
                  <Button variant="outline" className="w-full">Get Started Free</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary-500 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium">Most Popular</span>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Pro Plan</CardTitle>
                <div className="text-4xl font-bold text-gray-900 mt-4">$19<span className="text-lg font-normal text-gray-500">/month</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />Unlimited app plans</li>
                  <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />Advanced AI planning</li>
                  <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />Premium prompt templates</li>
                  <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />Priority support</li>
                  <li className="flex items-center"><CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />PRD export (PDF, Word)</li>
                </ul>
                <p className="text-sm text-gray-600 mb-4">For serious app builders</p>
                <Link to="/register">
                  <Button className="w-full">Start Pro Trial</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-lg font-medium text-gray-900">Start Free - No Credit Card Required</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Do I need technical knowledge to use Planorama?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Not at all! Planorama is designed for non-technical users. Just describe your app idea in plain English.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Which AI platforms does this work with?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Planorama generates prompts optimized for Lovable, Bolt, Cursor, Replit, Windsurf, and most other AI builders.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">What if I want to change my plan later?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">You can easily edit and modify your plan at any time. The AI will help you understand how changes affect other features.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">How is this different from just using ChatGPT?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Planorama is specifically designed for app planning with structured outputs, dependencies, and platform-specific prompts that generic AI can't provide.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Can I export my plan?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Yes! Pro users can export professional PRDs in PDF or Word format to share with developers or investors.</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">What if I get stuck during development?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Your plan includes detailed user stories and acceptance criteria to guide you through each step. Plus, our community is here to help!</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 px-4 bg-primary-600 text-white">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Build Your App Successfully?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of non-technical founders who've turned their ideas into real apps with Planorama.
          </p>
          <div className="flex items-center justify-center space-x-4 mb-8">
            <Link to="/register">
              <Button size="lg" variant="secondary" className="px-8 py-3">
                Start Planning for Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="px-8 py-3 text-white border-white hover:bg-white hover:text-primary-600">
              Book a Demo
            </Button>
          </div>
          <div className="flex items-center justify-center space-x-6 text-sm text-primary-100">
            <div className="flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              No credit card required
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Cancel anytime
            </div>
            <div className="flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Used by 1000+ builders
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Lightbulb className="h-6 w-6 text-primary-400" />
                <span className="text-lg font-bold">Planorama</span>
              </div>
              <p className="text-gray-400 mb-4">
                AI-powered app planning platform for creators and entrepreneurs.
              </p>
              <p className="text-gray-400">hello@planorama.ai</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">How It Works</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Examples</a></li>
                <li><Link to="/register" className="hover:text-white">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
                <li><Link to="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link to="/login" className="hover:text-white">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
              <div className="mt-6">
                <h4 className="font-semibold mb-2">Follow Us</h4>
                <div className="flex space-x-4 text-gray-400">
                  <a href="#" className="hover:text-white">Twitter</a>
                  <a href="#" className="hover:text-white">LinkedIn</a>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Planorama. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
