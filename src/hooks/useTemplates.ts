
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  features: TemplateFeature[];
  is_public: boolean | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
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
      .order('name');

    if (error) throw error;
    setTemplates(data || []);
  };

  const applyTemplate = async (templateId: string, projectId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) throw new Error('Template not found');

    // Create features from template
    const featurePromises = template.features.map((feature, index) =>
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
