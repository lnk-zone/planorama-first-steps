
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Eye, Edit, Trash2, Plus } from 'lucide-react';
import { useUserStories } from '@/hooks/useUserStories';
import UserStoryMiniCard from './UserStoryMiniCard';

interface CollapsibleFeatureCardProps {
  feature: any;
  onEdit: (feature: any) => void;
  onDelete: (featureId: string) => void;
  onAddChild: (parentFeature: any) => void;
}

const CollapsibleFeatureCard: React.FC<CollapsibleFeatureCardProps> = ({
  feature,
  onEdit,
  onDelete,
  onAddChild
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { userStories, loading } = useUserStories([feature.id]);

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

  const featureStories = userStories.filter(story => story.feature_id === feature.id);

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
              {feature.title}
            </CardTitle>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getPriorityColor(feature.priority)}>
                {feature.priority || 'Medium'}
              </Badge>
              <Badge variant="outline">
                {feature.category || 'Feature'}
              </Badge>
              {feature.estimated_hours && (
                <Badge variant="secondary">
                  {feature.estimated_hours}h
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(feature)}
              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
              title="Edit feature"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddChild(feature)}
              className="h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-50"
              title="Add child feature"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(feature.id)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
              title="Delete feature"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {feature.description && (
          <p className="text-gray-600 mb-4 text-sm">{feature.description}</p>
        )}
        
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between"
              disabled={loading}
            >
              <span className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                View User Stories ({featureStories.length})
              </span>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-4">
            {loading ? (
              <div className="space-y-2">
                <div className="h-16 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-16 bg-gray-100 rounded animate-pulse"></div>
              </div>
            ) : featureStories.length > 0 ? (
              <div className="space-y-3">
                {featureStories.map((story) => (
                  <UserStoryMiniCard key={story.id} story={story} />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p className="text-sm">No user stories yet</p>
                <p className="text-xs">Add some user stories to this feature</p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default CollapsibleFeatureCard;
