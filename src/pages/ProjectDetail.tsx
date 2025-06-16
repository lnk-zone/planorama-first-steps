import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, RefreshCw, Plus, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useFeatures } from '@/hooks/useFeatures';
import { useUserStories } from '@/hooks/useUserStories';
import AIFeatureGenerationModal from '@/components/AIFeatureGenerationModal';
import FeatureGenerationModal from '@/components/FeatureGenerationModal';
import AddEditFeatureModal from '@/components/AddEditFeatureModal';
import EditProjectModal from '@/components/EditProjectModal';
import CollapsibleFeatureCard from '@/components/CollapsibleFeatureCard';
import ExecutionOrderDisplay from '@/components/ExecutionOrderDisplay';
import ProjectMetrics from '@/components/ProjectMetrics';
import PRDTab from '@/components/PRDTab';
import PromptsTab from '@/components/PromptsTab';
import ProjectHeader from '@/components/ProjectHeader';
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
  const [editingFeature, setEditingFeature] = useState(null);

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
      <div className="min-h-screen bg-gray-50">
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
    setShowFeatureGenerationModal(true);
  };

  const handleCloseAIModal = () => {
    setShowAIFeatureModal(false);
    setIsRegenerating(false);
  };

  const handleCloseFeatureModal = () => {
    setShowFeatureGenerationModal(false);
    setIsRegenerating(false);
  };

  const handleAddChild = (parentFeature: any) => {
    console.log('Add child to:', parentFeature);
  };

  const handleEdit = (feature: any) => {
    setEditingFeature(feature);
    setShowAddFeatureModal(true);
  };

  const handleDelete = (featureId: string) => {
    console.log('Delete feature:', featureId);
  };

  const handleSaveFeature = async (featureData: any) => {
    await refetchFeatures();
    setShowAddFeatureModal(false);
    setEditingFeature(null);
  };

  const handleProjectUpdate = async () => {
    setShowEditProjectModal(false);
  };

  const handleStoryUpdate = async () => {
    await refetchStories();
  };

  const hasFeatures = features.length > 0;
  const totalStories = userStories.length;
  const completedStories = userStories.filter(s => s.status === 'completed').length;

  const mockExecutionPlan = {
    totalStories: totalStories,
    executionOrder: userStories
      .sort((a, b) => (a.execution_order || 0) - (b.execution_order || 0))
      .map(story => story.title),
    estimatedTotalHours: userStories.reduce((sum, story) => sum + (story.estimated_hours || 0), 0),
    phases: [
      {
        number: 1,
        name: "Phase 1: Foundation",
        stories: userStories.slice(0, Math.ceil(userStories.length / 2)).map(s => s.title),
        estimatedHours: userStories.slice(0, Math.ceil(userStories.length / 2))
          .reduce((sum, story) => sum + (story.estimated_hours || 0), 0)
      },
      {
        number: 2,
        name: "Phase 2: Implementation",
        stories: userStories.slice(Math.ceil(userStories.length / 2)).map(s => s.title),
        estimatedHours: userStories.slice(Math.ceil(userStories.length / 2))
          .reduce((sum, story) => sum + (story.estimated_hours || 0), 0)
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectHeader project={project} />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Project description - visible on larger screens */}
        {project.description && (
          <div className="hidden sm:block">
            <p className="text-gray-600">{project.description}</p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{features.length}</div>
              <p className="text-sm text-gray-600">Features</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{totalStories}</div>
              <p className="text-sm text-gray-600">User Stories</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{completedStories}</div>
              <p className="text-sm text-gray-600">
                {totalStories > 0 ? Math.round((completedStories / totalStories) * 100) : 0}% done
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {userStories.reduce((sum, story) => sum + (story.estimated_hours || 0), 0)}h
              </div>
              <p className="text-sm text-gray-600">Est. Hours</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        {hasFeatures ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <TabsList className="grid w-full max-w-2xl grid-cols-5">
                <TabsTrigger value="features">Features</TabsTrigger>
                <TabsTrigger value="execution">Execution</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="prd">PRD</TabsTrigger>
                <TabsTrigger value="prompts">Prompts</TabsTrigger>
              </TabsList>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerate}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate Features
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
              <div className="grid gap-4">
                {features.map((feature) => (
                  <CollapsibleFeatureCard
                    key={feature.id}
                    feature={feature}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onAddChild={handleAddChild}
                    onStoryUpdate={handleStoryUpdate}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="execution" className="space-y-4">
              <ExecutionOrderDisplay 
                userStories={userStories}
                executionPlan={mockExecutionPlan}
              />
            </TabsContent>

            <TabsContent value="metrics" className="space-y-4">
              <ProjectMetrics projects={[project]} />
            </TabsContent>

            <TabsContent value="prd" className="space-y-4">
              <PRDTab 
                projectTitle={project.title}
                projectDescription={project.description}
              />
            </TabsContent>

            <TabsContent value="prompts" className="space-y-4">
              <PromptsTab 
                projectTitle={project.title}
                projectDescription={project.description}
                features={features}
              />
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
          onClose={handleCloseFeatureModal}
          projectId={project.id}
          isRegeneration={isRegenerating}
          onFeaturesGenerated={handleFeatureGeneration}
        />

        <AddEditFeatureModal
          isOpen={showAddFeatureModal}
          onClose={() => {
            setShowAddFeatureModal(false);
            setEditingFeature(null);
          }}
          feature={editingFeature}
          onSave={handleSaveFeature}
        />

        <EditProjectModal
          isOpen={showEditProjectModal}
          onClose={() => setShowEditProjectModal(false)}
          onSuccess={handleProjectUpdate}
          project={project}
        />
      </div>
    </div>
  );
};

export default ProjectDetail;
