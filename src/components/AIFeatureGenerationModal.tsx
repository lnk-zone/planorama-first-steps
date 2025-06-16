
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Zap, RefreshCw, Settings } from 'lucide-react';
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
  const [appType, setAppType] = useState('web_app');
  const [complexity, setComplexity] = useState([2]); // 1=Simple, 2=Medium, 3=Complex
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgressData | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (isOpen && projectDescription) {
      setDescription(projectDescription);
    }
  }, [isOpen, projectDescription]);

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please provide a project description to generate features.",
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

      const result = await generator.generateFeaturesWithDependencies(
        projectId,
        description,
        appType
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
      case 1: return 'Simple';
      case 2: return 'Medium';
      case 3: return 'Complex';
      default: return 'Medium';
    }
  };

  const appTypeOptions = [
    { value: 'web_app', label: 'Web Application' },
    { value: 'mobile_app', label: 'Mobile App' },
    { value: 'saas', label: 'SaaS Platform' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'marketplace', label: 'Marketplace' },
    { value: 'social', label: 'Social Network' },
    { value: 'productivity', label: 'Productivity Tool' },
    { value: 'game', label: 'Game' },
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  and user stories with newly generated ones based on the description below.
                </p>
              </div>
            )}

            {/* Project Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Project Description</Label>
              <Textarea
                id="description"
                placeholder={`Describe your ${projectTitle || 'project'} in detail. What does it do? Who is it for? What are the main goals?`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-sm text-muted-foreground">
                Be as detailed as possible. The AI will use this to {isRegeneration ? 'regenerate' : 'generate'} comprehensive features with dependencies and execution order.
              </p>
            </div>

            {/* App Type */}
            <div className="space-y-2">
              <Label htmlFor="app-type">Application Type</Label>
              <Select value={appType} onValueChange={setAppType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {appTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    <Label>Project Complexity</Label>
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
                        <span className="font-medium">{getComplexityLabel(complexity[0])}</span>
                        <span>Complex</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {complexity[0] === 1 && "Generates 8-12 features with essential functionality"}
                      {complexity[0] === 2 && "Generates 12-18 features with comprehensive functionality"}
                      {complexity[0] === 3 && "Generates 15-25 features with advanced functionality"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button
                  onClick={handleGenerate}
                  disabled={!description.trim()}
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
