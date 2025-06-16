
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

Return ONLY valid JSON with this EXACT structure (no markdown, no code blocks):
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

IMPORTANT: Return ONLY the JSON object. Do not wrap it in markdown code blocks or add any extra text.
  `.trim();
};

const cleanJsonResponse = (content: string): string => {
  console.log('Raw AI response length:', content.length);
  console.log('Raw AI response (first 200 chars):', content.substring(0, 200));
  
  // Remove markdown code blocks if present
  let cleaned = content.trim();
  
  // Remove ```json and ``` markers
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '');
  }
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '');
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/\s*```$/, '');
  }
  
  // Find the first { and last } to extract just the JSON
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  console.log('Cleaned response length:', cleaned.length);
  console.log('Cleaned response (first 200 chars):', cleaned.substring(0, 200));
  
  return cleaned;
};

const validateResponse = (parsedContent: any): { isValid: boolean; error?: string } => {
  // Check basic structure
  if (!parsedContent || typeof parsedContent !== 'object') {
    return { isValid: false, error: 'Response is not a valid object' };
  }
  
  if (!parsedContent.features || !Array.isArray(parsedContent.features)) {
    return { isValid: false, error: 'Missing or invalid features array' };
  }
  
  if (!parsedContent.userStories || !Array.isArray(parsedContent.userStories)) {
    return { isValid: false, error: 'Missing or invalid userStories array' };
  }

  // Check for authentication features
  const authFeatures = parsedContent.features.filter((f: any) => 
    f.category === 'auth' || 
    (f.title && f.title.toLowerCase().includes('auth')) ||
    (f.title && f.title.toLowerCase().includes('login')) ||
    (f.title && f.title.toLowerCase().includes('register')) ||
    (f.title && f.title.toLowerCase().includes('user'))
  );

  if (authFeatures.length < 3) {
    console.warn('Few authentication features detected, but proceeding...');
  }

  // Check for proper dependencies
  const storiesWithDependencies = parsedContent.userStories.filter(
    (story: any) => story.dependencies && Array.isArray(story.dependencies) && story.dependencies.length > 0
  );

  if (storiesWithDependencies.length < parsedContent.userStories.length * 0.4) {
    console.warn('Few stories have dependencies, but proceeding...');
  }

  // Check minimum feature count
  if (parsedContent.features.length < 8) {
    return { isValid: false, error: 'Not enough features generated (minimum 8 required)' };
  }

  return { isValid: true };
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
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    console.log('Generating comprehensive features with enhanced prompt...');
    console.log('Description length:', description.length);
    console.log('App type:', appType);

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
- Return ONLY valid JSON, no markdown formatting or code blocks

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
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const aiResponse = await response.json();
    console.log('OpenAI response received successfully');

    if (!aiResponse.choices || !aiResponse.choices[0] || !aiResponse.choices[0].message) {
      console.error('Invalid OpenAI response structure:', aiResponse);
      throw new Error('Invalid response structure from OpenAI');
    }

    const content = aiResponse.choices[0].message.content;
    if (!content || content.trim().length === 0) {
      console.error('Empty content from OpenAI');
      throw new Error('Empty response from OpenAI');
    }

    // Clean and parse the JSON response
    const cleanedContent = cleanJsonResponse(content);
    let parsedContent;
    
    try {
      parsedContent = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse cleaned AI response:', parseError);
      console.error('Cleaned content that failed to parse:', cleanedContent.substring(0, 500));
      throw new Error(`Invalid JSON response from AI: ${parseError.message}`);
    }

    // Validate the response
    const validation = validateResponse(parsedContent);
    if (!validation.isValid) {
      console.error('Response validation failed:', validation.error);
      throw new Error(`AI response validation failed: ${validation.error}`);
    }

    console.log(`Successfully generated ${parsedContent.features.length} features and ${parsedContent.userStories.length} user stories`);
    
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
    
    let errorMessage = 'Failed to generate features';
    let statusCode = 500;
    
    if (error.message?.includes('OpenAI API key not configured')) {
      errorMessage = 'OpenAI API key not configured';
      statusCode = 500;
    } else if (error.message?.includes('OpenAI API error')) {
      errorMessage = 'OpenAI service error';
      statusCode = 502;
    } else if (error.message?.includes('Invalid JSON')) {
      errorMessage = 'AI response format error';
      statusCode = 502;
    } else if (error.message?.includes('validation failed')) {
      errorMessage = 'AI response quality error';
      statusCode = 502;
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error.message || 'Unknown error occurred',
        timestamp: new Date().toISOString()
      }),
      {
        status: statusCode,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
