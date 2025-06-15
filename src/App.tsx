
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Profile from "./pages/Profile";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import TemplatesPage from "./pages/TemplatesPage";
import ProjectPlanningPage from "./pages/ProjectPlanningPage";
import FeaturesPage from "./pages/FeaturesPage";
import UserStoriesPage from "./pages/UserStoriesPage";
import MindmapFeaturesPage from "./pages/MindmapFeaturesPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
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
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            
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
            <Route path="/projects/:id/planning" element={
              <ProtectedRoute>
                <ProjectPlanningPage />
              </ProtectedRoute>
            } />
            <Route path="/projects/:id/features" element={
              <ProtectedRoute>
                <FeaturesPage />
              </ProtectedRoute>
            } />
            <Route path="/projects/:id/mindmap" element={
              <ProtectedRoute>
                <MindmapFeaturesPage />
              </ProtectedRoute>
            } />
            <Route path="/projects/:id/features/:featureId/stories" element={
              <ProtectedRoute>
                <UserStoriesPage />
              </ProtectedRoute>
            } />
            <Route path="/templates" element={
              <ProtectedRoute>
                <TemplatesPage />
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
            
            {/* Help page */}
            <Route path="/help" element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-2xl mx-auto px-4 py-12">
                  <h1 className="text-3xl font-bold mb-8">Help & Support</h1>
                  <div className="text-left space-y-6 text-gray-700">
                    <section>
                      <h2 className="text-xl font-semibold mb-3">Getting Started</h2>
                      <p>Welcome to Planorama! Start by creating your first project and exploring our AI-powered features.</p>
                    </section>
                    <section>
                      <h2 className="text-xl font-semibold mb-3">Common Questions</h2>
                      <ul className="space-y-2">
                        <li>• How do I create a new project?</li>
                        <li>• How does AI PRD generation work?</li>
                        <li>• Can I collaborate with team members?</li>
                        <li>• How do I export my projects?</li>
                      </ul>
                    </section>
                    <section>
                      <h2 className="text-xl font-semibold mb-3">Contact Support</h2>
                      <p>Need help? Contact us at <strong>support@planorama.ai</strong> or through the chat widget.</p>
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
  </ErrorBoundary>
);

export default App;
