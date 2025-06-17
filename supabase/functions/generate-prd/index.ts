
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

FOCUS AREAS:
- Copy-paste ready feature specifications
- Implementation guidance for AI builders
- Common pitfalls and solutions
- Incremental development approach
- Technical requirements for AI tools
- Step-by-step implementation phases

Include specific sections:
- AI Builder Implementation Guide
- Phase-by-Phase Development Plan
- Copy-Paste Feature Specifications
- Common Implementation Challenges
- AI Builder Best Practices
`,
    comprehensive: `
COMPREHENSIVE BUSINESS PRD - Include all aspects for stakeholders and development teams.

FOCUS AREAS:
- Executive summary and business case
- Market analysis and competitive landscape
- Detailed user personas and use cases
- Complete technical architecture
- Business metrics and KPIs
- Risk assessment and mitigation
`,
    technical: `
TECHNICAL FOCUSED PRD - Emphasize technical specifications and architecture.

FOCUS AREAS:
- Technical architecture and system design
- API specifications and data models
- Security requirements and compliance
- Performance requirements and scalability
- Infrastructure and deployment considerations
`,
    business: `
BUSINESS FOCUSED PRD - Emphasize business value and market fit.

FOCUS AREAS:
- Business model and revenue strategy
- Market opportunity and competitive analysis
- User acquisition and retention strategy
- Success metrics and business KPIs
- Go-to-market strategy
`
  };

  return `
You are a senior product manager creating a comprehensive Product Requirements Document (PRD). Create a professional, detailed PRD that synthesizes all project information into actionable specifications.

CRITICAL INSTRUCTIONS - NO SHORTCUTS ALLOWED:
⚠️  ABSOLUTELY NO shortcuts, abbreviations, or "continue for X features" language
⚠️  This is an OFFICIAL ROADMAP DOCUMENT for non-technical stakeholders
⚠️  You MUST write out EVERY single feature specification in complete detail
⚠️  You MUST include ALL user stories with full acceptance criteria
⚠️  NO ellipsis (...), NO "etc.", NO "and more", NO truncation indicators
⚠️  EVERY section must be fully written out - this document will be used as-is
⚠️  Minimum 8,000 words total - this is a comprehensive professional document
⚠️  Each feature must have at least 200 words of detailed specification
⚠️  Each user story must have 3-5 detailed acceptance criteria written out completely

FORBIDDEN PHRASES (DO NOT USE):
- "... (continue for all X features)"
- "...and so on"
- "etc."
- "Additional features include..."
- "Similar patterns apply to..."
- Any form of truncation or summarization

${templateInstructions[template as keyof typeof templateInstructions] || templateInstructions.ai_builder}

PROJECT CONTEXT:
**Project:** ${projectTitle}
**Type:** ${appType}
**Description:** ${projectDescription}

**Development Metrics:**
- Total Features: ${features.length}
- User Stories: ${userStories.length}
- Estimated Development: ${totalEstimatedHours} hours
- Average Story Complexity: ${avgStoryComplexity.toFixed(1)}/3
- Development Phases: ${executionPlan.phases?.length || 3}

**Feature Categories:**
- Authentication Features: ${authFeatures.length}
- Core Business Features: ${coreFeatures.length}
- Integration Features: ${integrationFeatures.length}

**COMPLETE FEATURES OVERVIEW:**
${features.map((feature: any, index: number) => `
${index + 1}. **${feature.title}** (${feature.priority} priority, ${feature.complexity} complexity)
   ${feature.description}
   Estimated: ${feature.estimated_hours || 8} hours
   Category: ${feature.category}
   Status: ${feature.status}
`).join('')}

