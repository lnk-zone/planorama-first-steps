
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

**FEATURES OVERVIEW:**
${features.map((feature: any, index: number) => `
${index + 1}. **${feature.title}** (${feature.priority} priority, ${feature.complexity} complexity)
   ${feature.description}
   Estimated: ${feature.estimated_hours || 8} hours
`).join('')}

**USER STORIES SUMMARY:**
${userStories.slice(0, 10).map((story: any, index: number) => `
${index + 1}. ${story.title}
   - Priority: ${story.priority}, Complexity: ${story.complexity}
   - Estimated: ${story.estimated_hours || 4} hours
   ${story.acceptance_criteria?.length > 0 ? `- Acceptance Criteria: ${story.acceptance_criteria.length} criteria defined` : ''}
`).join('')}
${userStories.length > 10 ? `... and ${userStories.length - 10} more user stories` : ''}

**EXECUTION PLAN:**
${executionPlan.phases?.map((phase: any) => `
**${phase.name}** (${phase.estimatedHours} hours)
- Stories: ${phase.stories?.length || 0}
- Key Deliverables: ${phase.stories?.slice(0, 3).join(', ')}${phase.stories?.length > 3 ? '...' : ''}
`).join('') || 'No execution plan available'}

CREATE A COMPREHENSIVE PRD WITH THESE SECTIONS:

## 1. Executive Summary
- Project overview and business case
- Key objectives and success criteria
- High-level timeline and resource requirements

## 2. Product Overview
- Product vision and positioning
- Target market and user base
- Core value proposition
- Product goals and objectives

## 3. Target Users & Use Cases
- Primary user personas
- User journey and workflows
- Key use cases and scenarios
- User needs and pain points

## 4. Feature Specifications
- Detailed feature descriptions with user stories
- Feature prioritization and dependencies
- Acceptance criteria and success metrics
- Technical considerations for each feature

## 5. Technical Requirements
- System architecture overview
- Technology stack recommendations
- Security and compliance requirements
- Performance and scalability requirements
- Integration requirements

## 6. Implementation Roadmap
- Development phases with timelines
- Milestone definitions and deliverables
- Resource requirements and team structure
- Risk assessment and mitigation strategies

## 7. Success Metrics & Analytics
- Key Performance Indicators (KPIs)
- User engagement metrics
- Business success criteria
- Analytics and tracking requirements

## 8. User Experience Guidelines
- Design principles and guidelines
- User interface requirements
- Accessibility considerations
- Mobile and responsive design requirements

${template === 'ai_builder' ? `
## 9. AI Builder Implementation Guide
- Lovable/Bolt specific considerations
- Recommended implementation sequence
- Copy-paste ready specifications
- Common pitfalls and solutions
- Testing and validation approaches

## 10. Phase-by-Phase Development Plan
- Detailed breakdown of each development phase
- Prerequisites and dependencies
- AI builder session recommendations
- Quality assurance checkpoints
` : ''}

## ${template === 'ai_builder' ? '11' : '9'}. Out of Scope
- Features explicitly not included in this version
- Future considerations and roadmap
- Known limitations and constraints

OUTPUT FORMAT:
Return a well-structured, professional PRD document in markdown format. Use proper headings, bullet points, and formatting. Be specific and actionable while maintaining readability for both technical and non-technical stakeholders.

Focus on creating a document that serves as a comprehensive guide for building this ${appType} application with ${features.length} features and ${userStories.length} user stories.
  `.trim();
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

    console.log('Generating enhanced PRD...');
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

GUIDELINES:
- Create professional, comprehensive documentation
- Include all necessary sections for a complete PRD
- Tailor content to the specific app type and context
- Provide clear technical considerations
- Include realistic scope and timeline considerations
- Use proper markdown formatting with clear headings
- Be specific and actionable while maintaining readability
- Focus on creating implementable specifications

Return a well-structured PRD document that serves as a complete guide for building the application.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 16000,
        temperature: 0.3
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

    console.log('PRD generated successfully, length:', prdContent.length);

    return new Response(JSON.stringify({ 
      content: prdContent,
      wordCount: prdContent.split(' ').length,
      template,
      generatedAt: new Date().toISOString()
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
        error: 'Failed to generate PRD',
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
