
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PriorityBadge from '@/components/ui/priority-badge';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Plus, 
  FileText,
  Calendar
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Feature } from '@/hooks/useFeatures';
import { Link, useParams } from 'react-router-dom';

interface FeatureCardProps {
  feature: Feature;
  onEdit: (feature: Feature) => void;
  onDelete: (featureId: string) => void;
  onAddChild: (parentId: string) => void;
}

const FeatureCard = ({ feature, onEdit, onDelete, onAddChild }: FeatureCardProps) => {
  const { id: projectId } = useParams();

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'planned':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'on-hold':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getComplexityColor = (complexity: string | null) => {
    switch (complexity) {
      case 'simple':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'complex':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold mb-2">{feature.title}</CardTitle>
            <div className="flex flex-wrap gap-2 mb-2">
              <PriorityBadge priority={feature.priority as 'high' | 'medium' | 'low'} />
              <Badge variant="outline" className={getStatusColor(feature.status)}>
                {feature.status?.charAt(0).toUpperCase() + feature.status?.slice(1) || 'Unknown'}
              </Badge>
              {feature.complexity && (
                <Badge variant="outline" className={getComplexityColor(feature.complexity)}>
                  {feature.complexity.charAt(0).toUpperCase() + feature.complexity.slice(1)}
                </Badge>
              )}
              {feature.category && (
                <Badge variant="outline">
                  {feature.category}
                </Badge>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(feature)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Feature
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddChild(feature.id)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Child Feature
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/projects/${projectId}/features/${feature.id}/stories`}>
                  <FileText className="h-4 w-4 mr-2" />
                  User Stories
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(feature.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Feature
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      {feature.description && (
        <CardContent className="pt-0">
          <CardDescription className="text-sm text-gray-600">
            {feature.description}
          </CardDescription>
          
          <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
            <div className="flex items-center gap-4">
              {feature.created_at && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Created {new Date(feature.created_at).toLocaleDateString()}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/projects/${projectId}/features/${feature.id}/stories`}>
                  <FileText className="h-3 w-3 mr-1" />
                  Stories
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default FeatureCard;
