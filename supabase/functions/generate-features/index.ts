
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateFeaturesRequest {
  description: string;
  appType: string;
  enhancedInput?: {
    projectTitle: string;
    projectDescription: string;
    appType: string;
    targetUsers: string;
    coreUserActions: string;
    monetizationModel: string;
    specificRequirements: string[];
    technicalPreferences?: string;
    complexity: 'simple' | 'medium' | 'complex';
    includeAdvancedFeatures: boolean;
  };
}

const getAppTypeSpecificGuidance = (appType: string): string => {
  const guidance = {
    saas: "user authentication, subscription management, role-based access control, admin dashboard, billing integration, user onboarding, data export/import, API access, team management, usage analytics",
    marketplace: "seller profiles, product listings, search and filtering, shopping cart, payment processing, reviews and ratings, seller dashboard, buyer protection, commission system, dispute resolution",
    ecommerce: "product catalog, inventory management, shopping cart, checkout process, payment gateway, order tracking, customer accounts, wishlist, product recommendations, returns management",
    ai_tool: "AI model integration, prompt interface, result processing, usage analytics, API endpoints, model selection, batch processing, result export, usage limits, prompt templates",
    social: "user profiles, content creation, social feeds, messaging, notifications, privacy controls, content moderation, social interactions, friend/follow system, content sharing",
    productivity: "task management, collaboration tools, file sharing, calendar integration, reporting, workflow automation, team management, time tracking, project organization, document management",
    other: "core functionality, user management, data processing, reporting, integrations, security features, mobile responsiveness, performance optimization"
  };
  return guidance[appType] || guidance.other;
};

const getFeatureCount = (complexity: string): number => {
  return { simple: 10, medium: 15, complex: 22 }[complexity] || 15;
};

