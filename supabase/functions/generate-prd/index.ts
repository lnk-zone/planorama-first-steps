
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PRDGenerationRequest {
  projectData: {
    project: any;
    features: any[];
    userStories: any[];
    executionPlan: any;
    structuredPhases?: any[]; // New field for structured phases
  };
  template: 'comprehensive' | 'technical' | 'business' | 'ai_builder';
}

const buildEnhancedPRDPrompt = (projectData: any, template: string): string => {
  const { project, features, userStories, executionPlan, structuredPhases } = projectData;
  
  // Extract enhanced context if available
  const projectTitle = project.title || 'Untitled Project';
  const projectDescription = project.description || 'No description provided';
  const appType = project.project_type || 'web application';
  
  // Use structured phases for implementation roadmap
  const implementationRoadmapSection = structuredPhases ? 
    generateStructuredImplementationRoadmap(structuredPhases) :
    generateFallbackImplementationRoadmap(executionPlan);

  // Generate explicit phase coverage instructions
  const phaseByPhaseCoverageInstructions = structuredPhases && structuredPhases.length > 0 ? 
    generatePhaseByPhaseInstructions(structuredPhases) :
    generateFallbackPhaseInstructions(executionPlan);

  // Analyze features to extract context
  const authFeatures = features.filter((f: any) => 
    f.category === 'auth' || 
    f.title.toLowerCase().includes('auth') || 
    f.title.toLowerCase().includes('login') || 
    f.title.toLowerCase().includes('user')
  );
  
  const coreFeatures = features.filter((f: any) => 
    f.category === 'core' || f.priority === 'high'
  );
  
  const integrationFeatures = features.filter((f: any) => 
    f.category === 'integration' || 
    f.title.toLowerCase().includes('integration') || 
    f.title.toLowerCase().includes('api')
  );

  const totalEstimatedHours = userStories.reduce((sum: number, story: any) => sum + (story.estimated_hours || 4), 0);
  const avgStoryComplexity = userStories.reduce((sum: number, story: any) => {
    const complexity = story.complexity === 'high' ? 3 : story.complexity === 'medium' ? 2 : 1;
    return sum + complexity;
  }, 0) / userStories.length;

  const templateInstructions = {
    ai_builder: `
SPECIALIZED AI BUILDER PRD - This PRD is optimized for AI coding assistants like Lovable, Bolt, and Cursor.

Focus on providing:
- Implementation guidance for AI builders
- Copy-paste ready feature specifications
- Step-by-step development phases
- Technical requirements for AI tools
- Common implementation challenges and solutions
- Incremental development approach

Include these specialized sections:
- AI Builder Implementation Guide
- Phase-by-Phase Development Plan
- Copy-Paste Feature Specifications
- Common Implementation Challenges
- AI Builder Best Practices
`,
    comprehensive: `
COMPREHENSIVE BUSINESS PRD - Include all aspects for stakeholders and development teams.

Focus on providing:
- Executive summary and business case
- Market analysis and competitive landscape
- Detailed user personas and use cases
- Complete technical architecture
- Business metrics and KPIs
- Risk assessment and mitigation strategies
`,
    technical: `
TECHNICAL FOCUSED PRD - Emphasize technical specifications and architecture.

Focus on providing:
- Technical architecture and system design
- API specifications and data models
- Security requirements and compliance
- Performance requirements and scalability
- Infrastructure and deployment considerations
`,
    business: `
BUSINESS FOCUSED PRD - Emphasize business value and market fit.

Focus on providing:
- Business model and revenue strategy
- Market opportunity and competitive analysis
- User acquisition and retention strategy
- Success metrics and business KPIs
- Go-to-market strategy
`
  };

  return `
You are a senior product manager creating a comprehensive Product Requirements Document (PRD). Please create a professional, detailed PRD that synthesizes all project information into actionable specifications for both technical teams and non-technical stakeholders.

DOCUMENT REQUIREMENTS:
This PRD will serve as the official roadmap document for non-technical stakeholders who need complete information to understand and approve the project. Please ensure every section is thoroughly detailed and professionally written.

${templateInstructions[template as keyof typeof templateInstructions] || templateInstructions.ai_builder}

PROJECT CONTEXT:
**Project:** ${projectTitle}
**Type:** ${appType}
**Description:** ${projectDescription}

**Development Overview:**
- Total Features: ${features.length}
- User Stories: ${userStories.length}
- Estimated Development: ${userStories.reduce((sum: number, story: any) => sum + (story.estimated_hours || 4), 0)} hours
- Development Phases: ${structuredPhases?.length || executionPlan.phases?.length || 3}

**Complete Features List:**
${features.map((feature: any, index: number) => `
${index + 1}. **${feature.title}** (${feature.priority} priority, ${feature.complexity} complexity)
   Description: ${feature.description}
   Estimated Development: ${feature.estimated_hours || 8} hours
   Category: ${feature.category}
   Current Status: ${feature.status}
`).join('')}

**Complete User Stories Breakdown:**
${userStories.map((story: any, index: number) => `
${index + 1}. **${story.title}**
   - Description: ${story.description || 'Standard user story implementation'}
   - Priority: ${story.priority}, Complexity: ${story.complexity}
   - Estimated Time: ${story.estimated_hours || 4} hours
   - Related Feature: ${features.find((f: any) => f.id === story.feature_id)?.title || 'Core Feature'}
   - Acceptance Criteria: ${story.acceptance_criteria?.length > 0 ? story.acceptance_criteria.join('; ') : 'Standard completion and testing criteria'}
`).join('')}

**STRUCTURED IMPLEMENTATION ROADMAP:**
${implementationRoadmapSection}

Please create a comprehensive PRD with the following sections, ensuring each is thoroughly detailed:

## 1. Executive Summary
Please provide a comprehensive project overview including business case, key objectives and success criteria, high-level timeline and resource requirements, and expected ROI and business impact.

## 2. Product Overview
Please include detailed product vision and positioning, target market and user base analysis, core value proposition and competitive advantages, and product goals with measurable objectives.

## 3. Target Users & Use Cases
Please provide detailed primary user personas with demographics, complete user journey mapping and workflows, comprehensive use cases and scenarios, and user needs analysis with pain points addressed.

## 4. Feature Specifications
For each of the ${features.length} features, please provide a complete specification including:
- Detailed feature description explaining functionality and business value
- Complete list of associated user stories with full acceptance criteria
- Technical implementation considerations and requirements
- Dependencies and integration requirements
- Success metrics and testing criteria

Please write out specifications for all ${features.length} features completely without summarization.

## 5. Technical Requirements
Please provide comprehensive system architecture overview, complete technology stack recommendations with justifications, detailed security and compliance requirements, performance and scalability specifications with metrics, and integration requirements with API specifications.

## 6. Implementation Roadmap
${implementationRoadmapSection}

## 7. Success Metrics & Analytics
Please provide Key Performance Indicators (KPIs) with measurement methods, user engagement metrics and tracking implementation, business success criteria and ROI calculations, and analytics and tracking requirements with tools specification.

## 8. User Experience Guidelines
Please include design principles and guidelines with examples, user interface requirements and interaction patterns, accessibility considerations and compliance standards, and mobile and responsive design requirements.

${template === 'ai_builder' ? `
## 9. AI Builder Implementation Guide
Please provide Lovable/Bolt/Cursor specific considerations and best practices, recommended implementation sequence with detailed steps, copy-paste ready specifications for each feature, common pitfalls and solutions with specific examples, and testing and validation approaches for AI-built applications.

## 10. Phase-by-Phase Development Plan

CRITICAL INSTRUCTION: You must provide detailed coverage for EVERY SINGLE phase listed below. Do not provide examples or truncate. Write complete specifications for ALL phases.

${phaseByPhaseCoverageInstructions}

IMPORTANT: The above phases are the complete list. You must write detailed specifications for EVERY phase listed above. Do not use phrases like "and more", "similar patterns", "continue for all", or provide only examples. Each phase must be individually covered with complete detail.
` : ''}

## ${template === 'ai_builder' ? '11' : '9'}. Out of Scope
Please provide features explicitly not included in this version with explanations, future considerations and product roadmap beyond initial release, and known limitations and constraints with impact analysis.

DELIVERABLE SPECIFICATIONS:
- Create a well-structured, professional PRD document in markdown format
- Use proper headings, bullet points, and formatting for readability
- Provide specific and actionable specifications that can be implemented
- Maintain professional tone suitable for both technical and non-technical stakeholders
- Ensure every feature and user story is completely detailed
- Include implementation guidance that development teams can follow immediately

This document will serve as the definitive guide for building this ${appType} application with ${features.length} features and ${userStories.length} user stories.
  `.trim();
};

