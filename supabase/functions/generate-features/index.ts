
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
      "category": "core|ui|integration|admin|auth",
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

CRITICAL REQUIREMENTS FOR COMPREHENSIVE APP PLANNING:

1. ALWAYS INCLUDE ESSENTIAL AUTHENTICATION FEATURES:
   - User Registration (with email verification)
   - User Login/Logout
   - Password Reset/Recovery
   - User Profile Management
   - Account Settings
   These are MANDATORY for any app and must be included as separate features with detailed user stories.

2. INCLUDE CORE INFRASTRUCTURE FEATURES:
   - Error Handling & Validation
   - Data Security & Privacy
   - User Onboarding
   - Help/Support System
   - Settings & Configuration

3. GENERATE 12-18 TOTAL FEATURES (not 8-12):
   - 4-6 Authentication & User Management features
   - 6-8 Core business logic features (based on description)
   - 2-4 Supporting features (notifications, integrations, admin)

4. CREATE REALISTIC DEPENDENCY CHAINS:
   - User Registration MUST come before Login
   - Login MUST come before any protected features
   - Core features MUST be built before advanced features
   - Document uploads need authentication first
   - Task management needs user system first

5. USER STORY REQUIREMENTS:
   - Generate 2-4 user stories per feature
   - Include detailed acceptance criteria (3-5 criteria per story)
   - Ensure ALL stories have meaningful dependencies (not empty arrays)
   - Use realistic hour estimates: 2-6 hours for simple stories, 6-12 for complex

6. DEPENDENCY TYPES (use strategically):
   - "must_do_first": Critical blocking dependencies
   - "do_together": Related stories that should be coordinated

7. REALISTIC COMPLEXITY AND TIME ESTIMATES:
   - Authentication: medium complexity, 4-8 hours per story
   - Core business features: medium-high complexity, 6-12 hours per story
   - UI enhancements: low-medium complexity, 3-6 hours per story
   - Integrations: high complexity, 8-16 hours per story

8. MANDATORY AUTHENTICATION USER STORIES EXAMPLES:
   - "As a new user, I can register with email/password so that I can access the platform"
   - "As a registered user, I can log in securely so that I can access my account"
   - "As a user, I can reset my password if forgotten so that I can regain access"
   - "As a user, I can update my profile information so that my account stays current"
   - "As a user, I can log out securely so that my account remains protected"

9. ENSURE PROPER EXECUTION ORDER:
   Phase 1: Authentication & User Management (Stories 1-8)
   Phase 2: Core Business Features (Stories 9-16)
   Phase 3: Advanced Features & Integrations (Stories 17+)

10. CATEGORY GUIDELINES:
   - "auth": All authentication and user management features
   - "core": Primary business logic features
   - "ui": User interface and experience features
   - "integration": Third-party integrations
   - "admin": Administrative and management features

EXAMPLE DEPENDENCY STRUCTURE:
- User Registration → User Login → User Profile → Protected Features
- Document Upload System → Task Assignment → Workflow Automation
- Basic Communication → Advanced Notifications → Integration Features

Remember: This is for non-technical users building with AI tools. They need a complete roadmap that won't leave them stuck because they forgot essential features like authentication!
  `.trim();
};

const validateResponse = (parsedContent: any): boolean => {
  // Check basic structure
  if (!parsedContent.features || !parsedContent.userStories) {
    console.error('Missing features or userStories in response');
    return false;
  }

  // Check for authentication features
  const authFeatures = parsedContent.features.filter((f: any) => 
    f.category === 'auth' || 
    f.title.toLowerCase().includes('auth') ||
    f.title.toLowerCase().includes('login') ||
    f.title.toLowerCase().includes('register') ||
    f.title.toLowerCase().includes('user')
  );

  if (authFeatures.length < 3) {
    console.error('Insufficient authentication features found');
    return false;
  }

  // Check for proper dependencies
  const storiesWithDependencies = parsedContent.userStories.filter(
    (story: any) => story.dependencies && story.dependencies.length > 0
  );

  if (storiesWithDependencies.length < parsedContent.userStories.length * 0.6) {
    console.error('Too few stories have dependencies');
    return false;
  }

  // Check minimum feature count
  if (parsedContent.features.length < 10) {
    console.error('Not enough features generated');
    return false;
  }

  return true;
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

    console.log('Generating comprehensive features with enhanced prompt...');

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
            content: `You are an expert product manager and app architect helping non-technical users plan comprehensive apps for AI builders like Lovable and Bolt. 

CRITICAL INSTRUCTIONS:
- ALWAYS include authentication features (registration, login, logout, password reset, profile management)
- Generate realistic dependency chains where authentication comes first
- Include 12-18 total features covering all aspects of a complete app
- Ensure EVERY user story has meaningful dependencies (never empty arrays)
- Focus on creating a complete roadmap that prevents users from getting stuck
- Use detailed acceptance criteria (3-5 per story)
- Provide realistic time estimates based on complexity

You must generate a complete app plan, not just the business features described.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 12000,
        temperature: 0.2
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

    // Validate the response
    if (!validateResponse(parsedContent)) {
      console.error('Response validation failed, regenerating...');
      throw new Error('AI response did not meet quality requirements');
    }

    console.log(`Generated ${parsedContent.features.length} features and ${parsedContent.userStories.length} user stories`);
    
    const storiesWithDependencies = parsedContent.userStories.filter(
      (story: any) => story.dependencies && story.dependencies.length > 0
    );
    console.log(`${storiesWithDependencies.length} stories have dependencies`);

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
        details: 'Please try again or provide more detailed project description.'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
