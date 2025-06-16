
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  MoreHorizontal,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface RootNodeProps {
  data: {
    title: string;
    description?: string;
    onEdit: (nodeId: string) => void;
    onAddChild: (nodeId: string) => void;
  };
}

interface FeatureNodeProps {
  data: {
    id: string;
    title: string;
    description?: string;
    priority?: string;
    complexity?: string;
    category?: string;
    onEdit: (nodeId: string) => void;
    onAddChild: (nodeId: string) => void;
    onDelete: (nodeId: string) => void;
  };
}

export const ProfessionalRootNode: React.FC<RootNodeProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow min-w-[300px] max-w-[400px]">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">{data.title}</h2>
            {data.description && (
              <p className="text-sm text-gray-600 leading-relaxed">{data.description}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => data.onEdit('root')}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => data.onAddChild('root')}
            size="sm"
            className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-0"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Feature
          </Button>
        </div>
      </div>
    </div>
  );
};

export const ProfessionalFeatureNode: React.FC<FeatureNodeProps> = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);

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
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow min-w-[280px] max-w-[350px]">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 text-sm leading-snug mb-2">{data.title}</h3>
            
            {/* Badges */}
            <div className="flex items-center gap-1.5 mb-2">
              {data.priority && (
                <Badge variant="outline" className={`text-xs px-2 py-0.5 ${getPriorityColor(data.priority)}`}>
                  {data.priority}
                </Badge>
              )}
              {data.complexity && (
                <Badge variant="outline" className={`text-xs px-2 py-0.5 ${getComplexityColor(data.complexity)}`}>
                  {data.complexity}
                </Badge>
              )}
              {data.category && (
                <Badge variant="outline" className="text-xs px-2 py-0.5 bg-gray-50 text-gray-600">
                  {data.category}
                </Badge>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => data.onEdit(data.id)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => data.onDelete(data.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {data.description && (
          <p className="text-xs text-gray-600 leading-relaxed mb-3">{data.description}</p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => data.onAddChild(data.id)}
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Sub-feature
          </Button>
          
          {data.description && (
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-gray-500"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