function generatePhaseByPhaseInstructions(phases: any[]): string {
  if (!phases || phases.length === 0) {
    return "Please provide detailed development phases with task breakdowns, dependencies, time estimates, and quality checkpoints.";
  }

  return `
Please provide comprehensive coverage for each of the following ${phases.length} phases:

${phases.map((phase: any, index: number) => `
### For ${phase.name} (Phase ${index + 1}):
**Detailed Breakdown of Tasks:** Provide a complete list of specific development tasks for ${phase.name}, including all deliverables: ${phase.deliverables?.join(', ') || 'Core development tasks'}. Estimated effort: ${phase.estimatedHours || 0} hours.

**Prerequisites and Dependencies:** List all requirements that must be completed before starting ${phase.name}. Include any dependencies on previous phases, external systems, or resources.

**AI Builder Session Recommendations:** Provide specific guidance for implementing ${phase.name} using AI builders like Lovable, Bolt, or Cursor. Include recommended session structure, time estimates, and specific prompts or approaches.

**Quality Assurance Checkpoints:** Define validation criteria and testing requirements for ${phase.name}. Include what success looks like and how to verify completion before moving to the next phase.
`).join('\n')}

CRITICAL: You must provide complete coverage for all ${phases.length} phases listed above. Each phase must have detailed specifications for tasks, dependencies, AI builder recommendations, and quality checkpoints. Do not summarize or provide examples only.
`.trim();
}

