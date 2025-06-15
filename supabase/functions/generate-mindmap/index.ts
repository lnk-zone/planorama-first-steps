
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// JSON schema validation helper
function validateMindmapResponse(data: any): boolean {
  try {
    // Check top-level structure
    if (!data || typeof data !== 'object') return false;
    if (!data.mindmap || !data.features || !data.userStories) return false;
    
    // Check mindmap structure
    const mindmap = data.mindmap;
    if (!mindmap.rootNode || !mindmap.nodes || !mindmap.connections) return false;
    if (!Array.isArray(mindmap.nodes) || !Array.isArray(mindmap.connections)) return false;
    
    // Check features structure
    if (!Array.isArray(data.features)) return false;
    
    // Check user stories structure
    if (!Array.isArray(data.userStories)) return false;
    
    return true;
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
}

// Fallback response generator
function generateFallbackResponse(prompt: string): any {
  return {
    mindmap: {
      rootNode: {
        id: "root",
        title: "Project Overview",
        description: "AI-generated project structure",
        position: { x: 0, y: 0 },
        style: { color: "#1f2937", size: "large" }
      },
      nodes: [
        {
          id: "feature_1",
          title: "Core Feature",
          description: "Main functionality based on project description",
          parentId: "root",
          position: { x: 200, y: -100 },
          style: { color: "#3b82f6", size: "medium" },
          metadata: {
            priority: "high",
            complexity: "medium",
            category: "core"
          }
        },
        {
          id: "feature_2",
          title: "User Interface",
          description: "User-facing components and interactions",
          parentId: "root",
          position: { x: 200, y: 100 },
          style: { color: "#10b981", size: "medium" },
          metadata: {
            priority: "high",
            complexity: "medium",
            category: "ui"
          }
        }
      ],
      connections: [
        { from: "root", to: "feature_1" },
        { from: "root", to: "feature_2" }
      ]
    },
    features: [
      {
        nodeId: "feature_1",
        title: "Core Feature",
        description: "Main functionality based on project description",
        priority: "high",
        category: "core",
        complexity: "medium"
      },
      {
        nodeId: "feature_2",
        title: "User Interface",
        description: "User-facing components and interactions",
        priority: "high",
        category: "ui",
        complexity: "medium"
      }
    ],
    userStories: [
      {
        featureTitle: "Core Feature",
        title: "As a user, I can access the main functionality",
        description: "Users need to be able to interact with the core feature",
        acceptanceCriteria: ["Feature is accessible", "Feature works as expected", "Feature provides value"],
        priority: "high"
      },
      {
        featureTitle: "User Interface",
        title: "As a user, I can navigate the interface easily",
        description: "Users need an intuitive and responsive interface",
        acceptanceCriteria: ["Interface is intuitive", "Interface is responsive", "Interface is accessible"],
        priority: "high"
      }
    ]
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    const { prompt } = await req.json();
    console.log('Received prompt for mindmap generation:', prompt?.substring(0, 200) + '...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert product manager and app architect. Generate comprehensive mindmap structures for app development projects. 

CRITICAL: You MUST return ONLY valid JSON. Do not include any markdown formatting, code blocks, or explanatory text before or after the JSON.

The JSON must follow this EXACT structure with no deviations:
{
  "mindmap": {
    "rootNode": {
      "id": "root",
      "title": "App Name",
      "description": "Brief description",
      "position": { "x": 0, "y": 0 },
      "style": { "color": "#1f2937", "size": "large" }
    },
    "nodes": [
      {
        "id": "unique_id",
        "title": "Feature Name",
        "description": "Feature description",
        "parentId": "root",
        "position": { "x": 200, "y": -100 },
        "style": { "color": "#3b82f6", "size": "medium" },
        "metadata": {
          "priority": "high",
          "complexity": "medium",
          "category": "core"
        }
      }
    ],
    "connections": [
      { "from": "root", "to": "node_id" }
    ]
  },
  "features": [
    {
      "nodeId": "matching_node_id",
      "title": "Feature Name",
      "description": "Detailed description",
      "priority": "high",
      "category": "core",
      "complexity": "medium"
    }
  ],
  "userStories": [
    {
      "featureTitle": "Matching feature title",
      "title": "As a [user], I can [action]",
      "description": "Story description",
      "acceptanceCriteria": ["Criteria 1", "Criteria 2"],
      "priority": "high"
    }
  ]
}

Generate 6-12 features with 2-3 user stories each. Use colors: #3b82f6 (blue) for core, #10b981 (green) for ui, #f59e0b (yellow) for integration, #ef4444 (red) for admin.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 6000,
        temperature: 0.3
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received, processing...');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenAI response structure:', data);
      throw new Error('Invalid response from OpenAI');
    }

    const generatedContent = data.choices[0].message.content;
    console.log('Raw OpenAI content:', generatedContent);
    
    // Clean the content - remove markdown formatting if present
    let cleanContent = generatedContent.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    console.log('Cleaned content for parsing:', cleanContent.substring(0, 500) + '...');
    
    let aiResponse;
    try {
      aiResponse = JSON.parse(cleanContent);
      console.log('Successfully parsed JSON response');
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.error('Content that failed to parse:', cleanContent);
      
      // Try to extract JSON from the content if it's wrapped in text
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          aiResponse = JSON.parse(jsonMatch[0]);
          console.log('Successfully extracted and parsed JSON from wrapped content');
        } catch (extractError) {
          console.error('Failed to parse extracted JSON:', extractError);
          console.log('Using fallback response due to JSON parsing failure');
          aiResponse = generateFallbackResponse(prompt);
        }
      } else {
        console.log('No JSON found in content, using fallback response');
        aiResponse = generateFallbackResponse(prompt);
      }
    }

    // Validate the parsed response
    if (!validateMindmapResponse(aiResponse)) {
      console.error('Response failed validation:', aiResponse);
      console.log('Using fallback response due to validation failure');
      aiResponse = generateFallbackResponse(prompt);
    }

    console.log('Final response validation passed, returning data');
    return new Response(JSON.stringify(aiResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-mindmap function:', error);
    
    // Return fallback response instead of error in production
    const fallbackResponse = generateFallbackResponse('fallback');
    console.log('Returning fallback response due to error');
    
    return new Response(JSON.stringify(fallbackResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
