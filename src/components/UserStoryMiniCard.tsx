
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Clock, Target, Edit } from 'lucide-react';

interface UserStoryMiniCardProps {
  story: any;
  onEdit: (story: any) => void;
}

const UserStoryMiniCard: React.FC<UserStoryMiniCardProps> = ({ story, onEdit }) => {
  const [showCriteria, setShowCriteria] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-200 bg-gray-50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-sm text-gray-900 line-clamp-2 flex-1">
            {story.title}
          </h4>
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(story)}
              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
              title="Edit story"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Badge className={getStatusColor(story.status)} variant="secondary">
              {story.status || 'Todo'}
            </Badge>
          </div>
        </div>
        
        {story.description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">{story.description}</p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={getPriorityColor(story.priority)} variant="outline">
              {story.priority || 'Medium'}
            </Badge>
            {story.estimated_hours && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                {story.estimated_hours}h
              </div>
            )}
            {story.story_points && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Target className="h-3 w-3" />
                {story.story_points} pts
              </div>
            )}
          </div>
          
          {story.acceptance_criteria && story.acceptance_criteria.length > 0 && (
            <Collapsible open={showCriteria} onOpenChange={setShowCriteria}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                  Criteria
                  {showCriteria ? (
                    <ChevronDown className="h-3 w-3 ml-1" />
                  ) : (
                    <ChevronRight className="h-3 w-3 ml-1" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="bg-white p-2 rounded border text-xs">
                  <ul className="space-y-1">
                    {story.acceptance_criteria.map((criteria: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span className="text-gray-700">{criteria}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserStoryMiniCard;