function generateFallbackPhaseInstructions(executionPlan: any): string {
  const phaseCount = executionPlan?.phases?.length || 3;
  return `
Please provide detailed breakdown for all ${phaseCount} development phases including:
- Specific tasks and deliverables for each phase
- Prerequisites and dependencies
- AI builder session recommendations with time estimates
- Quality assurance checkpoints and validation criteria

Cover all ${phaseCount} phases completely without truncation.
`;
}

function generateStructuredImplementationRoadmap(phases: any[]): string {
  if (!phases || phases.length === 0) {
    return "No structured phases available.";
  }

  return `
The implementation will be executed in ${phases.length} carefully planned phases:

${phases.map((phase: any) => `
### ${phase.name} (${phase.estimatedHours || 0} hours)

**Phase Objective:** ${phase.description || `Complete ${phase.name}`}

**Key Deliverables:**
${(phase.deliverables || []).map((deliverable: string) => `- ${deliverable}`).join('\n')}

**Estimated Timeline:** ${phase.estimatedHours || 0} hours
**Dependencies:** Prerequisites from previous phases must be completed
**Success Criteria:** All deliverables tested and functioning as specified
`).join('\n')}

**Phase Sequencing Logic:**
- Each phase builds upon the foundation established in previous phases
- Dependencies are carefully managed to ensure smooth progression
- Testing and validation checkpoints occur at the end of each phase
- User stories are grouped logically to maximize development efficiency

**Total Estimated Timeline:** ${phases.reduce((sum: number, phase: any) => sum + (phase.estimatedHours || 0), 0)} hours across ${phases.length} phases
`.trim();
}

function generateFallbackImplementationRoadmap(executionPlan: any): string {
  if (!executionPlan?.phases) {
    return "Implementation roadmap will be determined based on feature priorities and dependencies.";
  }

  return `
${executionPlan.phases?.map((phase: any) => `
**${phase.name}** (${phase.estimatedHours} hours)
- Phase Number: ${phase.number}
- Stories Included: ${phase.stories?.length || 0}
- Key Deliverables: ${phase.stories?.join(', ') || 'Core development milestones'}
- Phase Description: ${phase.description || 'Implementation of core features and functionality'}
`).join('') || 'Structured development approach with logical phases'}
`.trim();
}

