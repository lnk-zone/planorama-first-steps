import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  ConnectionMode,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ProfessionalRootNode, ProfessionalFeatureNode } from './ProfessionalNodes';
import { MindmapToolbar } from './MindmapToolbar';
import { ProfessionalLayoutEngine } from '@/lib/enhancedLayoutEngine';
import { toast } from '@/hooks/use-toast';
import {
  Plus, Edit3, Trash2, MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface MindmapNode {
  id: string;
  title: string;
  description?: string;
  parentId?: string;
  position: { x: number; y: number };
  style?: { color?: string; size?: string };
  metadata?: {
    priority?: string;
    complexity?: string;
    category?: string;
    notes?: string;
    todos?: Array<{ id: string; text: string; completed: boolean }>;
  };
}

export interface MindmapConnection {
  from: string;
  to: string;
}

export interface MindmapStructure {
  rootNode: MindmapNode;
  nodes: MindmapNode[];
  connections: MindmapConnection[];
}

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
    notes?: string;
    todos?: Array<{ id: string; text: string; completed: boolean }>;
    onEdit: (nodeId: string) => void;
    onAddChild: (nodeId: string) => void;
    onDelete: (nodeId: string) => void;
    onUpdateTodo: (nodeId: string, todoId: string, updates: any) => void;
  };
}

const nodeTypes: NodeTypes = {
  rootNode: ProfessionalRootNode,
  featureNode: ProfessionalFeatureNode,
};

export interface InteractiveMindmapVisualizationProps {
  mindmap: MindmapStructure;
  mindmapId?: string;
  onNodeEdit?: (nodeId: string) => void;
  onNodeDelete?: (nodeId: string) => void;
  onNodeAdd?: (parentId: string) => void;
  onMindmapUpdate?: (updates: Partial<MindmapStructure>) => void;
}

const InteractiveMindmapVisualization: React.FC<InteractiveMindmapVisualizationProps> = ({
  mindmap,
  mindmapId,
  onNodeEdit,
  onNodeDelete,
  onNodeAdd,
  onMindmapUpdate,
}) => {
  // Convert mindmap structure to React Flow format
  const initialNodes = useMemo(() => {
    const flowNodes: Node[] = [];

    // Add root node
    flowNodes.push({
      id: mindmap.rootNode.id,
      type: 'rootNode',
      position: mindmap.rootNode.position,
      data: {
        title: mindmap.rootNode.title,
        description: mindmap.rootNode.description,
        onEdit: onNodeEdit || (() => {}),
        onAddChild: onNodeAdd || (() => {}),
      },
    });

    // Add feature nodes
    mindmap.nodes.forEach((node) => {
      flowNodes.push({
        id: node.id,
        type: 'featureNode',
        position: node.position,
        data: {
          id: node.id,
          title: node.title,
          description: node.description,
          priority: node.metadata?.priority,
          complexity: node.metadata?.complexity,
          category: node.metadata?.category,
          onEdit: onNodeEdit || (() => {}),
          onAddChild: onNodeAdd || (() => {}),
          onDelete: onNodeDelete || (() => {}),
        },
      });
    });

    return flowNodes;
  }, [mindmap, onNodeEdit, onNodeAdd, onNodeDelete]);

  const initialEdges = useMemo(() => {
    return mindmap.connections.map((conn, index) => ({
      id: `${conn.from}-${conn.to}`,
      source: conn.from,
      target: conn.to,
      type: 'smoothstep',
      animated: false,
      style: { 
        stroke: '#e2e8f0', 
        strokeWidth: 2,
      },
      markerEnd: {
        type: 'arrowclosed' as const,
        color: '#e2e8f0',
      },
    }));
  }, [mindmap.connections]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Update nodes when mindmap changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Toolbar handlers
  const handleAutoLayout = useCallback(() => {
    const layoutNodes = nodes.map(node => ({
      id: node.id,
      x: node.position.x,
      y: node.position.y,
      parentId: edges.find(edge => edge.target === node.id)?.source || null,
    }));

    const layoutLinks = edges.map(edge => ({
      source: edge.source,
      target: edge.target,
    }));

    const newPositions = ProfessionalLayoutEngine.hierarchicalLayout(
      layoutNodes,
      layoutLinks,
      { width: 1200, height: 800, nodeSpacing: 350, levelSpacing: 250 }
    );

    const positionMap = newPositions.reduce((acc, node) => {
      acc[node.id] = { x: node.x, y: node.y };
      return acc;
    }, {} as Record<string, { x: number; y: number }>);

    setNodes(nodes => 
      nodes.map(node => ({
        ...node,
        position: positionMap[node.id] || node.position,
      }))
    );

    toast({
      title: "Layout updated",
      description: "Nodes have been automatically arranged.",
    });
  }, [nodes, edges, setNodes]);

  const handleExport = useCallback(() => {
    toast({
      title: "Export coming soon",
      description: "Export functionality will be available soon.",
    });
  }, []);

  const handleShare = useCallback(() => {
    toast({
      title: "Share coming soon", 
      description: "Sharing functionality will be available soon.",
    });
  }, []);

  const handleGeneratePRD = useCallback(() => {
    toast({
      title: "PRD Generation coming soon",
      description: "PRD generation will be available soon.",
    });
  }, []);

  return (
    <div className="w-full h-full bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
      {/* Toolbar */}
      <MindmapToolbar
        onZoomIn={() => {}}
        onZoomOut={() => {}}
        onFitView={() => {}}
        onExport={handleExport}
        onShare={handleShare}
        onGeneratePRD={handleGeneratePRD}
        onAutoLayout={handleAutoLayout}
        nodeCount={nodes.length}
        connectionCount={edges.length}
      />

      {/* Mindmap */}
      <div className="w-full" style={{ height: 'calc(100% - 80px)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.2}
          maxZoom={1.8}
          defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
        >
          <Background 
            color="#f1f5f9" 
            gap={24} 
            size={1}
            variant="dots" as any
          />
          <Controls 
            className="bg-white border border-gray-200 rounded-lg shadow-sm"
            showInteractive={false}
          />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === 'rootNode') return '#3b82f6';
              return '#64748b';
            }}
            className="bg-white border border-gray-200 rounded-lg"
            maskColor="rgba(255, 255, 255, 0.8)"
          />
        </ReactFlow>
      </div>
    </div>
  );
};

export default InteractiveMindmapVisualization;
