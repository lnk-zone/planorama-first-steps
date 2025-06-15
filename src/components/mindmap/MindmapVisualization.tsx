import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';

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
  width?: number;
  height?: number;
  selectedNodeId?: string;
  onNodeClick?: (node: MindmapNode) => void;
  onViewportChange?: (viewport: ViewportState) => void;
}

const defaultViewport: ViewportState = { x: 0, y: 0, scale: 1 };

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
  width = 800,
  height = 600,
  selectedNodeId,
  onNodeClick,
  onViewportChange
}) => {
  const [viewport, setViewport] = useState<ViewportState>(defaultViewport);

  useEffect(() => {
    if (onViewportChange) {
      onViewportChange(defaultViewport);
    }
  }, [onViewportChange]);

  const nodes = useMemo(() => [mindmap.rootNode, ...mindmap.nodes], [mindmap]);
  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  const handleTransformed = useCallback((ref: any, state: any) => {
    const newVp = { x: state.positionX, y: state.positionY, scale: state.scale };
    setViewport(newVp);
    if (onViewportChange) onViewportChange(newVp);
  }, [onViewportChange]);

  const visibleNodes = useMemo(() => {
    const padding = 100;
    return nodes.filter(n => {
      const nx = n.position.x * viewport.scale + viewport.x;
      const ny = n.position.y * viewport.scale + viewport.y;
      return nx > -padding && nx < width + padding && ny > -padding && ny < height + padding;
    });
  }, [nodes, viewport, width, height]);

  const visibleConnections = useMemo(() => {
    return mindmap.connections.filter(c => {
      const a = nodeMap.get(c.from);
      const b = nodeMap.get(c.to);
      if (!a || !b) return false;
      return visibleNodes.includes(a) || visibleNodes.includes(b);
    });
  }, [mindmap, nodeMap, visibleNodes]);

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

  return (
    <div style={{ width, height }} className="relative border rounded bg-white overflow-hidden">
      <TransformWrapper
        onTransformed={handleTransformed}
        minScale={0.25}
        initialScale={1}
      >
        <ControlButtons />
        <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%', height: '100%' }}>
          <svg width={width} height={height} className="select-none">
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
