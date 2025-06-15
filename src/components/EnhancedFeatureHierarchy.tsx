
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown, Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import PriorityBadge from '@/components/ui/priority-badge';
import StatusBadge from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import type { Feature } from '@/hooks/useFeatures';

interface EnhancedFeatureHierarchyProps {
  features: Feature[];
  onFeatureSelect: (feature: Feature) => void;
  onAddChild: (parentFeature: Feature) => void;
  onEdit: (feature: Feature) => void;
  onDelete: (featureId: string) => void;
  onReorder?: (features: Feature[]) => void;
}

interface FeatureNode extends Feature {
  children: FeatureNode[];
  level: number;
}

const EnhancedFeatureHierarchy = ({ 
  features, 
  onFeatureSelect, 
  onAddChild, 
  onEdit, 
  onDelete,
  onReorder 
}: EnhancedFeatureHierarchyProps) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [draggedItem, setDraggedItem] = useState<FeatureNode | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);

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

  const handleDragStart = (e: React.DragEvent, node: FeatureNode) => {
    setDraggedItem(node);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragOver = (e: React.DragEvent, targetNode: FeatureNode) => {
    e.preventDefault();
    setDragOverItem(targetNode.id);
  };

  const handleDrop = (e: React.DragEvent, targetNode: FeatureNode) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.id === targetNode.id || !onReorder) {
      return;
    }

    // Prevent dropping parent onto its own child
    const isChildOf = (parent: FeatureNode, child: FeatureNode): boolean => {
      return parent.children.some(c => c.id === child.id || isChildOf(c, child));
    };

    if (isChildOf(draggedItem, targetNode)) {
      setDragOverItem(null);
      setDraggedItem(null);
      return;
    }

    // For now, just trigger a reorder of the flat features list
    // In a full implementation, you'd handle parent-child reassignment here
    const flatFeatures = features.map(f => f.id === draggedItem.id ? { ...f, parent_id: targetNode.id } : f);
    onReorder(flatFeatures);
    
    setDragOverItem(null);
    setDraggedItem(null);
  };

  const renderConnectionLine = (level: number, isLast: boolean, hasChildren: boolean) => {
    if (level === 0) return null;

    return (
      <div className="absolute left-0 top-0 h-full w-full pointer-events-none">
        {/* Vertical line from parent */}
        <div 
          className="absolute bg-gray-300"
          style={{
            left: `${(level - 1) * 20 + 12}px`,
            top: '0px',
            width: '1px',
            height: isLast ? '24px' : '100%'
          }}
        />
        {/* Horizontal line to node */}
        <div 
          className="absolute bg-gray-300"
          style={{
            left: `${(level - 1) * 20 + 12}px`,
            top: '24px',
            width: '20px',
            height: '1px'
          }}
        />
        {/* Vertical line continuation for children */}
        {hasChildren && (
          <div 
            className="absolute bg-gray-300"
            style={{
              left: `${level * 20 + 12}px`,
              top: '48px',
              width: '1px',
              height: 'calc(100% - 48px)'
            }}
          />
        )}
      </div>
    );
  };

  const renderFeatureNode = (node: FeatureNode, isLast: boolean = false): JSX.Element => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const paddingLeft = node.level * 20;

    return (
      <div key={node.id} className="relative">
        {renderConnectionLine(node.level, isLast, hasChildren && isExpanded)}
        
        <Card 
          className={`hover:shadow-md transition-all duration-200 ${
            dragOverItem === node.id ? 'border-blue-400 shadow-lg' : ''
          } ${draggedItem?.id === node.id ? 'opacity-50' : ''}`}
          style={{ marginLeft: `${paddingLeft}px`, marginBottom: '8px' }}
          draggable={!!onReorder}
          onDragStart={(e) => handleDragStart(e, node)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, node)}
          onDrop={(e) => handleDrop(e, node)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-1">
                {onReorder && (
                  <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                )}
                
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
                    <PriorityBadge 
                      priority={(node.priority as 'high' | 'medium' | 'low') || 'medium'} 
                      size="sm" 
                    />
                    <StatusBadge 
                      status={(node.status as 'planned' | 'in-progress' | 'completed' | 'on-hold') || 'planned'} 
                      size="sm" 
                    />
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
          <div className="relative">
            {node.children.map((child, index) => 
              renderFeatureNode(child, index === node.children.length - 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 relative">
      {hierarchy.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No features to display in hierarchy view</p>
        </div>
      ) : (
        <div className="relative">
          {hierarchy.map((node, index) => 
            renderFeatureNode(node, index === hierarchy.length - 1)
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedFeatureHierarchy;
