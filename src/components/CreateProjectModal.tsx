
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus, FileText, Layers } from 'lucide-react';
import TemplateSelectionModal from './TemplateSelectionModal';
import CreateTemplateModal from './CreateTemplateModal';
import { ProjectTemplate } from '@/hooks/useTemplates';

export interface CreateProjectData {
  title: string;
  description?: string;
  project_type?: string;
  template?: ProjectTemplate;
}

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: CreateProjectData) => void;
}

const CreateProjectModal = ({ isOpen, onClose, onSubmit }: CreateProjectModalProps) => {
  const [step, setStep] = useState<'basic' | 'template' | 'confirm'>('basic');
  const [projectData, setProjectData] = useState<CreateProjectData>({
    title: '',
    description: '',
    project_type: 'other'
  });
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isCreateTemplateModalOpen, setIsCreateTemplateModalOpen] = useState(false);

  const projectTypes = [
    { value: 'web_app', label: 'Web Application' },
    { value: 'mobile_app', label: 'Mobile App' },
    { value: 'saas', label: 'SaaS Platform' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'cms', label: 'CMS' },
    { value: 'api', label: 'API/Backend' },
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'portfolio', label: 'Portfolio/Blog' },
    { value: 'other', label: 'Other' }
  ];

  const handleBasicInfoNext = () => {
    if (!projectData.title.trim()) return;
    setStep('template');
  };

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setProjectData(prev => ({ ...prev, template }));
    setIsTemplateModalOpen(false);
    setStep('confirm');
  };

  const handleSkipTemplate = () => {
    setProjectData(prev => ({ ...prev, template: undefined }));
    setStep('confirm');
  };

  const handleSubmit = () => {
    onSubmit(projectData);
    resetForm();
  };

  const resetForm = () => {
    setProjectData({
      title: '',
      description: '',
      project_type: 'other'
    });
    setStep('basic');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const renderBasicInfo = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Project Name *</Label>
        <Input
          id="title"
          value={projectData.title}
          onChange={(e) => setProjectData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="My Awesome Project"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={projectData.description || ''}
          onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe your project..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Project Type</Label>
        <Select
          value={projectData.project_type}
          onValueChange={(value) => setProjectData(prev => ({ ...prev, project_type: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {projectTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          onClick={handleBasicInfoNext}
          disabled={!projectData.title.trim()}
        >
          Continue
        </Button>
      </div>
    </div>
  );

  const renderTemplateSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose a Starting Point</h3>
        <p className="text-gray-600">
          Select a template to get started quickly, or create from scratch.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
             onClick={() => setIsTemplateModalOpen(true)}>
          <div className="text-center">
            <Layers className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h4 className="font-semibold text-gray-900 mb-2">Use Template</h4>
            <p className="text-sm text-gray-600 mb-4">
              Start with a pre-built template that includes features and best practices.
            </p>
            <Button variant="outline" className="w-full">
              Browse Templates
            </Button>
          </div>
        </div>

        <div className="border rounded-lg p-6 hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer"
             onClick={handleSkipTemplate}>
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h4 className="font-semibold text-gray-900 mb-2">Start from Scratch</h4>
            <p className="text-sm text-gray-600 mb-4">
              Create a blank project and build your features from the ground up.
            </p>
            <Button variant="outline" className="w-full">
              Start Fresh
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      <div className="text-center">
        <p className="text-sm text-gray-600 mb-4">
          Want to save your own project as a template for future use?
        </p>
        <Button 
          variant="ghost" 
          onClick={() => setIsCreateTemplateModalOpen(true)}
          className="text-blue-600 hover:text-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Custom Template
        </Button>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setStep('basic')}>
          Back
        </Button>
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
      </div>
    </div>
  );

  const renderConfirmation = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Project Details</h3>
        
        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <div>
            <Label className="text-sm font-medium text-gray-700">Project Name</Label>
            <p className="text-gray-900">{projectData.title}</p>
          </div>
          
          {projectData.description && (
            <div>
              <Label className="text-sm font-medium text-gray-700">Description</Label>
              <p className="text-gray-900">{projectData.description}</p>
            </div>
          )}
          
          <div>
            <Label className="text-sm font-medium text-gray-700">Project Type</Label>
            <p className="text-gray-900">
              {projectTypes.find(t => t.value === projectData.project_type)?.label}
            </p>
          </div>
          
          {projectData.template && (
            <div>
              <Label className="text-sm font-medium text-gray-700">Template</Label>
              <p className="text-gray-900">{projectData.template.name}</p>
              <p className="text-sm text-gray-600">{projectData.template.description}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setStep('template')}>
          Back
        </Button>
        <div className="space-x-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Create Project
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {step === 'basic' && 'Create New Project'}
              {step === 'template' && 'Choose Template'}
              {step === 'confirm' && 'Confirm Project'}
            </DialogTitle>
            <DialogDescription>
              {step === 'basic' && 'Enter the basic information for your new project.'}
              {step === 'template' && 'Select a template or start from scratch.'}
              {step === 'confirm' && 'Review your project settings before creating.'}
            </DialogDescription>
          </DialogHeader>

          {step === 'basic' && renderBasicInfo()}
          {step === 'template' && renderTemplateSelection()}
          {step === 'confirm' && renderConfirmation()}
        </DialogContent>
      </Dialog>

      <TemplateSelectionModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleTemplateSelect}
      />

      <CreateTemplateModal
        isOpen={isCreateTemplateModalOpen}
        onClose={() => setIsCreateTemplateModalOpen(false)}
      />
    </>
  );
};

export default CreateProjectModal;
