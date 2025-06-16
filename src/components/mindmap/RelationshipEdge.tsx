
import React from 'react';
import { BaseEdge, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';

interface RelationshipEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: any;
  targetPosition: any;
  style?: React.CSSProperties;
  markerEnd?: any;
  data?: {
    relationshipType?: 'hierarchy' | 'blocks' | 'depends_on' | 'related';
    label?: string;
  };
}

const RelationshipEdge: React.FC<RelationshipEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const getEdgeStyle = () => {
    const baseStyle = { strokeWidth: 2, ...style };
    
    switch (data?.relationshipType) {
      case 'hierarchy':
        return { ...baseStyle, stroke: '#3b82f6', strokeWidth: 2 };
      case 'blocks':
        return { ...baseStyle, stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '5,5' };
      case 'depends_on':
        return { ...baseStyle, stroke: '#f59e0b', strokeWidth: 2, strokeDasharray: '10,5' };
      case 'related':
        return { ...baseStyle, stroke: '#10b981', strokeWidth: 1, strokeDasharray: '2,2' };
      default:
        return { ...baseStyle, stroke: '#e2e8f0' };
    }
  };

  const getRelationshipBadge = () => {
    if (!data?.relationshipType || data.relationshipType === 'hierarchy') return null;

    const badgeConfig = {
      blocks: { text: 'Blocks', color: 'bg-red-100 text-red-700' },
      depends_on: { text: 'Depends', color: 'bg-yellow-100 text-yellow-700' },
      related: { text: 'Related', color: 'bg-green-100 text-green-700' },
    };

    const config = badgeConfig[data.relationshipType as keyof typeof badgeConfig];
    if (!config) return null;

    return (
      <Badge 
        className={`text-xs px-2 py-1 ${config.color} border-0 pointer-events-none`}
      >
        {config.text}
      </Badge>
    );
  };

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={getEdgeStyle()}
      />
      {data?.relationshipType && data.relationshipType !== 'hierarchy' && (
        <EdgeLabelRenderer>
          <div
            className="absolute pointer-events-none"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {getRelationshipBadge()}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default RelationshipEdge;
