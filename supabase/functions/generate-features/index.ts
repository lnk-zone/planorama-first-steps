
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateFeaturesRequest {
  description: string;
  appType: string;
}

const buildFeatureGenerationPrompt = (description: string, appType: string): string => {
  return `
Generate a comprehensive feature plan for this ${appType} project:

PROJECT DESCRIPTION:
${description}

Return JSON with this EXACT structure:
{
  "features": [
    {
      "title": "Feature Name",
      "description": "Clear description of what this feature does",
      "priority": "high|medium|low",
      "category": "core|ui|integration|admin",
      "complexity": "low|medium|high",
      "estimatedHours": 8
    }
  ],
  "userStories": [
    {
      "featureTitle": "Matching feature title",
      "title": "As a [user type], I can [action] so that [benefit]",
      "description": "Detailed description of the user story",
      "acceptanceCriteria": [
        "Given [context], when [action], then [result]",
        "Given [context], when [action], then [result]"
      ],
      "priority": "high|medium|low",
      "complexity": "low|medium|high",
      "estimatedHours": 4,
      "dependencies": [
        {
          "targetStoryTitle": "Title of story this depends on",
          "type": "must_do_first",
          "reason": "Clear explanation why this dependency exists"
        },
        {
          "targetStoryTitle": "Title of related story", 
          "type": "do_together",
          "reason": "Clear explanation of the relationship"
        }
      ]
    }
  ]
}

REQUIREMENTS FOR NON-TECHNICAL USERS:
- Generate 8-12 main features (not overwhelming)
- 2-3 user stories per feature (actionable chunks)
- Use simple, non-technical language
- Focus on user-facing functionality first
- Include clear dependencies with simple explanations
- Prioritize features that provide immediate value
- Estimate realistic development time (4-8 hours per story)

DEPENDENCY TYPES (keep simple):
- "must_do_first": This story cannot start until the dependency is complete
- "do_together": These stories are related and should be coordinated

EXAMPLE DEPENDENCIES:
- "User Registration" must_do_first before "User Profile"
- "Product Catalog" must_do_first before "Shopping Cart"
- "Email Notifications" do_together with "Push Notifications"

STORY COMPLEXITY GUIDELINES:
- "low": Simple UI changes, basic forms (2-4 hours)
- "medium": Standard features, integrations (4-8 hours)
- "high": Complex logic, multiple integrations (8-16 hours)

Focus on creating a clear roadmap that prevents users from getting stuck with AI builders!
  `.trim();
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, appType }: GenerateFeaturesRequest = await req.json();

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Generating features with comprehensive prompt...');

    const prompt = buildFeatureGenerationPrompt(description, appType);

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
            content: `You are an expert product manager helping non-technical users plan apps for AI builders like Lovable and Bolt. Generate clear, actionable feature lists with dependencies and execution order that prevent users from getting stuck. ALWAYS include detailed dependencies between user stories using the exact format specified.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 8000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('OpenAI response received');

    const content = aiResponse.choices[0].message.content;
    let parsedContent;
    
    try {
      parsedContent = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Invalid JSON response from AI');
    }

    // Validate the response structure
    if (!parsedContent.features || !parsedContent.userStories) {
      console.error('Invalid response structure:', parsedContent);
      throw new Error('AI response missing required fields');
    }

    // Validate that user stories have dependencies
    const storiesWithDependencies = parsedContent.userStories.filter(
      (story: any) => story.dependencies && story.dependencies.length > 0
    );
    
    console.log(`Generated ${parsedContent.userStories.length} stories, ${storiesWithDependencies.length} have dependencies`);

    // Add validation for dependency structure
    for (const story of parsedContent.userStories) {
      if (story.dependencies) {
        for (const dep of story.dependencies) {
          if (!dep.targetStoryTitle || !dep.type || !dep.reason) {
            console.warn('Invalid dependency structure found:', dep);
          }
        }
      }
    }

    console.log('Returning structured feature data with dependencies');

    return new Response(JSON.stringify(parsedContent), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error in generate-features function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate features',
        details: 'Please try again or simplify your project description.'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
