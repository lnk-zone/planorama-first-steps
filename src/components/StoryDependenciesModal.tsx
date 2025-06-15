
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, ArrowRight } from 'lucide-react';
import { useStoryDependencies } from '@/hooks/useStoryDependencies';
import { useUserStories } from '@/hooks/useUserStories';
import { toast } from '@/hooks/use-toast';

interface StoryDependenciesModalProps {
  isOpen: boolean;
  storyId: string;
  featureId: string;
  onClose: () => void;
}

const StoryDependenciesModal = ({ isOpen, storyId, featureId, onClose }: StoryDependenciesModalProps) => {
  const { dependencies, dependents, loading, addDependency, removeDependency } = useStoryDependencies(storyId);
  const { userStories } = useUserStories(featureId);
  const [selectedStoryId, setSelectedStoryId] = useState('');
  const [dependencyType, setDependencyType] = useState('blocks');

  const availableStories = userStories.filter(story => 
    story.id !== storyId && 
    !dependencies.some(dep => dep.depends_on_story_id === story.id)
  );

  const handleAddDependency = async () => {
    if (!selectedStoryId) return;

    try {
      await addDependency(selectedStoryId, dependencyType);
      setSelectedStoryId('');
      toast({
        title: "Dependency added",
        description: "Story dependency has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add dependency. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveDependency = async (dependencyId: string) => {
    try {
      await removeDependency(dependencyId);
      toast({
        title: "Dependency removed",
        description: "Story dependency has been removed successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove dependency. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStoryTitle = (storyId: string) => {
    const story = userStories.find(s => s.id === storyId);
    return story?.title || 'Unknown Story';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Story Dependencies</DialogTitle>
          <DialogDescription>
            Manage dependencies between user stories to track blocking relationships.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Dependency */}
          <div className="space-y-4">
            <h4 className="font-medium">Add Dependency</h4>
            <div className="flex gap-2">
              <Select value={selectedStoryId} onValueChange={setSelectedStoryId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select story this depends on" />
                </SelectTrigger>
                <SelectContent>
                  {availableStories.map(story => (
                    <SelectItem key={story.id} value={story.id}>
                      {story.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={dependencyType} onValueChange={setDependencyType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blocks">Blocks</SelectItem>
                  <SelectItem value="depends_on">Depends On</SelectItem>
                  <SelectItem value="related">Related</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handleAddDependency} 
                disabled={!selectedStoryId}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Current Dependencies */}
          {dependencies.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">This story depends on:</h4>
              <div className="space-y-2">
                {dependencies.map(dep => (
                  <div key={dep.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{getStoryTitle(dep.depends_on_story_id)}</span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <Badge variant="outline" className="text-xs">
                        {dep.dependency_type}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDependency(dep.id)}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dependent Stories */}
          {dependents.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Stories that depend on this:</h4>
              <div className="space-y-2">
                {dependents.map(dep => (
                  <div key={dep.id} className="flex items-center gap-2 p-3 border rounded-lg bg-gray-50">
                    <span className="text-sm">{getStoryTitle(dep.story_id)}</span>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <Badge variant="outline" className="text-xs">
                      {dep.dependency_type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dependencies.length === 0 && dependents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No dependencies configured for this story.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StoryDependenciesModal;
