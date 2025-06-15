
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useFeatures } from '@/hooks/useFeatures';
import { useMindmapSync } from '@/hooks/useMindmapSync';
import AppLayout from '@/components/AppLayout';
import ViewToggle from '@/components/ViewToggle';
import FeatureCard from '@/components/FeatureCard';
import AddEditFeatureModal from '@/components/AddEditFeatureModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, ExternalLink, Settings, Code } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Feature } from '@/hooks/useFeatures';

const MindmapFeaturesPage = () => {
  const { id } = useParams<{ id: string }>();
  const { features, loading, addFeature, updateFeature, deleteFeature } = useFeatures(id || '');
  const { syncStatus, lastSyncTime, conflictCount, triggerSync, retrySync } = useMindmapSync(id || '');
  
  const [currentView, setCurrentView] = useState<'mindmap' | 'list'>('mindmap');
  const [mindmapData, setMindmapData] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);

  // Load mindmap data for external tool integration
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

  const handleAddFeature = async (featureData: any) => {
    try {
      const newFeature = await addFeature(featureData);
      setIsAddModalOpen(false);
      
      // Trigger sync after successful feature addition
      triggerSync([...features, newFeature]);
      
      toast({
        title: "Feature added",
        description: "New feature has been added and will sync to external mindmap tools.",
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
      const updatedFeature = await updateFeature(editingFeature.id, featureData);
      setEditingFeature(null);
      
      // Trigger sync after successful feature update
      const updatedFeatures = features.map(f => f.id === editingFeature.id ? updatedFeature : f);
      triggerSync(updatedFeatures);
      
      toast({
        title: "Feature updated",
        description: "Feature has been updated and will sync to external tools.",
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
      
      // Trigger sync after successful feature deletion
      const remainingFeatures = features.filter(f => f.id !== featureId);
      triggerSync(remainingFeatures);
      
      toast({
        title: "Feature deleted",
        description: "Feature has been removed and will sync to external tools.",
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
            <Link to={`/projects/${id}`} className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Link>
          </div>
          
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">External Mindmap Integration</h1>
              <p className="text-gray-600">Connect external mindmap tools and sync with your features</p>
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
            <div className="space-y-6">
              {/* External Tool Integration Card */}
              <Card>
                <CardHeader>
                  <CardTitle>External Mindmap Tool Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center">
                    <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Connect Your Mindmap Tool
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Integrate with external mindmap tools like Miro, Lucidchart, or Figma. 
                      Your features will sync automatically with the external tool when changes are made.
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button disabled>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Configure Integration
                      </Button>
                      <Button variant="outline" disabled>
                        <Code className="h-4 w-4 mr-2" />
                        API Documentation
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Export Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Export Data for External Tools</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Export your feature data in formats compatible with popular mindmap tools:
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" disabled>Export as JSON</Button>
                      <Button variant="outline" disabled>Export as CSV</Button>
                      <Button variant="outline" disabled>Export as XML</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Webhook Configuration Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Real-time Sync Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Configure webhooks to keep your external mindmap tool in sync with feature changes:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">Outgoing Webhook</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Send updates to external tools when features change
                        </p>
                        <Button variant="outline" size="sm" disabled>Configure</Button>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">Incoming Webhook</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Receive updates from external tools
                        </p>
                        <Button variant="outline" size="sm" disabled>Setup</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              {features.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No features yet</h3>
                  <p className="text-gray-600 mb-6">
                    Start by adding your first feature to sync with external mindmap tools.
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
                    onAddChild={() => {
                      toast({
                        title: "Coming soon",
                        description: "Child features will be available soon.",
                      });
                    }}
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
