
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UserStory } from './useUserStories';

export const useUserStoriesCache = () => {
  const [userStoriesCache, setUserStoriesCache] = useState<Record<string, UserStory[]>>({});
  const [loadingStories, setLoadingStories] = useState<Set<string>>(new Set());

  const loadUserStoriesForFeature = useCallback(async (featureId: string): Promise<UserStory[]> => {
    if (userStoriesCache[featureId]) {
      return userStoriesCache[featureId];
    }

    if (loadingStories.has(featureId)) {
      return [];
    }

    setLoadingStories(prev => new Set(prev).add(featureId));

    try {
      const { data, error } = await supabase
        .from('user_stories')
        .select('*')
        .eq('feature_id', featureId)
        .order('created_at');

      if (error) {
        console.error('Failed to load user stories:', error);
        return [];
      }

      const stories = data || [];
      setUserStoriesCache(prev => ({
        ...prev,
        [featureId]: stories
      }));

      return stories;
    } catch (error) {
      console.error('Error loading user stories:', error);
      return [];
    } finally {
      setLoadingStories(prev => {
        const newSet = new Set(prev);
        newSet.delete(featureId);
        return newSet;
      });
    }
  }, [userStoriesCache, loadingStories]);

  return {
    userStoriesCache,
    loadUserStoriesForFeature,
    isLoadingStories: (featureId: string) => loadingStories.has(featureId)
  };
};
