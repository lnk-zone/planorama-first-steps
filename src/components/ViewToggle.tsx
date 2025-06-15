
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Map, 
  List, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ViewToggleProps {
  currentView: 'mindmap' | 'list';
  onViewChange: (view: 'mindmap' | 'list') => void;
  syncStatus: 'synced' | 'syncing' | 'error' | 'offline';
  lastSyncTime?: Date;
  conflictCount?: number;
  onRetrySync?: () => void;
}

const ViewToggle = ({ 
  currentView, 
  onViewChange, 
  syncStatus, 
  lastSyncTime,
  conflictCount = 0,
  onRetrySync 
}: ViewToggleProps) => {
  const [showSyncDetails, setShowSyncDetails] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.altKey) {
        if (event.key === 'm' || event.key === 'M') {
          event.preventDefault();
          onViewChange('mindmap');
        } else if (event.key === 'l' || event.key === 'L') {
          event.preventDefault();
          onViewChange('list');
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onViewChange]);

  const getSyncIcon = () => {
    switch (syncStatus) {
      case 'synced':
        return <CheckCircle2 className="h-3 w-3 text-green-600" />;
      case 'syncing':
        return <RefreshCw className="h-3 w-3 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-600" />;
      case 'offline':
        return <WifiOff className="h-3 w-3 text-gray-400" />;
      default:
        return <Wifi className="h-3 w-3 text-gray-400" />;
    }
  };

  const getSyncText = () => {
    switch (syncStatus) {
      case 'synced':
        return 'Synced';
      case 'syncing':
        return 'Syncing...';
      case 'error':
        return 'Sync Error';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const getSyncVariant = () => {
    switch (syncStatus) {
      case 'synced':
        return 'default' as const;
      case 'syncing':
        return 'secondary' as const;
      case 'error':
        return 'destructive' as const;
      case 'offline':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };

  const formatLastSyncTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="flex items-center justify-between p-4 border-b bg-gray-50/50">
      <div className="flex items-center gap-4">
        <Tabs value={currentView} onValueChange={(value) => onViewChange(value as 'mindmap' | 'list')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mindmap" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              <span className="hidden sm:inline">Mindmap</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">List</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="hidden md:flex text-xs text-gray-500 gap-2">
          <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Alt+M</kbd>
          <span>Mindmap</span>
          <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Alt+L</kbd>
          <span>List</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {conflictCount > 0 && (
          <Badge variant="destructive" className="text-xs">
            {conflictCount} conflict{conflictCount !== 1 ? 's' : ''}
          </Badge>
        )}

        <div 
          className="relative"
          onMouseEnter={() => setShowSyncDetails(true)}
          onMouseLeave={() => setShowSyncDetails(false)}
        >
          <Badge 
            variant={getSyncVariant()}
            className={cn(
              "flex items-center gap-1 text-xs cursor-pointer transition-all",
              syncStatus === 'error' && onRetrySync && "hover:bg-red-700"
            )}
            onClick={syncStatus === 'error' && onRetrySync ? onRetrySync : undefined}
          >
            {getSyncIcon()}
            <span>{getSyncText()}</span>
          </Badge>

          {showSyncDetails && lastSyncTime && (
            <div className="absolute right-0 top-full mt-2 p-2 bg-white border rounded shadow-lg z-10 min-w-[160px]">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Clock className="h-3 w-3" />
                <span>Last sync: {formatLastSyncTime(lastSyncTime)}</span>
              </div>
              {syncStatus === 'error' && onRetrySync && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetrySync}
                  className="mt-2 w-full text-xs h-6"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewToggle;
