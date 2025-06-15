
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useRetry } from '@/hooks/useRetry';
import AppLayout from '@/components/AppLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import { DashboardSkeleton } from '@/components/LoadingStates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ProjectMetrics from '@/components/ProjectMetrics';
import ProjectProgressChart from '@/components/ProjectProgressChart';
import ActivityTimeline from '@/components/ActivityTimeline';
import ProductivityInsights from '@/components/ProductivityInsights';
import { Plus, FolderOpen, Calendar, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const Dashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjectsFunction = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const { execute: fetchProjects, isLoading: fetchLoading, error: fetchError, retry } = useRetry(
    fetchProjectsFunction,
    {
      maxRetries: 2,
      retryDelay: 1000,
    }
  );

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    setLoading(true);
    const data = await fetchProjects();
    
    if (data) {
      setProjects(data);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'on-hold':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading || fetchLoading) {
    return (
      <AppLayout>
        <DashboardSkeleton />
      </AppLayout>
    );
  }

  const recentProjects = projects.slice(0, 5);

  return (
    <ErrorBoundary>
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Error Alert */}
          {fetchError && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Failed to load projects. Please try again.</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    retry();
                    loadProjects();
                  }}
                  className="ml-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Welcome Section */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'there'}! 👋
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Here's your project analytics and recent activity.
            </p>
          </div>

          {/* Enhanced Metrics */}
          <ProjectMetrics projects={projects} />

          {/* Charts Section */}
          <div className="mb-8">
            <ProjectProgressChart projects={projects} />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
            {/* Recent Projects - Takes 2 columns */}
            <div className="xl:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg sm:text-xl">Recent Projects</CardTitle>
                      <CardDescription className="text-sm">
                        Your latest project activity
                      </CardDescription>
                    </div>
                    <Button asChild size="sm" className="w-full sm:w-auto">
                      <Link to="/projects">
                        View All
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentProjects.length === 0 ? (
                    <div className="text-center py-8">
                      <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No projects yet
                      </h3>
                      <p className="text-gray-500 mb-4 text-sm">
                        Get started by creating your first project
                      </p>
                      <Button asChild className="w-full sm:w-auto">
                        <Link to="/projects">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Project
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentProjects.map((project) => (
                        <div
                          key={project.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {project.title}
                                </p>
                                {project.description && (
                                  <p className="text-xs text-gray-500 truncate">
                                    {project.description}
                                  </p>
                                )}
                              </div>
                              <Badge
                                variant="secondary"
                                className={`${getStatusColor(project.status)} flex-shrink-0`}
                              >
                                {formatStatus(project.status)}
                              </Badge>
                            </div>
                            <div className="flex items-center mt-2 text-xs text-gray-500">
                              <Clock className="mr-1 h-3 w-3" />
                              {format(new Date(project.created_at), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Activity & Insights */}
            <div className="space-y-6">
              <ActivityTimeline projects={projects} />
              <ProductivityInsights projects={projects} />
              
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
                  <CardDescription className="text-sm">
                    Common tasks to get you started
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link to="/projects">
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Project
                    </Link>
                  </Button>
                  
                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link to="/templates">
                      <FolderOpen className="mr-2 h-4 w-4" />
                      Browse Templates
                    </Link>
                  </Button>
                  
                  <Button asChild className="w-full justify-start" variant="outline">
                    <Link to="/profile">
                      <Calendar className="mr-2 h-4 w-4" />
                      Update Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AppLayout>
    </ErrorBoundary>
  );
};

export default Dashboard;
