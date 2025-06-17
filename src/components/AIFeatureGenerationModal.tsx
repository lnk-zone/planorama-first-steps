
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Zap, RefreshCw, Settings, Plus, X, Users, Target, DollarSign, FileText } from 'lucide-react';
import { AIFeatureGenerator, type GenerationResult, type GenerationProgressData } from '@/lib/aiFeatureGenerator';
import GenerationProgress from '@/components/GenerationProgress';
import { toast } from '@/hooks/use-toast';

export interface AIFeatureGenerationModalProps {
  isOpen: boolean;
  projectId: string;
  projectTitle?: string;
  projectDescription?: string;
  isRegeneration?: boolean;
  onClose: () => void;
  onComplete: (result: GenerationResult) => void;
}

interface EnhancedProjectInput {
  projectTitle: string;
  projectDescription: string;
  appType: 'saas' | 'marketplace' | 'ecommerce' | 'ai_tool' | 'social' | 'productivity' | 'other';
  targetUsers: string;
  coreUserActions: string;
  monetizationModel: 'subscription' | 'one_time' | 'freemium' | 'ads' | 'marketplace_fees' | 'other';
  specificRequirements: string[];
  technicalPreferences?: string;
  complexity: 'simple' | 'medium' | 'complex';
  includeAdvancedFeatures: boolean;
}

