
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
    const prompt = this.buildPRDPrompt(projectData, template);
    
    try {
      // For now, we'll generate a mock PRD since we don't have OpenAI integration
      const prdContent = this.generateMockPRD(projectData, template);
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

  private buildPRDPrompt(projectData: any, template: string): string {
    return `
Generate a comprehensive Product Requirements Document for this project:

PROJECT DATA:
${JSON.stringify(projectData, null, 2)}

Create a detailed PRD with these sections:

## 1. EXECUTIVE SUMMARY
- Project name and description
- Problem statement and solution overview
- Target users and market opportunity
- Success metrics and business goals
- High-level timeline and resource requirements

## 2. FEATURE SPECIFICATIONS
For each feature (organized by execution order):
- Feature name and description
- Business justification and user value
- Detailed functional requirements
- User interface requirements
- Acceptance criteria
- Priority and complexity ratings

## 3. USER STORIES & DEVELOPMENT PLAN
Organized by execution order and phases:
- Complete user story specifications
- Acceptance criteria (Given-When-Then format)
- Dependencies and prerequisites
- Time estimates and complexity
- Phase groupings and milestones

## 4. TECHNICAL REQUIREMENTS
- Recommended technology stack
- Database design requirements
- API specifications
- Third-party integrations
- Performance and scalability requirements
- Security and compliance considerations

## 5. IMPLEMENTATION ROADMAP
- Phase-by-phase development plan
- Detailed timeline with milestones
- Resource allocation recommendations
- Risk assessment and mitigation
- Quality assurance checkpoints

## 6. SUCCESS METRICS & TESTING
- Key Performance Indicators (KPIs)
- User acceptance testing criteria
- Performance benchmarks
- Analytics and monitoring requirements

FORMAT REQUIREMENTS:
- Use clear, non-technical language for business sections
- Include specific, actionable requirements
- Organize content by execution order
- Provide implementation guidance
- Include troubleshooting considerations
- Focus on preventing common development issues

${template === 'ai_builder' ? `
AI BUILDER OPTIMIZATION:
- Include specific guidance for Lovable, Bolt, and Cursor
- Provide copy-paste ready specifications
- Include common pitfalls and solutions
- Focus on incremental development approach
- Provide clear acceptance criteria for AI validation
` : ''}

Make this PRD immediately useful for successful app development!
    `.trim();
  }

  private generateMockPRD(projectData: any, template: string): string {
    const project = projectData.project;
    const features = projectData.features;
    const userStories = projectData.userStories;
    const executionPlan = projectData.executionPlan;

    return `# Product Requirements Document: ${project.title}

## 1. EXECUTIVE SUMMARY

### Project Overview
**Project Name:** ${project.title}
**Description:** ${project.description || 'A comprehensive application solution'}

### Problem Statement
This project addresses key user needs through a structured approach to feature development and implementation.

### Target Users
- Primary users seeking ${project.project_type || 'web application'} solutions
- Secondary stakeholders requiring reliable and scalable platform

### Success Metrics
- User engagement and retention
- Feature adoption rates
- Performance benchmarks
- Development timeline adherence

### Timeline Overview
- **Total Features:** ${features.length}
- **Total User Stories:** ${userStories.length}
- **Estimated Development Time:** ${executionPlan.estimatedTotalHours} hours
- **Development Phases:** ${executionPlan.phases.length}

## 2. FEATURE SPECIFICATIONS

${features.map((feature, index) => `
### Feature ${index + 1}: ${feature.title}
**Priority:** ${feature.priority || 'Medium'}
**Complexity:** ${feature.complexity || 'Medium'}
**Category:** ${feature.category || 'Core'}

**Description:** ${feature.description || 'Feature description to be defined'}

**Business Justification:**
This feature provides essential functionality that directly supports user goals and business objectives.

**Functional Requirements:**
- Core functionality as specified in user stories
- Integration with existing system components
- Performance optimization for user experience

**User Interface Requirements:**
- Intuitive and accessible design
- Responsive layout for multiple devices
- Consistent with overall application design system

**Acceptance Criteria:**
- Feature functions as specified
- Passes all quality assurance tests
- Meets performance benchmarks
`).join('\n')}

## 3. USER STORIES & DEVELOPMENT PLAN

### Development Phases

${executionPlan.phases.map(phase => `
#### ${phase.name}
**Estimated Hours:** ${phase.estimatedHours}
**Stories:** ${phase.stories.length}

${phase.stories.map(storyTitle => {
  const story = userStories.find(s => s.title === storyTitle);
  return `
**Story:** ${storyTitle}
**Priority:** ${story?.priority || 'Medium'}
**Complexity:** ${story?.complexity || 'Medium'}
**Estimated Hours:** ${story?.estimated_hours || 4}

**Description:** ${story?.description || 'User story description'}

**Acceptance Criteria:**
${story?.acceptance_criteria?.map(criteria => `- ${criteria}`).join('\n') || '- Criteria to be defined'}
`;
}).join('\n')}
`).join('\n')}

## 4. TECHNICAL REQUIREMENTS

### Recommended Technology Stack
- **Frontend:** React with TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Supabase (Database, Authentication, API)
- **State Management:** React Query for server state
- **UI Components:** Shadcn/ui component library

### Database Design
Based on the existing schema with proper relationships and data integrity.

### API Specifications
RESTful API through Supabase with proper authentication and authorization.

### Performance Requirements
- Page load times under 3 seconds
- API response times under 500ms
- 99.9% uptime availability

### Security Considerations
- Row-level security for data access
- Authentication and authorization
- Data encryption and secure transmission

## 5. IMPLEMENTATION ROADMAP

### Phase 1: Foundation
**Duration:** ${Math.round(executionPlan.phases[0]?.estimatedHours / 8)} days
**Objectives:**
- Set up core infrastructure
- Implement basic user authentication
- Create foundational components

### Quality Assurance Checkpoints
- Code review for each feature
- Automated testing implementation
- User acceptance testing
- Performance monitoring

### Risk Mitigation
- Regular backup and recovery procedures
- Monitoring and alerting systems
- Gradual feature rollout strategy

## 6. SUCCESS METRICS & TESTING

### Key Performance Indicators (KPIs)
- Feature completion rate: 100%
- Bug resolution time: < 24 hours
- User satisfaction score: > 4.0/5.0
- System performance: Meeting all benchmarks

### User Acceptance Testing
- Feature functionality verification
- User experience validation
- Cross-browser compatibility testing
- Mobile responsiveness verification

### Performance Benchmarks
- Database query performance
- API response times
- Frontend rendering performance
- Overall system reliability

${template === 'ai_builder' ? `
## AI BUILDER OPTIMIZATION GUIDE

### Lovable Development Tips
- Break features into small, manageable components
- Use the existing UI component library consistently
- Implement features incrementally with immediate testing

### Common Pitfalls to Avoid
- Don't try to implement too many features at once
- Ensure proper error handling for all user interactions
- Test each feature thoroughly before moving to the next

### AI Validation Checklist
- ✓ Feature works as specified in acceptance criteria
- ✓ UI is responsive and accessible
- ✓ Data persists correctly in database
- ✓ Error states are handled gracefully
- ✓ Performance meets requirements
` : ''}

---

**Document Version:** 1.0
**Generated:** ${new Date().toLocaleDateString()}
**Status:** Draft - Ready for Development`;
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
