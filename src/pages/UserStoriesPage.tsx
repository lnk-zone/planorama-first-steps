
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Plus, FileText } from 'lucide-react';
import { useUserStories } from '@/hooks/useUserStories';
import { useFeatures } from '@/hooks/useFeatures';
import { toast } from '@/hooks/use-toast';
import UserStoryCard from '@/components/UserStoryCard';
import AddEditUserStoryModal from '@/components/AddEditUserStoryModal';
import type { UserStory } from '@/hooks/useUserStories';

const UserStoriesPage = () => {
  const { id: projectId, featureId } = useParams();
  const { features } = useFeatures(projectId || '');
  const { userStories, loading, addUserStory, updateUserStory, deleteUserStory } = useUserStories(featureId || '');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<UserStory | null>(null);

  const currentFeature = features.find(f => f.id === featureId);

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
      await updateUserStory(editingStory.id, storyData);
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
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add User Story
            </Button>
          </div>
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
                <Button onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First User Story
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {userStories.map(story => (
              <UserStoryCard
                key={story.id}
                story={story}
                onEdit={setEditingStory}
                onDelete={handleDeleteUserStory}
              />
            ))}
          </div>
        )}

        {/* Add/Edit Modals */}
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
      </div>
    </AppLayout>
  );
};

export default UserStoriesPage;
