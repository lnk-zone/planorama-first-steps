
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Clean up OAuth callback tokens from URL after processing
    if (location.hash.includes('access_token=') || location.hash.includes('error=')) {
      // Give the auth hook time to process the tokens
      const timer = setTimeout(() => {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [location.hash]);

  // Show loading spinner while checking auth or processing OAuth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {window.location.hash.includes('access_token=') ? 'Completing sign in...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
