
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
  };
  template: 'comprehensive' | 'technical' | 'business' | 'ai_builder';
}

const buildEnhancedPRDPrompt = (projectData: any, template: string): string => {
  const { project, features, userStories, executionPlan } = projectData;
  
  // Extract enhanced context if available
  const projectTitle = project.title || 'Untitled Project';
  const projectDescription = project.description || 'No description provided';
  const appType = project.project_type || 'web application';
  
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

Quality Guidelines:
- Please provide complete specifications for every feature without summarization
- Write out all user stories with detailed acceptance criteria 
- Ensure each feature has comprehensive implementation details
- Target 4,000-6,000 words for a thorough, professional document
- Use clear, actionable language suitable for stakeholders
- Include specific technical considerations to help non-technical users understand scope

Please avoid using shortcuts like:
- "...and so on" or "etc."
- "Additional features include..." without listing them
- "Similar patterns apply..." without explanation
- Any form of truncation that leaves information incomplete

${templateInstructions[template as keyof typeof templateInstructions] || templateInstructions.ai_builder}

PROJECT CONTEXT:
**Project:** ${projectTitle}
**Type:** ${appType}
**Description:** ${projectDescription}

**Development Overview:**
- Total Features: ${features.length}
- User Stories: ${userStories.length}
- Estimated Development: ${totalEstimatedHours} hours
- Average Story Complexity: ${avgStoryComplexity.toFixed(1)}/3
- Development Phases: ${executionPlan.phases?.length || 3}

**Feature Categories:**
- Authentication Features: ${authFeatures.length}
- Core Business Features: ${coreFeatures.length}
- Integration Features: ${integrationFeatures.length}

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
   - Dependencies: ${story.dependencies?.length > 0 ? JSON.stringify(story.dependencies) : 'No blocking dependencies'}
`).join('')}

**Execution Plan Overview:**
${executionPlan.phases?.map((phase: any) => `
**${phase.name}** (${phase.estimatedHours} hours)
- Phase Number: ${phase.number}
- Stories Included: ${phase.stories?.length || 0}
- Key Deliverables: ${phase.stories?.join(', ') || 'Core development milestones'}
- Phase Description: ${phase.description || 'Implementation of core features and functionality'}
`).join('') || 'Structured development approach with logical phases'}

Please create a comprehensive PRD with the following sections, ensuring each is thoroughly detailed:

## 1. Executive Summary
Please provide a comprehensive project overview including business case (approximately 300 words), key objectives and success criteria (approximately 200 words), high-level timeline and resource requirements (approximately 200 words), and expected ROI and business impact (approximately 200 words).

## 2. Product Overview
Please include detailed product vision and positioning (approximately 300 words), target market and user base analysis (approximately 300 words), core value proposition and competitive advantages (approximately 250 words), and product goals with measurable objectives (approximately 250 words).

## 3. Target Users & Use Cases
Please provide detailed primary user personas with demographics (approximately 400 words), complete user journey mapping and workflows (approximately 400 words), comprehensive use cases and scenarios (approximately 300 words), and user needs analysis with pain points addressed (approximately 300 words).

## 4. Feature Specifications
For each of the ${features.length} features, please provide a complete specification including:
- Detailed feature description explaining functionality and business value
- Complete list of associated user stories with full acceptance criteria
- Technical implementation considerations and requirements
- Dependencies and integration requirements
- Success metrics and testing criteria
- Risk factors and mitigation strategies

Please write out specifications for all ${features.length} features completely without summarization.

## 5. Technical Requirements
Please provide comprehensive system architecture overview (approximately 400 words), complete technology stack recommendations with justifications (approximately 300 words), detailed security and compliance requirements (approximately 300 words), performance and scalability specifications with metrics (approximately 300 words), and integration requirements with API specifications (approximately 300 words).

## 6. Implementation Roadmap
Please include detailed development phases with specific timelines (approximately 400 words), complete milestone definitions and deliverables for each phase (approximately 400 words), resource requirements and team structure recommendations (approximately 300 words), and comprehensive risk assessment with mitigation strategies (approximately 400 words).

## 7. Success Metrics & Analytics
Please provide Key Performance Indicators (KPIs) with measurement methods (approximately 300 words), user engagement metrics and tracking implementation (approximately 250 words), business success criteria and ROI calculations (approximately 250 words), and analytics and tracking requirements with tools specification (approximately 250 words).

## 8. User Experience Guidelines
Please include design principles and guidelines with examples (approximately 300 words), user interface requirements and interaction patterns (approximately 300 words), accessibility considerations and compliance standards (approximately 250 words), and mobile and responsive design requirements (approximately 250 words).

${template === 'ai_builder' ? `
## 9. AI Builder Implementation Guide
Please provide Lovable/Bolt/Cursor specific considerations and best practices (approximately 400 words), recommended implementation sequence with detailed steps (approximately 400 words), copy-paste ready specifications for each feature (approximately 500 words), common pitfalls and solutions with specific examples (approximately 300 words), and testing and validation approaches for AI-built applications (approximately 300 words).

## 10. Phase-by-Phase Development Plan
Please include detailed breakdown of each development phase with specific tasks (approximately 500 words), prerequisites and dependencies for each phase (approximately 300 words), AI builder session recommendations and time estimates (approximately 300 words), and quality assurance checkpoints with validation criteria (approximately 300 words).
` : ''}

## ${template === 'ai_builder' ? '11' : '9'}. Out of Scope
Please provide features explicitly not included in this version with explanations (approximately 200 words), future considerations and product roadmap beyond initial release (approximately 200 words), and known limitations and constraints with impact analysis (approximately 200 words).

DELIVERABLE SPECIFICATIONS:
- Create a well-structured, professional PRD document in markdown format
- Use proper headings, bullet points, and formatting for readability
- Provide specific and actionable specifications that can be implemented
- Maintain professional tone suitable for both technical and non-technical stakeholders
- Ensure every feature and user story is completely detailed
- Include implementation guidance that development teams can follow immediately

This document will serve as the definitive guide for building this ${appType} application with ${features.length} features and ${userStories.length} user stories. Please ensure every section is complete and provides the detailed information stakeholders need to understand and approve the project.
  `.trim();
};

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

    console.log('Generating comprehensive PRD with professional approach...');
    console.log('Template:', template);
    console.log('Features count:', projectData.features.length);
    console.log('User stories count:', projectData.userStories.length);

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
