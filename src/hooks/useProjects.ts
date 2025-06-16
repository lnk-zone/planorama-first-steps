
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  project_type: string;
  user_id: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateProjectData {
  title: string;
  description?: string;
  status?: string;
  project_type?: string;
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setProjects(data || []);
  };

  const addProject = async (projectData: CreateProjectData) => {
    const { data, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single();

    if (error) throw error;
    setProjects(prev => [data, ...prev]);
    return data;
  };

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();

    if (error) throw error;
    setProjects(prev => prev.map(p => p.id === projectId ? data : p));
    return data;
  };

  const deleteProject = async (projectId: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
    setProjects(prev => prev.filter(p => p.id !== projectId));
  };

  useEffect(() => {
    fetchProjects().finally(() => setLoading(false));
  }, []);

  return {
    projects,
    loading,
    addProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects
  };
};
