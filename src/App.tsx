
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
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          {/* Placeholder routes for future implementation */}
          <Route path="/projects/:id" element={
            <ProtectedRoute>
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold mb-4">Project Details</h1>
                  <p className="text-gray-600">Coming soon - Project mindmap integration</p>
                </div>
              </div>
            </ProtectedRoute>
          } />
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
          
          {/* Legal pages (placeholder) */}
          <Route path="/terms" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center max-w-2xl mx-auto px-4">
                <h1 className="text-2xl font-bold mb-4">Terms of Service</h1>
                <p className="text-gray-600">Terms of service content coming soon.</p>
              </div>
            </div>
          } />
          <Route path="/privacy" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center max-w-2xl mx-auto px-4">
                <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
                <p className="text-gray-600">Privacy policy content coming soon.</p>
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
