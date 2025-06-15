
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Zap, RefreshCw, Settings } from 'lucide-react';
import { AIMindmapGenerator, type GenerationResult, type GenerationProgressData } from '@/lib/aiMindmapGenerator';
import GenerationProgress from '@/components/GenerationProgress';
import { toast } from '@/hooks/use-toast';

export interface AIMindmapGenerationModalProps {
  isOpen: boolean;
  projectId: string;
  projectTitle?: string;
  projectDescription?: string;
  onClose: () => void;
  onComplete: (result: GenerationResult) => void;
}

const AIMindmapGenerationModal: React.FC<AIMindmapGenerationModalProps> = ({
  isOpen,
  projectId,
  projectTitle = '',
  projectDescription = '',
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
        description: "Please provide a project description to generate the mindmap.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProgress({ stage: 'analyzing', progress: 0, currentAction: 'Starting generation...' });

    try {
      const generator = new AIMindmapGenerator((progress) => {
        setProgress(progress);
      });

      const result = await generator.generateMindmapFromDescription(
        projectId,
        description,
        appType
      );

      toast({
        title: "Mindmap generated successfully!",
        description: `Created ${result.features.length} features with ${result.userStories.length} user stories.`,
      });

      onComplete(result);
      onClose();
    } catch (error) {
      console.error('Generation failed:', error);
      toast({
        title: "Generation failed",
        description: "Failed to generate mindmap. Please try again.",
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Generate Mindmap with AI
          </DialogTitle>
        </DialogHeader>

        {isGenerating ? (
          <GenerationProgress
            stage={progress?.stage || 'analyzing'}
            progress={progress?.progress || 0}
            currentAction={progress?.currentAction || 'Starting...'}
            onCancel={handleCancel}
          />
        ) : (
          <div className="space-y-6">
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
                Be as detailed as possible. The AI will use this to generate relevant features and user stories.
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
                      {complexity[0] === 1 && "Generates 6-10 core features with basic functionality"}
                      {complexity[0] === 2 && "Generates 8-15 features with moderate complexity"}
                      {complexity[0] === 3 && "Generates 12-20 features with advanced functionality"}
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
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={!description.trim()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={!description.trim()}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Generate Mindmap
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AIMindmapGenerationModal;
