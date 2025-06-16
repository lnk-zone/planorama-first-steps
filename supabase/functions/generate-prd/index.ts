
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { projectData, template } = await req.json();

    const systemPrompt = `You are an expert product manager and technical architect who creates comprehensive, professional Product Requirements Documents (PRDs) that help non-technical users succeed with AI app builders like Lovable, Bolt, and Cursor.

Your role is to transform feature lists and user stories into professional PRDs that serve as complete blueprints for development. You understand that users will reference this throughout development and share it with developers or stakeholders.

Key principles:
- Create comprehensive business analysis with market context
- Provide detailed technical specifications and architecture
- Include professional formatting with clear section hierarchy
- Focus on AI builder optimization with platform-specific guidance
- Generate actionable, copy-paste ready specifications
- Use AI builder time estimates (1-6 hours per story vs traditional development)
- Leverage all available project data for contextual insights
- Create logical development phases based on dependencies
- Include risk assessment and mitigation strategies
- Provide success metrics and KPIs based on project goals`;

    const userPrompt = buildEnhancedPRDPrompt(projectData, template);

    console.log('Generating enhanced PRD with OpenAI for project:', projectData.project?.title);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 16000,
        temperature: 0.2
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    console.log('Enhanced PRD generated successfully, length:', generatedContent.length);

    return new Response(JSON.stringify({ 
      content: generatedContent,
      usage: data.usage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-prd function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildEnhancedPRDPrompt(projectData: any, template: string): string {
  const project = projectData.project;
  const features = projectData.features || [];
  const userStories = projectData.userStories || [];
  const executionPlan = projectData.executionPlan || {};

  // Analyze project context
  const projectContext = analyzeProjectContext(project, features, userStories);
  const businessContext = generateBusinessContext(project, features);
  const technicalContext = analyzeTechnicalContext(features, userStories);
  const phaseAnalysis = analyzeExecutionPhases(features, userStories);

  return `Generate a comprehensive, professional Product Requirements Document (PRD) following the structure and quality of enterprise-level documentation.

## PROJECT ANALYSIS

### Project Overview
- **Title:** ${project?.title || 'Untitled Project'}
- **Description:** ${project?.description || 'No description provided'}
- **Type:** ${project?.project_type || 'Web Application'}
- **Status:** ${project?.status || 'Planning'}

### Business Context Analysis
${businessContext}

### Technical Context Analysis
${technicalContext}

### Project Metrics
- **Total Features:** ${features.length}
- **Total User Stories:** ${userStories.length}
- **Estimated Development Time:** ${executionPlan.estimatedTotalHours || 0} AI builder hours
- **Development Phases:** ${executionPlan.phases?.length || 1}

## FEATURE BREAKDOWN (Organized by Execution Order)

${features.map((feature: any, index: number) => {
  const relatedStories = userStories.filter((story: any) => story.feature_id === feature.id);
  return `
### ${index + 1}. ${feature.title}
- **Priority:** ${feature.priority || 'Medium'}
- **Complexity:** ${feature.complexity || 'Medium'} 
- **Category:** ${feature.category || 'Core'}
- **Execution Order:** ${feature.execution_order || 'Not set'}
- **Description:** ${feature.description || 'No description'}
- **AI Builder Estimate:** ${feature.estimated_hours || 4} hours
- **Related User Stories:** ${relatedStories.length} stories
${relatedStories.map((story: any, storyIndex: number) => `
  ${storyIndex + 1}. ${story.title}
     - Priority: ${story.priority || 'Medium'}
     - AI Builder Estimate: ${story.estimated_hours || 2} hours
     - Acceptance Criteria: ${story.acceptance_criteria ? story.acceptance_criteria.join('; ') : 'Not defined'}
`).join('')}`;
}).join('')}

## EXECUTION PHASES ANALYSIS
${phaseAnalysis}

Create a detailed PRD with the following structure and requirements:

# [Project Title] - Product Requirements Document

## 1. EXECUTIVE SUMMARY
- **Project Name and Description:** Clear, compelling overview
- **Problem Statement and Solution Overview:** Market context and value proposition
- **Target Users and Market Opportunity:** User personas and market analysis based on project type
- **Success Metrics and Business Goals:** Specific KPIs and measurable outcomes
- **High-Level Timeline and Resource Requirements:** Based on AI builder capabilities

## 2. FEATURE SPECIFICATIONS
For each feature (organized by execution order and dependencies):
- **Feature Name and Description:** Clear, actionable specifications
- **Business Justification and User Value:** Why this feature matters
- **Detailed Functional Requirements:** Specific, testable requirements
- **User Interface Requirements:** Design and interaction specifications
- **Acceptance Criteria:** Clear, measurable criteria in Given-When-Then format
- **Priority and Complexity Ratings:** Based on provided data
- **AI Builder Time Estimates:** Realistic estimates for AI-assisted development

## 3. USER STORIES & DEVELOPMENT PLAN
Organized by execution order and phases:
- **Complete User Story Specifications:** Professional format with context
- **Acceptance Criteria:** Detailed Given-When-Then format for each story
- **Dependencies and Prerequisites:** Clear dependency mapping
- **AI Builder Time Estimates:** Realistic 1-6 hour estimates per story
- **Phase Groupings and Milestones:** Logical development phases

## 4. TECHNICAL REQUIREMENTS
- **Recommended Technology Stack:** Modern web development stack
- **Database Design Requirements:** Schema suggestions based on features
- **API Specifications:** RESTful API design patterns
- **Third-Party Integrations:** Based on feature requirements
- **Performance and Scalability Requirements:** Realistic benchmarks
- **Security and Compliance Considerations:** Industry best practices

## 5. IMPLEMENTATION ROADMAP
- **Phase-by-Phase Development Plan:** Logical progression based on dependencies
- **Detailed Timeline with Milestones:** Realistic AI builder timeline
- **Resource Allocation Recommendations:** For AI-assisted development
- **Risk Assessment and Mitigation:** Technical and business risks
- **Quality Assurance Checkpoints:** Testing and validation strategies

## 6. SUCCESS METRICS & TESTING
- **Key Performance Indicators (KPIs):** Measurable success criteria
- **User Acceptance Testing Criteria:** Detailed testing specifications
- **Performance Benchmarks:** Realistic performance targets
- **Analytics and Monitoring Requirements:** Tracking and measurement strategy

${template === 'ai_builder' ? `
## AI BUILDER OPTIMIZATION

### Platform-Specific Guidance
- **Lovable Optimization:**
  - Component-based architecture recommendations
  - Supabase integration patterns
  - Progressive enhancement strategies
  - Responsive design best practices

- **Bolt Optimization:**
  - File structure recommendations
  - Environment setup guidance
  - Deployment strategies
  - Performance optimization tips

- **Cursor Optimization:**
  - Code organization patterns
  - AI-assisted development workflows
  - Debugging and testing strategies
  - Version control best practices

### Copy-Paste Ready Specifications
- Provide detailed component specifications that can be directly used as prompts
- Include specific database schema definitions
- Offer pre-written user story formats
- Supply ready-to-use acceptance criteria templates

### Common Pitfalls and Solutions
- **Over-Engineering:** Keep implementations simple and focused
- **Scope Creep:** Stick to defined user stories and acceptance criteria
- **Performance Issues:** Implement lazy loading and optimization from the start
- **Security Oversights:** Include authentication and authorization from day one

### Incremental Development Approach
- Break complex features into 2-4 hour development chunks
- Prioritize core functionality over advanced features
- Implement basic CRUD operations before complex business logic
- Focus on user experience and validation early

### AI Builder Time Estimates
- Simple CRUD operations: 1-2 hours
- Form with validation: 2-3 hours
- Complex business logic: 3-4 hours
- Integration with third-party services: 4-6 hours
- Advanced UI components: 2-4 hours

### Troubleshooting Guidance
- **Database Connection Issues:** Check environment variables and connection strings
- **Authentication Problems:** Verify JWT tokens and session management
- **UI Responsiveness:** Test on multiple screen sizes early and often
- **Performance Bottlenecks:** Profile and optimize database queries first
` : ''}

## FORMATTING REQUIREMENTS:
- Use professional, clear language suitable for technical and business stakeholders
- Include specific, actionable requirements with measurable outcomes
- Organize content by execution order and logical dependencies
- Provide comprehensive implementation guidance
- Include troubleshooting considerations and common challenges
- Focus on preventing typical development issues
- Use proper markdown formatting with clear hierarchy
- Include detailed technical specifications
- Provide business context and market analysis
- Ensure all time estimates reflect AI builder capabilities (not traditional development)

Generate a PRD that matches the depth, structure, and professionalism of enterprise-level documentation while being optimized for AI-assisted development workflows.`;
}

function analyzeProjectContext(project: any, features: any[], userStories: any[]): string {
  const complexityDistribution = features.reduce((acc: any, feature: any) => {
    const complexity = feature.complexity || 'medium';
    acc[complexity] = (acc[complexity] || 0) + 1;
    return acc;
  }, {});

  const priorityDistribution = features.reduce((acc: any, feature: any) => {
    const priority = feature.priority || 'medium';
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {});

  return `
Project Complexity Analysis:
- High complexity features: ${complexityDistribution.high || 0}
- Medium complexity features: ${complexityDistribution.medium || 0}
- Low complexity features: ${complexityDistribution.low || 0}

Priority Distribution:
- High priority features: ${priorityDistribution.high || 0}
- Medium priority features: ${priorityDistribution.medium || 0}
- Low priority features: ${priorityDistribution.low || 0}
  `;
}

function generateBusinessContext(project: any, features: any[]): string {
  const projectType = project?.project_type || 'other';
  const coreFeatures = features.filter(f => f.category === 'core' || f.priority === 'high');
  
  return `
Business Analysis:
- Project Type: ${projectType}
- Core Features Count: ${coreFeatures.length}
- Total Feature Scope: ${features.length} features
- Business Value Focus: ${coreFeatures.map(f => f.title).join(', ') || 'Not defined'}

Market Context:
Based on the project type "${projectType}" and core features, this solution addresses market needs in the ${projectType} space.
  `;
}

function analyzeTechnicalContext(features: any[], userStories: any[]): string {
  const totalEstimatedHours = userStories.reduce((sum: number, story: any) => sum + (story.estimated_hours || 4), 0);
  const avgComplexity = features.reduce((acc: any, feature: any) => {
    const complexity = feature.complexity || 'medium';
    acc[complexity] = (acc[complexity] || 0) + 1;
    return acc;
  }, {});

  return `
Technical Analysis:
- Total Estimated Development Time: ${totalEstimatedHours} AI builder hours
- Average Feature Complexity: Mostly ${Object.keys(avgComplexity).reduce((a, b) => avgComplexity[a] > avgComplexity[b] ? a : b, 'medium')}
- User Stories Count: ${userStories.length}
- Features with Dependencies: ${features.filter(f => f.dependencies && f.dependencies.length > 0).length}

Technical Recommendations:
- Suggested Development Approach: Incremental, AI-assisted development
- Recommended Stack: React/TypeScript with Supabase backend
- Architecture Pattern: Component-based with clear separation of concerns
  `;
}

function analyzeExecutionPhases(features: any[], userStories: any[]): string {
  // Group features by execution order
  const orderedFeatures = features.sort((a, b) => (a.execution_order || 999) - (b.execution_order || 999));
  const phases = [];
  
  // Create logical phases based on execution order and dependencies
  let currentPhase = [];
  let currentPhaseNumber = 1;
  
  for (const feature of orderedFeatures) {
    if (currentPhase.length >= 3) {
      phases.push({
        number: currentPhaseNumber,
        features: [...currentPhase],
        estimatedHours: currentPhase.reduce((sum, f) => sum + (f.estimated_hours || 8), 0)
      });
      currentPhase = [];
      currentPhaseNumber++;
    }
    currentPhase.push(feature);
  }
  
  if (currentPhase.length > 0) {
    phases.push({
      number: currentPhaseNumber,
      features: currentPhase,
      estimatedHours: currentPhase.reduce((sum, f) => sum + (f.estimated_hours || 8), 0)
    });
  }

  return phases.map(phase => `
Phase ${phase.number}: ${phase.features.map(f => f.title).join(', ')}
- Features: ${phase.features.length}
- Estimated Time: ${phase.estimatedHours} AI builder hours
- Focus: ${phase.features[0]?.category || 'Development'} functionality
  `).join('');
}
