
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
  EdgeTypes,
  ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Edit3, Trash2, MoreHorizontal } from 'lucide-react';
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

const RootNode: React.FC<RootNodeProps> = ({ data }) => {
  return (
    <Card className="w-80 min-h-[200px] bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-blue-900">{data.title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => data.onEdit('root')}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {data.description && (
          <p className="text-sm text-blue-800 mb-4">{data.description}</p>
        )}
        <Button
          onClick={() => data.onAddChild('root')}
          className="w-full bg-blue-600 hover:bg-blue-700"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Feature
        </Button>
      </CardContent>
    </Card>
  );
};

const FeatureNode: React.FC<FeatureNodeProps> = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(data.notes || '');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleSaveNote = () => {
    // This would trigger an update to the parent component
    setEditingNote(false);
  };

  return (
    <Card className={`w-72 min-h-[180px] shadow-md hover:shadow-lg transition-shadow ${getPriorityColor(data.priority || 'medium')}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-semibold mb-1">{data.title}</CardTitle>
            <div className="flex gap-1 flex-wrap">
              {data.priority && (
                <Badge variant="outline" className="text-xs">
                  {data.priority}
                </Badge>
              )}
              {data.complexity && (
                <Badge variant="outline" className="text-xs">
                  {data.complexity}
                </Badge>
              )}
              {data.category && (
                <Badge variant="outline" className="text-xs">
                  {data.category}
                </Badge>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => data.onEdit(data.id)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => data.onDelete(data.id)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {data.description && (
          <p className="text-sm text-gray-700 mb-3">{data.description}</p>
        )}

        {/* Expandable content */}
        {isExpanded && (
          <div className="space-y-3 mb-3">
            {/* Notes section */}
            <div>
              <h4 className="font-medium text-sm mb-1">Notes</h4>
              {editingNote ? (
                <div className="space-y-2">
                  <Textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add notes..."
                    className="text-xs"
                    rows={2}
                  />
                  <div className="flex gap-1">
                    <Button onClick={handleSaveNote} size="sm" variant="outline" className="text-xs h-6">
                      Save
                    </Button>
                    <Button onClick={() => setEditingNote(false)} size="sm" variant="ghost" className="text-xs h-6">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setEditingNote(true)}
                  className="text-xs text-gray-600 cursor-pointer hover:bg-gray-50 p-1 rounded min-h-[20px]"
                >
                  {noteText || 'Click to add notes...'}
                </div>
              )}
            </div>

            {/* Todo section */}
            {data.todos && data.todos.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-1">Tasks</h4>
                <div className="space-y-1">
                  {data.todos.map((todo) => (
                    <div key={todo.id} className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={(e) => data.onUpdateTodo(data.id, todo.id, { completed: e.target.checked })}
                        className="w-3 h-3"
                      />
                      <span className={todo.completed ? 'line-through text-gray-500' : ''}>
                        {todo.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-1">
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="ghost"
            size="sm"
            className="text-xs h-6 flex-1"
          >
            {isExpanded ? 'Less' : 'More'}
          </Button>
          <Button
            onClick={() => data.onAddChild(data.id)}
            variant="ghost"
            size="sm"
            className="text-xs h-6"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const nodeTypes: NodeTypes = {
  rootNode: RootNode,
  featureNode: FeatureNode,
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
          notes: node.metadata?.notes,
          todos: node.metadata?.todos,
          onEdit: onNodeEdit || (() => {}),
          onAddChild: onNodeAdd || (() => {}),
          onDelete: onNodeDelete || (() => {}),
          onUpdateTodo: (nodeId: string, todoId: string, updates: any) => {
            console.log('Update todo:', nodeId, todoId, updates);
          },
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
      style: { stroke: '#64748b', strokeWidth: 2 },
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

  return (
    <div className="w-full h-[600px] border rounded-lg bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background color="#e2e8f0" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'rootNode') return '#3b82f6';
            return '#64748b';
          }}
          className="bg-white"
        />
      </ReactFlow>
    </div>
  );
};

export default InteractiveMindmapVisualization;
