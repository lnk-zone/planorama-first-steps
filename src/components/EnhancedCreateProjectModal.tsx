
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField } from '@/components/ui/enhanced-form';
import GenerationProgress from '@/components/GenerationProgress';
import { Sparkles, FolderPlus, Loader2 } from 'lucide-react';
import { useFormValidation } from '@/hooks/useFormValidation';
import { AIFeatureGenerator, type GenerationResult } from '@/lib/aiFeatureGenerator';
import { toast } from '@/hooks/use-toast';

export interface EnhancedCreateProjectData {
  title: string;
  description: string;
  project_type: string;
  target_audience?: string;
  key_features?: string;
  monetization?: string;
  tech_stack?: string;
  timeline?: string;
  budget?: string;
}

interface EnhancedCreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EnhancedCreateProjectData) => Promise<string>;
  onFeaturesGenerated?: (projectId: string, result: GenerationResult) => void;
}

const EnhancedCreateProjectModal: React.FC<EnhancedCreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onFeaturesGenerated
}) => {
  const [formData, setFormData] = useState<EnhancedCreateProjectData>({
    title: '',
    description: '',
    project_type: '',
    target_audience: '',
    key_features: '',
    monetization: '',
    tech_stack: '',
    timeline: '',
    budget: ''
  });

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progressStage, setProgressStage] = useState<'analyzing' | 'generating_structure' | 'creating_features' | 'generating_stories' | 'complete'>('analyzing');
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentAction, setCurrentAction] = useState('');

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

  const updateProgress = (stage: typeof progressStage, progress: number, action: string) => {
    setProgressStage(stage);
    setProgressPercent(progress);
    setCurrentAction(action);
  };

  const handleSubmit = async (generateAI: boolean = false) => {
    const { isValid } = validateForm(formData);
    
    if (!isValid) {
      return;
    }

    try {
      if (generateAI) {
        setAiLoading(true);
        setShowProgress(true);
        updateProgress('analyzing', 10, 'Creating project...');

        // Create project first
        const projectId = await onSubmit(formData);
        updateProgress('generating_structure', 30, 'Analyzing project requirements...');

        // Generate features with AI
        const generator = new AIFeatureGenerator((progress) => {
          updateProgress(progress.stage, progress.progress, progress.currentAction);
        });

        updateProgress('creating_features', 50, 'Generating features...');

        const result = await generator.generateFeaturesWithDependencies(
          projectId,
          formData.description,
          formData.project_type,
          {
            projectTitle: formData.title,
            projectDescription: formData.description,
            appType: formData.project_type as any,
            targetUsers: formData.target_audience || '',
            coreUserActions: formData.key_features || '',
            monetizationModel: (formData.monetization as any) || 'other',
            specificRequirements: formData.key_features ? [formData.key_features] : [],
            technicalPreferences: formData.tech_stack,
            complexity: 'medium',
            includeAdvancedFeatures: true
          }
        );

        updateProgress('complete', 100, 'Features generated successfully!');

        // Close modal and show progress result
        setTimeout(() => {
          setShowProgress(false);
          setAiLoading(false);
          resetForm();
          onClose();
          onFeaturesGenerated?.(projectId, result);
        }, 1500);

      } else {
        setLoading(true);
        await onSubmit(formData);
        resetForm();
        onClose();
        
        toast({
          title: "Project created",
          description: "Your project has been created successfully.",
        });
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setAiLoading(false);
      setShowProgress(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      project_type: '',
      target_audience: '',
      key_features: '',
      monetization: '',
      tech_stack: '',
      timeline: '',
      budget: ''
    });
    clearAllErrors();
    setProgressPercent(0);
    setProgressStage('analyzing');
    setCurrentAction('');
  };

  const handleClose = () => {
    if (loading || aiLoading) return;
    resetForm();
    onClose();
  };

  // Show progress modal during AI generation
  if (showProgress) {
    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <GenerationProgress
            stage={progressStage}
            progress={progressPercent}
            currentAction={currentAction}
          />
        </DialogContent>
      </Dialog>
    );
  }

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
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <FormField
              label="Project Title"
              required
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter project title"
              error={errors.title}
              disabled={loading || aiLoading}
            />

            <div className="space-y-2">
              <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
              <Textarea
                id="description"
                placeholder="Describe what your project will do and its main purpose"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={errors.description ? 'border-red-500' : ''}
                disabled={loading || aiLoading}
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
                disabled={loading || aiLoading}
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

          {/* Enhanced Details for AI Generation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary-500" />
              AI Enhancement Details (Optional)
            </h3>
            <p className="text-sm text-gray-600">
              Provide additional details to help AI generate better features and user stories for your project.
            </p>

            <FormField
              label="Target Audience"
              value={formData.target_audience || ''}
              onChange={(e) => handleInputChange('target_audience', e.target.value)}
              placeholder="Who will use this application? (e.g., small business owners, students, developers)"
              disabled={loading || aiLoading}
            />

            <div className="space-y-2">
              <Label htmlFor="key_features">Key Features & Requirements</Label>
              <Textarea
                id="key_features"
                placeholder="What are the main features you want? (e.g., user authentication, payment processing, real-time chat)"
                value={formData.key_features || ''}
                onChange={(e) => handleInputChange('key_features', e.target.value)}
                disabled={loading || aiLoading}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Monetization Model"
                value={formData.monetization || ''}
                onChange={(e) => handleInputChange('monetization', e.target.value)}
                placeholder="How will you make money? (e.g., subscription, one-time purchase, ads)"
                disabled={loading || aiLoading}
              />

              <FormField
                label="Tech Stack Preference"
                value={formData.tech_stack || ''}
                onChange={(e) => handleInputChange('tech_stack', e.target.value)}
                placeholder="Preferred technologies (e.g., React, Node.js, PostgreSQL)"
                disabled={loading || aiLoading}
              />

              <FormField
                label="Timeline"
                value={formData.timeline || ''}
                onChange={(e) => handleInputChange('timeline', e.target.value)}
                placeholder="When do you want to launch? (e.g., 3 months, Q1 2024)"
                disabled={loading || aiLoading}
              />

              <FormField
                label="Budget Range"
                value={formData.budget || ''}
                onChange={(e) => handleInputChange('budget', e.target.value)}
                placeholder="Development budget (e.g., $10k, bootstrapped)"
                disabled={loading || aiLoading}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading || aiLoading}
              className="sm:order-1"
            >
              Cancel
            </Button>
            
            <Button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={loading || aiLoading}
              variant="outline"
              className="sm:order-2"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project Only'
              )}
            </Button>

            <Button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={loading || aiLoading}
              className="sm:order-3 flex-1"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating with AI...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create Project with AI
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
