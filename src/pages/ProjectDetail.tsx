
import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, RefreshCw, Plus, Settings, BarChart3, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useFeatures } from '@/hooks/useFeatures';
import { useUserStories } from '@/hooks/useUserStories';
import AIFeatureGenerationModal from '@/components/AIFeatureGenerationModal';
import FeatureGenerationModal from '@/components/FeatureGenerationModal';
import AddEditFeatureModal from '@/components/AddEditFeatureModal';
import EditProjectModal from '@/components/EditProjectModal';
import EnhancedFeatureHierarchy from '@/components/EnhancedFeatureHierarchy';
import ExecutionOrderDisplay from '@/components/ExecutionOrderDisplay';
import ProjectMetrics from '@/components/ProjectMetrics';
import { toast } from '@/hooks/use-toast';
import type { GenerationResult } from '@/lib/aiFeatureGenerator';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { projects, loading: projectsLoading } = useProjects();
  const { features, loading: featuresLoading, refetch: refetchFeatures } = useFeatures(id || '');
  const { userStories, loading: storiesLoading, refetch: refetchStories } = useUserStories(features.map(f => f.id));

  const [activeTab, setActiveTab] = useState('features');
  const [showAIFeatureModal, setShowAIFeatureModal] = useState(false);
  const [showFeatureGenerationModal, setShowFeatureGenerationModal] = useState(false);
  const [showAddFeatureModal, setShowAddFeatureModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const project = projects.find(p => p.id === id);

  useEffect(() => {
    if (!projectsLoading && !project) {
      toast({
        title: "Project not found",
        description: "The project you're looking for doesn't exist.",
        variant: "destructive",
      });
    }
  }, [project, projectsLoading]);

  if (projectsLoading || featuresLoading || storiesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !project) {
    return <Navigate to="/" replace />;
  }

  const handleAIFeatureGeneration = async (result: GenerationResult) => {
    await refetchFeatures();
    await refetchStories();
    toast({
      title: "Features generated successfully!",
      description: `Generated ${result.features.length} features with ${result.userStories.length} user stories.`,
    });
  };

  const handleFeatureGeneration = async (result: GenerationResult) => {
    await refetchFeatures();
    await refetchStories();
    toast({
      title: "Features generated successfully!",
      description: `Generated ${result.features.length} features with ${result.userStories.length} user stories.`,
    });
  };

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setShowAIFeatureModal(true);
  };

  const handleCloseAIModal = () => {
    setShowAIFeatureModal(false);
    setIsRegenerating(false);
  };

  const hasFeatures = features.length > 0;
  const totalStories = userStories.length;
  const completedStories = userStories.filter(s => s.status === 'completed').length;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
          {project.description && (
            <p className="text-gray-600 mt-2">{project.description}</p>
          )}
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="outline">{project.status}</Badge>
            <Badge variant="secondary">{project.project_type}</Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEditProjectModal(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          
          {!hasFeatures ? (
            <Button
              onClick={() => setShowAIFeatureModal(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Zap className="h-4 w-4 mr-2" />
              Generate Features
            </Button>
          ) : (
            <Button
              onClick={handleRegenerate}
              variant="outline"
              className="border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate Features
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{features.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">User Stories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStories}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedStories}</div>
            <p className="text-sm text-gray-600">
              {totalStories > 0 ? Math.round((completedStories / totalStories) * 100) : 0}% done
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Estimated Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userStories.reduce((sum, story) => sum + (story.estimated_hours || 0), 0)}h
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {hasFeatures ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="execution">Execution</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFeatureGenerationModal(true)}
              >
                <Zap className="h-4 w-4 mr-2" />
                Generate More
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddFeatureModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Feature
              </Button>
            </div>
          </div>

          <TabsContent value="features" className="space-y-4">
            <EnhancedFeatureHierarchy 
              projectId={project.id}
              onFeatureUpdated={refetchFeatures}
            />
          </TabsContent>

          <TabsContent value="execution" className="space-y-4">
            <ExecutionOrderDisplay projectId={project.id} />
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <ProjectMetrics projectId={project.id} />
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Users className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No features yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Get started by generating features with AI or add them manually. Features help organize your project into manageable pieces.
            </p>
            <div className="flex justify-center gap-3">
              <Button
                onClick={() => setShowAIFeatureModal(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Zap className="h-4 w-4 mr-2" />
                Generate Features with AI
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddFeatureModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Feature Manually
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <AIFeatureGenerationModal
        isOpen={showAIFeatureModal}
        onClose={handleCloseAIModal}
        projectId={project.id}
        projectTitle={project.title}
        projectDescription={project.description || ''}
        isRegeneration={isRegenerating}
        onComplete={handleAIFeatureGeneration}
      />

      <FeatureGenerationModal
        isOpen={showFeatureGenerationModal}
        onClose={() => setShowFeatureGenerationModal(false)}
        projectId={project.id}
        onFeaturesGenerated={handleFeatureGeneration}
      />

      <AddEditFeatureModal
        isOpen={showAddFeatureModal}
        onClose={() => setShowAddFeatureModal(false)}
        projectId={project.id}
        onFeatureAdded={refetchFeatures}
      />

      <EditProjectModal
        isOpen={showEditProjectModal}
        onClose={() => setShowEditProjectModal(false)}
        project={project}
      />
    </div>
  );
};

export default ProjectDetail;
