
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Save } from 'lucide-react';
import { useEnhancedTemplates, type CreateTemplateData } from '@/hooks/useEnhancedTemplates';
import { toast } from '@/hooks/use-toast';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectData?: {
    name: string;
    description?: string;
    features: any[];
  };
}

const CreateTemplateModal = ({ isOpen, onClose, projectData }: CreateTemplateModalProps) => {
  const { categories, createTemplate } = useEnhancedTemplates();
  const [formData, setFormData] = useState<CreateTemplateData>({
    name: '',
    description: '',
    category: '',
    features: [],
    tags: [],
    difficulty_level: 'beginner',
    estimated_hours: undefined,
    is_public: false
  });
  const [newTag, setNewTag] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when projectData changes
  useEffect(() => {
    if (projectData) {
      console.log('Initializing form with project data:', projectData);
      console.log('Project features count:', projectData.features?.length || 0);
      
      setFormData({
        name: projectData.name || '',
        description: projectData.description || '',
        category: '',
        features: projectData.features || [],
        tags: [],
        difficulty_level: 'beginner',
        estimated_hours: undefined,
        is_public: false
      });
    }
  }, [projectData]);

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Submitting template with data:', formData);
    console.log('Features being submitted:', formData.features);
    console.log('Number of features:', Array.isArray(formData.features) ? formData.features.length : 'not an array');
    
    if (!formData.name.trim() || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createTemplate(formData);
      console.log('Template created successfully:', result);
      
      toast({
        title: "Template Created",
        description: "Your template has been created successfully.",
      });
      onClose();
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: "Error",
        description: "Failed to create template. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: projectData?.name || '',
      description: projectData?.description || '',
      category: '',
      features: projectData?.features || [],
      tags: [],
      difficulty_level: 'beginner',
      estimated_hours: undefined,
      is_public: false
    });
    setNewTag('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Create Project Template
          </DialogTitle>
          <DialogDescription>
            Save this project as a reusable template for future use.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter template name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this template is for..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select
                  value={formData.difficulty_level || 'beginner'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty_level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hours">Estimated Hours</Label>
                <Input
                  id="hours"
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.estimated_hours || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    estimated_hours: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  placeholder="Hours to complete"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                />
                <Button type="button" onClick={handleAddTag} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags?.map(tag => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer">
                    {tag}
                    <X 
                      className="h-3 w-3 ml-1" 
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Public Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label>Make Public</Label>
                <p className="text-sm text-gray-600">
                  Allow other users to discover and use this template
                </p>
              </div>
              <Switch
                checked={formData.is_public || false}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
              />
            </div>
          </div>

          {/* Features Preview */}
          {formData.features && Array.isArray(formData.features) && formData.features.length > 0 && (
            <div className="space-y-2">
              <Label>Included Features ({formData.features.length})</Label>
              <div className="max-h-32 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                {formData.features.map((feature: any, index: number) => (
                  <div key={index} className="text-sm text-gray-700 mb-1">
                    • {feature.title || `Feature ${index + 1}`}
                    {feature.description && (
                      <span className="text-gray-500 ml-2">- {feature.description}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="space-y-2 p-3 bg-gray-100 rounded text-xs">
              <div>Debug Info:</div>
              <div>Features Array Length: {Array.isArray(formData.features) ? formData.features.length : 'not array'}</div>
              <div>Features Data: {JSON.stringify(formData.features, null, 2)}</div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Template'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTemplateModal;
