
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface Feature {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  priority: string | null;
  status: string | null;
  category: string | null;
  complexity: string | null;
  parent_id: string | null;
  order_index: number | null;
  metadata: Json | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateFeatureData {
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  category?: string;
  complexity?: string;
  parent_id?: string;
}

export const useFeatures = (projectId: string) => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeatures = async () => {
    const { data, error } = await supabase
      .from('features')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index');

    if (error) throw error;
    setFeatures(data || []);
  };

  const addFeature = async (featureData: CreateFeatureData) => {
    // Get the next order_index
    const maxOrderIndex = Math.max(...features.map(f => f.order_index || 0), -1);
    
    const { data, error } = await supabase
      .from('features')
      .insert([{ 
        ...featureData, 
        project_id: projectId,
        order_index: maxOrderIndex + 1
      }])
      .select()
      .single();

    if (error) throw error;
    setFeatures(prev => [...prev, data]);
    return data;
  };

  const addChildFeature = async (parentId: string, featureData: Omit<CreateFeatureData, 'parent_id'>) => {
    // Get the next order_index for child features of this parent
    const childFeatures = features.filter(f => f.parent_id === parentId);
    const maxChildOrderIndex = Math.max(...childFeatures.map(f => f.order_index || 0), -1);
    
    const { data, error } = await supabase
      .from('features')
      .insert([{ 
        ...featureData, 
        project_id: projectId,
        parent_id: parentId,
        order_index: maxChildOrderIndex + 1
      }])
      .select()
      .single();

    if (error) throw error;
    setFeatures(prev => [...prev, data]);
    return data;
  };

  const updateFeature = async (featureId: string, updates: Partial<Feature>) => {
    const { data, error } = await supabase
      .from('features')
      .update(updates)
      .eq('id', featureId)
      .select()
      .single();

    if (error) throw error;
    setFeatures(prev => prev.map(f => f.id === featureId ? data : f));
    return data;
  };

  const deleteFeature = async (featureId: string) => {
    // First, update any child features to remove their parent reference
    const childFeatures = features.filter(f => f.parent_id === featureId);
    if (childFeatures.length > 0) {
      await Promise.all(
        childFeatures.map(child => 
          supabase
            .from('features')
            .update({ parent_id: null })
            .eq('id', child.id)
        )
      );
    }

    const { error } = await supabase
      .from('features')
      .delete()
      .eq('id', featureId);

    if (error) throw error;
    
    // Update local state
    setFeatures(prev => 
      prev.filter(f => f.id !== featureId)
          .map(f => f.parent_id === featureId ? { ...f, parent_id: null } : f)
    );
  };

  const reorderFeatures = async (reorderedFeatures: Feature[]) => {
    // Update order_index for all features
    const updates = reorderedFeatures.map((feature, index) => ({
      id: feature.id,
      order_index: index
    }));

    for (const update of updates) {
      await supabase
        .from('features')
        .update({ order_index: update.order_index })
        .eq('id', update.id);
    }

    // Update local state
    setFeatures(reorderedFeatures);
  };

  useEffect(() => {
    fetchFeatures().finally(() => setLoading(false));
  }, [projectId]);

  return {
    features,
    loading,
    addFeature,
    addChildFeature,
    updateFeature,
    deleteFeature,
    reorderFeatures,
    refetch: fetchFeatures
  };
};
