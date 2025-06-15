
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  features: Json;
  is_public: boolean | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  tags?: string[] | null;
  difficulty_level?: string | null;
  estimated_hours?: number | null;
  is_featured?: boolean | null;
}

export interface TemplateFeature {
  title: string;
  description: string;
  priority: string;
}

export const useTemplates = () => {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('project_templates')
      .select('*')
      .eq('is_public', true)
      .order('is_featured', { ascending: false })
      .order('name');

    if (error) throw error;
    setTemplates(data || []);
  };

  const applyTemplate = async (templateId: string, projectId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) throw new Error('Template not found');

    // Parse features from JSON and type cast
    const features = Array.isArray(template.features) ? template.features as unknown as TemplateFeature[] : [];

    // Create features from template
    const featurePromises = features.map((feature, index) =>
      supabase
        .from('features')
        .insert([{
          project_id: projectId,
          title: feature.title,
          description: feature.description,
          priority: feature.priority,
          order_index: index
        }])
    );

    await Promise.all(featurePromises);

    // Record template usage
    const user = await supabase.auth.getUser();
    if (user.data.user) {
      await supabase
        .from('template_usage')
        .insert([{
          template_id: templateId,
          used_by: user.data.user.id,
          project_id: projectId
        }]);
    }
  };

  useEffect(() => {
    fetchTemplates().finally(() => setLoading(false));
  }, []);

  return {
    templates,
    loading,
    applyTemplate,
    refetch: fetchTemplates
  };
};
