
import { supabase } from '@/integrations/supabase/client';
import type { Feature } from '@/hooks/useFeatures';

export interface MindmapNode {
  id: string;
  title: string;
  description?: string;
  parentId?: string;
  position: { x: number; y: number };
  style: { color: string; size: string };
  metadata?: {
    priority?: string;
    complexity?: string;
    category?: string;
    featureId?: string;
    generated_by_ai?: boolean;
    node_id?: string;
    generation_timestamp?: string;
  };
}

export interface SyncEvent {
  type: 'mindmap' | 'features';
  payload: any;
}

export interface MindmapData {
  rootNode: MindmapNode;
  nodes: MindmapNode[];
  connections: Array<{ from: string; to: string }>;
}

export class MindmapSyncService {
  private eventEmitter = new EventTarget();

  // Sync mindmap changes to features
  async syncMindmapToFeatures(
    mindmapId: string,
    updatedNodes: MindmapNode[]
  ): Promise<void> {
    try {
      // Update mindmap record
      await this.updateMindmapData(mindmapId, updatedNodes);
      
      // Sync to features table
      for (const node of updatedNodes) {
        if (node.metadata?.featureId) {
          await this.updateFeatureFromNode(node);
        } else if (node.id !== 'root') {
          await this.createFeatureFromNode(node);
        }
      }
      
      this.emitSyncEvent('mindmap-to-features', { mindmapId, nodes: updatedNodes });
    } catch (error) {
      console.error('Mindmap to features sync failed:', error);
      throw error;
    }
  }

  // Sync features changes to mindmap
  async syncFeaturesToMindmap(
    projectId: string,
    updatedFeatures: Feature[]
  ): Promise<void> {
    try {
      const mindmap = await this.getMindmapByProject(projectId);
      if (!mindmap) return;

      const updatedNodes = await this.updateNodesFromFeatures(
        mindmap.data.nodes || [],
        updatedFeatures
      );
      
      await this.updateMindmapData(mindmap.id, updatedNodes);
      this.emitSyncEvent('features-to-mindmap', { projectId, features: updatedFeatures });
    } catch (error) {
      console.error('Features to mindmap sync failed:', error);
      throw error;
    }
  }

  // Real-time subscription to changes
  subscribeToChanges(projectId: string, callback: (event: SyncEvent) => void) {
    // Subscribe to mindmap changes
    const mindmapSubscription = supabase
      .channel(`mindmap-${projectId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'mindmaps', filter: `project_id=eq.${projectId}` },
        (payload) => callback({ type: 'mindmap', payload })
      )
      .subscribe();

    // Subscribe to features changes
    const featuresSubscription = supabase
      .channel(`features-${projectId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'features', filter: `project_id=eq.${projectId}` },
        (payload) => callback({ type: 'features', payload })
      )
      .subscribe();

    return () => {
      mindmapSubscription.unsubscribe();
      featuresSubscription.unsubscribe();
    };
  }

  // Private helper methods
  private async updateMindmapData(mindmapId: string, nodes: MindmapNode[]): Promise<void> {
    const { error } = await supabase
      .from('mindmaps')
      .update({
        data: { nodes, connections: [] },
        updated_at: new Date().toISOString()
      })
      .eq('id', mindmapId);

    if (error) throw error;
  }

  private async getMindmapByProject(projectId: string) {
    const { data, error } = await supabase
      .from('mindmaps')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  private async updateFeatureFromNode(node: MindmapNode): Promise<void> {
    if (!node.metadata?.featureId) return;

    const { error } = await supabase
      .from('features')
      .update({
        title: node.title,
        description: node.description || null,
        priority: node.metadata.priority || 'medium',
        complexity: node.metadata.complexity || 'medium',
        category: node.metadata.category || 'core',
        updated_at: new Date().toISOString()
      })
      .eq('id', node.metadata.featureId);

    if (error) throw error;
  }

  private async createFeatureFromNode(node: MindmapNode): Promise<void> {
    // Get project_id from mindmap
    const mindmap = await supabase
      .from('mindmaps')
      .select('project_id')
      .eq('id', node.metadata?.node_id || '')
      .single();

    if (!mindmap.data) return;

    const { data: feature, error } = await supabase
      .from('features')
      .insert({
        project_id: mindmap.data.project_id,
        title: node.title,
        description: node.description || null,
        priority: node.metadata?.priority || 'medium',
        complexity: node.metadata?.complexity || 'medium',
        category: node.metadata?.category || 'core',
        metadata: {
          ...node.metadata,
          node_id: node.id,
          sync_timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) throw error;

    // Update node with feature ID for future syncing
    node.metadata = { ...node.metadata, featureId: feature.id };
  }

  private async updateNodesFromFeatures(
    existingNodes: MindmapNode[],
    features: Feature[]
  ): Promise<MindmapNode[]> {
    const updatedNodes = [...existingNodes];

    features.forEach(feature => {
      const nodeIndex = updatedNodes.findIndex(node => 
        node.metadata?.featureId === feature.id
      );

      if (nodeIndex >= 0) {
        // Update existing node
        updatedNodes[nodeIndex] = {
          ...updatedNodes[nodeIndex],
          title: feature.title,
          description: feature.description || '',
          metadata: {
            ...updatedNodes[nodeIndex].metadata,
            priority: feature.priority || 'medium',
            complexity: feature.complexity || 'medium',
            category: feature.category || 'core',
            featureId: feature.id
          }
        };
      } else {
        // Create new node for new feature
        const newNode: MindmapNode = {
          id: `node_${feature.id}`,
          title: feature.title,
          description: feature.description || '',
          parentId: 'root',
          position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
          style: { color: this.getPriorityColor(feature.priority || 'medium'), size: 'medium' },
          metadata: {
            priority: feature.priority || 'medium',
            complexity: feature.complexity || 'medium',
            category: feature.category || 'core',
            featureId: feature.id
          }
        };
        updatedNodes.push(newNode);
      }
    });

    return updatedNodes;
  }

  private getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#3b82f6';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  }

  private emitSyncEvent(type: string, data: any): void {
    const event = new CustomEvent(type, { detail: data });
    this.eventEmitter.dispatchEvent(event);
  }

  // Public method to listen to sync events
  onSyncEvent(type: string, callback: (data: any) => void): () => void {
    const handler = (event: CustomEvent) => callback(event.detail);
    this.eventEmitter.addEventListener(type, handler as EventListener);
    
    return () => {
      this.eventEmitter.removeEventListener(type, handler as EventListener);
    };
  }
}

export const mindmapSyncService = new MindmapSyncService();
