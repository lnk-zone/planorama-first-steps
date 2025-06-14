
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/projects" element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          } />
          <Route path="/projects/:id" element={
            <ProtectedRoute>
              <ProjectDetail />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          {/* Settings route */}
          <Route path="/settings" element={
            <ProtectedRoute>
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold mb-4">Settings</h1>
                  <p className="text-gray-600">Coming soon - App settings</p>
                </div>
              </div>
            </ProtectedRoute>
          } />
          
          {/* Legal pages */}
          <Route path="/terms" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center max-w-4xl mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
                <div className="text-left space-y-6 text-gray-700">
                  <section>
                    <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
                    <p>By accessing and using Planorama, you accept and agree to be bound by the terms and provision of this agreement.</p>
                  </section>
                  <section>
                    <h2 className="text-xl font-semibold mb-3">2. Use License</h2>
                    <p>Permission is granted to temporarily download one copy of Planorama for personal, non-commercial transitory viewing only.</p>
                  </section>
                  <section>
                    <h2 className="text-xl font-semibold mb-3">3. Disclaimer</h2>
                    <p>The materials on Planorama are provided on an 'as is' basis. Planorama makes no warranties, expressed or implied.</p>
                  </section>
                  <section>
                    <h2 className="text-xl font-semibold mb-3">4. Limitations</h2>
                    <p>In no event shall Planorama or its suppliers be liable for any damages arising out of the use or inability to use the materials on Planorama.</p>
                  </section>
                  <section>
                    <h2 className="text-xl font-semibold mb-3">5. Contact Information</h2>
                    <p>If you have any questions about these Terms of Service, please contact us through our support channels.</p>
                  </section>
                </div>
              </div>
            </div>
          } />
          <Route path="/privacy" element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center max-w-4xl mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
                <div className="text-left space-y-6 text-gray-700">
                  <section>
                    <h2 className="text-xl font-semibold mb-3">Information We Collect</h2>
                    <p>We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.</p>
                  </section>
                  <section>
                    <h2 className="text-xl font-semibold mb-3">How We Use Your Information</h2>
                    <p>We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.</p>
                  </section>
                  <section>
                    <h2 className="text-xl font-semibold mb-3">Information Sharing</h2>
                    <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.</p>
                  </section>
                  <section>
                    <h2 className="text-xl font-semibold mb-3">Data Security</h2>
                    <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
                  </section>
                  <section>
                    <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
                    <p>If you have any questions about this Privacy Policy, please contact us through our support channels.</p>
                  </section>
                </div>
              </div>
            </div>
          } />
          
          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
