
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Zap, Plus, X, Users, Target, DollarSign, FileText, Settings, Lightbulb } from 'lucide-react';
import { AIFeatureGenerator, type GenerationResult, type GenerationProgressData } from '@/lib/aiFeatureGenerator';
import GenerationProgress from '@/components/GenerationProgress';
import { toast } from '@/hooks/use-toast';

export interface EnhancedCreateProjectData {
  title: string;
  description: string;
  project_type: string;
  generateFeatures: boolean;
  appType?: 'saas' | 'marketplace' | 'ecommerce' | 'ai_tool' | 'social' | 'productivity' | 'other';
  targetUsers?: string;
  coreUserActions?: string;
  monetizationModel?: 'subscription' | 'one_time' | 'freemium' | 'ads' | 'marketplace_fees' | 'other';
  specificRequirements?: string[];
  complexity?: 'simple' | 'medium' | 'complex';
}

interface EnhancedCreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: EnhancedCreateProjectData) => Promise<string>;
  onFeaturesGenerated?: (projectId: string, result: GenerationResult) => void;
}

const EnhancedCreateProjectModal: React.FC<EnhancedCreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onFeaturesGenerated
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_type: 'web_app',
    generateFeatures: true,
    appType: 'other' as const,
    targetUsers: '',
    coreUserActions: '',
    monetizationModel: 'freemium' as const,
    specificRequirements: [''] as string[],
    complexity: [2] as number[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgressData | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const projectTypes = [
    { value: 'web_app', label: 'Web App' },
    { value: 'mobile_app', label: 'Mobile App' },
    { value: 'saas', label: 'SaaS Platform' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'cms', label: 'CMS' },
    { value: 'api', label: 'API/Backend' },
    { value: 'dashboard', label: 'Dashboard' },
    { value: 'portfolio', label: 'Portfolio/Blog' },
    { value: 'other', label: 'Other' },
  ];

  const appTypeOptions = [
    { value: 'saas', label: 'SaaS Platform', icon: '🏢' },
    { value: 'marketplace', label: 'Marketplace', icon: '🛒' },
    { value: 'ecommerce', label: 'E-commerce', icon: '💳' },
    { value: 'ai_tool', label: 'AI Tool', icon: '🤖' },
    { value: 'social', label: 'Social Platform', icon: '👥' },
    { value: 'productivity', label: 'Productivity Tool', icon: '📊' },
    { value: 'other', label: 'Other', icon: '⚡' }
  ];

  const monetizationOptions = [
    { value: 'freemium', label: 'Freemium' },
    { value: 'subscription', label: 'Subscription' },
    { value: 'one_time', label: 'One-time Purchase' },
    { value: 'marketplace_fees', label: 'Marketplace Fees' },
    { value: 'ads', label: 'Advertising' },
    { value: 'other', label: 'Other' }
  ];

  const getComplexityLabel = (value: number) => {
    switch (value) {
      case 1: return 'simple';
      case 2: return 'medium';
      case 3: return 'complex';
      default: return 'medium';
    }
  };

  const getFeatureCount = (complexityLevel: string) => {
    return { simple: 10, medium: 15, complex: 22 }[complexityLevel] || 15;
  };

  const handleAddRequirement = () => {
    setFormData(prev => ({
      ...prev,
      specificRequirements: [...prev.specificRequirements, '']
    }));
  };

  const handleRemoveRequirement = (index: number) => {
    if (formData.specificRequirements.length > 1) {
      setFormData(prev => ({
        ...prev,
        specificRequirements: prev.specificRequirements.filter((_, i) => i !== index)
      }));
    }
  };

  const handleRequirementChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      specificRequirements: prev.specificRequirements.map((req, i) => i === index ? value : req)
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Project title required",
        description: "Please enter a project title.",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.description.trim()) {
      toast({
        title: "Project description required",
        description: "Please provide a project description.",
        variant: "destructive",
      });
      return false;
    }

    if (formData.generateFeatures) {
      if (!formData.targetUsers.trim()) {
        toast({
          title: "Target users required",
          description: "Please specify who will use this app for AI feature generation.",
          variant: "destructive",
        });
        return false;
      }

      if (!formData.coreUserActions.trim()) {
        toast({
          title: "Core user actions required",
          description: "Please describe what users should be able to do for AI feature generation.",
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Create the project first
      const projectData: EnhancedCreateProjectData = {
        title: formData.title,
        description: formData.description,
        project_type: formData.project_type,
        generateFeatures: formData.generateFeatures,
        appType: formData.appType,
        targetUsers: formData.targetUsers,
        coreUserActions: formData.coreUserActions,
        monetizationModel: formData.monetizationModel,
        specificRequirements: formData.specificRequirements.filter(req => req.trim() !== ''),
        complexity: getComplexityLabel(formData.complexity[0]) as 'simple' | 'medium' | 'complex',
      };

      const projectId = await onSubmit(projectData);

      // If AI feature generation is enabled, generate features
      if (formData.generateFeatures && projectId) {
        setIsGenerating(true);
        setProgress({ 
          stage: 'analyzing', 
          progress: 0, 
          currentAction: 'Starting AI feature generation...' 
        });

        try {
          const generator = new AIFeatureGenerator((progress) => {
            setProgress(progress);
          });

          // Prepare enhanced input data
          const enhancedInput = {
            projectTitle: formData.title,
            projectDescription: formData.description,
            appType: formData.appType,
            targetUsers: formData.targetUsers,
            coreUserActions: formData.coreUserActions,
            monetizationModel: formData.monetizationModel,
            specificRequirements: formData.specificRequirements.filter(req => req.trim() !== ''),
            technicalPreferences: '',
            complexity: getComplexityLabel(formData.complexity[0]) as 'simple' | 'medium' | 'complex',
            includeAdvancedFeatures: formData.complexity[0] >= 3
          };

          const result = await generator.generateFeaturesWithDependencies(
            projectId,
            formData.description,
            formData.appType,
            enhancedInput,
            false
          );

          toast({
            title: "Project created with AI features!",
            description: `Created ${result.features.length} features with ${result.userStories.length} user stories.`,
          });

          onFeaturesGenerated?.(projectId, result);
        } catch (error) {
          console.error('Feature generation failed:', error);
          toast({
            title: "Project created successfully",
            description: "However, feature generation failed. You can generate features later from the project page.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Project created successfully!",
          description: "Your new project has been created.",
        });
      }

      onClose();
      resetForm();
    } catch (error) {
      console.error('Project creation failed:', error);
      toast({
        title: "Error creating project",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsGenerating(false);
      setProgress(null);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      project_type: 'web_app',
      generateFeatures: true,
      appType: 'other',
      targetUsers: '',
      coreUserActions: '',
      monetizationModel: 'freemium',
      specificRequirements: [''],
      complexity: [2],
    });
    setShowAdvanced(false);
  };

  const mapProgressStage = (stage: GenerationProgressData['stage']) => {
    switch (stage) {
      case 'analyzing': return 'analyzing';
      case 'generating_features': return 'creating_features';
      case 'creating_stories': return 'generating_stories';
      case 'calculating_order': return 'generating_stories';
      case 'complete': return 'complete';
      default: return 'analyzing';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Create New Project
          </DialogTitle>
        </DialogHeader>

        {isGenerating && progress ? (
          <GenerationProgress
            stage={mapProgressStage(progress.stage)}
            progress={progress.progress}
            currentAction={progress.currentAction}
            onCancel={() => {
              setIsGenerating(false);
              setProgress(null);
            }}
          />
        ) : (
          <div className="space-y-6">
            {/* Basic Project Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter project title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    disabled={isSubmitting || isGenerating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project_type">Project Type</Label>
                  <Select 
                    value={formData.project_type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, project_type: value }))}
                    disabled={isSubmitting || isGenerating}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Project Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project. What does it do? What problem does it solve?"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="resize-none"
                  disabled={isSubmitting || isGenerating}
                />
              </div>
            </div>

            {/* AI Feature Generation Toggle */}
            <div className="border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox 
                  id="generateFeatures"
                  checked={formData.generateFeatures}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, generateFeatures: checked as boolean }))}
                  disabled={isSubmitting || isGenerating}
                />
                <Label htmlFor="generateFeatures" className="flex items-center gap-2 font-medium">
                  <Zap className="h-4 w-4 text-purple-600" />
                  Generate features with AI
                </Label>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  Recommended
                </Badge>
              </div>
              <p className="text-sm text-gray-600 ml-6">
                Automatically generate comprehensive features and user stories based on your project details.
              </p>
            </div>

            {/* AI Generation Fields */}
            {formData.generateFeatures && (
              <div className="space-y-4 border-l-4 border-purple-200 pl-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      App Type *
                    </Label>
                    <Select 
                      value={formData.appType} 
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, appType: value }))}
                      disabled={isSubmitting || isGenerating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {appTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <span className="flex items-center gap-2">
                              <span>{option.icon}</span>
                              {option.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Complexity Level *
                    </Label>
                    <div className="space-y-2">
                      <Slider
                        value={formData.complexity}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, complexity: value }))}
                        max={3}
                        min={1}
                        step={1}
                        className="w-full"
                        disabled={isSubmitting || isGenerating}
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Simple</span>
                        <span className="font-medium">
                          {getComplexityLabel(formData.complexity[0]).charAt(0).toUpperCase() + getComplexityLabel(formData.complexity[0]).slice(1)} 
                          ({getFeatureCount(getComplexityLabel(formData.complexity[0]))} features)
                        </span>
                        <span>Complex</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Target Users *
                  </Label>
                  <Textarea
                    placeholder="Who will use this app? (e.g., small business owners, freelancers, students, teachers)"
                    value={formData.targetUsers}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetUsers: e.target.value }))}
                    rows={2}
                    className="resize-none"
                    disabled={isSubmitting || isGenerating}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Core User Actions *
                  </Label>
                  <Textarea
                    placeholder="What should users be able to do? (e.g., create projects, collaborate with team, track progress)"
                    value={formData.coreUserActions}
                    onChange={(e) => setFormData(prev => ({ ...prev, coreUserActions: e.target.value }))}
                    rows={2}
                    className="resize-none"
                    disabled={isSubmitting || isGenerating}
                  />
                </div>

                {/* Advanced Options */}
                <div className="border-t pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="mb-4"
                    disabled={isSubmitting || isGenerating}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                  </Button>

                  {showAdvanced && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Monetization Model
                        </Label>
                        <Select 
                          value={formData.monetizationModel} 
                          onValueChange={(value: any) => setFormData(prev => ({ ...prev, monetizationModel: value }))}
                          disabled={isSubmitting || isGenerating}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {monetizationOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Specific Requirements
                        </Label>
                        <div className="space-y-2">
                          {formData.specificRequirements.map((requirement, index) => (
                            <div key={index} className="flex gap-2">
                              <Textarea
                                placeholder={`Requirement ${index + 1} (e.g., "Must integrate with Stripe", "Similar to Slack channels")`}
                                value={requirement}
                                onChange={(e) => handleRequirementChange(index, e.target.value)}
                                rows={1}
                                className="resize-none flex-1"
                                disabled={isSubmitting || isGenerating}
                              />
                              {formData.specificRequirements.length > 1 && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleRemoveRequirement(index)}
                                  className="shrink-0"
                                  disabled={isSubmitting || isGenerating}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAddRequirement}
                            className="w-full"
                            disabled={isSubmitting || isGenerating}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Another Requirement
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting || isGenerating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isGenerating}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isSubmitting || isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    {isGenerating ? 'Generating Features...' : 'Creating Project...'}
                  </>
                ) : (
                  <>
                    <Lightbulb className="h-4 w-4 mr-2" />
                    {formData.generateFeatures ? 'Create Project with AI' : 'Create Project'}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedCreateProjectModal;
