
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import { useMindmap } from '@/hooks/useMindmap';

export interface MindmapNode {
  id: string;
  title: string;
  description?: string;
  parentId?: string;
  position: { x: number; y: number };
  style?: { color?: string; size?: string };
  metadata?: Record<string, any>;
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

export interface ViewportState {
  x: number;
  y: number;
  scale: number;
}

export interface MindmapVisualizationProps {
  mindmap: MindmapStructure;
  mindmapId?: string;
  width?: number;
  height?: number;
  selectedNodeId?: string;
  onNodeClick?: (node: MindmapNode) => void;
  onViewportChange?: (viewport: ViewportState) => void;
}

const ControlButtons = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className="absolute right-2 top-2 z-10 flex gap-1 bg-white bg-opacity-80 rounded-md p-1 shadow">
      <button className="px-2" onClick={() => zoomIn()}>+</button>
      <button className="px-2" onClick={() => zoomOut()}>-</button>
      <button className="px-2" onClick={() => resetTransform()}>reset</button>
    </div>
  );
};

const MindmapVisualization: React.FC<MindmapVisualizationProps> = ({
  mindmap,
  mindmapId,
  width = 800,
  height = 600,
  selectedNodeId,
  onNodeClick,
  onViewportChange
}) => {
  const { mindmap: liveMindmap } = useMindmap(mindmapId, mindmap);
  const currentMap = liveMindmap || mindmap;
  const [viewport, setViewport] = useState<ViewportState>({ x: 0, y: 0, scale: 1 });

  const nodes = useMemo(() => [currentMap.rootNode, ...currentMap.nodes], [currentMap]);
  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  // Calculate the bounding box of all nodes
  const boundingBox = useMemo(() => {
    if (nodes.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
      const radius = node.style?.size === 'large' ? 40 : node.style?.size === 'small' ? 20 : 30;
      minX = Math.min(minX, node.position.x - radius);
      maxX = Math.max(maxX, node.position.x + radius);
      minY = Math.min(minY, node.position.y - radius);
      maxY = Math.max(maxY, node.position.y + radius);
    });
    
    return { minX, maxX, minY, maxY };
  }, [nodes]);

  // Calculate initial transform to center the mindmap
  const initialTransform = useMemo(() => {
    const bbox = boundingBox;
    const contentWidth = bbox.maxX - bbox.minX;
    const contentHeight = bbox.maxY - bbox.minY;
    
    // Calculate scale to fit content with some padding
    const padding = 100;
    const scaleX = (width - padding * 2) / contentWidth;
    const scaleY = (height - padding * 2) / contentHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 1
    
    // Calculate translation to center the content
    const centerX = (bbox.minX + bbox.maxX) / 2;
    const centerY = (bbox.minY + bbox.maxY) / 2;
    const translateX = width / 2 - centerX * scale;
    const translateY = height / 2 - centerY * scale;
    
    return { x: translateX, y: translateY, scale };
  }, [boundingBox, width, height]);

  useEffect(() => {
    if (onViewportChange) {
      onViewportChange(initialTransform);
    }
    setViewport(initialTransform);
  }, [onViewportChange, initialTransform]);

  const handleTransformed = useCallback((ref: any, state: any) => {
    const newVp = { x: state.positionX, y: state.positionY, scale: state.scale };
    setViewport(newVp);
    if (onViewportChange) onViewportChange(newVp);
  }, [onViewportChange]);

  // Expand viewport for rendering to include off-screen nodes
  const renderBounds = useMemo(() => {
    const padding = 200;
    return {
      minX: boundingBox.minX - padding,
      maxX: boundingBox.maxX + padding,
      minY: boundingBox.minY - padding,
      maxY: boundingBox.maxY + padding
    };
  }, [boundingBox]);

  const visibleNodes = useMemo(() => {
    // Show all nodes within the expanded render bounds
    return nodes.filter(n => {
      return n.position.x >= renderBounds.minX && 
             n.position.x <= renderBounds.maxX &&
             n.position.y >= renderBounds.minY && 
             n.position.y <= renderBounds.maxY;
    });
  }, [nodes, renderBounds]);

  const visibleConnections = useMemo(() => {
    return currentMap.connections.filter(c => {
      const from = nodeMap.get(c.from);
      const to = nodeMap.get(c.to);
      if (!from || !to) return false;
      return visibleNodes.includes(from) && visibleNodes.includes(to);
    });
  }, [currentMap, nodeMap, visibleNodes]);

  const handleNodeClick = useCallback((node: MindmapNode) => {
    if (onNodeClick) onNodeClick(node);
  }, [onNodeClick]);

  const renderNode = (node: MindmapNode) => {
    const { x, y } = node.position;
    const radius = node.style?.size === 'large' ? 40 : node.style?.size === 'small' ? 20 : 30;
    const color = node.style?.color || '#3b82f6';
    const isSelected = node.id === selectedNodeId;
    return (
      <g key={node.id} transform={`translate(${x}, ${y})`} onClick={() => handleNodeClick(node)} className="cursor-pointer">
        <circle r={radius} fill={color} stroke={isSelected ? '#000' : '#fff'} strokeWidth={2} />
        <text x={0} y={radius + 14} textAnchor="middle" className="text-xs fill-gray-800">
          {node.title}
        </text>
      </g>
    );
  };

  // Calculate SVG viewBox to encompass all content
  const svgViewBox = useMemo(() => {
    const padding = 50;
    return `${renderBounds.minX - padding} ${renderBounds.minY - padding} ${
      renderBounds.maxX - renderBounds.minX + padding * 2
    } ${renderBounds.maxY - renderBounds.minY + padding * 2}`;
  }, [renderBounds]);

  return (
    <div style={{ width, height }} className="relative border rounded bg-white overflow-hidden">
      <TransformWrapper
        onTransformed={handleTransformed}
        minScale={0.25}
        maxScale={3}
        initialScale={initialTransform.scale}
        initialPositionX={initialTransform.x}
        initialPositionY={initialTransform.y}
        centerOnInit={false}
      >
        <ControlButtons />
        <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%', height: '100%' }}>
          <svg 
            width={width} 
            height={height} 
            viewBox={svgViewBox}
            className="select-none"
            preserveAspectRatio="xMidYMid meet"
          >
            {visibleConnections.map(c => {
              const from = nodeMap.get(c.from)!;
              const to = nodeMap.get(c.to)!;
              return (
                <line
                  key={`${c.from}-${c.to}`}
                  x1={from.position.x}
                  y1={from.position.y}
                  x2={to.position.x}
                  y2={to.position.y}
                  stroke="#999"
                  strokeWidth="2"
                />
              );
            })}
            {visibleNodes.map(renderNode)}
          </svg>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
};

export default MindmapVisualization;
