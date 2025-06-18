import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { projectId, platform } = await req.json();
    console.log(`Generating story prompts for project ${projectId}, platform: ${platform}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch project data
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (!project) {
      throw new Error('Project not found');
    }

    // Fetch features and user stories
    const { data: features } = await supabase
      .from('features')
      .select('*')
      .eq('project_id', projectId)
      .order('execution_order');

    const { data: userStories } = await supabase
      .from('user_stories')
      .select('*')
      .in('feature_id', features?.map(f => f.id) || [])
      .order('execution_order');

    // Get structured phases from PRD metadata (new approach)
    const { data: prd } = await supabase
      .from('prds')
      .select('metadata')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let structuredPhases: any[] = [];
    if (prd?.metadata?.implementationPhases) {
      structuredPhases = prd.metadata.implementationPhases;
      console.log('✓ Using structured phases from PRD:', structuredPhases.length, 'phases');
    } else {
      console.log('No structured phases found in PRD, generating new ones...');
      
      // Generate structured phases on-the-fly using the new edge function
      const projectData = {
        project,
        features: features || [],
        userStories: userStories || []
      };

      const { data: phasesResponse, error: phasesError } = await supabase
        .functions
        .invoke('generate-implementation-phases', {
          body: { projectData }
        });

      if (phasesError) {
        console.error('Failed to generate phases:', phasesError);
        // Use fallback logic
        structuredPhases = createFallbackPhases(userStories || []);
      } else {
        structuredPhases = phasesResponse?.phases || [];
        console.log('✓ Generated structured phases on-the-fly:', structuredPhases.length, 'phases');
      }
    }

    // Clear existing prompts for this project and platform
    console.log('✓ Clearing existing prompts...');
    await supabase
      .from('generated_prompts')
      .delete()
      .eq('project_id', projectId)
      .eq('platform', platform);

    await supabase
      .from('troubleshooting_guides')
      .delete()
      .eq('project_id', projectId)
      .eq('platform', platform);

    console.log('✓ Successfully cleared existing prompts');

    // Generate prompts using the structured phases
    const prompts = await generatePromptsWithStructuredPhases(
      project, 
      features || [], 
      userStories || [], 
      structuredPhases,
      platform
    );

    // Save to database
    console.log('💾 Saving new prompts to database...');
    
    // Save phase overview prompts
    for (const prompt of prompts.phaseOverviews) {
      console.log(`Saving phase overview: ${prompt.title}`);
      const { error } = await supabase
        .from('generated_prompts')
        .insert({
          project_id: projectId,
          platform,
          prompt_type: 'phase_overview',
          title: prompt.title,
          content: prompt.content,
          execution_order: prompt.execution_order,
          phase_number: prompt.phase_number
        });
      
      if (error) {
        console.error('Error saving phase overview:', error);
        throw error;
      }
      console.log(`✓ Successfully saved phase overview for Phase ${prompt.phase_number}`);
    }

    // Save story prompts with accurate phase mapping
    for (const prompt of prompts.storyPrompts) {
      const phaseNumber = mapStoryToPhase(prompt.userStoryTitle, structuredPhases);
      
      console.log(`💾 Saving story: "${prompt.title}" with phase_number: ${phaseNumber}, execution_order: ${prompt.execution_order}`);
      
      const insertData = {
        project_id: projectId,
        user_story_id: prompt.user_story_id,
        platform,
        prompt_type: 'story' as const,
        title: prompt.title,
        content: prompt.content,
        execution_order: prompt.execution_order,
        phase_number: phaseNumber
      };
      
      const { error } = await supabase
        .from('generated_prompts')
        .insert(insertData);
      
      if (error) {
        console.error(`Error saving story "${prompt.title}":`, error);
        throw error;
      }
      console.log(`✅ Successfully saved story "${prompt.title}" with phase_number: ${phaseNumber}`);
    }

    // Save transition prompts
    for (const prompt of prompts.transitionPrompts) {
      console.log(`Saving transition prompt: ${prompt.title}`);
      const { error } = await supabase
        .from('generated_prompts')
        .insert({
          project_id: projectId,
          platform,
          prompt_type: 'transition',
          title: prompt.title,
          content: prompt.content,
          execution_order: prompt.execution_order,
          phase_number: prompt.phase_number
        });
      
      if (error) {
        console.error('Error saving transition:', error);
        throw error;
      }
      console.log(`✓ Successfully saved transition for Phase ${prompt.phase_number}`);
    }

    // Save troubleshooting guide
    console.log('Saving troubleshooting guide...');
    const { error: troubleshootingError } = await supabase
      .from('troubleshooting_guides')
      .insert({
        project_id: projectId,
        platform,
        content: prompts.troubleshootingGuide,
        sections: {}
      });

    if (troubleshootingError) {
      console.error('Error saving troubleshooting guide:', troubleshootingError);
      throw troubleshootingError;
    }
    console.log('✓ Successfully saved troubleshooting guide');

    console.log('🎉 Successfully saved all generated prompts to database');

    // Verification query
    const { data: savedPrompts } = await supabase
      .from('generated_prompts')
      .select('title, phase_number, execution_order')
      .eq('project_id', projectId)
      .eq('platform', platform)
      .eq('prompt_type', 'story')
      .order('execution_order');

    console.log('✅ VERIFICATION - Saved prompts in database:');
    savedPrompts?.forEach((prompt: any) => {
      console.log(`  - story: "${prompt.title}" | phase: ${prompt.phase_number} | order: ${prompt.execution_order}`);
    });

    return new Response(JSON.stringify({ 
      success: true,
      promptsGenerated: prompts.storyPrompts.length + prompts.phaseOverviews.length + prompts.transitionPrompts.length,
      phases: structuredPhases.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-story-prompts function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to map stories to phases using structured phase data
function mapStoryToPhase(storyTitle: string, structuredPhases: any[]): number {
  // Try to find exact match in deliverables
  for (const phase of structuredPhases) {
    if (phase.deliverables && phase.deliverables.includes(storyTitle)) {
      return phase.number;
    }
  }
  
  // Try partial matching for similar titles
  for (const phase of structuredPhases) {
    if (phase.deliverables) {
      for (const deliverable of phase.deliverables) {
        // Check if story title is similar to any deliverable (simple keyword matching)
        const storyWords = storyTitle.toLowerCase().split(' ');
        const deliverableWords = deliverable.toLowerCase().split(' ');
        const commonWords = storyWords.filter(word => deliverableWords.includes(word) && word.length > 3);
        
        if (commonWords.length >= 2) {
          return phase.number;
        }
      }
    }
  }
  
  // Fallback to phase 1 if no match found
  return 1;
}

// Fallback function to create basic phases if no structured phases available
function createFallbackPhases(userStories: any[]): any[] {
  const totalStories = userStories.length;
  const storiesPerPhase = Math.ceil(totalStories / 3);
  
  const phases = [];
  for (let i = 0; i < 3; i++) {
    const startIndex = i * storiesPerPhase;
    const endIndex = Math.min(startIndex + storiesPerPhase, totalStories);
    const phaseStories = userStories.slice(startIndex, endIndex);
    
    phases.push({
      number: i + 1,
      name: `Phase ${i + 1}: ${i === 0 ? 'Foundation' : i === 1 ? 'Core Features' : 'Advanced Features'}`,
      deliverables: phaseStories.map((story: any) => story.title),
      estimatedHours: phaseStories.reduce((sum: number, story: any) => sum + (story.estimated_hours || 2), 0),
      description: `Phase ${i + 1} of development`
    });
  }
  
  return phases;
}

// Main generation function using structured phases
async function generatePromptsWithStructuredPhases(
  project: any,
  features: any[],
  userStories: any[],
  structuredPhases: any[],
  platform: string
) {
  const phaseOverviews = [];
  const storyPrompts = [];
  const transitionPrompts = [];
  
  // Generate phase overview prompts based on structured phases
  for (const phase of structuredPhases) {
    const phasePrompt = await generatePhaseOverviewPrompt(project, phase, platform);
    phaseOverviews.push({
      title: `Phase ${phase.number} Overview: ${phase.name}`,
      content: phasePrompt,
      execution_order: phase.number,
      phase_number: phase.number
    });
  }
  
  // Generate story prompts (execution order preserved)
  for (let i = 0; i < userStories.length; i++) {
    const story = userStories[i];
    const storyPrompt = await generateStoryPrompt(project, story, features, platform);
    storyPrompts.push({
      title: `Story ${i + 1}: ${story.title}`,
      content: storyPrompt,
      execution_order: i + 1,
      user_story_id: story.id,
      userStoryTitle: story.title
    });
  }
  
  // Generate transition prompts between stories
  for (let i = 0; i < userStories.length - 1; i++) {
    const currentStory = userStories[i];
    const nextStory = userStories[i + 1];
    const currentPhase = mapStoryToPhase(currentStory.title, structuredPhases);
    
    const transitionPrompt = await generateTransitionPrompt(project, currentStory, nextStory, platform);
    transitionPrompts.push({
      title: `Transition: ${currentStory.title} → ${nextStory.title}`,
      content: transitionPrompt,
      execution_order: i + 1,
      phase_number: currentPhase
    });
  }
  
  // Generate troubleshooting guide
  const troubleshootingGuide = await generateTroubleshootingGuide(project, platform);
  
  return {
    phaseOverviews,
    storyPrompts,
    transitionPrompts,
    troubleshootingGuide
  };
}

async function generatePhaseOverviewPrompt(project: any, phase: any, platform: string): Promise<string> {
  // Safe property access with fallbacks
  const phaseName = phase.name || `Phase ${phase.number}`;
  const deliverables = Array.isArray(phase.deliverables) ? phase.deliverables : [];
  const estimatedHours = phase.estimatedHours || phase.estimated_hours || 'Not specified';
  const description = phase.description || 'No description available';

  const prompt = `Generate a comprehensive phase overview prompt for ${platform} development.

Project: ${project.title}
Description: ${project.description}

Phase Details:
- ${phaseName}
- Deliverables: ${deliverables.join(', ')}
- Estimated Hours: ${estimatedHours}
- Description: ${description}

Create a detailed prompt that:
1. Explains the phase objectives and scope
2. Lists all deliverables for this phase
3. Provides context about how this phase fits into the overall project
4. Includes specific technical guidance for ${platform}
5. Mentions estimated time commitment
6. Provides tips for success in this phase

Make it comprehensive and actionable for AI builder development.`;

  return await callOpenAI(prompt, 'phase_overview');
}

async function generateStoryPrompt(project: any, story: any, features: any[], platform: string): Promise<string> {
  const feature = features.find(f => f.id === story.feature_id);
  
  const prompt = `Generate a comprehensive implementation prompt for this user story in ${platform}.

Project Context: ${project.title} - ${project.description}
Feature: ${feature?.title || 'Unknown Feature'}
User Story: ${story.title}
Description: ${story.description || 'No description provided'}
Acceptance Criteria: ${story.acceptance_criteria?.join(', ') || 'None specified'}
Estimated Hours: ${story.estimated_hours || 'Not specified'}

Create a detailed, step-by-step implementation prompt that includes:
1. Clear explanation of what needs to be built
2. Technical requirements and considerations
3. Step-by-step implementation guidance
4. Code structure recommendations
5. Testing considerations
6. Common pitfalls to avoid
7. ${platform}-specific best practices

Make it comprehensive enough for AI builders to implement successfully.`;

  return await callOpenAI(prompt, 'story');
}

async function generateTransitionPrompt(project: any, currentStory: any, nextStory: any, platform: string): Promise<string> {
  const prompt = `Generate a transition prompt for ${platform} development.

Project: ${project.title}
Current Story: ${currentStory.title}
Next Story: ${nextStory.title}

Create a prompt that:
1. Summarizes what was accomplished in the current story
2. Explains how it connects to the next story
3. Identifies any dependencies or prerequisites
4. Provides guidance on refactoring or cleanup needed
5. Suggests testing before moving forward
6. ${platform}-specific transition considerations

Keep it concise but thorough.`;

  return await callOpenAI(prompt, 'transition');
}

async function generateTroubleshootingGuide(project: any, platform: string): Promise<string> {
  const prompt = `Generate a comprehensive troubleshooting guide for ${platform} development.

Project: ${project.title}
Type: ${project.project_type}

Create a troubleshooting guide that covers:
1. Common ${platform} development issues
2. Environment setup problems
3. Database connection issues
4. Authentication problems
5. Deployment challenges
6. Performance optimization tips
7. Debugging strategies
8. Best practices for ${platform}

Make it practical and actionable for developers using AI builders.`;

  return await callOpenAI(prompt, 'troubleshooting');
}

async function callOpenAI(prompt: string, type: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert software architect and technical writer specializing in AI-assisted development. You create comprehensive, actionable prompts for AI builders.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.3
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
