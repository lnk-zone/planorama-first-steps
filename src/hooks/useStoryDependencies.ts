
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StoryDependency {
  id: string;
  story_id: string;
  depends_on_story_id: string;
  dependency_type: string;
  created_at: string;
}

export const useStoryDependencies = (storyId: string) => {
  const [dependencies, setDependencies] = useState<StoryDependency[]>([]);
  const [dependents, setDependents] = useState<StoryDependency[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDependencies = async () => {
    // Get stories this story depends on
    const { data: deps, error: depsError } = await supabase
      .from('story_dependencies')
      .select('*')
      .eq('story_id', storyId);

    // Get stories that depend on this story
    const { data: dependents, error: dependentsError } = await supabase
      .from('story_dependencies')
      .select('*')
      .eq('depends_on_story_id', storyId);

    if (depsError || dependentsError) {
      throw depsError || dependentsError;
    }

    setDependencies(deps || []);
    setDependents(dependents || []);
  };

  const addDependency = async (dependsOnStoryId: string, dependencyType = 'blocks') => {
    const { data, error } = await supabase
      .from('story_dependencies')
      .insert([{
        story_id: storyId,
        depends_on_story_id: dependsOnStoryId,
        dependency_type: dependencyType
      }])
      .select()
      .single();

    if (error) throw error;
    await fetchDependencies();
    return data;
  };

  const removeDependency = async (dependencyId: string) => {
    const { error } = await supabase
      .from('story_dependencies')
      .delete()
      .eq('id', dependencyId);

    if (error) throw error;
    await fetchDependencies();
  };

  useEffect(() => {
    if (storyId) {
      fetchDependencies().finally(() => setLoading(false));
    }
  }, [storyId]);

  return {
    dependencies,
    dependents,
    loading,
    addDependency,
    removeDependency,
    refetch: fetchDependencies
  };
};
