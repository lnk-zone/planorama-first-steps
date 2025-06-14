
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Landing from './Landing';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // If user is authenticated, redirect them to dashboard
  if (user) {
    window.location.href = '/dashboard';
    return null;
  }

  // Show landing page for non-authenticated users
  return <Landing />;
};

export default Index;
