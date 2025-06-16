
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface UserStory {
  id: string;
  feature_id: string;
  title: string;
  description: string | null;
  acceptance_criteria: string[] | null;
  priority: string | null;
  status: string | null;
  story_points: number | null;
  created_at: string | null;
  updated_at: string | null;
  // Add new fields for AI feature generation
  execution_order: number | null;
  dependencies: Json | null;
  estimated_hours: number | null;
  complexity: string | null;
}

export interface CreateUserStoryData {
  title: string;
  description?: string;
  acceptance_criteria?: string[];
  priority?: string;
  status?: string;
  story_points?: number;
  execution_order?: number;
  dependencies?: Json;
  estimated_hours?: number;
  complexity?: string;
}

export const useUserStories = (featureIds: string | string[]) => {
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserStories = async () => {
    if (!featureIds || (Array.isArray(featureIds) && featureIds.length === 0)) {
      setUserStories([]);
      return;
    }

    const ids = Array.isArray(featureIds) ? featureIds : [featureIds];
    
    const { data, error } = await supabase
      .from('user_stories')
      .select('*')
      .in('feature_id', ids)
      .order('created_at');

    if (error) throw error;
    setUserStories(data || []);
  };

  const addUserStory = async (storyData: CreateUserStoryData & { feature_id: string }) => {
    const { data, error } = await supabase
      .from('user_stories')
      .insert([storyData])
      .select()
      .single();

    if (error) throw error;
    setUserStories(prev => [...prev, data]);
    return data;
  };

  const updateUserStory = async (storyId: string, updates: Partial<UserStory>) => {
    const { data, error } = await supabase
      .from('user_stories')
      .update(updates)
      .eq('id', storyId)
      .select()
      .single();

    if (error) throw error;
    setUserStories(prev => prev.map(s => s.id === storyId ? data : s));
    return data;
  };

  const deleteUserStory = async (storyId: string) => {
    const { error } = await supabase
      .from('user_stories')
      .delete()
      .eq('id', storyId);

    if (error) throw error;
    setUserStories(prev => prev.filter(s => s.id !== storyId));
  };

  useEffect(() => {
    fetchUserStories().finally(() => setLoading(false));
  }, [JSON.stringify(featureIds)]);

  return {
    userStories,
    loading,
    addUserStory,
    updateUserStory,
    deleteUserStory,
    refetch: fetchUserStories
  };
};
