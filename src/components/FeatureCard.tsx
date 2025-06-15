
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Plus, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Feature } from '@/hooks/useFeatures';

interface FeatureCardProps {
  feature: Feature;
  onEdit: (feature: Feature) => void;
  onDelete: (featureId: string) => void;
  onAddChild: (parentFeature: Feature) => void;
}

const FeatureCard = ({ feature, onEdit, onDelete, onAddChild }: FeatureCardProps) => {
  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'planned': return 'bg-gray-100 text-gray-800';
      case 'on-hold': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
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
              {feature.category && (
                <Badge variant="outline">
                  {feature.category}
                </Badge>
              )}
              {feature.complexity && (
                <Badge variant="outline">
                  {feature.complexity} complexity
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(feature)}
              className="h-8 w-8 p-0"
              title="Edit feature"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddChild(feature)}
              className="h-8 w-8 p-0"
              title="Add child feature"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Link
              to={`/projects/${feature.project_id}/features/${feature.id}/stories`}
              className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent hover:text-accent-foreground"
              title="View user stories"
            >
              <MessageSquare className="h-4 w-4" />
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(feature.id)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
              title="Delete feature"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {feature.description && (
        <CardContent>
          <p className="text-gray-600 leading-relaxed">
            {feature.description}
          </p>
        </CardContent>
      )}
    </Card>
  );
};

export default FeatureCard;
