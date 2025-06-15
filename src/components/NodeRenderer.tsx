import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '@/components/ui/context-menu';
import { Edit, Plus, Trash2 } from 'lucide-react';
import type { MindmapNode } from './mindmap/MindmapVisualization';

export interface NodeRendererProps {
  node: MindmapNode;
  scale: number;
  onEdit?: (node: MindmapNode) => void;
  onDelete?: (node: MindmapNode) => void;
  onAddChild?: (node: MindmapNode) => void;
}

const getPriorityColor = (priority?: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'medium':
    default:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  }
};

const NodeRenderer = ({ node, scale, onEdit, onDelete, onAddChild }: NodeRendererProps) => {
  const [hovered, setHovered] = useState(false);

  const showDetails = scale > 0.7;
  const showDescription = scale > 1;

  const priority = (node.metadata?.priority as string) || 'medium';
  const complexity = node.metadata?.complexity as string | undefined;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className="relative" style={{ width: showDetails ? 180 : 120 }}
        >
          <Card
            className={`transition-shadow ${hovered ? 'shadow-lg' : 'shadow'}`}
            style={{ fontSize: showDetails ? '0.75rem' : '0.65rem' }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{node.title}</CardTitle>
            </CardHeader>
            {showDescription && node.description && (
              <CardContent className="pt-0">
                <p className="text-xs text-gray-600">{node.description}</p>
              </CardContent>
            )}
            {showDetails && (
              <CardContent className="pt-2 flex gap-1 items-center">
                <Badge variant="outline" className={getPriorityColor(priority)}>
                  {priority}
                </Badge>
                {complexity && (
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                    {complexity}
                  </Badge>
                )}
              </CardContent>
            )}
            {hovered && showDetails && (
              <div className="absolute top-1 right-1 flex gap-1">
                {onEdit && (
                  <button className="p-1 hover:text-blue-600" onClick={() => onEdit(node)}>
                    <Edit className="h-3 w-3" />
                  </button>
                )}
                {onAddChild && (
                  <button className="p-1 hover:text-green-600" onClick={() => onAddChild(node)}>
                    <Plus className="h-3 w-3" />
                  </button>
                )}
                {onDelete && (
                  <button className="p-1 text-red-600 hover:text-red-800" onClick={() => onDelete(node)}>
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
          </Card>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {onEdit && <ContextMenuItem onSelect={() => onEdit(node)}>Edit</ContextMenuItem>}
        {onAddChild && <ContextMenuItem onSelect={() => onAddChild(node)}>Add child</ContextMenuItem>}
        {onDelete && (
          <ContextMenuItem onSelect={() => onDelete(node)} className="text-red-600">
            Delete
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default NodeRenderer;