const validatePRDResponse = (content: string): { isValid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  // Check for common shortcuts and incomplete content
  const problematicPhrases = [
    '... (continue for',
    '...and so on',
    'etc.',
    'Additional features include...',
    'Similar patterns apply',
    '...',
    'and more',
    'continue for all'
  ];
  
  const lowerContent = content.toLowerCase();
  problematicPhrases.forEach(phrase => {
    if (lowerContent.includes(phrase.toLowerCase())) {
      issues.push(`Contains incomplete content indicator: "${phrase}"`);
    }
  });
  
  // Check minimum reasonable length
  const wordCount = content.split(/\s+/).length;
  if (wordCount < 3000) {
    issues.push(`Document appears incomplete: ${wordCount} words (expected 4000-6000)`);
  }
  
  // Check for essential sections
  const requiredSections = [
    'Executive Summary',
    'Product Overview', 
    'Target Users',
    'Feature Specifications',
    'Technical Requirements',
    'Implementation Roadmap',
    'Success Metrics'
  ];
  
  requiredSections.forEach(section => {
    if (!content.includes(section)) {
      issues.push(`Missing essential section: ${section}`);
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectData, template }: PRDGenerationRequest = await req.json();

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Generating comprehensive PRD with structured phases...');
    console.log('Template:', template);
    console.log('Features count:', projectData.features.length);
    console.log('User stories count:', projectData.userStories.length);
    console.log('Structured phases:', projectData.structuredPhases?.length || 0);

    const prompt = buildEnhancedPRDPrompt(projectData, template);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a senior product manager AI who creates comprehensive Product Requirements Documents. You synthesize feature lists and user stories into professional, detailed PRDs suitable for development teams and stakeholders.

Professional Standards:
- Create thorough documentation with complete specifications for every feature
- Write all user stories with detailed acceptance criteria
- Provide actionable implementation guidance
- Use professional language suitable for business stakeholders
- Ensure comprehensive coverage without shortcuts or abbreviations
- Target 4,000-6,000 words for thorough documentation
- Focus on clarity and completeness for non-technical audiences

Document Purpose:
- Serves as official roadmap for project stakeholders
- Provides implementation guidance for development teams
- Contains complete specifications without requiring additional clarification
- Enables non-technical users to understand project scope and requirements

CRITICAL INSTRUCTION FOR PHASE-BY-PHASE SECTIONS:
When you encounter instructions to cover multiple phases or items individually, you MUST provide complete coverage for each one. Never use phrases like "and more", "similar patterns", "continue for all", or provide only examples. Each phase, feature, or item must be individually addressed with full detail. This is essential for the document's completeness and professional quality.

Please create detailed, professional documentation that covers all aspects of the project comprehensively. Every feature should be fully specified, every user story should include complete acceptance criteria, and all sections should provide the depth of information needed for successful project execution.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 16000,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    
    if (!aiResponse.choices || !aiResponse.choices[0] || !aiResponse.choices[0].message) {
      throw new Error('Invalid response structure from OpenAI');
    }

    const prdContent = aiResponse.choices[0].message.content;
    
    if (!prdContent || prdContent.trim().length === 0) {
      throw new Error('Empty response from OpenAI');
    }

    // Validate the response quality
    const validation = validatePRDResponse(prdContent);
    if (!validation.isValid) {
      console.warn('PRD quality issues detected:', validation.issues);
      // Continue with generation but log issues for monitoring
    }

    console.log('PRD generated successfully, length:', prdContent.length);
    console.log('Word count:', prdContent.split(/\s+/).length);
    
    if (validation.issues.length > 0) {
      console.log('Content quality notes:', validation.issues);
    }

    return new Response(JSON.stringify({ 
      content: prdContent,
      wordCount: prdContent.split(' ').length,
      template,
      generatedAt: new Date().toISOString(),
      qualityNotes: validation.issues
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in generate-prd function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate comprehensive PRD',
        details: error.message || 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
