
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Users, 
  ChevronRight, 
  ChevronDown, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';
import type { UserStory } from '@/hooks/useUserStories';
import type { ExecutionPlan, Phase, Dependency } from '@/lib/aiFeatureGenerator';

interface ExecutionOrderDisplayProps {
  userStories: UserStory[];
  executionPlan: ExecutionPlan;
  onReorderStories?: (newOrder: string[]) => void;
}

const ExecutionOrderDisplay: React.FC<ExecutionOrderDisplayProps> = ({
  userStories,
  executionPlan,
  onReorderStories
}) => {
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([1]));
  const [selectedStory, setSelectedStory] = useState<string | null>(null);

  const togglePhase = (phaseNumber: number) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseNumber)) {
      newExpanded.delete(phaseNumber);
    } else {
      newExpanded.add(phaseNumber);
    }
    setExpandedPhases(newExpanded);
  };

  const getStoryById = (title: string) => {
    return userStories.find(story => story.title === title);
  };

  const getExecutionOrder = (storyTitle: string) => {
    return executionPlan.executionOrder.indexOf(storyTitle) + 1;
  };

  const getDependencyInfo = (story: UserStory) => {
    if (!story.dependencies) return [];
    try {
      return story.dependencies as unknown as Dependency[];
    } catch {
      return [];
    }
  };

  const getCompletedStories = () => {
    return userStories.filter(story => story.status === 'completed').length;
  };

  const getProgressPercentage = () => {
    return (getCompletedStories() / userStories.length) * 100;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'high': return 'bg-purple-50 text-purple-700';
      case 'medium': return 'bg-blue-50 text-blue-700';
      case 'low': return 'bg-teal-50 text-teal-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Execution Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{getCompletedStories()} of {userStories.length} stories completed</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {executionPlan.phases.length}
                </div>
                <div className="text-sm text-muted-foreground">Phases</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {executionPlan.totalStories}
                </div>
                <div className="text-sm text-muted-foreground">Total Stories</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {executionPlan.estimatedTotalHours}h
                </div>
                <div className="text-sm text-muted-foreground">Est. Hours</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Development Phases</h3>
        
        {executionPlan.phases.map((phase) => (
          <Card key={phase.number} className="overflow-hidden">
            <CardHeader 
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => togglePhase(phase.number)}
            >
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {expandedPhases.has(phase.number) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span>{phase.name}</span>
                  <Badge variant="outline">{phase.stories.length} stories</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{phase.estimatedHours}h</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            
            {expandedPhases.has(phase.number) && (
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {phase.stories.map((storyTitle, index) => {
                    const story = getStoryById(storyTitle);
                    const executionOrder = getExecutionOrder(storyTitle);
                    const dependencies = story ? getDependencyInfo(story) : [];
                    const isSelected = selectedStory === storyTitle;
                    
                    if (!story) return null;

                    return (
                      <div key={index} className="space-y-2">
                        <Card 
                          className={`cursor-pointer transition-all ${
                            isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedStory(isSelected ? null : storyTitle)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Badge 
                                variant={story.status === 'completed' ? 'default' : 'secondary'}
                                className="text-xs font-mono"
                              >
                                {executionOrder}
                              </Badge>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <Users className="h-4 w-4 text-muted-foreground" />
                                  <h4 className="font-medium text-sm leading-tight">{story.title}</h4>
                                  {story.status === 'completed' && (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  )}
                                </div>
                                
                                {story.description && (
                                  <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                                    {story.description}
                                  </p>
                                )}
                                
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${getPriorityColor(story.priority || 'medium')}`}
                                  >
                                    {story.priority}
                                  </Badge>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${getComplexityColor(story.complexity || 'medium')}`}
                                  >
                                    {story.complexity}
                                  </Badge>
                                  {story.estimated_hours && (
                                    <Badge variant="outline" className="text-xs">
                                      {story.estimated_hours}h
                                    </Badge>
                                  )}
                                  {dependencies.length > 0 && (
                                    <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                                      {dependencies.length} dependencies
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* Dependency Details */}
                        {isSelected && dependencies.length > 0 && (
                          <Card className="ml-8 border-l-4 border-l-orange-200">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="h-4 w-4 text-orange-600" />
                                <span className="font-medium text-sm">Dependencies</span>
                              </div>
                              <div className="space-y-2">
                                {dependencies.map((dep, depIndex) => (
                                  <div key={depIndex} className="flex items-start gap-2 text-sm">
                                    <ArrowRight className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{dep.targetStoryTitle}</span>
                                        <Badge 
                                          variant="outline" 
                                          className={`text-xs ${
                                            dep.type === 'must_do_first' 
                                              ? 'bg-red-50 text-red-700' 
                                              : 'bg-blue-50 text-blue-700'
                                          }`}
                                        >
                                          {dep.type === 'must_do_first' ? 'Must do first' : 'Do together'}
                                        </Badge>
                                      </div>
                                      <p className="text-muted-foreground text-xs mt-1">{dep.reason}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4" />
            Legend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">1</Badge>
                <span>Execution order number</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700">Must do first</Badge>
                <span>Blocking dependency</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Completed story</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">Do together</Badge>
                <span>Related dependency</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExecutionOrderDisplay;
