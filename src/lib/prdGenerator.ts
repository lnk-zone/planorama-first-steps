import { supabase } from '@/integrations/supabase/client';

export interface PRDDocument {
  id: string;
  content: string;
  sections: PRDSection[];
  template: string;
  generatedAt: Date;
  wordCount: number;
  metadata: {
    totalFeatures: number;
    totalUserStories: number;
    estimatedDevelopmentTime: number;
    phases: number;
  };
}

export interface PRDSection {
  name: string;
  order: number;
  content: string;
  isEditable: boolean;
}

export interface ExportResult {
  data: Blob | string;
  filename: string;
  mimeType: string;
}

export class PRDGenerator {
  async generateComprehensivePRD(
    projectId: string,
    template: 'comprehensive' | 'technical' | 'business' | 'ai_builder' = 'ai_builder'
  ): Promise<PRDDocument> {
    
    const projectData = await this.gatherProjectDataWithOrder(projectId);
    
    try {
      console.log('Calling generate-prd edge function...');
      
      // Call the Supabase edge function for PRD generation
      const { data: prdResponse, error: functionError } = await supabase
        .functions
        .invoke('generate-prd', {
          body: {
            projectData,
            template
          }
        });

      if (functionError) {
        console.error('Edge function error:', functionError);
        throw new Error(`Failed to generate PRD: ${functionError.message}`);
      }

      if (!prdResponse?.content) {
        throw new Error('No content received from PRD generation');
      }

      const prdContent = prdResponse.content;
      const sections = this.parsePRDSections(prdContent);
      
      // Save PRD to database
      const prdRecord = await this.savePRDToDatabase(projectId, prdContent, template, sections);
      await this.savePRDSections(prdRecord.id, sections);
      
      return {
        id: prdRecord.id,
        content: prdContent,
        sections,
        template,
        generatedAt: new Date(),
        wordCount: prdContent.split(' ').length,
        metadata: {
          totalFeatures: projectData.features.length,
          totalUserStories: projectData.userStories.length,
          estimatedDevelopmentTime: projectData.executionPlan.estimatedTotalHours,
          phases: projectData.executionPlan.phases.length
        }
      };
      
    } catch (error) {
      console.error('PRD generation failed:', error);
      throw new Error('Failed to generate PRD. Please try again.');
    }
  }

  private async gatherProjectDataWithOrder(projectId: string) {
    // Fetch project data
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    // Fetch features
    const { data: features } = await supabase
      .from('features')
      .select('*')
      .eq('project_id', projectId)
      .order('execution_order', { ascending: true });

    // Fetch user stories
    const { data: userStories } = await supabase
      .from('user_stories')
      .select('*')
      .in('feature_id', features?.map(f => f.id) || [])
      .order('execution_order', { ascending: true });

    // Mock execution plan
    const executionPlan = {
      totalStories: userStories?.length || 0,
      estimatedTotalHours: userStories?.reduce((sum, story) => sum + (story.estimated_hours || 0), 0) || 0,
      phases: [
        {
          number: 1,
          name: "Phase 1: Foundation",
          stories: userStories?.slice(0, Math.ceil(userStories.length / 2)).map(s => s.title) || [],
          estimatedHours: userStories?.slice(0, Math.ceil(userStories.length / 2))
            .reduce((sum, story) => sum + (story.estimated_hours || 0), 0) || 0
        }
      ]
    };

    return {
      project,
      features: features || [],
      userStories: userStories || [],
      executionPlan
    };
  }

  private parsePRDSections(content: string): PRDSection[] {
    const sections: PRDSection[] = [];
    const sectionRegex = /^##\s+(\d+\.\s+)?(.+)$/gm;
    const matches = [...content.matchAll(sectionRegex)];
    
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const nextMatch = matches[i + 1];
      
      const sectionName = match[2].trim();
      const startIndex = match.index || 0;
      const endIndex = nextMatch ? nextMatch.index : content.length;
      const sectionContent = content.slice(startIndex, endIndex).trim();
      
      sections.push({
        name: sectionName,
        order: i + 1,
        content: sectionContent,
        isEditable: true
      });
    }
    
    return sections;
  }

  private async savePRDToDatabase(projectId: string, content: string, template: string, sections: PRDSection[]) {
    const { data: project } = await supabase
      .from('projects')
      .select('title')
      .eq('id', projectId)
      .single();

    const { data, error } = await supabase
      .from('prds')
      .insert({
        project_id: projectId,
        title: `PRD - ${project?.title || 'Project'}`,
        content,
        template,
        sections: sections.reduce((acc, section) => {
          acc[section.name] = section.content;
          return acc;
        }, {} as Record<string, string>),
        metadata: {
          wordCount: content.split(' ').length,
          sectionCount: sections.length
        }
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async savePRDSections(prdId: string, sections: PRDSection[]) {
    const sectionData = sections.map(section => ({
      prd_id: prdId,
      section_name: section.name,
      section_order: section.order,
      content: section.content,
      is_editable: section.isEditable
    }));

    const { error } = await supabase
      .from('prd_sections')
      .insert(sectionData);

    if (error) throw error;
  }

  async getPRDByProjectId(projectId: string): Promise<PRDDocument | null> {
    const { data } = await supabase
      .from('prds')
      .select(`
        *,
        prd_sections (*)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) return null;

    return {
      id: data.id,
      content: data.content,
      sections: (data.prd_sections || []).map((section: any) => ({
        name: section.section_name,
        order: section.section_order,
        content: section.content,
        isEditable: section.is_editable
      })),
      template: data.template,
      generatedAt: new Date(data.created_at),
      wordCount: data.content.split(' ').length,
      metadata: data.metadata as any
    };
  }

  async exportPRD(prdId: string, format: 'markdown' | 'html' | 'text'): Promise<ExportResult> {
    const { data } = await supabase
      .from('prds')
      .select('*')
      .eq('id', prdId)
      .single();

    if (!data) throw new Error('PRD not found');

    switch (format) {
      case 'markdown':
        return {
          data: data.content,
          filename: `prd-${data.title.replace(/\s+/g, '-').toLowerCase()}.md`,
          mimeType: 'text/markdown'
        };
      case 'html':
        const htmlContent = this.convertMarkdownToHtml(data.content);
        return {
          data: htmlContent,
          filename: `prd-${data.title.replace(/\s+/g, '-').toLowerCase()}.html`,
          mimeType: 'text/html'
        };
      case 'text':
        const textContent = data.content.replace(/[#*`]/g, '');
        return {
          data: textContent,
          filename: `prd-${data.title.replace(/\s+/g, '-').toLowerCase()}.txt`,
          mimeType: 'text/plain'
        };
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private convertMarkdownToHtml(markdown: string): string {
    return markdown
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n/g, '<br>');
  }
}
