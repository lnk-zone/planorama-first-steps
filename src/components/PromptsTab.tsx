
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Copy, 
  Zap, 
  Code, 
  MessageSquare, 
  Check, 
  ChevronDown, 
  ChevronRight,
  Play,
  HelpCircle,
  Download,
  CheckCircle,
  Circle,
  BookOpen
} from 'lucide-react';
import { useStoryPrompts } from '@/hooks/useStoryPrompts';
import { toast } from '@/hooks/use-toast';

interface PromptsTabProps {
  projectId: string;
  projectTitle: string;
  projectDescription?: string;
  features: any[];
}

const PLATFORMS = [
  { id: 'lovable', name: 'Lovable', icon: Code, color: 'from-purple-600 to-blue-600' },
  { id: 'bolt', name: 'Bolt', icon: Zap, color: 'from-yellow-600 to-orange-600' },
  { id: 'cursor', name: 'Cursor', icon: MessageSquare, color: 'from-green-600 to-teal-600' },
  { id: 'claude', name: 'Claude', icon: MessageSquare, color: 'from-orange-600 to-red-600' },
  { id: 'replit', name: 'Replit', icon: Code, color: 'from-blue-600 to-indigo-600' },
  { id: 'windsurf', name: 'Windsurf', icon: Zap, color: 'from-cyan-600 to-blue-600' },
];

