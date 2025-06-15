
import { useState, useEffect, useCallback } from 'react';
import { mindmapSyncService, type SyncEvent, type MindmapNode } from '@/lib/mindmapSync';
import type { Feature } from '@/hooks/useFeatures';
import { toast } from '@/hooks/use-toast';

export interface SyncState {
  status: 'synced' | 'syncing' | 'error' | 'offline';
  lastSyncTime?: Date;
  conflictCount: number;
  isOnline: boolean;
}

export const useMindmapSync = (projectId: string) => {
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'synced',
    conflictCount: 0,
    isOnline: navigator.onLine
  });

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setSyncState(prev => ({ ...prev, isOnline: true, status: 'synced' }));
    };

    const handleOffline = () => {
      setSyncState(prev => ({ ...prev, isOnline: false, status: 'offline' }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!projectId) return;

    const unsubscribe = mindmapSyncService.subscribeToChanges(
      projectId,
      (event: SyncEvent) => {
        console.log('Sync event received:', event);
        setSyncState(prev => ({
          ...prev,
          lastSyncTime: new Date(),
          status: 'synced'
        }));
      }
    );

    return unsubscribe;
  }, [projectId]);

  const syncMindmapToFeatures = useCallback(async (
    mindmapId: string,
    updatedNodes: MindmapNode[]
  ) => {
    if (!syncState.isOnline) {
      toast({
        title: "Offline",
        description: "Changes will sync when you're back online",
        variant: "default"
      });
      return;
    }

    setSyncState(prev => ({ ...prev, status: 'syncing' }));

    try {
      await mindmapSyncService.syncMindmapToFeatures(mindmapId, updatedNodes);
      setSyncState(prev => ({
        ...prev,
        status: 'synced',
        lastSyncTime: new Date(),
        conflictCount: 0
      }));

      toast({
        title: "Synced",
        description: "Mindmap changes saved to features",
      });
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncState(prev => ({
        ...prev,
        status: 'error',
        conflictCount: prev.conflictCount + 1
      }));

      toast({
        title: "Sync Error",
        description: "Failed to sync mindmap changes",
        variant: "destructive"
      });
    }
  }, [syncState.isOnline]);

  const syncFeaturesToMindmap = useCallback(async (
    projectId: string,
    updatedFeatures: Feature[]
  ) => {
    if (!syncState.isOnline) {
      return;
    }

    setSyncState(prev => ({ ...prev, status: 'syncing' }));

    try {
      await mindmapSyncService.syncFeaturesToMindmap(projectId, updatedFeatures);
      setSyncState(prev => ({
        ...prev,
        status: 'synced',
        lastSyncTime: new Date(),
        conflictCount: 0
      }));
    } catch (error) {
      console.error('Features to mindmap sync failed:', error);
      setSyncState(prev => ({
        ...prev,
        status: 'error',
        conflictCount: prev.conflictCount + 1
      }));
    }
  }, [syncState.isOnline]);

  const retrySync = useCallback(() => {
    setSyncState(prev => ({
      ...prev,
      status: 'synced',
      conflictCount: 0
    }));

    toast({
      title: "Sync Reset",
      description: "Sync status cleared. Try your changes again.",
    });
  }, []);

  return {
    syncState,
    syncMindmapToFeatures,
    syncFeaturesToMindmap,
    retrySync
  };
};
