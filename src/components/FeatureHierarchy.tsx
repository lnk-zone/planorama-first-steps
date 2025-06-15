import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight, ChevronDown, Plus, Edit, Trash2 } from 'lucide-react';
import type { Feature } from '@/hooks/useFeatures';

interface FeatureHierarchyProps {
  features: Feature[];
  onFeatureSelect: (feature: Feature) => void;
  onAddChild: (parentFeature: Feature) => void;
  onEdit: (feature: Feature) => void;
  onDelete: (featureId: string) => void;
}

interface FeatureNode extends Feature {
  children: FeatureNode[];
  level: number;
}

const FeatureHierarchy = ({ features, onFeatureSelect, onAddChild, onEdit, onDelete }: FeatureHierarchyProps) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Build hierarchy tree
  const buildHierarchy = (features: Feature[]): FeatureNode[] => {
    const featureMap = new Map<string, FeatureNode>();
    const rootFeatures: FeatureNode[] = [];

    // Initialize all features as nodes
    features.forEach(feature => {
      featureMap.set(feature.id, {
        ...feature,
        children: [],
        level: 0
      });
    });

    // Build parent-child relationships and set levels
    const setChildLevel = (node: FeatureNode, level: number) => {
      node.level = level;
      node.children.forEach(child => setChildLevel(child, level + 1));
    };

    features.forEach(feature => {
      const node = featureMap.get(feature.id)!;
      
      if (feature.parent_id && featureMap.has(feature.parent_id)) {
        const parent = featureMap.get(feature.parent_id)!;
        parent.children.push(node);
      } else {
        rootFeatures.push(node);
      }
    });

    // Set correct levels for all nodes
    rootFeatures.forEach(root => setChildLevel(root, 0));

    return rootFeatures;
  };

  const hierarchy = buildHierarchy(features);

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

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

  const renderFeatureNode = (node: FeatureNode): JSX.Element => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const paddingLeft = node.level * 20;

    return (
      <div key={node.id} className="space-y-2">
        <Card className="hover:shadow-md transition-shadow" style={{ marginLeft: `${paddingLeft}px` }}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-1">
                {hasChildren ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => toggleExpanded(node.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                ) : (
                  <div className="w-6" />
                )}
                
                <div className="flex-1">
                  <CardTitle 
                    className="text-lg cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => onFeatureSelect(node)}
                  >
                    {node.title}
                  </CardTitle>
                  <div className="flex gap-2 mt-1">
                    <Badge className={getPriorityColor(node.priority)} variant="outline">
                      {node.priority || 'medium'}
                    </Badge>
                    <Badge className={getStatusColor(node.status)} variant="outline">
                      {node.status || 'planned'}
                    </Badge>
                    {hasChildren && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {node.children.length} child{node.children.length !== 1 ? 'ren' : ''}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(node)}
                  className="h-8 w-8 p-0"
                  title="Edit feature"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddChild(node)}
                  className="h-8 w-8 p-0"
                  title="Add child feature"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(node.id)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                  title="Delete feature"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {node.description && (
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600">
                {node.description}
              </p>
            </CardContent>
          )}
        </Card>

        {hasChildren && isExpanded && (
          <div className="space-y-2">
            {node.children.map(child => renderFeatureNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {hierarchy.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No features to display in hierarchy view</p>
        </div>
      ) : (
        hierarchy.map(node => renderFeatureNode(node))
      )}
    </div>
  );
};

export default FeatureHierarchy;