**COMPLETE USER STORIES BREAKDOWN:**
${userStories.map((story: any, index: number) => `
${index + 1}. **${story.title}**
   - Description: ${story.description || 'No description provided'}
   - Priority: ${story.priority}, Complexity: ${story.complexity}
   - Estimated: ${story.estimated_hours || 4} hours
   - Feature: ${features.find((f: any) => f.id === story.feature_id)?.title || 'Unknown Feature'}
   - Acceptance Criteria: ${story.acceptance_criteria?.length > 0 ? story.acceptance_criteria.join('; ') : 'Standard completion criteria apply'}
   - Dependencies: ${story.dependencies?.length > 0 ? JSON.stringify(story.dependencies) : 'No dependencies'}
`).join('')}

**EXECUTION PLAN DETAILS:**
${executionPlan.phases?.map((phase: any) => `
**${phase.name}** (${phase.estimatedHours} hours)
- Phase Number: ${phase.number}
- Stories Count: ${phase.stories?.length || 0}
- Key Deliverables: ${phase.stories?.join(', ') || 'No deliverables specified'}
- Description: ${phase.description || 'Phase focuses on core development activities'}
`).join('') || 'No execution plan available'}

CREATE A COMPREHENSIVE PRD WITH THESE SECTIONS (WRITE EVERY SECTION IN COMPLETE DETAIL):

## 1. Executive Summary
- Project overview and business case (minimum 300 words)
- Key objectives and success criteria (minimum 200 words)
- High-level timeline and resource requirements (minimum 200 words)
- Expected ROI and business impact (minimum 200 words)

## 2. Product Overview
- Product vision and positioning (minimum 300 words)
- Target market and user base analysis (minimum 300 words)
- Core value proposition and competitive advantages (minimum 250 words)
- Product goals and measurable objectives (minimum 250 words)

## 3. Target Users & Use Cases
- Detailed primary user personas with demographics (minimum 400 words)
- Complete user journey mapping and workflows (minimum 400 words)
- Comprehensive use cases and scenarios (minimum 300 words)
- User needs analysis and pain points addressed (minimum 300 words)

## 4. Feature Specifications
FOR EACH OF THE ${features.length} FEATURES, WRITE A COMPLETE SPECIFICATION INCLUDING:
- Detailed feature description explaining functionality and business value
- Complete list of user stories with full acceptance criteria
- Technical implementation considerations
- Dependencies and integration requirements
- Success metrics and testing criteria
- Risk factors and mitigation strategies

WRITE OUT ALL ${features.length} FEATURES - NO SHORTCUTS OR ABBREVIATIONS

## 5. Technical Requirements
- Comprehensive system architecture overview (minimum 400 words)
- Complete technology stack recommendations with justifications (minimum 300 words)
- Detailed security and compliance requirements (minimum 300 words)
- Performance and scalability specifications with metrics (minimum 300 words)
- Integration requirements and API specifications (minimum 300 words)

## 6. Implementation Roadmap
- Detailed development phases with specific timelines (minimum 400 words)
- Complete milestone definitions and deliverables for each phase (minimum 400 words)
- Resource requirements and team structure recommendations (minimum 300 words)
- Comprehensive risk assessment and mitigation strategies (minimum 400 words)

## 7. Success Metrics & Analytics
- Key Performance Indicators (KPIs) with measurement methods (minimum 300 words)
- User engagement metrics and tracking implementation (minimum 250 words)
- Business success criteria and ROI calculations (minimum 250 words)
- Analytics and tracking requirements with tools specification (minimum 250 words)

## 8. User Experience Guidelines
- Design principles and guidelines with examples (minimum 300 words)
- User interface requirements and interaction patterns (minimum 300 words)
- Accessibility considerations and compliance standards (minimum 250 words)
- Mobile and responsive design requirements (minimum 250 words)

${template === 'ai_builder' ? `
## 9. AI Builder Implementation Guide
- Lovable/Bolt/Cursor specific considerations and best practices (minimum 400 words)
- Recommended implementation sequence with detailed steps (minimum 400 words)
- Copy-paste ready specifications for each feature (minimum 500 words)
- Common pitfalls and solutions with specific examples (minimum 300 words)
- Testing and validation approaches for AI-built applications (minimum 300 words)

## 10. Phase-by-Phase Development Plan
- Detailed breakdown of each development phase with specific tasks (minimum 500 words)
- Prerequisites and dependencies for each phase (minimum 300 words)
- AI builder session recommendations and time estimates (minimum 300 words)
- Quality assurance checkpoints and validation criteria (minimum 300 words)
` : ''}

