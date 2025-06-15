
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus } from 'lucide-react';
import type { UserStory, CreateUserStoryData } from '@/hooks/useUserStories';

interface AddEditUserStoryModalProps {
  isOpen: boolean;
  story?: UserStory | null;
  featureId: string;
  onClose: () => void;
  onSave: (data: CreateUserStoryData) => void;
}

const AddEditUserStoryModal = ({ isOpen, story, featureId, onClose, onSave }: AddEditUserStoryModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('draft');
  const [storyPoints, setStoryPoints] = useState<number | undefined>(undefined);
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<string[]>(['']);

  useEffect(() => {
    if (story) {
      setTitle(story.title);
      setDescription(story.description || '');
      setPriority(story.priority || 'medium');
      setStatus(story.status || 'draft');
      setStoryPoints(story.story_points || undefined);
      setAcceptanceCriteria(story.acceptance_criteria || ['']);
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('draft');
      setStoryPoints(undefined);
      setAcceptanceCriteria(['']);
    }
  }, [story, isOpen]);

  const handleAddCriteria = () => {
    setAcceptanceCriteria([...acceptanceCriteria, '']);
  };

  const handleRemoveCriteria = (index: number) => {
    setAcceptanceCriteria(acceptanceCriteria.filter((_, i) => i !== index));
  };

  const handleCriteriaChange = (index: number, value: string) => {
    const newCriteria = [...acceptanceCriteria];
    newCriteria[index] = value;
    setAcceptanceCriteria(newCriteria);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const filteredCriteria = acceptanceCriteria.filter(criteria => criteria.trim() !== '');
    
    const data: CreateUserStoryData = {
      title,
      description: description || undefined,
      priority,
      status,
      story_points: storyPoints,
      acceptance_criteria: filteredCriteria.length > 0 ? filteredCriteria : undefined,
    };

    onSave(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {story ? 'Edit User Story' : 'Add User Story'}
          </DialogTitle>
          <DialogDescription>
            {story ? 'Update the user story details below.' : 'Create a new user story for this feature.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="As a user, I want to..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the user story..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
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

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="storyPoints">Story Points</Label>
            <Input
              id="storyPoints"
              type="number"
              min="1"
              max="100"
              value={storyPoints || ''}
              onChange={(e) => setStoryPoints(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="1, 2, 3, 5, 8, 13..."
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Acceptance Criteria</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCriteria}
                className="h-8"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {acceptanceCriteria.map((criteria, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={criteria}
                    onChange={(e) => handleCriteriaChange(index, e.target.value)}
                    placeholder={`Acceptance criteria ${index + 1}`}
                    className="flex-1"
                  />
                  {acceptanceCriteria.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveCriteria(index)}
                      className="h-10 w-10 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              {story ? 'Update Story' : 'Create Story'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditUserStoryModal;
