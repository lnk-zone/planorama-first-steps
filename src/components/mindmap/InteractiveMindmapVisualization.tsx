
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
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ProfessionalRootNode, ProfessionalFeatureNode } from './ProfessionalNodes';
import { MindmapToolbar } from './MindmapToolbar';
import { ProfessionalLayoutEngine } from '@/lib/enhancedLayoutEngine';
import { toast } from '@/hooks/use-toast';
import { useFeatures } from '@/hooks/useFeatures';
import { useUserStories } from '@/hooks/useUserStories';

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
    featureId?: string;
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

const nodeTypes: NodeTypes = {
  rootNode: ProfessionalRootNode,
  featureNode: ProfessionalFeatureNode,
};

export interface InteractiveMindmapVisualizationProps {
  mindmap: MindmapStructure;
  mindmapId?: string;
  projectId: string;
  onNodeEdit?: (nodeId: string) => void;
  onNodeDelete?: (nodeId: string) => void;
  onNodeAdd?: (parentId: string) => void;
  onMindmapUpdate?: (updates: Partial<MindmapStructure>) => void;
}

const InteractiveMindmapVisualization: React.FC<InteractiveMindmapVisualizationProps> = ({
  mindmap,
  mindmapId,
  projectId,
  onNodeEdit,
  onNodeDelete,
  onNodeAdd,
  onMindmapUpdate,
}) => {
  const { features } = useFeatures(projectId);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [userStoriesCache, setUserStoriesCache] = useState<Record<string, any[]>>({});

  // Build feature mapping for node-feature synchronization
  const featureMapping = useMemo(() => {
    const mapping: Record<string, string> = {};
    
    // Map existing nodes to features by title matching
    mindmap.nodes.forEach(node => {
      const matchingFeature = features.find(f => 
        f.title === node.title || node.metadata?.featureId === f.id
      );
      if (matchingFeature) {
        mapping[node.id] = matchingFeature.id;
      }
    });
    
    return mapping;
  }, [mindmap.nodes, features]);

  // Generate connections based on feature hierarchy and explicit mindmap connections
  const generateConnections = useCallback(() => {
    const connections: MindmapConnection[] = [];
    
    // Add explicit mindmap connections
    connections.push(...mindmap.connections);
    
    // Add connections based on feature parent-child relationships
    features.forEach(feature => {
      if (feature.parent_id) {
        // Find nodes corresponding to this feature and its parent
        const childNodeId = Object.keys(featureMapping).find(nodeId => 
          featureMapping[nodeId] === feature.id
        );
        const parentNodeId = Object.keys(featureMapping).find(nodeId => 
          featureMapping[nodeId] === feature.parent_id
        );
        
        if (childNodeId && parentNodeId) {
          // Avoid duplicates
          const existingConnection = connections.find(conn => 
            conn.from === parentNodeId && conn.to === childNodeId
          );
          if (!existingConnection) {
            connections.push({ from: parentNodeId, to: childNodeId });
          }
        }
      } else {
        // Top-level feature connects to root
        const nodeId = Object.keys(featureMapping).find(nId => 
          featureMapping[nId] === feature.id
        );
        if (nodeId) {
          const existingConnection = connections.find(conn => 
            conn.from === mindmap.rootNode.id && conn.to === nodeId
          );
          if (!existingConnection) {
            connections.push({ from: mindmap.rootNode.id, to: nodeId });
          }
        }
      }
    });
    
    return connections;
  }, [mindmap.connections, mindmap.rootNode.id, features, featureMapping]);

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

    // Add feature nodes with user stories integration
    mindmap.nodes.forEach((node) => {
      const featureId = featureMapping[node.id];
      const feature = features.find(f => f.id === featureId);
      const userStories = userStoriesCache[featureId] || [];
      const isExpanded = expandedNodes.has(node.id);

      flowNodes.push({
        id: node.id,
        type: 'featureNode',
        position: node.position,
        data: {
          id: node.id,
          title: node.title,
          description: node.description,
          priority: node.metadata?.priority || feature?.priority,
          complexity: node.metadata?.complexity || feature?.complexity,
          category: node.metadata?.category || feature?.category,
          featureId,
          userStories,
          isExpanded,
          onEdit: onNodeEdit || (() => {}),
          onAddChild: onNodeAdd || (() => {}),
          onDelete: onNodeDelete || (() => {}),
          onToggleExpand: (nodeId: string) => {
            setExpandedNodes(prev => {
              const newSet = new Set(prev);
              if (newSet.has(nodeId)) {
                newSet.delete(nodeId);
              } else {
                newSet.add(nodeId);
              }
              return newSet;
            });
          },
        },
      });
    });

    return flowNodes;
  }, [mindmap, featureMapping, features, userStoriesCache, expandedNodes, onNodeEdit, onNodeAdd, onNodeDelete]);

  const initialEdges = useMemo(() => {
    const connections = generateConnections();
    
    return connections.map((conn) => ({
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
        type: MarkerType.ArrowClosed,
        color: '#e2e8f0',
      },
    }));
  }, [generateConnections]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Update nodes and edges when dependencies change
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Load user stories for expanded nodes
  useEffect(() => {
    const loadUserStories = async () => {
      const newCache = { ...userStoriesCache };
      
      for (const nodeId of expandedNodes) {
        const featureId = featureMapping[nodeId];
        if (featureId && !newCache[featureId]) {
          try {
            // This would ideally use the useUserStories hook, but for now we'll simulate
            newCache[featureId] = []; // Placeholder - in real implementation, fetch user stories
          } catch (error) {
            console.error('Failed to load user stories:', error);
          }
        }
      }
      
      setUserStoriesCache(newCache);
    };

    loadUserStories();
  }, [expandedNodes, featureMapping, userStoriesCache]);

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
            variant="dots"
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
