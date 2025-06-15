import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useFeatures } from '@/hooks/useFeatures';
import { useMindmapSync } from '@/hooks/useMindmapSync';
import AppLayout from '@/components/AppLayout';
import ViewToggle from '@/components/ViewToggle';
import MindmapViewer from '@/components/MindmapViewer';
import FeatureCard from '@/components/FeatureCard';
import AddEditFeatureModal from '@/components/AddEditFeatureModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Feature } from '@/hooks/useFeatures';
import type { MindmapNode } from '@/lib/mindmapSync';

const MindmapFeaturesPage = () => {
  const { id } = useParams<{ id: string }>();
  const { features, loading, addFeature, updateFeature, deleteFeature } = useFeatures(id || '');
  const { syncStatus, lastSyncTime, conflictCount, syncMindmapToFeatures, syncFeaturesToMindmap, retrySync } = useMindmapSync(id || '');
  
  const [currentView, setCurrentView] = useState<'mindmap' | 'list'>('mindmap');
  const [mindmapData, setMindmapData] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);

  // Load mindmap data
  useEffect(() => {
    const loadMindmapData = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('mindmaps')
          .select('*')
          .eq('project_id', id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading mindmap:', error);
          return;
        }

        if (data) {
          setMindmapData(data.data);
        }
      } catch (error) {
        console.error('Error loading mindmap data:', error);
      }
    };

    loadMindmapData();
  }, [id]);

  // Sync features to mindmap when features change
  useEffect(() => {
    if (features.length > 0) {
      syncFeaturesToMindmap(features);
    }
  }, [features, syncFeaturesToMindmap]);

  const handleNodeClick = (node: MindmapNode) => {
    if (node.metadata?.featureId) {
      const feature = features.find(f => f.id === node.metadata?.featureId);
      if (feature) {
        setEditingFeature(feature);
      }
    }
  };

  const handleNodeUpdate = async (nodeId: string, updates: Partial<MindmapNode>) => {
    if (!mindmapData) return;

    const updatedNodes = mindmapData.nodes?.map((node: MindmapNode) => 
      node.id === nodeId ? { ...node, ...updates } : node
    ) || [];

    if (mindmapData.rootNode?.id === nodeId) {
      const updatedRootNode = { ...mindmapData.rootNode, ...updates };
      const newMindmapData = {
        ...mindmapData,
        rootNode: updatedRootNode,
        nodes: updatedNodes
      };
      setMindmapData(newMindmapData);

      // Get mindmap ID and sync
      const { data: mindmap } = await supabase
        .from('mindmaps')
        .select('id')
        .eq('project_id', id)
        .single();

      if (mindmap) {
        await syncMindmapToFeatures(mindmap.id, [updatedRootNode, ...updatedNodes]);
      }
    } else {
      const newMindmapData = {
        ...mindmapData,
        nodes: updatedNodes
      };
      setMindmapData(newMindmapData);

      // Sync changes
      const { data: mindmap } = await supabase
        .from('mindmaps')
        .select('id')
        .eq('project_id', id)
        .single();

      if (mindmap) {
        await syncMindmapToFeatures(mindmap.id, updatedNodes);
      }
    }
  };

  const handleNodeDelete = async (nodeId: string) => {
    if (!mindmapData || nodeId === 'root') return;

    const nodeToDelete = mindmapData.nodes?.find((node: MindmapNode) => node.id === nodeId);
    if (nodeToDelete?.metadata?.featureId) {
      await deleteFeature(nodeToDelete.metadata.featureId);
    }

    const updatedNodes = mindmapData.nodes?.filter((node: MindmapNode) => node.id !== nodeId) || [];
    const newMindmapData = {
      ...mindmapData,
      nodes: updatedNodes
    };
    setMindmapData(newMindmapData);
  };

  const handleAddFeature = async (featureData: any) => {
    try {
      await addFeature(featureData);
      setIsAddModalOpen(false);
      toast({
        title: "Feature added",
        description: "New feature has been added and will appear in the mindmap.",
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
      setEditingFeature(null);
      toast({
        title: "Feature updated",
        description: "Feature has been updated in both views.",
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
    if (!confirm('Are you sure you want to delete this feature?')) {
      return;
    }

    try {
      await deleteFeature(featureId);
      toast({
        title: "Feature deleted",
        description: "Feature has been removed from both views.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete feature. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
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
            <Link to={`/projects/${id}/planning`} className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Planning
            </Link>
          </div>
          
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Features & Mindmap</h1>
              <p className="text-gray-600">Visual planning with synchronized features</p>
            </div>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Feature
            </Button>
          </div>
        </div>

        {/* View Toggle */}
        <ViewToggle
          currentView={currentView}
          onViewChange={setCurrentView}
          syncStatus={syncStatus}
          lastSyncTime={lastSyncTime}
          conflictCount={conflictCount}
          onRetrySync={retrySync}
        />

        {/* Content */}
        <div className="mt-6">
          {currentView === 'mindmap' ? (
            <Card>
              <CardHeader>
                <CardTitle>Visual Mindmap</CardTitle>
              </CardHeader>
              <CardContent>
                <MindmapViewer
                  projectId={id || ''}
                  mindmapData={mindmapData}
                  features={features}
                  onNodeClick={handleNodeClick}
                  onNodeUpdate={handleNodeUpdate}
                  onNodeDelete={handleNodeDelete}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {features.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No features yet</h3>
                  <p className="text-gray-600 mb-6">
                    Start by adding your first feature to see it in both views.
                  </p>
                  <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Feature
                  </Button>
                </div>
              ) : (
                features.map(feature => (
                  <FeatureCard
                    key={feature.id}
                    feature={feature}
                    onEdit={(feature) => setEditingFeature(feature)}
                    onDelete={handleDeleteFeature}
                    onAddChild={() => {}} // Not implemented in this version
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Modals */}
        <AddEditFeatureModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddFeature}
        />

        <AddEditFeatureModal
          isOpen={!!editingFeature}
          feature={editingFeature}
          onClose={() => setEditingFeature(null)}
          onSave={handleEditFeature}
        />
      </div>
    </AppLayout>
  );
};

export default MindmapFeaturesPage;
