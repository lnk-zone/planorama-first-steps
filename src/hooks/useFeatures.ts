
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  metadata: Record<string, any> | null;
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
    const { data, error } = await supabase
      .from('features')
      .insert([{ ...featureData, project_id: projectId }])
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
    const { error } = await supabase
      .from('features')
      .delete()
      .eq('id', featureId);

    if (error) throw error;
    setFeatures(prev => prev.filter(f => f.id !== featureId));
  };

  useEffect(() => {
    fetchFeatures().finally(() => setLoading(false));
  }, [projectId]);

  return {
    features,
    loading,
    addFeature,
    updateFeature,
    deleteFeature,
    refetch: fetchFeatures
  };
};
