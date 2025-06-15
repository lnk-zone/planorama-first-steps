
import { useEffect, useRef, useState, useCallback } from 'react';
import { mindmapSyncService, type SyncEvent, type MindmapNode } from '@/lib/mindmapSync';
import type { Feature } from '@/hooks/useFeatures';

export const useMindmapSync = (projectId: string) => {
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'offline'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<Date | undefined>();
  const [conflictCount, setConflictCount] = useState(0);
  const cleanupRef = useRef<(() => void) | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncedFeaturesRef = useRef<string>('');

  // Debounced sync function
  const debouncedSync = useCallback((syncFn: () => Promise<void>, delay = 1000) => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(async () => {
      setSyncStatus('syncing');
      try {
        await syncFn();
        setSyncStatus('synced');
        setLastSyncTime(new Date());
      } catch (error) {
        console.error('Sync failed:', error);
        setSyncStatus('error');
        setConflictCount(prev => prev + 1);
      }
    }, delay);
  }, []);

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
      setConflictCount(prev => prev + 1);
    }
  };

  // Sync features changes to mindmap - only if features actually changed
  const syncFeaturesToMindmap = useCallback((features: Feature[]) => {
    // Create a hash of the features to detect actual changes
    const featuresHash = JSON.stringify(features.map(f => ({
      id: f.id,
      title: f.title,
      description: f.description,
      priority: f.priority,
      complexity: f.complexity,
      category: f.category,
      updated_at: f.updated_at
    })));

    // Only sync if features have actually changed
    if (featuresHash === lastSyncedFeaturesRef.current) {
      return;
    }

    lastSyncedFeaturesRef.current = featuresHash;

    debouncedSync(async () => {
      await mindmapSyncService.syncFeaturesToMindmap(projectId, features);
    });
  }, [projectId, debouncedSync]);

  // Manual sync trigger for CRUD operations
  const triggerSync = useCallback((features: Feature[]) => {
    debouncedSync(async () => {
      await mindmapSyncService.syncFeaturesToMindmap(projectId, features);
    }, 500); // Shorter delay for manual triggers
  }, [projectId, debouncedSync]);

  // Retry sync operation
  const retrySync = () => {
    setSyncStatus('synced');
    setConflictCount(0);
    setLastSyncTime(new Date());
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
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [projectId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    syncStatus,
    lastSyncTime,
    conflictCount,
    syncMindmapToFeatures,
    syncFeaturesToMindmap,
    triggerSync,
    retrySync
  };
};
