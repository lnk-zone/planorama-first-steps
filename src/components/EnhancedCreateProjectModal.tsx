
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField } from '@/components/ui/enhanced-form';
import { FolderPlus, Loader2 } from 'lucide-react';
import { useFormValidation } from '@/hooks/useFormValidation';
import { toast } from '@/hooks/use-toast';

export interface EnhancedCreateProjectData {
  title: string;
  description: string;
  project_type: string;
}

interface EnhancedCreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EnhancedCreateProjectData) => Promise<string>;
}

const EnhancedCreateProjectModal: React.FC<EnhancedCreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<EnhancedCreateProjectData>({
    title: '',
    description: '',
    project_type: ''
  });

  const [loading, setLoading] = useState(false);

  const validationRules = {
    title: { required: true, minLength: { value: 2, message: 'Title must be at least 2 characters' }, maxLength: { value: 100, message: 'Title must be less than 100 characters' } },
    description: { required: true, minLength: { value: 10, message: 'Description must be at least 10 characters' }, maxLength: { value: 500, message: 'Description must be less than 500 characters' } },
    project_type: { required: true }
  };

  const { errors, validateField, validateForm, clearAllErrors } = useFormValidation({ rules: validationRules });

  const handleInputChange = (field: keyof EnhancedCreateProjectData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      validateField(field, value);
    }
  };

  const handleSubmit = async () => {
    const { isValid } = validateForm(formData);
    
    if (!isValid) {
      return;
    }

    try {
      setLoading(true);
      await onSubmit(formData);
      resetForm();
      onClose();
      
      toast({
        title: "Project created",
        description: "Your project has been created successfully.",
      });
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      project_type: ''
    });
    clearAllErrors();
  };

  const handleClose = () => {
    if (loading) return;
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            Create New Project
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          {/* Basic Information */}
          <div className="space-y-4">
            <FormField
              label="Project Title"
              required
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter project title"
              error={errors.title}
              disabled={loading}
            />

            <div className="space-y-2">
              <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
              <Textarea
                id="description"
                placeholder="Describe what your project will do and its main purpose"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={errors.description ? 'border-red-500' : ''}
                disabled={loading}
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_type">Project Type <span className="text-red-500">*</span></Label>
              <Select
                value={formData.project_type}
                onValueChange={(value) => handleInputChange('project_type', value)}
                disabled={loading}
              >
                <SelectTrigger className={errors.project_type ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web_app">Web Application</SelectItem>
                  <SelectItem value="mobile_app">Mobile App</SelectItem>
                  <SelectItem value="saas">SaaS Platform</SelectItem>
                  <SelectItem value="ecommerce">E-commerce</SelectItem>
                  <SelectItem value="cms">Content Management System</SelectItem>
                  <SelectItem value="api">API/Backend Service</SelectItem>
                  <SelectItem value="dashboard">Dashboard/Analytics</SelectItem>
                  <SelectItem value="portfolio">Portfolio/Blog</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.project_type && (
                <p className="text-sm text-red-500">{errors.project_type}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="sm:order-1"
            >
              Cancel
            </Button>
            
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="sm:order-2 flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Create Project
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedCreateProjectModal;
