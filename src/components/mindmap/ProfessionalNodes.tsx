
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  User,
  CheckCircle2
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
    featureId?: string;
    userStories?: Array<{
      id: string;
      title: string;
      description?: string;
      status?: string;
      priority?: string;
    }>;
    isExpanded?: boolean;
    onEdit: (nodeId: string) => void;
    onAddChild: (nodeId: string) => void;
    onDelete: (nodeId: string) => void;
    onToggleExpand: (nodeId: string) => void;
  };
}

export const ProfessionalRootNode: React.FC<RootNodeProps> = ({ data }) => {
  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 min-w-[320px] max-w-[400px] border-0">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2 leading-tight">{data.title}</h2>
            {data.description && (
              <p className="text-blue-100 text-sm leading-relaxed opacity-90">{data.description}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white hover:bg-white/20">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white">
              <DropdownMenuItem onClick={() => data.onEdit('root')}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <Button
          onClick={() => data.onAddChild('root')}
          size="sm"
          variant="secondary"
          className="bg-white/20 text-white hover:bg-white/30 border-0 backdrop-blur-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Feature
        </Button>
      </div>
    </div>
  );
};

export const ProfessionalFeatureNode: React.FC<FeatureNodeProps> = ({ data }) => {
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'core': return 'bg-indigo-50 text-indigo-700';
      case 'ui': return 'bg-pink-50 text-pink-700';
      case 'integration': return 'bg-orange-50 text-orange-700';
      case 'admin': return 'bg-gray-50 text-gray-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const hasUserStories = data.userStories && data.userStories.length > 0;

  return (
    <Card className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 min-w-[300px] max-w-[380px]">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-base leading-snug mb-2 pr-2">{data.title}</h3>
            
            {/* Badges */}
            <div className="flex items-center gap-1.5 mb-3 flex-wrap">
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
                <Badge variant="outline" className={`text-xs px-2 py-0.5 ${getCategoryColor(data.category)}`}>
                  {data.category}
                </Badge>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2 text-gray-500 hover:text-gray-700">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => data.onEdit(data.id)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => data.onDelete(data.id)} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {data.description && !data.isExpanded && (
          <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-2">{data.description}</p>
        )}

        {/* Expanded Content - User Stories */}
        {data.isExpanded && (
          <div className="mb-4 space-y-3">
            {data.description && (
              <p className="text-sm text-gray-600 leading-relaxed">{data.description}</p>
            )}
            
            {hasUserStories && (
              <div className="border-t pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">User Stories</span>
                  <Badge variant="outline" className="text-xs">
                    {data.userStories!.length}
                  </Badge>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {data.userStories!.map((story) => (
                    <div key={story.id} className="bg-gray-50 rounded-md p-2 text-xs">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 leading-tight">{story.title}</p>
                          {story.description && (
                            <p className="text-gray-600 mt-1 leading-tight">{story.description}</p>
                          )}
                          <div className="flex gap-1 mt-1">
                            {story.status && (
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                {story.status}
                              </Badge>
                            )}
                            {story.priority && (
                              <Badge variant="outline" className={`text-xs px-1 py-0 ${getPriorityColor(story.priority)}`}>
                                {story.priority}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {!hasUserStories && (
              <div className="border-t pt-3">
                <div className="flex items-center gap-2 text-gray-500">
                  <User className="h-4 w-4" />
                  <span className="text-sm">No user stories yet</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => data.onAddChild(data.id)}
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Sub-feature
          </Button>
          
          <Button
            onClick={() => data.onToggleExpand(data.id)}
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs text-gray-500 hover:text-gray-700"
          >
            {data.isExpanded ? (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Collapse
              </>
            ) : (
              <>
                <ChevronRight className="h-3 w-3 mr-1" />
                {hasUserStories ? `${data.userStories!.length} Stories` : 'Expand'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
