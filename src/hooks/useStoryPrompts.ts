
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface GeneratedPrompt {
  id: string;
  project_id: string;
  user_story_id?: string;
  platform: string;
  prompt_type: 'story' | 'phase_overview' | 'transition';
  title: string;
  content: string;
  execution_order: number;
  phase_number?: number;
  created_at: string;
}

export interface TroubleshootingGuide {
  id: string;
  project_id: string;
  platform: string;
  content: string;
  sections: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface StoryCompletion {
  id: string;
  project_id: string;
  user_story_id: string;
  user_id: string;
  completed_at: string;
  platform: string;
  notes?: string;
}

export const useStoryPrompts = (projectId: string, platform: string) => {
  const queryClient = useQueryClient();

  // Fetch generated prompts
  const { data: prompts, isLoading: promptsLoading } = useQuery({
    queryKey: ['story-prompts', projectId, platform],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_prompts')
        .select('*')
        .eq('project_id', projectId)
        .eq('platform', platform)
        .order('execution_order');

      if (error) throw error;
      return data as GeneratedPrompt[];
    },
  });

  // Fetch troubleshooting guide
  const { data: troubleshootingGuide, isLoading: guideLoading } = useQuery({
    queryKey: ['troubleshooting-guide', projectId, platform],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('troubleshooting_guides')
        .select('*')
        .eq('project_id', projectId)
        .eq('platform', platform)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as TroubleshootingGuide | null;
    },
  });

  // Fetch story completions
  const { data: completions } = useQuery({
    queryKey: ['story-completions', projectId, platform],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('story_completions')
        .select('*')
        .eq('project_id', projectId)
        .eq('platform', platform)
        .eq('user_id', user.id);

      if (error) throw error;
      return data as StoryCompletion[];
    },
  });

  // Generate prompts mutation
  const generatePromptsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-story-prompts', {
        body: { projectId, platform }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story-prompts', projectId, platform] });
      queryClient.invalidateQueries({ queryKey: ['troubleshooting-guide', projectId, platform] });
      toast({
        title: "AI Builder prompts generated successfully",
        description: "Your comprehensive user story prompts are ready to use with any AI builder.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error generating prompts",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mark story as complete
  const markStoryCompleteMutation = useMutation({
    mutationFn: async ({ storyId, notes }: { storyId: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('story_completions')
        .insert({
          project_id: projectId,
          user_story_id: storyId,
          user_id: user.id,
          platform,
          notes
        });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story-completions', projectId, platform] });
      toast({
        title: "Story marked as complete",
        description: "Great progress! Keep going.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error marking story complete",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Unmark story as complete
  const unmarkStoryCompleteMutation = useMutation({
    mutationFn: async (storyId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('story_completions')
        .delete()
        .eq('project_id', projectId)
        .eq('user_story_id', storyId)
        .eq('user_id', user.id)
        .eq('platform', platform);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story-completions', projectId, platform] });
      toast({
        title: "Story unmarked",
        description: "Story completion status updated.",
      });
    },
  });

  const isStoryComplete = (storyId: string) => {
    return completions?.some(c => c.user_story_id === storyId) || false;
  };

  const getStoryCompletion = (storyId: string) => {
    return completions?.find(c => c.user_story_id === storyId);
  };

  return {
    prompts: prompts || [],
    troubleshootingGuide,
    completions: completions || [],
    isLoading: promptsLoading || guideLoading,
    generatePrompts: generatePromptsMutation.mutate,
    isGenerating: generatePromptsMutation.isPending,
    markStoryComplete: markStoryCompleteMutation.mutate,
    unmarkStoryComplete: unmarkStoryCompleteMutation.mutate,
    isStoryComplete,
    getStoryCompletion,
  };
};
