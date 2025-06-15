
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, CheckCircle } from 'lucide-react';
import type { UserStory } from '@/hooks/useUserStories';

interface UserStoryCardProps {
  story: UserStory;
  onEdit: (story: UserStory) => void;
  onDelete: (storyId: string) => void;
}

const UserStoryCard = ({ story, onEdit, onDelete }: UserStoryCardProps) => {
  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
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

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'ready':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-medium">{story.title}</CardTitle>
            <div className="flex gap-2 mt-2">
              <Badge className={getPriorityColor(story.priority)}>
                {(story.priority || 'medium').charAt(0).toUpperCase() + (story.priority || 'medium').slice(1)}
              </Badge>
              <Badge className={getStatusColor(story.status)}>
                {(story.status || 'draft').charAt(0).toUpperCase() + (story.status || 'draft').slice(1)}
              </Badge>
              {story.story_points && (
                <Badge variant="outline">
                  {story.story_points} {story.story_points === 1 ? 'point' : 'points'}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(story)}
              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(story.id)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {story.description && (
          <CardDescription className="mb-4">
            {story.description}
          </CardDescription>
        )}
        
        {story.acceptance_criteria && story.acceptance_criteria.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Acceptance Criteria:</h4>
            <ul className="space-y-1">
              {story.acceptance_criteria.map((criteria, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {criteria}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserStoryCard;
