
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
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ProfessionalRootNode, ProfessionalFeatureNode } from './ProfessionalNodes';
import { MindmapToolbar } from './MindmapToolbar';
import { ProfessionalLayoutEngine } from '@/lib/enhancedLayoutEngine';
import { toast } from '@/hooks/use-toast';
import { useFeatures } from '@/hooks/useFeatures';

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

  // Build stable feature mapping for node-feature synchronization
  const featureMapping = useMemo(() => {
    const mapping: Record<string, string> = {};
    
    console.log('Building feature mapping...');
    console.log('Features:', features);
    console.log('Mindmap nodes:', mindmap.nodes);
    
    // First try to map by featureId in metadata
    mindmap.nodes.forEach(node => {
      if (node.metadata?.featureId) {
        const feature = features.find(f => f.id === node.metadata.featureId);
        if (feature) {
          mapping[node.id] = feature.id;
          console.log(`Mapped node ${node.id} to feature ${feature.id} by featureId`);
        }
      }
    });
    
    // Then try to map by title matching for unmapped nodes
    mindmap.nodes.forEach(node => {
      if (!mapping[node.id]) {
        const matchingFeature = features.find(f => 
          f.title.toLowerCase().trim() === node.title.toLowerCase().trim()
        );
        if (matchingFeature) {
          mapping[node.id] = matchingFeature.id;
          console.log(`Mapped node ${node.id} to feature ${matchingFeature.id} by title`);
        }
      }
    });
    
    console.log('Final feature mapping:', mapping);
    return mapping;
  }, [mindmap.nodes, features]);

  // Generate connections based on feature hierarchy and explicit mindmap connections
  const connections = useMemo(() => {
    const allConnections: MindmapConnection[] = [];
    
    console.log('Generating connections...');
    
    // Add explicit mindmap connections first
    allConnections.push(...mindmap.connections);
    console.log('Added explicit connections:', mindmap.connections);
    
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
          const existingConnection = allConnections.find(conn => 
            conn.from === parentNodeId && conn.to === childNodeId
          );
          if (!existingConnection) {
            allConnections.push({ from: parentNodeId, to: childNodeId });
            console.log(`Added parent-child connection: ${parentNodeId} -> ${childNodeId}`);
          }
        }
      } else {
        // Top-level feature connects to root
        const nodeId = Object.keys(featureMapping).find(nId => 
          featureMapping[nId] === feature.id
        );
        if (nodeId) {
          const existingConnection = allConnections.find(conn => 
            conn.from === mindmap.rootNode.id && conn.to === nodeId
          );
          if (!existingConnection) {
            allConnections.push({ from: mindmap.rootNode.id, to: nodeId });
            console.log(`Added root connection: ${mindmap.rootNode.id} -> ${nodeId}`);
          }
        }
      }
    });
    
    console.log('Final connections:', allConnections);
    return allConnections;
  }, [mindmap.connections, mindmap.rootNode.id, features, featureMapping]);

  // Load user stories for expanded nodes
  const loadUserStoriesForNode = useCallback(async (nodeId: string) => {
    const featureId = featureMapping[nodeId];
    if (!featureId || userStoriesCache[featureId]) {
      return;
    }

    console.log(`Loading user stories for feature ${featureId}`);
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase
        .from('user_stories')
        .select('*')
        .eq('feature_id', featureId)
        .order('created_at');

      if (error) {
        console.error('Failed to load user stories:', error);
        return;
      }

      console.log(`Loaded ${data?.length || 0} user stories for feature ${featureId}`);
      
      setUserStoriesCache(prev => ({
        ...prev,
        [featureId]: data || []
      }));
    } catch (error) {
      console.error('Error loading user stories:', error);
    }
  }, [featureMapping, userStoriesCache]);

  // Load user stories when nodes are expanded
  useEffect(() => {
    const loadPromises = Array.from(expandedNodes).map(loadUserStoriesForNode);
    Promise.all(loadPromises);
  }, [expandedNodes, loadUserStoriesForNode]);

  // Convert mindmap structure to React Flow format
  const initialNodes = useMemo(() => {
    const flowNodes: Node[] = [];

    console.log('Building React Flow nodes...');

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
      const userStories = featureId ? (userStoriesCache[featureId] || []) : [];
      const isExpanded = expandedNodes.has(node.id);

      console.log(`Node ${node.id}: featureId=${featureId}, stories=${userStories.length}, expanded=${isExpanded}`);

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
            console.log(`Toggling expand for node ${nodeId}`);
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

    console.log('Built React Flow nodes:', flowNodes);
    return flowNodes;
  }, [mindmap, featureMapping, features, userStoriesCache, expandedNodes, onNodeEdit, onNodeAdd, onNodeDelete]);

  const initialEdges = useMemo(() => {
    console.log('Building React Flow edges from connections:', connections);
    
    const edges = connections.map((conn) => ({
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

    console.log('Built React Flow edges:', edges);
    return edges;
  }, [connections]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Update nodes and edges when dependencies change - but prevent infinite loops
  useEffect(() => {
    console.log('Updating nodes and edges due to dependency change');
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    console.log('Updating edges due to dependency change');
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

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
            variant={BackgroundVariant.Dots}
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
