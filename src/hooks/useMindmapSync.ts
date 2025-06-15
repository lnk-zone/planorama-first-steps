
import { useEffect, useRef, useState } from 'react';
import { mindmapSyncService, type SyncEvent, type MindmapNode } from '@/lib/mindmapSync';
import type { Feature } from '@/hooks/useFeatures';

export const useMindmapSync = (projectId: string) => {
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'offline'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<Date | undefined>();
  const cleanupRef = useRef<(() => void) | null>(null);

  // Sync mindmap changes to features
  const syncMindmapToFeatures = async (mindmapId: string, nodes: MindmapNode[]) => {
    setSyncStatus('syncing');
    try {
      await mindmapSyncService.syncMindmapToFeatures(mindmapId, nodes);
      setSyncStatus('synced');
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
    }
  };

  // Sync features changes to mindmap
  const syncFeaturesToMindmap = async (features: Feature[]) => {
    setSyncStatus('syncing');
    try {
      await mindmapSyncService.syncFeaturesToMindmap(projectId, features);
      setSyncStatus('synced');
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
    }
  };

  // Subscribe to real-time changes
  useEffect(() => {
    console.log(`Setting up sync subscription for project ${projectId}`);
    
    const handleSyncEvent = (event: SyncEvent) => {
      console.log('Received sync event:', event);
      setLastSyncTime(new Date());
      // Emit custom event for components to listen to
      window.dispatchEvent(new CustomEvent('mindmap-sync', { detail: event }));
    };

    // Clean up any existing subscription before creating a new one
    if (cleanupRef.current) {
      cleanupRef.current();
    }

    // Subscribe to changes
    const cleanup = mindmapSyncService.subscribeToChanges(projectId, handleSyncEvent);
    cleanupRef.current = cleanup;

    // Cleanup function
    return () => {
      console.log(`Cleaning up sync subscription for project ${projectId}`);
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [projectId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  return {
    syncStatus,
    lastSyncTime,
    syncMindmapToFeatures,
    syncFeaturesToMindmap
  };
};
