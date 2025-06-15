
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface TemplateCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  display_order: number | null;
  is_active: boolean | null;
  created_at: string | null;
}

export interface EnhancedProjectTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  features: Json;
  is_public: boolean | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  tags: string[] | null;
  difficulty_level: string | null;
  estimated_hours: number | null;
  version: number | null;
  parent_template_id: string | null;
  is_featured: boolean | null;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  category: string;
  features: Json;
  tags?: string[];
  difficulty_level?: string;
  estimated_hours?: number;
  is_public?: boolean;
}

export const useEnhancedTemplates = () => {
  const [templates, setTemplates] = useState<EnhancedProjectTemplate[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
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

  const fetchUserTemplates = async () => {
    const { data, error } = await supabase
      .from('project_templates')
      .select('*')
      .eq('created_by', (await supabase.auth.getUser()).data.user?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('template_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;
    setCategories(data || []);
  };

  const createTemplate = async (templateData: CreateTemplateData) => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('project_templates')
      .insert([{
        ...templateData,
        created_by: user.data.user.id,
        is_public: templateData.is_public ?? false
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const updateTemplate = async (templateId: string, updates: Partial<CreateTemplateData>) => {
    const { data, error } = await supabase
      .from('project_templates')
      .update(updates)
      .eq('id', templateId)
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const deleteTemplate = async (templateId: string) => {
    const { error } = await supabase
      .from('project_templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;
  };

  const recordTemplateUsage = async (templateId: string, projectId?: string) => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return;

    const { error } = await supabase
      .from('template_usage')
      .insert([{
        template_id: templateId,
        used_by: user.data.user.id,
        project_id: projectId
      }]);

    if (error) console.error('Failed to record template usage:', error);
  };

  const applyTemplate = async (templateId: string, projectId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) throw new Error('Template not found');

    // Parse features from JSON and type cast
    const features = Array.isArray(template.features) ? template.features as unknown as any[] : [];

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
    await recordTemplateUsage(templateId, projectId);
  };

  useEffect(() => {
    Promise.all([fetchTemplates(), fetchCategories()])
      .finally(() => setLoading(false));
  }, []);

  return {
    templates,
    categories,
    loading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplate,
    fetchUserTemplates,
    recordTemplateUsage,
    refetch: () => Promise.all([fetchTemplates(), fetchCategories()])
  };
};
