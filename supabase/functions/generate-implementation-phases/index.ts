
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

interface ImplementationPhase {
  number: number;
  name: string;
  deliverables: string[];
  estimatedHours: number;
  description: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { projectData } = await req.json();
    console.log('Generating structured implementation phases...');
    
    if (!projectData || !projectData.features || !projectData.userStories) {
      throw new Error('Project data with features and user stories is required');
    }

    const { project, features, userStories } = projectData;

    // Create comprehensive prompt for structured phase generation
    const phaseGenerationPrompt = `
You are a senior project manager creating a structured implementation roadmap for a development project. You must analyze the features and user stories to create logical development phases.

PROJECT CONTEXT:
**Project:** ${project.title}
**Description:** ${project.description}
**Type:** ${project.project_type || 'web application'}

**FEATURES (${features.length} total):**
${features.map((feature: any, index: number) => `
${index + 1}. **${feature.title}** (Priority: ${feature.priority}, Complexity: ${feature.complexity})
   - Description: ${feature.description}
   - Category: ${feature.category}
   - Estimated Hours: ${feature.estimated_hours || 8}
`).join('')}

**USER STORIES (${userStories.length} total):**
${userStories.map((story: any, index: number) => `
${index + 1}. **${story.title}**
   - Description: ${story.description || 'Standard implementation'}
   - Priority: ${story.priority}, Complexity: ${story.complexity}
   - Estimated Hours: ${story.estimated_hours || 4}
   - Feature: ${features.find((f: any) => f.id === story.feature_id)?.title || 'Core Feature'}
`).join('')}

PHASE GENERATION REQUIREMENTS:

1. **Create 3-4 logical phases** based on:
   - Dependencies (authentication before advanced features)
   - Complexity (simple before complex)
   - User value (core features first)
   - Technical architecture (foundation before extensions)

2. **Each phase must include:**
   - Logical grouping of user stories
   - Realistic hour estimates
   - Clear deliverables
   - Sequential progression

3. **Phase Distribution Guidelines:**
   - Phase 1: Foundation & Authentication (20-30% of stories)
   - Phase 2: Core Business Features (40-50% of stories)
   - Phase 3: Advanced Features & Integrations (20-30% of stories)
   - Phase 4 (if needed): Polish & Optimization (10-15% of stories)

4. **Deliverables Mapping:**
   - Map each user story title exactly as provided
   - Group related stories logically
   - Ensure no story is missed
   - Balance phase workloads

OUTPUT FORMAT - CRITICAL: Return ONLY valid JSON, no explanations:

{
  "phases": [
    {
      "number": 1,
      "name": "Phase 1: Foundation & Authentication",
      "deliverables": ["User Story Title 1", "User Story Title 2"],
      "estimatedHours": 32,
      "description": "Establish core foundation and user authentication system"
    },
    {
      "number": 2,
      "name": "Phase 2: Core Business Features",
      "deliverables": ["User Story Title 3", "User Story Title 4"],
      "estimatedHours": 48,
      "description": "Implement primary business functionality"
    }
  ]
}

CRITICAL REQUIREMENTS:
- Return ONLY the JSON object, no additional text
- Use exact user story titles from the list above
- Ensure all ${userStories.length} user stories are included across phases
- Make realistic hour estimates based on story complexity
- Create logical phase progression
    `.trim();

    console.log('Calling OpenAI for structured phase generation...');
    
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
            content: 'You are a senior project manager who creates structured implementation phases for development projects. You return only valid JSON without any additional text or explanations. You analyze features and user stories to create logical, sequential development phases.'
          },
          {
            role: 'user',
            content: phaseGenerationPrompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    
    console.log('Raw AI response:', generatedContent);

    // Clean and parse the JSON response
    let phasesData;
    try {
      // Remove any markdown formatting or extra text
      const cleanedContent = generatedContent
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^[^{]*({[\s\S]*})[^}]*$/g, '$1')
        .trim();
      
      phasesData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw response:', generatedContent);
      
      // Try to extract JSON from the response
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          phasesData = JSON.parse(jsonMatch[0]);
        } catch (retryError) {
          throw new Error('Failed to parse generated implementation phases JSON');
        }
      } else {
        throw new Error('No valid JSON found in AI response');
      }
    }

    // Validate the response structure
    if (!phasesData.phases || !Array.isArray(phasesData.phases)) {
      throw new Error('Invalid phase data structure - missing phases array');
    }

    // Validate each phase has required properties
    const validatedPhases: ImplementationPhase[] = phasesData.phases.map((phase: any, index: number) => {
      if (!phase.number || !phase.name || !Array.isArray(phase.deliverables)) {
        throw new Error(`Invalid phase structure at index ${index}`);
      }
      
      return {
        number: phase.number,
        name: phase.name,
        deliverables: phase.deliverables,
        estimatedHours: phase.estimatedHours || 0,
        description: phase.description || `Phase ${phase.number} implementation`
      };
    });

    console.log('Successfully generated phases:', validatedPhases.length);
    validatedPhases.forEach((phase: ImplementationPhase) => {
      console.log(`Phase ${phase.number}: ${phase.name} (${phase.deliverables.length} deliverables, ${phase.estimatedHours}h)`);
    });

    // Verify all user stories are accounted for
    const allDeliverables = validatedPhases.flatMap(phase => phase.deliverables);
    const userStoryTitles = userStories.map((story: any) => story.title);
    const missingStories = userStoryTitles.filter(title => !allDeliverables.includes(title));
    
    if (missingStories.length > 0) {
      console.warn('Some user stories not mapped to phases:', missingStories);
    }

    return new Response(JSON.stringify({ 
      success: true,
      phases: validatedPhases
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-implementation-phases function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