const AIFeatureGenerationModal: React.FC<AIFeatureGenerationModalProps> = ({
  isOpen,
  projectId,
  projectTitle = '',
  projectDescription = '',
  isRegeneration = false,
  onClose,
  onComplete
}) => {
  const [description, setDescription] = useState(projectDescription);
  const [appType, setAppType] = useState<EnhancedProjectInput['appType']>('other');
  const [targetUsers, setTargetUsers] = useState('');
  const [coreUserActions, setCoreUserActions] = useState('');
  const [monetizationModel, setMonetizationModel] = useState<EnhancedProjectInput['monetizationModel']>('freemium');
  const [specificRequirements, setSpecificRequirements] = useState<string[]>(['']);
  const [technicalPreferences, setTechnicalPreferences] = useState('');
  const [complexity, setComplexity] = useState([2]); // 1=Simple, 2=Medium, 3=Complex
  const [includeAdvancedFeatures, setIncludeAdvancedFeatures] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgressData | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (isOpen && projectDescription) {
      setDescription(projectDescription);
    }
  }, [isOpen, projectDescription]);

  const handleAddRequirement = () => {
    setSpecificRequirements([...specificRequirements, '']);
  };

  const handleRemoveRequirement = (index: number) => {
    if (specificRequirements.length > 1) {
      setSpecificRequirements(specificRequirements.filter((_, i) => i !== index));
    }
  };

  const handleRequirementChange = (index: number, value: string) => {
    const updated = [...specificRequirements];
    updated[index] = value;
    setSpecificRequirements(updated);
  };

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please provide a project description to generate features.",
        variant: "destructive",
      });
      return;
    }

    if (!targetUsers.trim()) {
      toast({
        title: "Target users required",
        description: "Please specify who will use this app.",
        variant: "destructive",
      });
      return;
    }

    if (!coreUserActions.trim()) {
      toast({
        title: "Core user actions required",
        description: "Please describe what users should be able to do.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProgress({ 
      stage: 'analyzing', 
      progress: 0, 
      currentAction: isRegeneration ? 'Starting feature regeneration...' : 'Starting feature generation...' 
    });

    try {
      const generator = new AIFeatureGenerator((progress) => {
        setProgress(progress);
      });

      // Prepare enhanced input data
      const enhancedInput = {
        projectTitle,
        projectDescription: description,
        appType,
        targetUsers,
        coreUserActions,
        monetizationModel,
        specificRequirements: specificRequirements.filter(req => req.trim() !== ''),
        technicalPreferences,
        complexity: getComplexityLabel(complexity[0]) as 'simple' | 'medium' | 'complex',
        includeAdvancedFeatures
      };

      const result = await generator.generateFeaturesWithDependencies(
        projectId,
        description,
        appType,
        enhancedInput
      );

      toast({
        title: isRegeneration ? "Features regenerated successfully!" : "Features generated successfully!",
        description: `${isRegeneration ? 'Updated' : 'Created'} ${result.features.length} features with ${result.userStories.length} user stories.`,
      });

      onComplete(result);
      onClose();
    } catch (error) {
      console.error('Generation failed:', error);
      toast({
        title: isRegeneration ? "Regeneration failed" : "Generation failed",
        description: "Failed to generate features. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setProgress(null);
    }
  };

  const handleCancel = () => {
    setIsGenerating(false);
    setProgress(null);
  };

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

  // Map progress stages to GenerationProgress component expected stages
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
            {isRegeneration ? (
              <>
                <RefreshCw className="h-5 w-5" />
                Regenerate Features with AI
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                Generate Features with AI
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {isGenerating && progress ? (
          <GenerationProgress
            stage={mapProgressStage(progress.stage)}
            progress={progress.progress}
            currentAction={progress.currentAction}
            onCancel={handleCancel}
          />
        ) : (
          <div className="space-y-6">
            {isRegeneration && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  You're about to regenerate the existing features. This will replace your current features 
                  and user stories with newly generated ones based on the information below.
                </p>
              </div>
            )}

            {/* Enhanced Input Form */}
            <div className="space-y-6">
              {/* App Type and Complexity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="app-type" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    App Type *
                  </Label>
                  <Select value={appType} onValueChange={(value: any) => setAppType(value)}>
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
                
                <div>
                  <Label className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Complexity Level *
                  </Label>
                  <div className="space-y-2">
                    <Slider
                      value={complexity}
                      onValueChange={setComplexity}
                      max={3}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Simple</span>
                      <span className="font-medium">
                        {getComplexityLabel(complexity[0]).charAt(0).toUpperCase() + getComplexityLabel(complexity[0]).slice(1)} 
                        ({getFeatureCount(getComplexityLabel(complexity[0]))} features)
                      </span>
                      <span>Complex</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Project Description *
                </Label>
                <Textarea
                  id="description"
                  placeholder={`Describe your ${projectTitle || 'project'} in detail. What does it do? What problem does it solve?`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Target Users */}
              <div className="space-y-2">
                <Label htmlFor="target-users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Target Users *
                </Label>
                <Textarea
                  id="target-users"
                  placeholder="Who will use this app? (e.g., small business owners, freelancers, students, teachers)"
                  value={targetUsers}
                  onChange={(e) => setTargetUsers(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>

              {/* Core User Actions */}
              <div className="space-y-2">
                <Label htmlFor="core-actions" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Core User Actions *
                </Label>
                <Textarea
                  id="core-actions"
                  placeholder="What should users be able to do? (e.g., create projects, collaborate with team, track progress, manage inventory)"
                  value={coreUserActions}
                  onChange={(e) => setCoreUserActions(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>

              {/* Monetization Model */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Monetization Model
                </Label>
                <Select value={monetizationModel} onValueChange={(value: any) => setMonetizationModel(value)}>
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

              {/* Specific Requirements */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Specific Requirements
                </Label>
                <div className="space-y-2">
                  {specificRequirements.map((requirement, index) => (
                    <div key={index} className="flex gap-2">
                      <Textarea
                        placeholder={`Requirement ${index + 1} (e.g., "Must integrate with Stripe", "Similar to Slack channels", "Mobile-first design")`}
                        value={requirement}
                        onChange={(e) => handleRequirementChange(index, e.target.value)}
                        rows={1}
                        className="resize-none flex-1"
                      />
                      {specificRequirements.length > 1 && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleRemoveRequirement(index)}
                          className="shrink-0"
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
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Requirement
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Add specific features you want, apps similar to your vision, or technical requirements.
                </p>
              </div>

              {/* Advanced Options */}
              <div className="border-t pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="mb-4"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                </Button>

                {showAdvanced && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Technical Preferences</Label>
                      <Textarea
                        placeholder="Any specific technical requirements or preferences? (e.g., mobile app, real-time features, offline support)"
                        value={technicalPreferences}
                        onChange={(e) => setTechnicalPreferences(e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button
                  onClick={handleGenerate}
                  disabled={!description.trim() || !targetUsers.trim() || !coreUserActions.trim()}
                  className={isRegeneration 
                    ? "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                    : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  }
                >
                  {isRegeneration ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate Features
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Generate Features
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AIFeatureGenerationModal;
