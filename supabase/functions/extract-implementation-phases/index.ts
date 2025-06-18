
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

    const { implementationRoadmapText, userStories } = await req.json();
    console.log('Extracting implementation phases from roadmap text...');
    
    if (!implementationRoadmapText) {
      throw new Error('Implementation roadmap text is required');
    }

    // Create the extraction prompt
    const extractionPrompt = `
Extract the implementation phases from this Implementation Roadmap section and convert them to structured JSON format.

IMPLEMENTATION ROADMAP TEXT:
${implementationRoadmapText}

USER STORIES AVAILABLE:
${userStories.map((story: any, index: number) => `${index + 1}. ${story.title}`).join('\n')}

REQUIREMENTS:
1. Extract each phase with its number, name, and deliverables
2. Map deliverables to actual user story titles when possible
3. Estimate hours based on the deliverables mentioned
4. Maintain the logical order and grouping from the original roadmap

OUTPUT FORMAT - Valid JSON only:
{
  "phases": [
    {
      "number": 1,
      "name": "Phase 1: [Phase Name]",
      "deliverables": ["Exact User Story Title", "Another User Story Title"],
      "estimatedHours": 24,
      "description": "Brief description of what this phase accomplishes"
    }
  ]
}

CRITICAL: Only return valid JSON. Do not include any explanatory text before or after the JSON.
`.trim();

    console.log('Calling OpenAI for phase extraction...');
    
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
            content: 'You are an expert project manager who extracts structured implementation phases from project roadmaps. You return only valid JSON without any additional text or explanations.'
          },
          {
            role: 'user',
            content: extractionPrompt
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
    const extractedContent = data.choices[0].message.content;
    
    console.log('Raw AI response:', extractedContent);

    // Parse the JSON response
    let phasesData;
    try {
      phasesData = JSON.parse(extractedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw response:', extractedContent);
      
      // Try to extract JSON from the response if it's wrapped in text
      const jsonMatch = extractedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          phasesData = JSON.parse(jsonMatch[0]);
        } catch (retryError) {
          throw new Error('Failed to parse extracted implementation phases JSON');
        }
      } else {
        throw new Error('No valid JSON found in AI response');
      }
    }

    if (!phasesData.phases || !Array.isArray(phasesData.phases)) {
      throw new Error('Invalid phase data structure - missing phases array');
    }

    console.log('Successfully extracted phases:', phasesData.phases.length);
    phasesData.phases.forEach((phase: any) => {
      console.log(`Phase ${phase.number}: ${phase.name} (${phase.deliverables?.length || 0} deliverables)`);
    });

    return new Response(JSON.stringify({ 
      success: true,
      phases: phasesData.phases
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in extract-implementation-phases function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