## ${template === 'ai_builder' ? '11' : '9'}. Out of Scope
- Features explicitly not included in this version with explanations (minimum 200 words)
- Future considerations and product roadmap beyond initial release (minimum 200 words)
- Known limitations and constraints with impact analysis (minimum 200 words)

QUALITY REQUIREMENTS:
- Minimum 8,000 words total document length
- Each major section must be substantial and detailed
- Every feature must have complete specifications
- All user stories must be fully detailed with acceptance criteria
- No abbreviations, shortcuts, or truncation
- Professional tone suitable for stakeholders and development teams
- Actionable specifications that can be implemented without further clarification

OUTPUT FORMAT:
Return a well-structured, professional PRD document in markdown format. Use proper headings, bullet points, and formatting. Be specific and actionable while maintaining readability for both technical and non-technical stakeholders.

This document will serve as the definitive guide for building this ${appType} application with ${features.length} features and ${userStories.length} user stories. Every section must be complete and ready for immediate use by development teams and stakeholders.
  `.trim();
};

const validatePRDResponse = (content: string): { isValid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  // Check for shortcuts and forbidden phrases
  const forbiddenPhrases = [
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
  forbiddenPhrases.forEach(phrase => {
    if (lowerContent.includes(phrase.toLowerCase())) {
      issues.push(`Contains forbidden shortcut phrase: "${phrase}"`);
    }
  });
  
  // Check minimum length
  const wordCount = content.split(/\s+/).length;
  if (wordCount < 6000) {
    issues.push(`Document too short: ${wordCount} words (minimum 6000 required)`);
  }
  
  // Check for section completeness
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
      issues.push(`Missing required section: ${section}`);
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

    console.log('Generating comprehensive PRD with no shortcuts...');
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
            content: `You are a senior product manager AI creating comprehensive Product Requirements Documents. You synthesize feature lists and user stories into professional, detailed PRDs suitable for development teams and stakeholders.

CRITICAL RULES - NO SHORTCUTS ALLOWED:
⚠️  NEVER use shortcuts like "...continue for X features" or "etc."
⚠️  This is an OFFICIAL DOCUMENT for non-technical stakeholders
⚠️  EVERY feature must be fully specified with complete details
⚠️  EVERY user story must have detailed acceptance criteria
⚠️  Write EVERYTHING out in complete detail - no abbreviations
⚠️  Minimum 8,000 words - this is a comprehensive professional document
⚠️  Each section must be substantial and actionable
⚠️  No ellipsis (...), truncation, or summarization allowed

GUIDELINES:
- Create professional, comprehensive documentation
- Include all necessary sections for a complete PRD
- Tailor content to the specific app type and context
- Provide clear technical considerations
- Include realistic scope and timeline considerations
- Use proper markdown formatting with clear headings
- Be specific and actionable while maintaining readability
- Focus on creating implementable specifications

Return a complete, detailed PRD document that serves as a comprehensive guide for building the application. Every section must be fully written out without any shortcuts or abbreviations.`
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

    // Validate the response for shortcuts and completeness
    const validation = validatePRDResponse(prdContent);
    if (!validation.isValid) {
      console.error('PRD validation failed:', validation.issues);
      // Return with validation issues but don't fail completely
      console.warn('PRD quality issues detected, but proceeding with generation');
    }

    console.log('PRD generated successfully, length:', prdContent.length);
    console.log('Word count:', prdContent.split(/\s+/).length);
    
    if (validation.issues.length > 0) {
      console.log('Quality issues detected:', validation.issues);
    }

    return new Response(JSON.stringify({ 
      content: prdContent,
      wordCount: prdContent.split(' ').length,
      template,
      generatedAt: new Date().toISOString(),
      qualityIssues: validation.issues
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
