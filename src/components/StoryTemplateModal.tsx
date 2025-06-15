
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Template, Plus } from 'lucide-react';
import { useStoryTemplates } from '@/hooks/useStoryTemplates';
import { toast } from '@/hooks/use-toast';
import type { CreateUserStoryData } from '@/hooks/useUserStories';

interface StoryTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (storyData: CreateUserStoryData) => void;
}

const StoryTemplateModal = ({ isOpen, onClose, onApplyTemplate }: StoryTemplateModalProps) => {
  const { templates, loading } = useStoryTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = Array.from(new Set(templates.map(t => t.category).filter(Boolean))) as string[];
  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const handleApplyTemplate = () => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;

    const storyData: CreateUserStoryData = {
      title: template.title_template,
      description: template.description_template || '',
      acceptance_criteria: template.acceptance_criteria_template || [],
      priority: 'medium',
      status: 'draft'
    };

    onApplyTemplate(storyData);
    onClose();
    toast({
      title: "Template applied",
      description: "Story has been created from template.",
    });
  };

  const resetSelection = () => {
    setSelectedTemplate('');
    setSelectedCategory('all');
  };

  const handleClose = () => {
    resetSelection();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Template className="h-5 w-5" />
            Story Templates
          </DialogTitle>
          <DialogDescription>
            Choose a template to create a new user story with predefined content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Category Filter */}
          <div className="flex items-center gap-4">
            <Label>Category:</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Templates List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedTemplate === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                  {template.category && (
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                  )}
                </div>
                
                {template.description && (
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                )}

                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-gray-500">Title:</span>
                    <p className="text-sm text-gray-800">{template.title_template}</p>
                  </div>
                  
                  {template.description_template && (
                    <div>
                      <span className="text-xs font-medium text-gray-500">Description:</span>
                      <p className="text-sm text-gray-800">{template.description_template}</p>
                    </div>
                  )}
                  
                  {template.acceptance_criteria_template && template.acceptance_criteria_template.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-gray-500">Acceptance Criteria:</span>
                      <ul className="text-sm text-gray-800 list-disc list-inside mt-1">
                        {template.acceptance_criteria_template.slice(0, 3).map((criteria, index) => (
                          <li key={index}>{criteria}</li>
                        ))}
                        {template.acceptance_criteria_template.length > 3 && (
                          <li className="text-gray-500">
                            +{template.acceptance_criteria_template.length - 3} more...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Template className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No templates found in this category.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleApplyTemplate}
            disabled={!selectedTemplate}
          >
            <Plus className="h-4 w-4 mr-2" />
            Use Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StoryTemplateModal;