const buildEnhancedFeatureGenerationPrompt = (data: GenerateFeaturesRequest): string => {
  const { description, appType, enhancedInput } = data;
  
  if (!enhancedInput) {
    // Fallback to basic prompt if enhanced input not provided
    return buildBasicFeatureGenerationPrompt(description, appType);
  }

  const featureCount = getFeatureCount(enhancedInput.complexity);
  const appSpecificGuidance = getAppTypeSpecificGuidance(appType);
  const requirements = enhancedInput.specificRequirements.length > 0 
    ? enhancedInput.specificRequirements.join(', ') 
    : 'No specific requirements specified';

  return `
You are an expert product manager AI specializing in comprehensive app planning for AI builders like Lovable, Bolt, and Cursor. You create complete, implementable feature plans that include ALL essential components for a functional application.

CRITICAL PROJECT CONTEXT:
**Project:** ${enhancedInput.projectTitle}
**App Type:** ${appType} application
**Target Users:** ${enhancedInput.targetUsers}
**Core Actions:** ${enhancedInput.coreUserActions}
**Monetization:** ${enhancedInput.monetizationModel}
**Complexity:** ${enhancedInput.complexity} (${featureCount} total features)
**Specific Requirements:** ${requirements}
${enhancedInput.technicalPreferences ? `**Technical Preferences:** ${enhancedInput.technicalPreferences}` : ''}

**Project Description:** ${description}

MANDATORY FEATURE REQUIREMENTS:

1. **ALWAYS INCLUDE AUTHENTICATION SYSTEM (4-5 features):**
   - User Registration & Email Verification
   - Secure Login/Logout System
   - Password Reset & Recovery
   - User Profile Management
   - Account Settings & Preferences

2. **CORE BUSINESS FEATURES (${Math.floor(featureCount * 0.5)}-${Math.ceil(featureCount * 0.6)} features):**
   Based on the core user actions: "${enhancedInput.coreUserActions}"
   - Implement the primary functionality described
   - Include data management and CRUD operations
   - Add search, filtering, and organization features
   - Ensure mobile responsiveness

3. **${appType.toUpperCase()} SPECIFIC FEATURES:**
   Include these essential ${appType} features: ${appSpecificGuidance}

4. **MONETIZATION FEATURES (if ${enhancedInput.monetizationModel}):**
   ${enhancedInput.monetizationModel === 'subscription' ? '- Subscription management, billing integration, plan selection' : ''}
   ${enhancedInput.monetizationModel === 'freemium' ? '- Free tier limitations, upgrade prompts, premium features' : ''}
   ${enhancedInput.monetizationModel === 'marketplace_fees' ? '- Transaction processing, fee calculation, payout system' : ''}
   ${enhancedInput.monetizationModel === 'ads' ? '- Ad placement system, revenue tracking, advertiser management' : ''}

5. **INFRASTRUCTURE & SUPPORT FEATURES:**
   - Error handling & user feedback
   - Help system & user onboarding
   - Data security & privacy controls
   - Performance optimization

ENHANCED USER STORY GENERATION:
For each feature, create 2-4 detailed user stories with:
- Proper format: "As a [specific user type], I want [specific capability] so that [clear benefit]"
- 3-5 detailed acceptance criteria per story
- Realistic time estimates (2-8 hours based on complexity)
- Dependencies that create logical implementation order
- Priority levels that ensure auth features come first

DEPENDENCY STRATEGY:
Create realistic implementation chains:
- Authentication → Profile Management → Protected Features
- Basic CRUD → Advanced Features → Integrations
- Core Business Logic → Analytics → Admin Features

OUTPUT FORMAT - Return ONLY this JSON structure:
{
  "features": [
    {
      "title": "Specific, Clear Feature Name",
      "description": "Detailed description explaining what this does and why it's important for ${appType} targeting ${enhancedInput.targetUsers}",
      "priority": "high|medium|low",
      "category": "auth|core|ui|integration|admin",
      "complexity": "low|medium|high",
      "estimatedHours": 6
    }
  ],
  "userStories": [
    {
      "featureTitle": "Exact matching feature title from above",
      "userStories": [
        {
          "title": "As a ${enhancedInput.targetUsers}, I want [specific capability] so that [clear benefit]",
          "description": "Detailed story description with context",
          "acceptanceCriteria": [
            "Given [context], when [action], then [result]",
            "Given [context], when [action], then [result]",
            "Given [context], when [action], then [result]"
          ],
          "priority": "high|medium|low",
          "complexity": "low|medium|high",
          "estimatedHours": 4,
          "dependencies": [
            {
              "targetStoryTitle": "Title of prerequisite story",
              "type": "must_do_first",
              "reason": "Clear explanation why this dependency exists"
            }
          ]
        }
      ]
    }
  ]
}

CRITICAL SUCCESS FACTORS:
- Generate exactly ${featureCount} features covering ALL aspects of a complete ${appType}
- Ensure authentication features are prioritized and come first
- Create stories small enough for AI builders (2-8 hour tasks)
- Include realistic dependencies that prevent users from getting stuck
- Focus on ${enhancedInput.targetUsers} and their ability to: ${enhancedInput.coreUserActions}
- Consider ${enhancedInput.monetizationModel} model throughout the feature set

Return ONLY the JSON object. No markdown formatting or explanations.
  `.trim();
};

const buildBasicFeatureGenerationPrompt = (description: string, appType: string): string => {
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
      "userStories": [
        {
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
            }
          ]
        }
      ]
    }
  ]
}

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
    const requestData: GenerateFeaturesRequest = await req.json();

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    console.log('Generating features with enhanced prompt system...');
    console.log('App type:', requestData.appType);
    console.log('Enhanced input provided:', !!requestData.enhancedInput);

    const prompt = buildEnhancedFeatureGenerationPrompt(requestData);

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
            content: `You are an expert product manager AI helping non-technical users plan comprehensive apps for AI builders like Lovable and Bolt. 

CRITICAL INSTRUCTIONS:
- ALWAYS include complete authentication system (registration, login, logout, password reset, profile management)
- Generate realistic dependency chains where authentication comes first
- Include the specified number of features covering all aspects of a complete app
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
      (storyGroup: any) => storyGroup.userStories.some((story: any) => story.dependencies && story.dependencies.length > 0)
    );
    console.log(`${storiesWithDependencies.length} feature groups have stories with dependencies`);

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
