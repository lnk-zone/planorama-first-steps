
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, Zap, Users, FileText } from 'lucide-react';

export interface GenerationProgressProps {
  stage: 'analyzing' | 'generating_structure' | 'creating_features' | 'generating_stories' | 'complete';
  progress: number;
  currentAction: string;
  estimatedTimeRemaining?: number;
  onCancel?: () => void;
}

const GenerationProgress: React.FC<GenerationProgressProps> = ({
  stage,
  progress,
  currentAction,
  estimatedTimeRemaining,
  onCancel
}) => {
  const stages = [
    { key: 'analyzing', label: 'Analyzing', icon: Clock },
    { key: 'generating_structure', label: 'Generating Structure', icon: Zap },
    { key: 'creating_features', label: 'Creating Features', icon: FileText },
    { key: 'generating_stories', label: 'Generating Stories', icon: Users },
    { key: 'complete', label: 'Complete', icon: CheckCircle }
  ];

  const currentStageIndex = stages.findIndex(s => s.key === stage);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Generating Your Mindmap
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{currentAction}</span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Stage Indicators */}
        <div className="flex justify-between">
          {stages.map((stageInfo, index) => {
            const Icon = stageInfo.icon;
            const isActive = index === currentStageIndex;
            const isCompleted = index < currentStageIndex;
            const isPending = index > currentStageIndex;
            
            return (
              <div 
                key={stageInfo.key}
                className={`flex flex-col items-center space-y-2 ${
                  isActive ? 'text-blue-600' : 
                  isCompleted ? 'text-green-600' : 
                  'text-gray-400'
                }`}
              >
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2
                  ${isActive ? 'border-blue-600 bg-blue-50' : 
                    isCompleted ? 'border-green-600 bg-green-50' : 
                    'border-gray-300 bg-gray-50'}
                `}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-center">
                  {stageInfo.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Estimated Time */}
        {estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            Estimated time remaining: {Math.ceil(estimatedTimeRemaining / 1000)}s
          </div>
        )}

        {/* Cancel Button */}
        {onCancel && stage !== 'complete' && (
          <div className="text-center">
            <button
              onClick={onCancel}
              className="text-sm text-red-600 hover:text-red-800 underline"
            >
              Cancel Generation
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GenerationProgress;
