
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import type { Feature } from '@/hooks/useFeatures';

interface BulkFeatureOperationsProps {
  isOpen: boolean;
  selectedFeatures: Feature[];
  onClose: () => void;
  onBulkUpdate: (updates: Partial<Feature>) => Promise<void>;
  onBulkDelete: () => Promise<void>;
}

const BulkFeatureOperations = ({ 
  isOpen, 
  selectedFeatures, 
  onClose, 
  onBulkUpdate, 
  onBulkDelete 
}: BulkFeatureOperationsProps) => {
  const [operation, setOperation] = useState<string>('');
  const [newStatus, setNewStatus] = useState<string>('');
  const [newPriority, setNewPriority] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBulkOperation = async () => {
    if (!operation) return;

    setIsProcessing(true);
    try {
      if (operation === 'delete') {
        await onBulkDelete();
      } else if (operation === 'status' && newStatus) {
        await onBulkUpdate({ status: newStatus });
      } else if (operation === 'priority' && newPriority) {
        await onBulkUpdate({ priority: newPriority });
      }
      
      handleClose();
    } catch (error) {
      console.error('Bulk operation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setOperation('');
    setNewStatus('');
    setNewPriority('');
    onClose();
  };

  const canExecute = () => {
    if (operation === 'delete') return true;
    if (operation === 'status') return !!newStatus;
    if (operation === 'priority') return !!newPriority;
    return false;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Operations</DialogTitle>
          <DialogDescription>
            Apply changes to {selectedFeatures.length} selected feature{selectedFeatures.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Features Preview */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Selected Features:</h4>
            <div className="max-h-32 overflow-y-auto border rounded-lg p-3 bg-gray-50">
              {selectedFeatures.map((feature) => (
                <div key={feature.id} className="flex items-center justify-between py-1">
                  <span className="text-sm truncate">{feature.title}</span>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-xs">
                      {feature.status || 'planned'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {feature.priority || 'medium'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operation Selection */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Operation:</label>
              <Select value={operation} onValueChange={setOperation}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an operation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="status">Change Status</SelectItem>
                  <SelectItem value="priority">Change Priority</SelectItem>
                  <SelectItem value="delete">Delete Features</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Selection */}
            {operation === 'status' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">New Status:</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Priority Selection */}
            {operation === 'priority' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">New Priority:</label>
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Delete Warning */}
            {operation === 'delete' && (
              <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-800 font-medium">Warning</p>
                  <p className="text-sm text-red-700">
                    This action cannot be undone. All selected features and their user stories will be permanently deleted.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkOperation}
              disabled={!canExecute() || isProcessing}
              variant={operation === 'delete' ? 'destructive' : 'default'}
            >
              {isProcessing ? (
                'Processing...'
              ) : (
                <>
                  {operation === 'delete' && <Trash2 className="h-4 w-4 mr-2" />}
                  {operation === 'status' && <CheckCircle className="h-4 w-4 mr-2" />}
                  {operation === 'priority' && <AlertTriangle className="h-4 w-4 mr-2" />}
                  {operation === 'delete' ? 'Delete Features' : 'Apply Changes'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkFeatureOperations;
