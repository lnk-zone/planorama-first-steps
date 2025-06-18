
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  Users, 
  GitBranch,
  MoreHorizontal
} from 'lucide-react';
import { useUserStories } from '@/hooks/useUserStories';
import { useFeatures } from '@/hooks/useFeatures';
import { toast } from '@/hooks/use-toast';
import UserStoryCard from '@/components/UserStoryCard';
import AddEditUserStoryModal from '@/components/AddEditUserStoryModal';
import StoryDependenciesModal from '@/components/StoryDependenciesModal';
import BulkStoryOperationsModal from '@/components/BulkStoryOperationsModal';
import StoryTemplateModal from '@/components/StoryTemplateModal';
import type { UserStory } from '@/hooks/useUserStories';

const UserStoriesPage = () => {
  const { id: projectId, featureId } = useParams();
  const { features } = useFeatures(projectId || '');
  const { userStories, loading, addUserStory, updateUserStory, deleteUserStory, refetch } = useUserStories(featureId || '');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<UserStory | null>(null);
  const [dependenciesStoryId, setDependenciesStoryId] = useState<string | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedStories, setSelectedStories] = useState<string[]>([]);

  const currentFeature = features.find(f => f.id === featureId);

  const handleSelectStory = (storyId: string, selected: boolean) => {
    setSelectedStories(prev => 
      selected 
        ? [...prev, storyId]
        : prev.filter(id => id !== storyId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedStories(checked ? userStories.map(s => s.id) : []);
  };

  const getSelectedStoryObjects = () => {
    return userStories.filter(story => selectedStories.includes(story.id));
  };

  const handleAddUserStory = async (storyData: any) => {
    try {
      await addUserStory(storyData);
      setIsAddModalOpen(false);
      toast({
        title: "User story created",
        description: "New user story has been added successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user story. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditUserStory = async (storyData: any) => {
    if (!editingStory) return;
    
    try {
      await updateUserStory({ storyId: editingStory.id, updates: storyData });
      setEditingStory(null);
      toast({
        title: "User story updated",
        description: "User story has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user story. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUserStory = async (storyId: string) => {
    if (!confirm('Are you sure you want to delete this user story? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteUserStory(storyId);
      setSelectedStories(prev => prev.filter(id => id !== storyId));
      toast({
        title: "User story deleted",
        description: "User story has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user story. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleApplyTemplate = async (storyData: any) => {
    try {
      await addUserStory(storyData);
      toast({
        title: "Story created from template",
        description: "New user story has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create story from template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkOperationComplete = () => {
    setSelectedStories([]);
    refetch();
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="space-y-4">
              <div className="h-48 bg-gray-200 rounded-lg"></div>
              <div className="h-48 bg-gray-200 rounded-lg"></div>
            </div>
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
            <Link to={`/projects/${projectId}/features`} className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Features
            </Link>
          </div>
          
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">User Stories</h1>
              <p className="text-gray-600">
                {currentFeature ? `Manage user stories for "${currentFeature.title}"` : 'Manage user stories for this feature'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsTemplateModalOpen(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Use Template
              </Button>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add User Story
              </Button>
            </div>
          </div>

          {/* Bulk Operations Bar */}
          {selectedStories.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
              <span className="text-sm text-blue-800">
                {selectedStories.length} {selectedStories.length === 1 ? 'story' : 'stories'} selected
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedStories([])}
                >
                  Clear Selection
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsBulkModalOpen(true)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Bulk Actions
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* User Stories List */}
        {userStories.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No user stories yet</h3>
                <p className="text-gray-600 mb-6">
                  Start by adding your first user story to define what users want to achieve with this feature.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => setIsTemplateModalOpen(true)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                  <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First User Story
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Select All */}
            <div className="flex items-center gap-2 p-2">
              <Checkbox
                checked={selectedStories.length === userStories.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-gray-600">Select all stories</span>
            </div>

            {userStories.map(story => (
              <div key={story.id} className="flex items-start gap-3">
                <Checkbox
                  checked={selectedStories.includes(story.id)}
                  onCheckedChange={(checked) => handleSelectStory(story.id, checked as boolean)}
                  className="mt-6"
                />
                <div className="flex-1">
                  <UserStoryCard
                    story={story}
                    onEdit={setEditingStory}
                    onDelete={handleDeleteUserStory}
                  />
                  <div className="flex gap-2 mt-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDependenciesStoryId(story.id)}
                      className="h-8 text-xs"
                    >
                      <GitBranch className="h-3 w-3 mr-1" />
                      Dependencies
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modals */}
        <AddEditUserStoryModal
          isOpen={isAddModalOpen}
          featureId={featureId || ''}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddUserStory}
        />

        <AddEditUserStoryModal
          isOpen={!!editingStory}
          story={editingStory}
          featureId={featureId || ''}
          onClose={() => setEditingStory(null)}
          onSave={handleEditUserStory}
        />

        <StoryDependenciesModal
          isOpen={!!dependenciesStoryId}
          storyId={dependenciesStoryId || ''}
          featureId={featureId || ''}
          onClose={() => setDependenciesStoryId(null)}
        />

        <BulkStoryOperationsModal
          isOpen={isBulkModalOpen}
          selectedStories={getSelectedStoryObjects()}
          projectId={projectId || ''}
          onClose={() => setIsBulkModalOpen(false)}
          onOperationComplete={handleBulkOperationComplete}
        />

        <StoryTemplateModal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          onApplyTemplate={handleApplyTemplate}
        />
      </div>
    </AppLayout>
  );
};

export default UserStoriesPage;
