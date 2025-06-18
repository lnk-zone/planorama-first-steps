import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';

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
  implementationPhases?: ImplementationPhase[]; // New field for structured phases
}

export interface ImplementationPhase {
  number: number;
  name: string;
  deliverables: string[];
  estimatedHours: number;
  description: string;
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
    
    const projectData = await this.gatherEnhancedProjectData(projectId);
    
    try {
      console.log('Calling enhanced generate-prd edge function...');
      
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
      
      // NEW: Extract implementation phases from the PRD content
      console.log('Extracting implementation phases from PRD...');
      let implementationPhases: ImplementationPhase[] = [];
      
      try {
        const implementationRoadmapSection = this.extractImplementationRoadmapSection(prdContent);
        
        if (implementationRoadmapSection) {
          const { data: phasesResponse, error: phasesError } = await supabase
            .functions
            .invoke('extract-implementation-phases', {
              body: {
                implementationRoadmapText: implementationRoadmapSection,
                userStories: projectData.userStories
              }
            });

          if (phasesError) {
            console.error('Phase extraction error:', phasesError);
            console.warn('Continuing without structured phases - will use fallback logic');
          } else if (phasesResponse?.phases) {
            implementationPhases = phasesResponse.phases;
            console.log('Successfully extracted', implementationPhases.length, 'implementation phases');
          }
        }
      } catch (phaseError) {
        console.error('Failed to extract implementation phases:', phaseError);
        console.warn('Continuing without structured phases - will use fallback logic');
      }
      
      const prdRecord = await this.savePRDToDatabase(
        projectId, 
        prdContent, 
        template, 
        sections, 
        implementationPhases
      );
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
          phases: implementationPhases.length || projectData.executionPlan.phases.length
        },
        implementationPhases
      };
      
    } catch (error) {
      console.error('PRD generation failed:', error);
      throw new Error('Failed to generate PRD. Please try again.');
    }
  }

  private extractImplementationRoadmapSection(prdContent: string): string | null {
    // Extract the Implementation Roadmap section from the PRD
    const roadmapMatch = prdContent.match(/## Implementation Roadmap([\s\S]*?)(?=##|$)/i);
    
    if (roadmapMatch && roadmapMatch[1]) {
      return roadmapMatch[1].trim();
    }
    
    // Alternative patterns to try
    const alternativePatterns = [
      /## \d+\.\s+Implementation Roadmap([\s\S]*?)(?=##|$)/i,
      /## Development Roadmap([\s\S]*?)(?=##|$)/i,
      /## Project Roadmap([\s\S]*?)(?=##|$)/i
    ];
    
    for (const pattern of alternativePatterns) {
      const match = prdContent.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    console.warn('Could not find Implementation Roadmap section in PRD');
    return null;
  }

  private async gatherEnhancedProjectData(projectId: string) {
    // Fetch project data
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    // Fetch features with enhanced data
    const { data: features } = await supabase
      .from('features')
      .select('*')
      .eq('project_id', projectId)
      .order('execution_order', { ascending: true });

    // Fetch user stories with enhanced data
    const { data: userStories } = await supabase
      .from('user_stories')
      .select('*')
      .in('feature_id', features?.map(f => f.id) || [])
      .order('execution_order', { ascending: true });

    // Enhanced execution plan with better analysis
    const executionPlan = this.generateEnhancedExecutionPlan(features || [], userStories || []);

    return {
      project,
      features: features || [],
      userStories: userStories || [],
      executionPlan
    };
  }

  private generateEnhancedExecutionPlan(features: any[], userStories: any[]) {
    const totalStories = userStories.length;
    const estimatedTotalHours = userStories.reduce((sum, story) => sum + (story.estimated_hours || 2), 0);
    
    // Create logical phases based on execution order and dependencies
    const orderedFeatures = features.sort((a, b) => (a.execution_order || 999) - (b.execution_order || 999));
    const phases = [];
    
    let currentPhase = [];
    let currentPhaseNumber = 1;
    let currentPhaseHours = 0;
    
    for (const feature of orderedFeatures) {
      const featureStories = userStories.filter(story => story.feature_id === feature.id);
      const featureHours = featureStories.reduce((sum, story) => sum + (story.estimated_hours || 2), 0);
      
      // Start new phase if current one is getting too large (>20 hours) or has >4 features
      if ((currentPhaseHours + featureHours > 20 || currentPhase.length >= 4) && currentPhase.length > 0) {
        phases.push({
          number: currentPhaseNumber,
          name: `Phase ${currentPhaseNumber}: ${this.getPhaseNameFromFeatures(currentPhase)}`,
          features: [...currentPhase],
          stories: userStories.filter(story => currentPhase.some(f => f.id === story.feature_id)).map(s => s.title),
          estimatedHours: currentPhaseHours,
          description: this.generatePhaseDescription(currentPhase)
        });
        currentPhase = [];
        currentPhaseNumber++;
        currentPhaseHours = 0;
      }
      
      currentPhase.push(feature);
      currentPhaseHours += featureHours;
    }
    
    // Add final phase if there are remaining features
    if (currentPhase.length > 0) {
      phases.push({
        number: currentPhaseNumber,
        name: `Phase ${currentPhaseNumber}: ${this.getPhaseNameFromFeatures(currentPhase)}`,
        features: currentPhase,
        stories: userStories.filter(story => currentPhase.some(f => f.id === story.feature_id)).map(s => s.title),
        estimatedHours: currentPhaseHours,
        description: this.generatePhaseDescription(currentPhase)
      });
    }

    return {
      totalStories,
      estimatedTotalHours,
      phases,
      averageStoryHours: totalStories > 0 ? Math.round(estimatedTotalHours / totalStories) : 2,
      complexity: this.assessProjectComplexity(features, userStories),
      riskFactors: this.identifyRiskFactors(features, userStories)
    };
  }

  private getPhaseNameFromFeatures(features: any[]): string {
    const categories = [...new Set(features.map(f => f.category || 'Core'))];
    const priorities = [...new Set(features.map(f => f.priority || 'medium'))];
    
    if (features.some(f => f.category === 'authentication' || f.title.toLowerCase().includes('auth'))) {
      return 'Authentication & Foundation';
    } else if (features.some(f => f.category === 'core' || f.priority === 'high')) {
      return 'Core Features';
    } else if (features.some(f => f.category === 'integration' || f.title.toLowerCase().includes('integration'))) {
      return 'Integrations & Advanced Features';
    } else {
      return `${categories[0] || 'Development'} Features`;
    }
  }

  private generatePhaseDescription(features: any[]): string {
    const featureTypes = features.map(f => f.category || 'feature').join(', ');
    const complexity = features.some(f => f.complexity === 'high') ? 'high' : 
                     features.some(f => f.complexity === 'medium') ? 'medium' : 'low';
    
    return `This phase focuses on ${featureTypes} with ${complexity} complexity. Key deliverables include ${features.map(f => f.title).join(', ')}.`;
  }

  private assessProjectComplexity(features: any[], userStories: any[]): string {
    const highComplexityFeatures = features.filter(f => f.complexity === 'high').length;
    const totalFeatures = features.length;
    const avgStoryHours = userStories.length > 0 ? 
      userStories.reduce((sum, s) => sum + (s.estimated_hours || 2), 0) / userStories.length : 2;

    if (highComplexityFeatures > totalFeatures * 0.3 || avgStoryHours > 4) {
      return 'High - Complex integrations and advanced features';
    } else if (highComplexityFeatures > 0 || avgStoryHours > 2.5) {
      return 'Medium - Standard web application complexity';
    } else {
      return 'Low - Simple CRUD operations and basic features';
    }
  }

  private identifyRiskFactors(features: any[], userStories: any[]): string[] {
    const risks = [];
    
    if (features.some(f => f.title.toLowerCase().includes('integration'))) {
      risks.push('Third-party integration dependencies');
    }
    
    if (features.some(f => f.complexity === 'high')) {
      risks.push('High complexity features may require additional development time');
    }
    
    if (userStories.some(s => (s.estimated_hours || 0) > 6)) {
      risks.push('Some user stories exceed recommended AI builder session length');
    }
    
    if (features.length > 15) {
      risks.push('Large feature scope may require careful prioritization');
    }
    
    return risks.length > 0 ? risks : ['Low risk - straightforward implementation'];
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

  private async savePRDToDatabase(
    projectId: string, 
    content: string, 
    template: string, 
    sections: PRDSection[], 
    implementationPhases: ImplementationPhase[] = []
  ) {
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
          sectionCount: sections.length,
          implementationPhases: implementationPhases // Store structured phases in metadata
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

    // Extract implementation phases from metadata
    const implementationPhases = data.metadata?.implementationPhases || [];

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
      metadata: data.metadata as any,
      implementationPhases
    };
  }

  async exportPRD(prdId: string, format: 'markdown' | 'html' | 'text' | 'pdf'): Promise<ExportResult> {
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
      case 'pdf':
        const pdfBlob = this.convertToPDF(data.content, data.title);
        return {
          data: pdfBlob,
          filename: `prd-${data.title.replace(/\s+/g, '-').toLowerCase()}.pdf`,
          mimeType: 'application/pdf'
        };
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private convertToPDF(content: string, title: string): Blob {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    
    // Set font
    pdf.setFont('helvetica');
    
    // Add title
    pdf.setFontSize(20);
    pdf.text(title, margin, 30);
    
    // Add content
    pdf.setFontSize(12);
    let yPosition = 50;
    
    // Split content into lines and handle page breaks
    const lines = content.split('\n');
    
    for (const line of lines) {
      // Handle headers
      if (line.startsWith('# ')) {
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        const headerText = line.substring(2);
        const wrappedHeader = pdf.splitTextToSize(headerText, maxWidth);
        
        // Check if we need a new page
        if (yPosition + (wrappedHeader.length * 10) > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        
        pdf.text(wrappedHeader, margin, yPosition);
        yPosition += wrappedHeader.length * 10 + 5;
        
      } else if (line.startsWith('## ')) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        const headerText = line.substring(3);
        const wrappedHeader = pdf.splitTextToSize(headerText, maxWidth);
        
        if (yPosition + (wrappedHeader.length * 8) > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        
        pdf.text(wrappedHeader, margin, yPosition);
        yPosition += wrappedHeader.length * 8 + 3;
        
      } else if (line.startsWith('### ')) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        const headerText = line.substring(4);
        const wrappedHeader = pdf.splitTextToSize(headerText, maxWidth);
        
        if (yPosition + (wrappedHeader.length * 7) > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        
        pdf.text(wrappedHeader, margin, yPosition);
        yPosition += wrappedHeader.length * 7 + 2;
        
      } else if (line.trim() !== '') {
        // Regular text
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        // Remove markdown formatting
        let cleanLine = line.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
        cleanLine = cleanLine.replace(/\*(.*?)\*/g, '$1'); // Italic
        cleanLine = cleanLine.replace(/`(.*?)`/g, '$1'); // Code
        
        const wrappedText = pdf.splitTextToSize(cleanLine, maxWidth);
        
        // Check if we need a new page
        if (yPosition + (wrappedText.length * 6) > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        
        pdf.text(wrappedText, margin, yPosition);
        yPosition += wrappedText.length * 6;
      } else {
        // Empty line
        yPosition += 4;
      }
      
      // Reset font for next line
      pdf.setFont('helvetica', 'normal');
    }
    
    return new Blob([pdf.output('blob')], { type: 'application/pdf' });
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
