
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Plus, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import PriorityBadge from '@/components/ui/priority-badge';
import StatusBadge from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import type { Feature } from '@/hooks/useFeatures';

interface FeatureCardProps {
  feature: Feature;
  onEdit: (feature: Feature) => void;
  onDelete: (featureId: string) => void;
  onAddChild: (parentFeature: Feature) => void;
}

const FeatureCard = ({ feature, onEdit, onDelete, onAddChild }: FeatureCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-semibold text-gray-900 mb-2">
              {feature.title}
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <PriorityBadge 
                priority={(feature.priority as 'high' | 'medium' | 'low') || 'medium'} 
                size="sm" 
              />
              <StatusBadge 
                status={(feature.status as 'planned' | 'in-progress' | 'completed' | 'on-hold') || 'planned'} 
                size="sm" 
              />
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
