import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import TemplateSelectionModal from './TemplateSelectionModal';
import { ProjectTemplate, TemplateFeature, useTemplates } from '@/hooks/useTemplates';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CreateProjectData {
  title: string;
  description: string;
  status: string;
  project_type: string;
}

const CreateProjectModal = ({ isOpen, onClose, onSuccess }: CreateProjectModalProps) => {
  const { user } = useAuth();
  const { applyTemplate } = useTemplates();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [formData, setFormData] = useState<CreateProjectData>({
    title: '',
    description: '',
    status: 'planning',
    project_type: 'web-app',
  });
  const [errors, setErrors] = useState<{ title?: string }>({});

  const projectTypes = [
    { value: 'web-app', label: 'Web App' },
    { value: 'mobile-app', label: 'Mobile App' },
    { value: 'saas', label: 'SaaS Platform' },
    { value: 'desktop-app', label: 'Desktop App' },
    { value: 'api', label: 'API/Backend' },
    { value: 'other', label: 'Other' },
  ];

  const validateForm = () => {
    const newErrors: { title?: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Project title is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreateProjectData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateModal(false);
    if (template.id !== 'scratch') {
      setFormData(prev => ({
        ...prev,
        project_type: template.category === 'web_app' ? 'web-app' : 
                     template.category === 'mobile_app' ? 'mobile-app' :
                     template.category === 'ecommerce' ? 'web-app' :
                     template.category === 'cms' ? 'web-app' :
                     template.category === 'saas' ? 'saas' : 'other'
      }));
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) return;

    setLoading(true);
    
    try {
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          status: formData.status,
          project_type: formData.project_type,
        })
        .select()
        .single();

      if (error) throw error;

      // Apply template features if a template was selected
      if (selectedTemplate && selectedTemplate.id !== 'scratch') {
        await applyTemplate(selectedTemplate.id, project.id);
      }

      toast({
        title: "Project created successfully!",
        description: `${formData.title} has been added to your projects.`,
      });

      handleClose();
      onSuccess();
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error creating project",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        title: '',
        description: '',
        status: 'planning',
        project_type: 'web-app',
      });
      setErrors({});
      setStep(1);
      setSelectedTemplate(null);
      onClose();
    }
  };

  const handleNext = () => {
    if (step === 1) {
      setShowTemplateModal(true);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedTemplate(null);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {step === 1 ? 'Create New Project' : 'Project Details'}
            </DialogTitle>
            <DialogDescription>
              {step === 1 
                ? 'Start planning your next amazing app. Choose a template or start from scratch.'
                : 'Complete your project information and settings.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {step === 1 ? (
            <div className="py-6">
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-600">
                  Would you like to start with a template or create a project from scratch?
                </p>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full h-auto p-4 text-left"
                    onClick={handleNext}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="font-medium">Choose from Templates</div>
                        <div className="text-sm text-gray-500">Get started quickly with pre-built features</div>
                      </div>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full h-auto p-4 text-left"
                    onClick={() => handleTemplateSelect({
                      id: 'scratch',
                      name: 'Start from Scratch',
                      description: 'Create a project without any pre-defined features',
                      category: 'custom',
                      features: [],
                      is_public: true,
                      created_by: null,
                      created_at: null,
                      updated_at: null
                    })}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <div className="font-medium">Start from Scratch</div>
                        <div className="text-sm text-gray-500">Build your project from the ground up</div>
                      </div>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                {selectedTemplate && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Using Template: {selectedTemplate.name}
                        </p>
                        <p className="text-xs text-blue-700">
                          {Array.isArray(selectedTemplate.features) ? (selectedTemplate.features as unknown as TemplateFeature[]).length : 0} features will be added
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowTemplateModal(true)}
                        className="text-blue-700 hover:text-blue-900"
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter project title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">{errors.title}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project_type">Project Type</Label>
                  <Select
                    value={formData.project_type}
                    onValueChange={(value) => handleInputChange('project_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this project is about (optional)"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Initial Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <TemplateSelectionModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSelectTemplate={handleTemplateSelect}
      />
    </>
  );
};

export default CreateProjectModal;
