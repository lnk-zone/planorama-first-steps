
import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import type { MindmapNode } from '@/lib/mindmapSync';
import type { Feature } from '@/hooks/useFeatures';

interface MindmapViewerProps {
  projectId: string;
  mindmapData?: {
    rootNode: MindmapNode;
    nodes: MindmapNode[];
    connections: Array<{ from: string; to: string }>;
  };
  features: Feature[];
  onNodeClick?: (node: MindmapNode) => void;
  onNodeUpdate?: (nodeId: string, updates: Partial<MindmapNode>) => void;
  onNodeDelete?: (nodeId: string) => void;
}

// Custom node component for mindmap nodes
const CustomMindmapNode = ({ data }: { data: any }) => {
  const { node, onEdit, onDelete } = data;
  
  return (
    <Card className="min-w-[200px] hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium leading-tight">
            {node.title}
          </CardTitle>
          <div className="flex gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(node);
              }}
              className="h-6 w-6 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
            {node.id !== 'root' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(node.id);
                }}
                className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      {(node.description || node.metadata) && (
        <CardContent className="pt-0">
          {node.description && (
            <p className="text-xs text-gray-600 mb-2 leading-relaxed">
              {node.description}
            </p>
          )}
          {node.metadata && (
            <div className="flex flex-wrap gap-1">
              {node.metadata.priority && (
                <Badge variant="outline" className="text-xs">
                  {node.metadata.priority}
                </Badge>
              )}
              {node.metadata.category && (
                <Badge variant="outline" className="text-xs">
                  {node.metadata.category}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

const nodeTypes = {
  mindmapNode: CustomMindmapNode,
};

const MindmapViewer = ({
  projectId,
  mindmapData,
  features,
  onNodeClick,
  onNodeUpdate,
  onNodeDelete
}: MindmapViewerProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Convert mindmap data to React Flow format
  useEffect(() => {
    if (!mindmapData) {
      // Create a default structure if no mindmap data exists
      const defaultNodes: Node[] = [
        {
          id: 'root',
          type: 'mindmapNode',
          position: { x: 400, y: 200 },
          data: {
            node: {
              id: 'root',
              title: 'Project Root',
              description: 'Main project node',
              position: { x: 400, y: 200 }
            },
            onEdit: (node: MindmapNode) => onNodeClick?.(node),
            onDelete: (nodeId: string) => onNodeDelete?.(nodeId)
          }
        }
      ];

      // Add nodes for existing features
      const featureNodes: Node[] = features.map((feature, index) => ({
        id: `feature_${feature.id}`,
        type: 'mindmapNode',
        position: { 
          x: 200 + (index % 3) * 300, 
          y: 400 + Math.floor(index / 3) * 150 
        },
        data: {
          node: {
            id: `feature_${feature.id}`,
            title: feature.title,
            description: feature.description || '',
            parentId: 'root',
            position: { 
              x: 200 + (index % 3) * 300, 
              y: 400 + Math.floor(index / 3) * 150 
            },
            style: { color: '#3b82f6', size: 'medium' },
            metadata: {
              priority: feature.priority || 'medium',
              category: feature.category || 'core',
              complexity: feature.complexity || 'medium',
              featureId: feature.id
            }
          },
          onEdit: (node: MindmapNode) => onNodeClick?.(node),
          onDelete: (nodeId: string) => onNodeDelete?.(nodeId)
        }
      }));

      const featureEdges: Edge[] = features.map(feature => ({
        id: `edge_root_to_feature_${feature.id}`,
        source: 'root',
        target: `feature_${feature.id}`,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        style: { stroke: '#6b7280' }
      }));

      setNodes([...defaultNodes, ...featureNodes]);
      setEdges(featureEdges);
      return;
    }

    // Convert mindmap data to React Flow nodes
    const flowNodes: Node[] = [];
    
    // Add root node
    if (mindmapData.rootNode) {
      flowNodes.push({
        id: mindmapData.rootNode.id,
        type: 'mindmapNode',
        position: mindmapData.rootNode.position,
        data: {
          node: mindmapData.rootNode,
          onEdit: (node: MindmapNode) => onNodeClick?.(node),
          onDelete: (nodeId: string) => onNodeDelete?.(nodeId)
        }
      });
    }

    // Add other nodes
    mindmapData.nodes.forEach(node => {
      flowNodes.push({
        id: node.id,
        type: 'mindmapNode',
        position: node.position,
        data: {
          node,
          onEdit: (node: MindmapNode) => onNodeClick?.(node),
          onDelete: (nodeId: string) => onNodeDelete?.(nodeId)
        }
      });
    });

    // Convert connections to edges
    const flowEdges: Edge[] = mindmapData.connections.map((connection, index) => ({
      id: `edge_${connection.from}_to_${connection.to}_${index}`,
      source: connection.from,
      target: connection.to,
      type: 'smoothstep',
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
      style: { stroke: '#6b7280' }
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [mindmapData, features, onNodeClick, onNodeDelete]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const handleNodeDrag = useCallback((event: any, node: Node) => {
    if (onNodeUpdate) {
      onNodeUpdate(node.id, {
        position: node.position
      });
    }
  }, [onNodeUpdate]);

  if (!mindmapData && features.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Mindmap Data</h3>
          <p className="text-gray-600">
            Generate a mindmap using AI or add features to see them visualized here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[600px] w-full border rounded-lg overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={handleNodeDrag}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
        minZoom={0.2}
        maxZoom={2}
      >
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};

export default MindmapViewer;
