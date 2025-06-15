
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GripVertical, Edit, Trash2, Plus } from 'lucide-react';
import type { Feature } from '@/hooks/useFeatures';

interface DraggableFeatureListProps {
  features: Feature[];
  onReorder: (features: Feature[]) => void;
  onEdit: (feature: Feature) => void;
  onDelete: (featureId: string) => void;
  onAddChild: (parentFeature: Feature) => void;
}

const DraggableFeatureList = ({ features, onReorder, onEdit, onDelete, onAddChild }: DraggableFeatureListProps) => {
  const [draggedItem, setDraggedItem] = useState<Feature | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, feature: Feature) => {
    setDraggedItem(feature);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragOver = (e: React.DragEvent, targetFeature: Feature) => {
    e.preventDefault();
    setDragOverItem(targetFeature.id);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = (e: React.DragEvent, targetFeature: Feature) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.id === targetFeature.id) {
      return;
    }

    const newFeatures = [...features];
    const draggedIndex = newFeatures.findIndex(f => f.id === draggedItem.id);
    const targetIndex = newFeatures.findIndex(f => f.id === targetFeature.id);

    // Remove dragged item and insert at new position
    newFeatures.splice(draggedIndex, 1);
    newFeatures.splice(targetIndex, 0, draggedItem);

    // Update order_index for all features
    const reorderedFeatures = newFeatures.map((feature, index) => ({
      ...feature,
      order_index: index
    }));

    onReorder(reorderedFeatures);
    setDragOverItem(null);
    setDraggedItem(null);
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'planned': return 'bg-gray-100 text-gray-800';
      case 'on-hold': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-3">
      {features.map((feature) => (
        <Card
          key={feature.id}
          draggable
          onDragStart={(e) => handleDragStart(e, feature)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, feature)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, feature)}
          className={`cursor-move transition-all duration-200 ${
            dragOverItem === feature.id ? 'border-blue-400 shadow-lg' : 'hover:shadow-md'
          } ${draggedItem?.id === feature.id ? 'opacity-50' : ''}`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <GripVertical className="h-5 w-5 text-gray-400 cursor-grab mt-1" />
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getPriorityColor(feature.priority)}>
                      {(feature.priority || 'medium').charAt(0).toUpperCase() + (feature.priority || 'medium').slice(1)} Priority
                    </Badge>
                    <Badge className={getStatusColor(feature.status)}>
                      {(feature.status || 'planned').charAt(0).toUpperCase() + (feature.status || 'planned').slice(1)}
                    </Badge>
                    {feature.category && (
                      <Badge variant="outline">
                        {feature.category}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(feature)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddChild(feature)}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(feature.id)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          {feature.description && (
            <CardContent>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};

export default DraggableFeatureList;
