
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

    const systemPrompt = `You are an expert product manager who creates comprehensive PRDs that help non-technical users succeed with AI app builders. Focus on clarity, actionable specifications, and proper sequencing.

Your role is to transform feature lists and user stories into professional Product Requirements Documents that serve as complete blueprints for development. You understand that users will reference this throughout development and share it with developers or stakeholders.

Key principles:
- Write in clear, non-technical language for business sections
- Include specific, actionable requirements
- Organize content by execution order and dependencies
- Provide implementation guidance to prevent common development issues
- Focus on incremental development approach`;

    const userPrompt = buildPRDPrompt(projectData, template);

    console.log('Generating PRD with OpenAI for project:', projectData.project?.title);

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
        max_tokens: 10000,
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

    console.log('PRD generated successfully, length:', generatedContent.length);

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

function buildPRDPrompt(projectData: any, template: string): string {
  const project = projectData.project;
  const features = projectData.features || [];
  const userStories = projectData.userStories || [];
  const executionPlan = projectData.executionPlan || {};

  return `Generate a comprehensive Product Requirements Document for this project:

PROJECT OVERVIEW:
- Title: ${project?.title || 'Untitled Project'}
- Description: ${project?.description || 'No description provided'}
- Type: ${project?.project_type || 'Web Application'}
- Status: ${project?.status || 'Planning'}

FEATURES (${features.length} total, organized by execution order):
${features.map((feature: any, index: number) => `
${index + 1}. ${feature.title}
   - Priority: ${feature.priority || 'Medium'}
   - Complexity: ${feature.complexity || 'Medium'} 
   - Category: ${feature.category || 'Core'}
   - Execution Order: ${feature.execution_order || 'Not set'}
   - Description: ${feature.description || 'No description'}
   - Estimated Hours: ${feature.estimated_hours || 'Not estimated'}
`).join('')}

USER STORIES (${userStories.length} total, organized by execution order):
${userStories.map((story: any, index: number) => `
${index + 1}. ${story.title}
   - Feature: ${features.find((f: any) => f.id === story.feature_id)?.title || 'Unknown'}
   - Priority: ${story.priority || 'Medium'}
   - Complexity: ${story.complexity || 'Medium'}
   - Execution Order: ${story.execution_order || 'Not set'}
   - Estimated Hours: ${story.estimated_hours || 4}
   - Description: ${story.description || 'No description'}
   - Acceptance Criteria: ${story.acceptance_criteria ? story.acceptance_criteria.join('; ') : 'Not defined'}
`).join('')}

EXECUTION PLAN:
- Total Stories: ${executionPlan.totalStories || userStories.length}
- Estimated Total Hours: ${executionPlan.estimatedTotalHours || 0}
- Development Phases: ${executionPlan.phases?.length || 1}

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
- Suggest breaking down complex features into smaller, manageable components
- Include specific prompts that can be used with AI builders
- Provide troubleshooting guidance for common AI builder issues
` : ''}

${template === 'technical' ? `
TECHNICAL FOCUS:
- Emphasize technical architecture and implementation details
- Include detailed API specifications and data models
- Provide comprehensive security and performance requirements
- Include technical risk assessment and mitigation strategies
` : ''}

${template === 'business' ? `
BUSINESS FOCUS:
- Emphasize business value and ROI considerations
- Include market analysis and competitive positioning
- Provide detailed success metrics and KPIs
- Focus on stakeholder communication and project governance
` : ''}

Make this PRD immediately useful for successful app development!`;
}
