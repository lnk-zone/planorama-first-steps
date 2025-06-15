
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Plus, FileText } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Feature } from '@/hooks/useFeatures';

interface FeatureCardProps {
  feature: Feature;
  onEdit: (feature: Feature) => void;
  onDelete: (featureId: string) => void;
  onAddChild: (parentId: string) => void;
}

const FeatureCard = ({ feature, onEdit, onDelete, onAddChild }: FeatureCardProps) => {
  const { id: projectId } = useParams();
  const [userStoriesCount, setUserStoriesCount] = useState(0);

  useEffect(() => {
    const fetchUserStoriesCount = async () => {
      const { count } = await supabase
        .from('user_stories')
        .select('*', { count: 'exact', head: true })
        .eq('feature_id', feature.id);
      
      setUserStoriesCount(count || 0);
    };

    fetchUserStoriesCount();
  }, [feature.id]);

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
      case 'planned':
        return 'bg-gray-100 text-gray-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'on-hold':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplexityColor = (complexity: string | null) => {
    switch (complexity) {
      case 'simple':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'complex':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-semibold text-gray-900 mb-2">
              {feature.title}
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge className={getPriorityColor(feature.priority)}>
                {(feature.priority || 'medium').charAt(0).toUpperCase() + (feature.priority || 'medium').slice(1)} Priority
              </Badge>
              <Badge className={getStatusColor(feature.status)}>
                {(feature.status || 'planned').charAt(0).toUpperCase() + (feature.status || 'planned').slice(1)}
              </Badge>
              <Badge className={getComplexityColor(feature.complexity)}>
                {(feature.complexity || 'medium').charAt(0).toUpperCase() + (feature.complexity || 'medium').slice(1)} Complexity
              </Badge>
              {feature.category && (
                <Badge variant="outline">
                  {feature.category}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1 ml-2">
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
              onClick={() => onAddChild(feature.id)}
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
          <CardDescription className="text-gray-600 leading-relaxed mb-4">
            {feature.description}
          </CardDescription>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>
              Created {new Date(feature.created_at || '').toLocaleDateString()}
            </span>
            {userStoriesCount > 0 && (
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {userStoriesCount} {userStoriesCount === 1 ? 'story' : 'stories'}
              </span>
            )}
          </div>
          
          <Link to={`/projects/${projectId}/features/${feature.id}/stories`}>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              {userStoriesCount === 0 ? 'Add Stories' : 'View Stories'}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureCard;
