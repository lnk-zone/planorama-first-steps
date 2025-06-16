
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UserStory } from './useUserStories';

export const useUserStoriesForFeature = (featureId: string | undefined) => {
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!featureId) {
      setUserStories([]);
      return;
    }

    const fetchUserStories = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_stories')
          .select('*')
          .eq('feature_id', featureId)
          .order('created_at');

        if (error) throw error;
        setUserStories(data || []);
      } catch (error) {
        console.error('Failed to fetch user stories:', error);
        setUserStories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStories();
  }, [featureId]);

  return { userStories, loading };
};
