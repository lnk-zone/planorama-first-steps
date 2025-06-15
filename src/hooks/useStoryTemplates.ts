
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StoryTemplate {
  id: string;
  name: string;
  description: string | null;
  title_template: string;
  description_template: string | null;
  acceptance_criteria_template: string[] | null;
  category: string | null;
  is_public: boolean | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const useStoryTemplates = () => {
  const [templates, setTemplates] = useState<StoryTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('story_templates')
      .select('*')
      .order('name');

    if (error) throw error;
    setTemplates(data || []);
  };

  const createTemplate = async (templateData: Omit<StoryTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('story_templates')
      .insert([{ ...templateData, created_by: user?.id }])
      .select()
      .single();

    if (error) throw error;
    setTemplates(prev => [...prev, data]);
    return data;
  };

  const updateTemplate = async (templateId: string, updates: Partial<StoryTemplate>) => {
    const { data, error } = await supabase
      .from('story_templates')
      .update(updates)
      .eq('id', templateId)
      .select()
      .single();

    if (error) throw error;
    setTemplates(prev => prev.map(t => t.id === templateId ? data : t));
    return data;
  };

  const deleteTemplate = async (templateId: string) => {
    const { error } = await supabase
      .from('story_templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;
    setTemplates(prev => prev.filter(t => t.id !== templateId));
  };

  useEffect(() => {
    fetchTemplates().finally(() => setLoading(false));
  }, []);

  return {
    templates,
    loading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refetch: fetchTemplates
  };
};
