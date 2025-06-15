
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Settings, Trash2 } from 'lucide-react';
import { useBulkStoryOperations } from '@/hooks/useBulkStoryOperations';
import { useFeatures } from '@/hooks/useFeatures';
import { toast } from '@/hooks/use-toast';
import type { UserStory } from '@/hooks/useUserStories';

interface BulkStoryOperationsModalProps {
  isOpen: boolean;
  selectedStories: UserStory[];
  projectId: string;
  onClose: () => void;
  onOperationComplete: () => void;
}

const BulkStoryOperationsModal = ({ 
  isOpen, 
  selectedStories, 
  projectId, 
  onClose, 
  onOperationComplete 
}: BulkStoryOperationsModalProps) => {
  const { loading, bulkUpdateStatus, bulkUpdatePriority, bulkDelete, moveStoriesToFeature } = useBulkStoryOperations();
  const { features } = useFeatures(projectId);
  const [operation, setOperation] = useState<string>('');
  const [newStatus, setNewStatus] = useState<string>('');
  const [newPriority, setNewPriority] = useState<string>('');
  const [targetFeatureId, setTargetFeatureId] = useState<string>('');

  const handleBulkOperation = async () => {
    const storyIds = selectedStories.map(s => s.id);
    
    try {
      let result;
      
      switch (operation) {
        case 'update_status':
          result = await bulkUpdateStatus(storyIds, newStatus);
          break;
        case 'update_priority':
          result = await bulkUpdatePriority(storyIds, newPriority);
          break;
        case 'move_feature':
          result = await moveStoriesToFeature(storyIds, targetFeatureId);
          break;
        case 'delete':
          if (!confirm(`Are you sure you want to delete ${selectedStories.length} user stories? This action cannot be undone.`)) {
            return;
          }
          result = await bulkDelete(storyIds);
          break;
        default:
          return;
      }

      if (result.success) {
        toast({
          title: "Bulk operation completed",
          description: `Successfully updated ${result.updatedCount} user stories.`,
        });
        onOperationComplete();
        onClose();
      } else {
        toast({
          title: "Operation failed",
          description: result.errors.join(', '),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform bulk operation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setOperation('');
    setNewStatus('');
    setNewPriority('');
    setTargetFeatureId('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const isFormValid = () => {
    switch (operation) {
      case 'update_status':
        return newStatus !== '';
      case 'update_priority':
        return newPriority !== '';
      case 'move_feature':
        return targetFeatureId !== '';
      case 'delete':
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Bulk Operations
          </DialogTitle>
          <DialogDescription>
            Perform actions on {selectedStories.length} selected user stories.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selected Stories Preview */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Selected Stories:</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {selectedStories.map(story => (
                <div key={story.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <span className="truncate flex-1">{story.title}</span>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-xs">
                      {story.priority || 'medium'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {story.status || 'draft'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operation Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Operation:</label>
            <Select value={operation} onValueChange={setOperation}>
              <SelectTrigger>
                <SelectValue placeholder="Choose bulk operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="update_status">Update Status</SelectItem>
                <SelectItem value="update_priority">Update Priority</SelectItem>
                <SelectItem value="move_feature">Move to Feature</SelectItem>
                <SelectItem value="delete">Delete Stories</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Operation-specific fields */}
          {operation === 'update_status' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">New Status:</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {operation === 'update_priority' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">New Priority:</label>
              <Select value={newPriority} onValueChange={setNewPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {operation === 'move_feature' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Feature:</label>
              <Select value={targetFeatureId} onValueChange={setTargetFeatureId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select feature" />
                </SelectTrigger>
                <SelectContent>
                  {features.map(feature => (
                    <SelectItem key={feature.id} value={feature.id}>
                      {feature.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {operation === 'delete' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <Trash2 className="h-4 w-4" />
                <span className="text-sm font-medium">Warning</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                This will permanently delete {selectedStories.length} user stories. This action cannot be undone.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleBulkOperation}
            disabled={!isFormValid() || loading}
            variant={operation === 'delete' ? 'destructive' : 'default'}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {operation === 'delete' ? 'Delete Stories' : 'Apply Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkStoryOperationsModal;
