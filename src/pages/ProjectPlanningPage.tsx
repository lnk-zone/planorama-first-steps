
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFeatures } from '@/hooks/useFeatures';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Plus, 
  BarChart3, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Target,
  Layers,
  Users,
  FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const ProjectPlanningPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { features, loading: featuresLoading } = useFeatures(id || '');
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) {
      fetchProject();
    }
  }, [id, user]);

  const fetchProject = async () => {
    if (!id || !user) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        toast({
          title: "Error loading project",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate planning statistics
  const planningStats = {
    totalFeatures: features.length,
    completedFeatures: features.filter(f => f.status === 'completed').length,
    inProgressFeatures: features.filter(f => f.status === 'in-progress').length,
    plannedFeatures: features.filter(f => f.status === 'planned').length,
    highPriorityFeatures: features.filter(f => f.priority === 'high').length,
    mediumPriorityFeatures: features.filter(f => f.priority === 'medium').length,
    lowPriorityFeatures: features.filter(f => f.priority === 'low').length,
  };

  const progressPercentage = planningStats.totalFeatures > 0 
    ? Math.round((planningStats.completedFeatures / planningStats.totalFeatures) * 100)
    : 0;

  if (loading || featuresLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Project not found</h1>
            <Link to="/projects">
              <Button>Back to Projects</Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link to={`/projects/${id}`} className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Link>
          </div>
          
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title} - Planning</h1>
              <p className="text-gray-600">{project.description}</p>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link to={`/projects/${id}/features`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Feature
                </Link>
              </Button>
            </div>
          </div>

          {/* Project Navigation Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Features</CardTitle>
                    <Layers className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{planningStats.totalFeatures}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{planningStats.completedFeatures}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                    <Clock className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{planningStats.inProgressFeatures}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{planningStats.highPriorityFeatures}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Progress Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Project Progress
                  </CardTitle>
                  <CardDescription>
                    Overall completion status of your project features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm text-muted-foreground">{progressPercentage}%</span>
                    </div>
                    <Progress value={progressPercentage} className="w-full" />
                    
                    <div className="grid grid-cols-3 gap-4 pt-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{planningStats.completedFeatures}</div>
                        <div className="text-sm text-muted-foreground">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{planningStats.inProgressFeatures}</div>
                        <div className="text-sm text-muted-foreground">In Progress</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-600">{planningStats.plannedFeatures}</div>
                        <div className="text-sm text-muted-foreground">Planned</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Common planning tasks for your project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                      <Link to={`/projects/${id}/features`}>
                        <Layers className="h-6 w-6" />
                        <span>Manage Features</span>
                      </Link>
                    </Button>
                    
                    <Button disabled variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                      <FileText className="h-6 w-6" />
                      <span>Generate PRD</span>
                    </Button>
                    
                    <Button disabled variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                      <Users className="h-6 w-6" />
                      <span>Invite Team</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features">
              <Card>
                <CardHeader>
                  <CardTitle>Feature Management</CardTitle>
                  <CardDescription>
                    Detailed view of all project features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Feature Management</h3>
                    <p className="text-gray-600 mb-4">Manage your project features in detail</p>
                    <Button asChild>
                      <Link to={`/projects/${id}/features`}>
                        Go to Features
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="progress">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Progress</CardTitle>
                  <CardDescription>
                    In-depth progress tracking and analytics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-2">By Priority</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            High Priority
                          </Badge>
                          <span className="text-sm">{planningStats.highPriorityFeatures} features</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Medium Priority
                          </Badge>
                          <span className="text-sm">{planningStats.mediumPriorityFeatures} features</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Low Priority
                          </Badge>
                          <span className="text-sm">{planningStats.lowPriorityFeatures} features</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline">
              <Card>
                <CardHeader>
                  <CardTitle>Project Timeline</CardTitle>
                  <CardDescription>
                    Timeline view of your project milestones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Timeline Coming Soon</h3>
                    <p className="text-gray-600">Visual timeline and milestone tracking will be available soon.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProjectPlanningPage;