const PromptsTab: React.FC<PromptsTabProps> = ({ 
  projectId,
  projectTitle, 
  projectDescription, 
  features 
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState('lovable');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([1]));
  const [expandedStories, setExpandedStories] = useState<Set<string>>(new Set());
  const [troubleshootingOpen, setTroubleshootingOpen] = useState(false);

  const {
    prompts,
    troubleshootingGuide,
    isLoading,
    generatePrompts,
    isGenerating,
    markStoryComplete,
    unmarkStoryComplete,
    isStoryComplete,
    getStoryCompletion,
  } = useStoryPrompts(projectId, selectedPlatform);

  const handleCopyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(id);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast({
        title: "Copied to clipboard",
        description: "Prompt has been copied and is ready to paste.",
      });
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast({
        title: "Failed to copy",
        description: "Please try copying manually.",
        variant: "destructive",
      });
    }
  };

  const handleExportPrompts = () => {
    const content = prompts.map(p => `${p.title}\n\n${p.content}`).join('\n\n---\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectTitle}-${selectedPlatform}-prompts.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const togglePhaseExpansion = (phaseNumber: number) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseNumber)) {
      newExpanded.delete(phaseNumber);
    } else {
      newExpanded.add(phaseNumber);
    }
    setExpandedPhases(newExpanded);
  };

  const toggleStoryExpansion = (storyId: string) => {
    const newExpanded = new Set(expandedStories);
    if (newExpanded.has(storyId)) {
      newExpanded.delete(storyId);
    } else {
      newExpanded.add(storyId);
    }
    setExpandedStories(newExpanded);
  };

  const toggleStoryComplete = (storyId: string) => {
    if (isStoryComplete(storyId)) {
      unmarkStoryComplete(storyId);
    } else {
      markStoryComplete({ storyId });
    }
  };

  // Group prompts by type
  const phaseOverviews = prompts.filter(p => p.prompt_type === 'phase_overview');
  const storyPrompts = prompts.filter(p => p.prompt_type === 'story');
  const transitionPrompts = prompts.filter(p => p.prompt_type === 'transition');

  // Calculate progress
  const totalStories = storyPrompts.length;
  const completedStories = storyPrompts.filter(p => p.user_story_id && isStoryComplete(p.user_story_id)).length;
  const progressPercentage = totalStories > 0 ? (completedStories / totalStories) * 100 : 0;

  // Group by phases using the phase_number field directly
  const phases = phaseOverviews.map(phase => {
    // Get stories that belong to this phase using the phase_number field
    const phaseStories = storyPrompts.filter(story => 
      story.phase_number === phase.phase_number
    );

    const phaseTransitions = transitionPrompts.filter(transition => 
      transition.phase_number === phase.phase_number
    );
    
    return {
      ...phase,
      stories: phaseStories,
      transitions: phaseTransitions
    };
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Story-by-Story Prompts</h2>
          {troubleshootingGuide && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTroubleshootingOpen(true)}
              className="flex items-center gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              Troubleshooting Guide
            </Button>
          )}
        </div>
        <p className="text-gray-600 mb-4">
          Generate detailed, step-by-step prompts for each user story that guide you through building your app incrementally
        </p>

        {/* Progress Bar */}
        {totalStories > 0 && (
          <div className="max-w-md mx-auto mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{completedStories}/{totalStories} stories completed</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}
      </div>

      {/* Platform Selection */}
      <Tabs value={selectedPlatform} onValueChange={setSelectedPlatform}>
        <TabsList className="grid w-full grid-cols-6">
          {PLATFORMS.map(platform => (
            <TabsTrigger key={platform.id} value={platform.id} className="text-xs">
              {platform.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {PLATFORMS.map(platform => (
          <TabsContent key={platform.id} value={platform.id} className="space-y-6">
            {/* Generate/Actions Bar */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 bg-gradient-to-r ${platform.color} rounded-lg flex items-center justify-center`}>
                  <platform.icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">{platform.name} Prompts</h3>
                  <p className="text-sm text-gray-600">
                    {prompts.length > 0 ? `${prompts.length} prompts ready` : 'No prompts generated yet'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {prompts.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportPrompts}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export All
                  </Button>
                )}
                <Button
                  onClick={() => generatePrompts()}
                  disabled={isGenerating}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  {isGenerating ? 'Generating...' : prompts.length > 0 ? 'Regenerate' : 'Generate Prompts'}
                </Button>
              </div>
            </div>

            {/* Prompts Content */}
            {prompts.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No prompts generated yet</h3>
                    <p className="text-gray-600 mb-6">
                      Generate detailed prompts for each user story to guide your development process.
                    </p>
                    <Button onClick={() => generatePrompts()} disabled={isGenerating}>
                      <Play className="h-4 w-4 mr-2" />
                      Generate {platform.name} Prompts
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {phases.length > 0 ? (
                  // Phase-grouped view
                  phases.map(phase => (
                    <Card key={phase.id} className="border-2">
                      <Collapsible
                        open={expandedPhases.has(phase.phase_number || 1)}
                        onOpenChange={() => togglePhaseExpansion(phase.phase_number || 1)}
                      >
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {expandedPhases.has(phase.phase_number || 1) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                <CardTitle className="text-lg">{phase.title}</CardTitle>
                                <Badge variant="outline">
                                  {phase.stories.length} stories
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyToClipboard(phase.content, phase.id);
                                }}
                              >
                                {copiedIndex === phase.id ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <CardContent>
                            <Textarea
                              value={phase.content}
                              readOnly
                              className="min-h-[200px] text-sm font-mono resize-none mb-4"
                            />
                            
                            {/* Stories in this phase */}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900">Stories in this phase:</h4>
                              {phase.stories.length > 0 ? (
                                phase.stories.map(story => (
                                  <Card key={story.id} className="bg-gray-50 border border-gray-200">
                                    <Collapsible
                                      open={expandedStories.has(story.id)}
                                      onOpenChange={() => toggleStoryExpansion(story.id)}
                                    >
                                      <CollapsibleTrigger asChild>
                                        <CardHeader className="pb-3 cursor-pointer hover:bg-gray-100">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                              {expandedStories.has(story.id) ? (
                                                <ChevronDown className="h-4 w-4" />
                                              ) : (
                                                <ChevronRight className="h-4 w-4" />
                                              )}
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  story.user_story_id && toggleStoryComplete(story.user_story_id);
                                                }}
                                                className="p-1"
                                              >
                                                {story.user_story_id && isStoryComplete(story.user_story_id) ? (
                                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                                ) : (
                                                  <Circle className="h-5 w-5 text-gray-400" />
                                                )}
                                              </Button>
                                              <CardTitle className="text-base">{story.title}</CardTitle>
                                              <Badge variant="secondary" className="text-xs">
                                                {story.content.length} chars
                                              </Badge>
                                            </div>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopyToClipboard(story.content, story.id);
                                              }}
                                            >
                                              {copiedIndex === story.id ? (
                                                <>
                                                  <Check className="h-4 w-4 text-green-600 mr-2" />
                                                  Copied!
                                                </>
                                              ) : (
                                                <>
                                                  <Copy className="h-4 w-4 mr-2" />
                                                  Copy
                                                </>
                                              )}
                                            </Button>
                                          </div>
                                        </CardHeader>
                                      </CollapsibleTrigger>
                                      
                                      <CollapsibleContent>
                                        <CardContent>
                                          <Textarea
                                            value={story.content}
                                            readOnly
                                            className="min-h-[300px] text-sm font-mono resize-none"
                                          />
                                        </CardContent>
                                      </CollapsibleContent>
                                    </Collapsible>
                                  </Card>
                                ))
                              ) : (
                                <p className="text-gray-500 italic">No individual story prompts found for this phase.</p>
                              )}
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  ))
                ) : (
                  // Flat view for stories without phases
                  storyPrompts.map(story => (
                    <Card key={story.id} className="border-2">
                      <Collapsible
                        open={expandedStories.has(story.id)}
                        onOpenChange={() => toggleStoryExpansion(story.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {expandedStories.has(story.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    story.user_story_id && toggleStoryComplete(story.user_story_id);
                                  }}
                                  className="p-1"
                                >
                                  {story.user_story_id && isStoryComplete(story.user_story_id) ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-gray-400" />
                                  )}
                                </Button>
                                <CardTitle className="text-lg">{story.title}</CardTitle>
                                <Badge variant="outline" className="text-xs">
                                  {story.content.length} chars
                                </Badge>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyToClipboard(story.content, story.id);
                                }}
                              >
                                {copiedIndex === story.id ? (
                                  <>
                                    <Check className="h-4 w-4 text-green-600 mr-2" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Prompt
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <CardContent>
                            <Textarea
                              value={story.content}
                              readOnly
                              className="min-h-[400px] text-sm font-mono resize-none"
                            />
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  ))
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Troubleshooting Guide Modal */}
      <Dialog open={troubleshootingOpen} onOpenChange={setTroubleshootingOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Troubleshooting Guide - {PLATFORMS.find(p => p.id === selectedPlatform)?.name}
            </DialogTitle>
          </DialogHeader>
          
          {troubleshootingGuide && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Comprehensive troubleshooting guide for common issues
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyToClipboard(troubleshootingGuide.content, 'troubleshooting')}
                >
                  {copiedIndex === 'troubleshooting' ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Guide
                    </>
                  )}
                </Button>
              </div>
              
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-lg overflow-x-auto">
                  {troubleshootingGuide.content}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Pro Tips
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Work through stories in execution order for best results</li>
            <li>• Mark stories as complete to track your progress</li>
            <li>• Use the troubleshooting guide when you get stuck</li>
            <li>• Copy prompts and paste directly into your AI builder</li>
            <li>• Export all prompts for offline reference</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromptsTab;
