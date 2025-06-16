
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock, Users, FileText, CheckCircle } from 'lucide-react';
import { AIFeatureGenerator, type GenerationResult, type GenerationProgressData } from '@/lib/aiFeatureGenerator';
import GenerationProgress from '@/components/GenerationProgress';
import { toast } from 'sonner';

interface FeatureGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onFeaturesGenerated: (result: GenerationResult) => void;
}

const FeatureGenerationModal: React.FC<FeatureGenerationModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onFeaturesGenerated
}) => {
  const [projectDescription, setProjectDescription] = useState('');
  const [appType, setAppType] = useState('web_app');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgressData | null>(null);
  const [generatedResult, setGeneratedResult] = useState<GenerationResult | null>(null);

  const handleGenerate = async () => {
    if (!projectDescription.trim()) {
      toast.error('Please enter a project description');
      return;
    }

    setIsGenerating(true);
    setProgress(null);
    setGeneratedResult(null);

    try {
      const generator = new AIFeatureGenerator(setProgress);
      const result = await generator.generateFeaturesWithDependencies(
        projectId,
        projectDescription,
        appType
      );

      setGeneratedResult(result);
      toast.success('Features generated successfully!');
    } catch (error) {
      console.error('Generation failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate features');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAccept = () => {
    if (generatedResult) {
      onFeaturesGenerated(generatedResult);
      onClose();
      toast.success('Features added to your project!');
    }
  };

  const handleReset = () => {
    setGeneratedResult(null);
    setProgress(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            AI Feature Generation with Dependencies
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!generatedResult && !isGenerating && (
            <>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Project Description
                  </label>
                  <Textarea
                    placeholder="Describe your app idea in detail. What does it do? Who is it for? What are the main features you envision?"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The more detailed your description, the better the AI can plan your features and dependencies.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    App Type
                  </label>
                  <Select value={appType} onValueChange={setAppType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="web_app">Web Application</SelectItem>
                      <SelectItem value="mobile_app">Mobile App</SelectItem>
                      <SelectItem value="dashboard">Dashboard/Admin Panel</SelectItem>
                      <SelectItem value="ecommerce">E-commerce Platform</SelectItem>
                      <SelectItem value="social_platform">Social Platform</SelectItem>
                      <SelectItem value="productivity_tool">Productivity Tool</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleGenerate} disabled={!projectDescription.trim()}>
                  <Zap className="h-4 w-4 mr-2" />
                  Generate Features & Dependencies
                </Button>
              </div>
            </>
          )}

          {isGenerating && progress && (
            <GenerationProgress
              stage={progress.stage}
              progress={progress.progress}
              currentAction={progress.currentAction}
            />
          )}

          {generatedResult && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Generated Plan</h3>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleReset}>
                    Generate New Plan
                  </Button>
                  <Button onClick={handleAccept}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept & Add to Project
                  </Button>
                </div>
              </div>

              {/* Execution Plan Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Execution Plan Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {generatedResult.features.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Features</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {generatedResult.userStories.length}
                      </div>
                      <div className="text-sm text-muted-foreground">User Stories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {generatedResult.executionPlan.estimatedTotalHours}h
                      </div>
                      <div className="text-sm text-muted-foreground">Estimated Hours</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Phases */}
              <div className="space-y-4">
                <h4 className="font-medium">Development Phases</h4>
                {generatedResult.executionPlan.phases.map((phase) => (
                  <Card key={phase.number}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>{phase.name}</span>
                        <Badge variant="outline">{phase.estimatedHours}h</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {phase.stories.map((storyTitle, index) => {
                          const story = generatedResult.userStories.find(s => s.title === storyTitle);
                          const executionOrder = generatedResult.executionPlan.executionOrder.indexOf(storyTitle) + 1;
                          
                          return (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <Badge variant="secondary" className="text-xs">
                                {executionOrder}
                              </Badge>
                              <span className="flex-1">{storyTitle}</span>
                              {story?.estimated_hours && (
                                <Badge variant="outline" className="text-xs">
                                  {story.estimated_hours}h
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Features Preview */}
              <div className="space-y-4">
                <h4 className="font-medium">Features Overview</h4>
                <div className="grid gap-3">
                  {generatedResult.features.map((feature) => (
                    <Card key={feature.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{feature.title}</h5>
                          <div className="flex gap-1">
                            <Badge variant="outline" className="text-xs">
                              {feature.priority}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {feature.complexity}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                        
                        {/* Show user stories for this feature */}
                        <div className="mt-3 space-y-1">
                          {generatedResult.userStories
                            .filter(story => story.feature_id === feature.id)
                            .map((story) => {
                              const executionOrder = generatedResult.executionPlan.executionOrder.indexOf(story.title) + 1;
                              return (
                                <div key={story.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Badge variant="secondary" className="text-xs">
                                    {executionOrder}
                                  </Badge>
                                  <Users className="h-3 w-3" />
                                  <span className="flex-1">{story.title}</span>
                                </div>
                              );
                            })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeatureGenerationModal;
