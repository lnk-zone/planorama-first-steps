import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Settings, Share2, Download, Zap, FileText, Users, Activity, Layers, Plus, RefreshCw } from 'lucide-react';
import InteractiveMindmapVisualization, { MindmapStructure, MindmapNode } from '@/components/mindmap/InteractiveMindmapVisualization';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useFeatures } from '@/hooks/useFeatures';
import { toast } from '@/hooks/use-toast';
import FeatureCard from '@/components/FeatureCard';
import AddEditFeatureModal from '@/components/AddEditFeatureModal';
import AIMindmapGenerationModal from '@/components/AIMindmapGenerationModal';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { features, loading: featuresLoading, addFeature, updateFeature, deleteFeature, refetch: refetchFeatures } = useFeatures(id || '');
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  const [isAIGenerationModalOpen, setIsAIGenerationModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('planning');
  const [mindmap, setMindmap] = useState<MindmapStructure | null>(null);
  const [mindmapId, setMindmapId] = useState<string | null>(null);
  const [mindmapLoading, setMindmapLoading] = useState(false);
  const [selectedParentNodeId, setSelectedParentNodeId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<MindmapNode | null>(null);
  const [hasMindmap, setHasMindmap] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchProject();
    }
  }, [id, user]);

  useEffect(() => {
    if (activeTab === 'mindmap' && id) {
      fetchMindmap();
    }
  }, [activeTab, id]);

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

  const fetchMindmap = async () => {
    if (!id) return;
    setMindmapLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('mindmaps')
        .select('id, data')
        .eq('project_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (!error && data) {
        setMindmapId(data.id);
        setMindmap(data.data as unknown as MindmapStructure);
        setHasMindmap(true);
      } else {
        setMindmapId(null);
        setMindmap(null);
        setHasMindmap(false);
      }
    } catch (error) {
      console.error('Error fetching mindmap:', error);
      setHasMindmap(false);
    } finally {
      setMindmapLoading(false);
    }
  };

  const handleAddFeature = async (featureData: any) => {
    try {
      const newFeature = await addFeature({
        ...featureData,
        parent_id: selectedParentNodeId || featureData.parent_id
      });

      if (mindmap && mindmapId) {
        const nodeId = crypto.randomUUID();
        const newNode: MindmapNode = {
          id: nodeId,
          title: newFeature.title,
          description: newFeature.description || undefined,
          parentId: selectedParentNodeId || mindmap.rootNode.id,
          position: { x: Math.random() * 400 - 200, y: Math.random() * 400 - 200 },
          style: { color: '#3b82f6', size: 'medium' },
          metadata: { priority: newFeature.priority, complexity: newFeature.complexity }
        };
        const conn = { from: selectedParentNodeId || mindmap.rootNode.id, to: nodeId };
        const updated: MindmapStructure & { featureMapping?: Record<string, string> } = {
          ...mindmap,
          nodes: [...mindmap.nodes, newNode],
          connections: [...mindmap.connections, conn],
          featureMapping: { ...(mindmap as any).featureMapping, [nodeId]: newFeature.id }
        };
        await syncMindmap(updated);
      }

      setIsAddModalOpen(false);
      setSelectedParentNodeId(null);
      toast({
        title: "Feature added",
        description: "New feature has been added successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add feature. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditFeature = async (featureData: any) => {
    if (!editingFeature) return;

    try {
      await updateFeature(editingFeature.id, featureData);
      await updateMindmapNodeFromFeature(editingFeature.id, featureData);
      setEditingFeature(null);
      toast({
        title: "Feature updated",
        description: "Feature has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update feature. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFeature = async (featureId: string) => {
    try {
      await deleteFeature(featureId);
      toast({
        title: "Feature deleted",
        description: "Feature has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete feature. Please try again.",
        variant: "destructive",
      });
    }
  };

  const syncMindmap = async (updated: MindmapStructure) => {
    if (!mindmapId) return;
    setMindmap(updated);
    // Convert MindmapStructure to Json for database storage
    await supabase
      .from('mindmaps')
      .update({ 
        data: updated as unknown as any, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', mindmapId);
  };

  const updateMindmapNodeFromFeature = async (featureId: string, updates: any) => {
    if (!mindmap) return;
    const mapping: Record<string, string> = (mindmap as any).featureMapping || {};
    const nodeId = Object.entries(mapping).find(([_, fId]) => fId === featureId)?.[0];
    if (!nodeId) return;
    const apply = (node: MindmapNode) => ({
      ...node,
      title: updates.title || node.title,
      description: updates.description || node.description,
      metadata: { ...(node.metadata || {}), priority: updates.priority, complexity: updates.complexity }
    });
    let updated = { ...mindmap } as MindmapStructure;
    if (nodeId === mindmap.rootNode.id) {
      updated.rootNode = apply(mindmap.rootNode);
    } else {
      updated.nodes = mindmap.nodes.map(n => n.id === nodeId ? apply(n) : n);
    }
    await syncMindmap(updated);
  };

  const handleNodeEdit = (nodeId: string) => {
    if (nodeId === 'root') {
      // Handle root node edit - could open project settings
      toast({
        title: "Edit Project",
        description: "Project editing coming soon.",
      });
      return;
    }

    // Find the corresponding feature for this node
    const mapping: Record<string, string> = (mindmap as any)?.featureMapping || {};
    const featureId = mapping[nodeId];
    if (featureId) {
      const feature = features.find(f => f.id === featureId);
      if (feature) {
        setEditingFeature(feature);
      }
    }
  };

  const handleNodeDelete = (nodeId: string) => {
    // Find the corresponding feature and delete it
    const mapping: Record<string, string> = (mindmap as any)?.featureMapping || {};
    const featureId = mapping[nodeId];
    if (featureId) {
      handleDeleteFeature(featureId);
    }
  };

  const handleNodeAdd = (parentId: string) => {
    setSelectedParentNodeId(parentId);
    setIsAddModalOpen(true);
  };

  const handleNodeClick = (node: MindmapNode) => {
    const mapping: Record<string, string> = (mindmap as any)?.featureMapping || {};
    const featureId = mapping[node.id];
    if (featureId) {
      const feature = features.find(f => f.id === featureId);
      if (feature) setEditingFeature(feature);
    } else {
      setSelectedParentNodeId(node.id);
      setIsAddModalOpen(true);
    }
    setSelectedNode(node);
  };

  const handleAIGenerationComplete = (result: any) => {
    // Refresh features to show the newly generated ones
    refetchFeatures();

    setMindmapId(result.mindmapData.id);
    setMindmap(result.mindmapData.data as MindmapStructure);
    setHasMindmap(true);

    const isRegeneration = hasMindmap;
    toast({
      title: isRegeneration ? "Mindmap regenerated successfully!" : "Mindmap generated successfully!",
      description: `${isRegeneration ? 'Updated' : 'Generated'} ${result.features.length} features and ${result.userStories.length} user stories.`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'development':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Project not found</h1>
          <Link to="/projects">
            <Button>Back to Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link to="/projects" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Link>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
              <p className="text-gray-600 mb-4">{project.description}</p>
              <div className="flex items-center space-x-4">
                <Badge className={getStatusColor(project.status)}>
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </Badge>
                <span className="text-sm text-gray-500">
                  Created {new Date(project.created_at).toLocaleDateString()}
                </span>
                <span className="text-sm text-gray-500">
                  Updated {new Date(project.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {hasMindmap ? (
                <Button 
                  onClick={() => setIsAIGenerationModalOpen(true)}
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate Mindmap
                </Button>
              ) : (
                <Button 
                  onClick={() => setIsAIGenerationModalOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Generate Mindmap with AI
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="planning" className="flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Planning
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center">
              <Layers className="h-4 w-4 mr-2" />
              Features
            </TabsTrigger>
            <TabsTrigger value="mindmap" className="flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Mindmap
            </TabsTrigger>
            <TabsTrigger value="prd" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              PRD
            </TabsTrigger>
            <TabsTrigger value="prompts" className="flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Prompts
            </TabsTrigger>
            <TabsTrigger value="collaborate" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Collaborate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="planning" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Planning Overview</CardTitle>
                <CardDescription>
                  Track your project's progress and manage features effectively
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Feature Stats */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Feature Progress</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Features:</span>
                        <Badge variant="outline">{features.length}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Planned:</span>
                        <Badge variant="outline">{features.filter(f => f.status === 'planned').length}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">In Progress:</span>
                        <Badge variant="outline">{features.filter(f => f.status === 'in-progress').length}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Completed:</span>
                        <Badge variant="outline">{features.filter(f => f.status === 'completed').length}</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Quick Actions</h3>
                    <div className="space-y-2">
                      {hasMindmap ? (
                        <Button 
                          onClick={() => setIsAIGenerationModalOpen(true)} 
                          className="w-full justify-start bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Regenerate Mindmap
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => setIsAIGenerationModalOpen(true)} 
                          className="w-full justify-start bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Generate Mindmap with AI
                        </Button>
                      )}
                      <Button onClick={() => setIsAddModalOpen(true)} className="w-full justify-start">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Feature
                      </Button>
                      <Button variant="outline" className="w-full justify-start" disabled>
                        <FileText className="h-4 w-4 mr-2" />
                        Generate PRD
                      </Button>
                      <Button variant="outline" className="w-full justify-start" disabled>
                        <Download className="h-4 w-4 mr-2" />
                        Export Project
                      </Button>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Recent Activity</h3>
                    <div className="text-sm text-gray-500">
                      <p>Project created {new Date(project.created_at).toLocaleDateString()}</p>
                      <p>Last updated {new Date(project.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Features</h2>
                <p className="text-gray-600">Manage your project features and their requirements</p>
              </div>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Feature
              </Button>
            </div>

            {featuresLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              </div>
            ) : features.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No features yet</h3>
                    <p className="text-gray-600 mb-6">
                      Start by adding your first feature to define what you want to build.
                    </p>
                    <Button onClick={() => setIsAddModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Feature
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {features.map(feature => (
                  <FeatureCard
                    key={feature.id}
                    feature={feature}
                    onEdit={(feature) => setEditingFeature(feature)}
                    onDelete={handleDeleteFeature}
                    onAddChild={() => {
                      toast({
                        title: "Coming soon",
                        description: "Child features will be available soon.",
                      });
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="mindmap" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Project Mindmap</CardTitle>
                <CardDescription>
                  Interactive mindmap for visualizing and organizing your app features and user flows.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {mindmapLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                  </div>
                ) : mindmap ? (
                  <div className="h-[700px] w-full">
                    <InteractiveMindmapVisualization
                      mindmap={mindmap}
                      mindmapId={mindmapId || undefined}
                      onNodeEdit={handleNodeEdit}
                      onNodeDelete={handleNodeDelete}
                      onNodeAdd={handleNodeAdd}
                    />
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center m-6">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      AI-Powered Mindmap Generation
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Generate a comprehensive mindmap structure using AI, or create one manually.
                      The mindmap will integrate with your features and user stories.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button
                        onClick={() => setIsAIGenerationModalOpen(true)}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Generate with AI
                      </Button>
                      <Button variant="outline" disabled>
                        Create Manually
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prd" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Product Requirements Document</CardTitle>
                    <CardDescription>
                      AI-generated professional PRD based on your mindmap
                    </CardDescription>
                  </div>
                  <Button variant="outline" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Export PRD
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    PRD Generation Coming Soon
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Once your mindmap is complete, AI will generate a comprehensive Product Requirements Document
                    including user stories, technical specifications, and implementation details.
                  </p>
                  <Button disabled>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate PRD with AI
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prompts" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Development Prompts</CardTitle>
                    <CardDescription>
                      AI-optimized prompts for coding platforms like Lovable, Bolt, and Cursor
                    </CardDescription>
                  </div>
                  <Button variant="outline" disabled>
                    <Download className="h-4 w-4 mr-2" />
                    Export Prompts
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center">
                  <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Prompt Generation Coming Soon
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Transform your PRD into development-ready prompts optimized for different AI coding platforms.
                    Choose from templates for web apps, mobile apps, and more.
                  </p>
                  <Button disabled>
                    Generate Development Prompts
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="collaborate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Collaboration</CardTitle>
                <CardDescription>
                  Invite team members and stakeholders to review and contribute to your project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Collaboration Features Coming Soon
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Invite team members, assign roles, collect feedback, and manage project permissions.
                    Real-time collaboration on mindmaps and PRDs.
                  </p>
                  <Button disabled>
                    <Users className="h-4 w-4 mr-2" />
                    Invite Team Members
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <AddEditFeatureModal
          isOpen={isAddModalOpen}
          parentId={selectedParentNodeId || undefined}
          onClose={() => {
            setIsAddModalOpen(false);
            setSelectedParentNodeId(null);
          }}
          onSave={handleAddFeature}
        />

        <AddEditFeatureModal
          isOpen={!!editingFeature}
          feature={editingFeature}
          onClose={() => setEditingFeature(null)}
          onSave={handleEditFeature}
        />

        <AIMindmapGenerationModal
          isOpen={isAIGenerationModalOpen}
          projectId={id!}
          projectTitle={project?.title}
          projectDescription={project?.description}
          existingMindmapId={mindmapId}
          onClose={() => setIsAIGenerationModalOpen(false)}
          onComplete={handleAIGenerationComplete}
        />
      </div>
    </div>
  );
};

export default ProjectDetail;
