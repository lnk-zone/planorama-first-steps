
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFeatures } from '@/hooks/useFeatures';
import AppLayout from '@/components/AppLayout';
import FeatureCard from '@/components/FeatureCard';
import AddEditFeatureModal from '@/components/AddEditFeatureModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter,
  Layers
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const FeaturesPage = () => {
  const { id } = useParams<{ id: string }>();
  const { features, loading, addFeature, updateFeature, deleteFeature } = useFeatures(id || '');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredFeatures = features.filter(feature => {
    const matchesSearch = feature.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         feature.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || feature.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || feature.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Features</h1>
              <p className="text-gray-600">Manage your project features and their requirements</p>
            </div>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Feature
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mb-6">
            <Badge variant="outline" className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              Total: {features.length}
            </Badge>
            <Badge variant="outline">
              Planned: {features.filter(f => f.status === 'planned').length}
            </Badge>
            <Badge variant="outline">
              In Progress: {features.filter(f => f.status === 'in-progress').length}
            </Badge>
            <Badge variant="outline">
              Completed: {features.filter(f => f.status === 'completed').length}
            </Badge>
          </div>
        </div>

        {/* Features List */}
        {filteredFeatures.length === 0 ? (
          <div className="text-center py-12">
            <Layers className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {features.length === 0 ? "No features yet" : "No features match your filters"}
            </h3>
            <p className="text-gray-600 mb-6">
              {features.length === 0 
                ? "Start by adding your first feature to define what you want to build."
                : "Try adjusting your search or filter criteria."
              }
            </p>
            {features.length === 0 && (
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Feature
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFeatures.map(feature => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                onEdit={(feature) => setEditingFeature(feature)}
                onDelete={handleDeleteFeature}
                onAddChild={() => {
                  // TODO: Implement child feature creation
                  toast({
                    title: "Coming soon",
                    description: "Child features will be available soon.",
                  });
                }}
              />
            ))}
          </div>
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
      </div>
    </AppLayout>
  );
};

export default FeaturesPage;
