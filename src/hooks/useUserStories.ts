
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();

  const { data: userStories = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['user-stories', featureIds],
    queryFn: async () => {
      if (!featureIds || (Array.isArray(featureIds) && featureIds.length === 0)) {
        return [];
      }

      const ids = Array.isArray(featureIds) ? featureIds : [featureIds];
      
      const { data, error } = await supabase
        .from('user_stories')
        .select('*')
        .in('feature_id', ids)
        .order('created_at');

      if (error) throw error;
      return data || [];
    },
    enabled: Boolean(featureIds && (Array.isArray(featureIds) ? featureIds.length > 0 : true)),
  });

  const addUserStoryMutation = useMutation({
    mutationFn: async (storyData: CreateUserStoryData & { feature_id: string }) => {
      const { data, error } = await supabase
        .from('user_stories')
        .insert([storyData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-stories'] });
    },
  });

  const updateUserStoryMutation = useMutation({
    mutationFn: async ({ storyId, updates }: { storyId: string; updates: Partial<UserStory> }) => {
      const { data, error } = await supabase
        .from('user_stories')
        .update(updates)
        .eq('id', storyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-stories'] });
    },
  });

  const deleteUserStoryMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const { error } = await supabase
        .from('user_stories')
        .delete()
        .eq('id', storyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-stories'] });
    },
  });

  return {
    userStories,
    loading,
    addUserStory: addUserStoryMutation.mutate,
    updateUserStory: updateUserStoryMutation.mutate,
    deleteUserStory: deleteUserStoryMutation.mutate,
    refetch
  };
};
