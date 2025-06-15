
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UserStory } from '@/hooks/useUserStories';

export interface BulkOperationResult {
  success: boolean;
  updatedCount: number;
  errors: string[];
}

export const useBulkStoryOperations = () => {
  const [loading, setLoading] = useState(false);

  const bulkUpdateStatus = async (storyIds: string[], status: string): Promise<BulkOperationResult> => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Log the bulk operation
      await supabase
        .from('story_operations')
        .insert([{
          operation_type: 'bulk_status_update',
          story_ids: storyIds,
          changes: { status },
          performed_by: user?.id
        }]);

      const { data, error } = await supabase
        .from('user_stories')
        .update({ status })
        .in('id', storyIds)
        .select();

      if (error) throw error;

      return {
        success: true,
        updatedCount: data?.length || 0,
        errors: []
      };
    } catch (error) {
      return {
        success: false,
        updatedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    } finally {
      setLoading(false);
    }
  };

  const bulkUpdatePriority = async (storyIds: string[], priority: string): Promise<BulkOperationResult> => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from('story_operations')
        .insert([{
          operation_type: 'bulk_priority_update',
          story_ids: storyIds,
          changes: { priority },
          performed_by: user?.id
        }]);

      const { data, error } = await supabase
        .from('user_stories')
        .update({ priority })
        .in('id', storyIds)
        .select();

      if (error) throw error;

      return {
        success: true,
        updatedCount: data?.length || 0,
        errors: []
      };
    } catch (error) {
      return {
        success: false,
        updatedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    } finally {
      setLoading(false);
    }
  };

  const bulkDelete = async (storyIds: string[]): Promise<BulkOperationResult> => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from('story_operations')
        .insert([{
          operation_type: 'bulk_delete',
          story_ids: storyIds,
          changes: {},
          performed_by: user?.id
        }]);

      const { error } = await supabase
        .from('user_stories')
        .delete()
        .in('id', storyIds);

      if (error) throw error;

      return {
        success: true,
        updatedCount: storyIds.length,
        errors: []
      };
    } catch (error) {
      return {
        success: false,
        updatedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    } finally {
      setLoading(false);
    }
  };

  const moveStoriesToFeature = async (storyIds: string[], targetFeatureId: string): Promise<BulkOperationResult> => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from('story_operations')
        .insert([{
          operation_type: 'bulk_move',
          story_ids: storyIds,
          changes: { target_feature_id: targetFeatureId },
          performed_by: user?.id
        }]);

      const { data, error } = await supabase
        .from('user_stories')
        .update({ feature_id: targetFeatureId })
        .in('id', storyIds)
        .select();

      if (error) throw error;

      return {
        success: true,
        updatedCount: data?.length || 0,
        errors: []
      };
    } catch (error) {
      return {
        success: false,
        updatedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    bulkUpdateStatus,
    bulkUpdatePriority,
    bulkDelete,
    moveStoriesToFeature
  };
};
