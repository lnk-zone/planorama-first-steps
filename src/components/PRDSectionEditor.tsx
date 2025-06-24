
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface PRDSection {
  name: string;
  content: string;
  order: number;
}

interface PRDSectionEditorProps {
  section: PRDSection;
  index: number;
  onSave: (index: number, content: string) => Promise<void>;
}

const PRDSectionEditor: React.FC<PRDSectionEditorProps> = ({ section, index, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(section.content);
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = () => {
    setEditContent(section.content);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditContent(section.content);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(index, editContent);
      setIsEditing(false);
      toast.success('Section updated successfully');
    } catch (error) {
      console.error('Error saving section:', error);
      toast.error('Failed to save section');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{section.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Section {section.order}</Badge>
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
            placeholder="Edit section content..."
          />
        ) : (
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-gray-50 p-4 rounded-lg">
              {section.content}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PRDSectionEditor;
