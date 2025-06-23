import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useFeatures } from '@/hooks/useFeatures';
import AppLayout from '@/components/AppLayout';
import FeatureCard from '@/components/FeatureCard';
import EnhancedFeatureHierarchy from '@/components/EnhancedFeatureHierarchy';
import DraggableFeatureList from '@/components/DraggableFeatureList';
import BulkFeatureOperations from '@/components/BulkFeatureOperations';
import AdvancedFeatureFilters, { type FeatureFilters } from '@/components/AdvancedFeatureFilters';
import AddEditFeatureModal from '@/components/AddEditFeatureModal';
import AddChildFeatureModal from '@/components/AddChildFeatureModal';
import AIFeatureGenerationModal from '@/components/AIFeatureGenerationModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Plus, 
  Layers,
  List,
  Shuffle,
  Settings2,
  Sparkles,
  CheckCircle,
  Info
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Feature } from '@/hooks/useFeatures';

const FeaturesPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { features, loading, addFeature, addChildFeature, updateFeature, deleteFeature, reorderFeatures } = useFeatures(id || '');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAIGenerationModalOpen, setIsAIGenerationModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [parentFeatureForChild, setParentFeatureForChild] = useState<Feature | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'hierarchy' | 'draggable'>('list');
  const [showGeneratedAlert, setShowGeneratedAlert] = useState(false);
  
  const [filters, setFilters] = useState<FeatureFilters>({
    search: '',
    status: [],
    priority: [],
    complexity: [],
    category: [],
    dateRange: {}
  });

  // Check if we're viewing newly generated features
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam === 'generated') {
      setShowGeneratedAlert(true);
      // Clean up URL after showing alert
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  // Get unique categories from features
  const categories = Array.from(new Set(features.filter(f => f.category).map(f => f.category!)));

  // Apply filters to features
  const filteredFeatures = features.filter(feature => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        feature.title.toLowerCase().includes(searchLower) ||
        feature.description?.toLowerCase().includes(searchLower) ||
        false;
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(feature.status || 'planned')) {
      return false;
    }

    // Priority filter
    if (filters.priority.length > 0 && !filters.priority.includes(feature.priority || 'medium')) {
      return false;
    }

    // Complexity filter
    if (filters.complexity.length > 0 && !filters.complexity.includes(feature.complexity || 'medium')) {
      return false;
    }

    // Category filter
    if (filters.category.length > 0 && (!feature.category || !filters.category.includes(feature.category))) {
      return false;
    }

    // Date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      const featureDate = new Date(feature.created_at || '');
      if (filters.dateRange.from && featureDate < filters.dateRange.from) return false;
      if (filters.dateRange.to && featureDate > filters.dateRange.to) return false;
    }

    return true;
  });

  // Data integrity checks
  const checkForCircularDependencies = (parentId: string, childId: string): boolean => {
    const visited = new Set<string>();
    const checkCircular = (currentId: string): boolean => {
      if (visited.has(currentId)) return true;
      visited.add(currentId);
      
      const feature = features.find(f => f.id === currentId);
      if (!feature || !feature.parent_id) return false;
      
      return checkCircular(feature.parent_id);
    };
    
    return checkCircular(childId);
  };

  const handleSelectFeature = (featureId: string, selected: boolean) => {
    setSelectedFeatures(prev => 
      selected 
        ? [...prev, featureId]
        : prev.filter(id => id !== featureId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedFeatures(checked ? filteredFeatures.map(f => f.id) : []);
  };

  const getSelectedFeatureObjects = () => {
    return features.filter(feature => selectedFeatures.includes(feature.id));
  };

  const handleReorderFeatures = async (reorderedFeatures: Feature[]) => {
    try {
      await reorderFeatures(reorderedFeatures);
      toast({
        title: "Features reordered",
        description: "Feature order has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reorder features. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkUpdate = async (updates: Partial<Feature>) => {
    try {
      for (const featureId of selectedFeatures) {
        await updateFeature(featureId, updates);
      }
      setSelectedFeatures([]);
      toast({
        title: "Features updated",
        description: `${selectedFeatures.length} features have been updated successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update features. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const featureId of selectedFeatures) {
        await deleteFeature(featureId);
      }
      setSelectedFeatures([]);
      toast({
        title: "Features deleted",
        description: `${selectedFeatures.length} features have been deleted successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete features. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddFeature = async (featureData: any) => {
    try {
      await addFeature(featureData);
      setIsAddModalOpen(false);
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

  const handleAddChildFeature = async (parentId: string, featureData: any) => {
    // Check for circular dependencies
    if (checkForCircularDependencies(parentId, featureData.id || '')) {
      toast({
        title: "Error",
        description: "Cannot create circular dependency between features.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addChildFeature(parentId, featureData);
      setParentFeatureForChild(null);
      toast({
        title: "Child feature added",
        description: "New child feature has been added successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add child feature. Please try again.",
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
    const featureToDelete = features.find(f => f.id === featureId);
    const childFeatures = features.filter(f => f.parent_id === featureId);
    
    let confirmMessage = 'Are you sure you want to delete this feature?';
    if (childFeatures.length > 0) {
      confirmMessage += ` This will also remove ${childFeatures.length} child feature${childFeatures.length > 1 ? 's' : ''} from their parent relationship.`;
    }
    
    if (!confirm(confirmMessage)) {
      return;
    }

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

  const handleAddChildClick = (parentFeature: Feature) => {
    setParentFeatureForChild(parentFeature);
  };

  const handleAIGenerationComplete = () => {
    setIsAIGenerationModalOpen(false);
    toast({
      title: "Features generated",
      description: "AI has successfully generated features and user stories for your project.",
    });
    // Refresh the page to show the new features
    window.location.reload();
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

  // Determine what to show: existing features or generation form
  const hasFeatures = features.length > 0;

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
          
          {/* Generated Features Alert */}
          {showGeneratedAlert && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Features and user stories have been successfully generated by AI! Review them below and customize as needed.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Features</h1>
              <p className="text-gray-600">Manage your project features and their requirements</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsAddModalOpen(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Feature
              </Button>
              {hasFeatures && (
                <Button onClick={() => setIsAIGenerationModalOpen(true)} variant="outline">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Regenerate with AI
                </Button>
              )}
            </div>
          </div>

          {/* Show generation form if no features exist */}
          {!hasFeatures && (
            <div className="text-center py-12 bg-gray-50 rounded-lg mb-6">
              <Sparkles className="h-12 w-12 text-primary-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No features yet</h3>
              <p className="text-gray-600 mb-6">
                Start by generating features with AI or add them manually
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setIsAIGenerationModalOpen(true)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Features with AI
                </Button>
                <Button onClick={() => setIsAddModalOpen(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Manually
                </Button>
              </div>
            </div>
          )}

          {/* Advanced Filters - only show if we have features */}
          {hasFeatures && (
            <>
              <AdvancedFeatureFilters
                filters={filters}
                onFiltersChange={setFilters}
                categories={categories}
              />

              {/* Stats */}
              <div className="flex gap-4 mt-4">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  Total: {filteredFeatures.length}
                </Badge>
                <Badge variant="outline">
                  Planned: {filteredFeatures.filter(f => f.status === 'planned').length}
                </Badge>
                <Badge variant="outline">
                  In Progress: {filteredFeatures.filter(f => f.status === 'in-progress').length}
                </Badge>
                <Badge variant="outline">
                  Completed: {filteredFeatures.filter(f => f.status === 'completed').length}
                </Badge>
              </div>

              {/* Bulk Operations Bar */}
              {selectedFeatures.length > 0 && (
                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg mt-4">
                  <span className="text-sm text-blue-800">
                    {selectedFeatures.length} feature{selectedFeatures.length !== 1 ? 's' : ''} selected
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedFeatures([])}
                    >
                      Clear Selection
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsBulkModalOpen(true)}
                    >
                      <Settings2 className="h-4 w-4 mr-2" />
                      Bulk Actions
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* View Mode Tabs - only show if we have features */}
        {hasFeatures && (
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="mb-6">
            <TabsList>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                List View
              </TabsTrigger>
              <TabsTrigger value="hierarchy" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Hierarchy
              </TabsTrigger>
              <TabsTrigger value="draggable" className="flex items-center gap-2">
                <Shuffle className="h-4 w-4" />
                Reorder
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4 mt-6">
              {filteredFeatures.length === 0 ? (
                <div className="text-center py-12">
                  <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No features match your filters</h3>
                  <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Select All */}
                  <div className="flex items-center gap-2 p-2">
                    <Checkbox
                      checked={selectedFeatures.length === filteredFeatures.length}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm text-gray-600">Select all features</span>
                  </div>

                  {filteredFeatures.map(feature => (
                    <div key={feature.id} className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedFeatures.includes(feature.id)}
                        onCheckedChange={(checked) => handleSelectFeature(feature.id, checked as boolean)}
                        className="mt-6"
                      />
                      <div className="flex-1">
                        <FeatureCard
                          feature={feature}
                          onEdit={(feature) => setEditingFeature(feature)}
                          onDelete={handleDeleteFeature}
                          onAddChild={handleAddChildClick}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="hierarchy" className="mt-6">
              {filteredFeatures.length === 0 ? (
                <div className="text-center py-12">
                  <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No features to display</h3>
                  <p className="text-gray-600 mb-6">Add features to see them in hierarchy view.</p>
                </div>
              ) : (
                <EnhancedFeatureHierarchy
                  features={filteredFeatures}
                  onFeatureSelect={(feature) => console.log('Selected:', feature)}
                  onAddChild={handleAddChildClick}
                  onEdit={(feature) => setEditingFeature(feature)}
                  onDelete={handleDeleteFeature}
                  onReorder={handleReorderFeatures}
                />
              )}
            </TabsContent>

            <TabsContent value="draggable" className="mt-6">
              {filteredFeatures.length === 0 ? (
                <div className="text-center py-12">
                  <Shuffle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No features to reorder</h3>
                  <p className="text-gray-600 mb-6">Add features to reorder them by dragging and dropping.</p>
                </div>
              ) : (
                <DraggableFeatureList
                  features={filteredFeatures}
                  onReorder={handleReorderFeatures}
                  onEdit={(feature) => setEditingFeature(feature)}
                  onDelete={handleDeleteFeature}
                  onAddChild={handleAddChildClick}
                />
              )}
            </TabsContent>
          </Tabs>
        )}

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

        <AddChildFeatureModal
          isOpen={!!parentFeatureForChild}
          parentFeature={parentFeatureForChild}
          onClose={() => setParentFeatureForChild(null)}
          onSave={handleAddChildFeature}
        />

        <BulkFeatureOperations
          isOpen={isBulkModalOpen}
          selectedFeatures={getSelectedFeatureObjects()}
          onClose={() => setIsBulkModalOpen(false)}
          onBulkUpdate={handleBulkUpdate}
          onBulkDelete={handleBulkDelete}
        />

        <AIFeatureGenerationModal
          isOpen={isAIGenerationModalOpen}
          onClose={() => setIsAIGenerationModalOpen(false)}
          onComplete={handleAIGenerationComplete}
          projectId={id || ''}
        />
      </div>
    </AppLayout>
  );
};

export default FeaturesPage;
