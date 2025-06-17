
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

CRITICAL INSTRUCTIONS - NO SHORTCUTS OR ABBREVIATIONS:
⚠️  You MUST generate COMPLETE specifications for ALL ${featureCount} features
⚠️  You MUST write out ALL user stories with COMPLETE acceptance criteria (3-5 criteria each)
⚠️  NO shortcuts, NO "similar to above", NO "etc.", NO truncation
⚠️  This is for NON-TECHNICAL users who need complete implementation roadmaps
⚠️  Every user story must have DETAILED dependencies - no empty dependency arrays
⚠️  Write EVERYTHING out in full detail - this will be used as-is by developers
⚠️  Each feature description must be at least 100 words explaining implementation details
⚠️  Each user story must have specific, actionable acceptance criteria
⚠️  NO abbreviations or shortcuts - write every single detail

FORBIDDEN - DO NOT USE:
- "Similar to the above feature..."
- "...and other related functionality"
- "etc." or "..."  
- Empty dependency arrays (every story needs realistic dependencies)
- Vague acceptance criteria like "Feature works properly"
- Generic descriptions - be specific to this ${appType} app

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

MANDATORY FEATURE REQUIREMENTS - WRITE ALL OF THESE OUT COMPLETELY:

1. **AUTHENTICATION SYSTEM (4-5 features) - WRITE EVERY DETAIL:**
   - User Registration & Email Verification (complete implementation details)
   - Secure Login/Logout System (complete session management details)
   - Password Reset & Recovery (complete flow and security details)
   - User Profile Management (complete CRUD operations details)
   - Account Settings & Preferences (complete customization options)

2. **CORE BUSINESS FEATURES (${Math.floor(featureCount * 0.5)}-${Math.ceil(featureCount * 0.6)} features) - WRITE EVERY DETAIL:**
   Based on the core user actions: "${enhancedInput.coreUserActions}"
   - Implement the primary functionality described (complete specifications)
   - Include data management and CRUD operations (complete database interactions)
   - Add search, filtering, and organization features (complete UI/UX details)
   - Ensure mobile responsiveness (complete responsive design requirements)

3. **${appType.toUpperCase()} SPECIFIC FEATURES - WRITE EVERY DETAIL:**
   Include these essential ${appType} features with complete specifications: ${appSpecificGuidance}

4. **MONETIZATION FEATURES (if ${enhancedInput.monetizationModel}) - WRITE EVERY DETAIL:**
   ${enhancedInput.monetizationModel === 'subscription' ? '- Subscription management, billing integration, plan selection (complete payment flow)' : ''}
   ${enhancedInput.monetizationModel === 'freemium' ? '- Free tier limitations, upgrade prompts, premium features (complete tier management)' : ''}
   ${enhancedInput.monetizationModel === 'marketplace_fees' ? '- Transaction processing, fee calculation, payout system (complete financial flow)' : ''}
   ${enhancedInput.monetizationModel === 'ads' ? '- Ad placement system, revenue tracking, advertiser management (complete ad ecosystem)' : ''}

5. **INFRASTRUCTURE & SUPPORT FEATURES - WRITE EVERY DETAIL:**
   - Error handling & user feedback (complete error management system)
   - Help system & user onboarding (complete support infrastructure)
   - Data security & privacy controls (complete security implementation)
   - Performance optimization (complete optimization strategies)

ENHANCED USER STORY GENERATION REQUIREMENTS:
For EVERY SINGLE user story, you MUST include:
- Proper format: "As a [specific user type], I want [specific capability] so that [clear benefit]"
- 3-5 DETAILED acceptance criteria per story (write them all out completely)
- Realistic time estimates (2-8 hours based on complexity with justification)
- DETAILED dependencies that create logical implementation order (NO EMPTY ARRAYS)
- Priority levels that ensure auth features come first
- Complete description explaining the technical implementation approach

DEPENDENCY REQUIREMENTS - NO SHORTCUTS:
Create realistic implementation chains with DETAILED explanations:
- Authentication → Profile Management → Protected Features (explain each dependency)
- Basic CRUD → Advanced Features → Integrations (explain implementation order)
- Core Business Logic → Analytics → Admin Features (explain technical dependencies)
- EVERY user story must have at least 1-2 meaningful dependencies
- Explain WHY each dependency exists in technical terms

OUTPUT FORMAT - Return ONLY this JSON structure with COMPLETE DETAILS:
{
  "features": [
    {
      "title": "Specific, Clear Feature Name (not vague)",
      "description": "DETAILED description (minimum 100 words) explaining what this does, how it works technically, why it's important for ${appType} targeting ${enhancedInput.targetUsers}, specific implementation requirements, database interactions, UI components needed, and integration points",
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
          "description": "DETAILED story description (minimum 50 words) with technical context, user workflow, expected behavior, error handling, and success criteria",
          "acceptanceCriteria": [
            "Given [specific context], when [specific action], then [specific result with measurable outcome]",
            "Given [specific context], when [specific action], then [specific result with measurable outcome]",
            "Given [specific context], when [specific action], then [specific result with measurable outcome]",
            "Given [specific error scenario], when [action], then [error handling result]",
            "Given [edge case], when [action], then [expected behavior]"
          ],
          "priority": "high|medium|low",
          "complexity": "low|medium|high",
          "estimatedHours": 4,
          "dependencies": [
            {
              "targetStoryTitle": "Exact title of prerequisite story",
              "type": "must_do_first",
              "reason": "DETAILED technical explanation why this dependency exists, what would break without it, and how it impacts implementation order"
            },
            {
              "targetStoryTitle": "Another prerequisite story title",
              "type": "must_do_first", 
              "reason": "Another detailed technical dependency explanation"
            }
          ]
        }
      ]
    }
  ]
}

CRITICAL SUCCESS FACTORS - NO COMPROMISES:
- Generate exactly ${featureCount} features covering ALL aspects of a complete ${appType}
- Ensure authentication features are prioritized and come first
- Create stories small enough for AI builders (2-8 hour tasks) with technical justification
- Include realistic dependencies that prevent users from getting stuck
- Focus on ${enhancedInput.targetUsers} and their ability to: ${enhancedInput.coreUserActions}
- Consider ${enhancedInput.monetizationModel} model throughout the feature set
- EVERY feature must have complete, detailed specifications
- EVERY user story must have 3-5 detailed acceptance criteria
- EVERY user story must have meaningful, explained dependencies
- NO shortcuts, abbreviations, or truncation anywhere

QUALITY VALIDATION REQUIREMENTS:
- Minimum 20,000 characters total response length
- Each feature description minimum 100 words
- Each user story description minimum 50 words  
- Every acceptance criteria must be specific and testable
- Every dependency must have detailed technical explanation
- No empty arrays for dependencies - every story has prerequisites

Return ONLY the complete JSON object with every detail written out in full. No markdown formatting or explanations outside the JSON. This JSON will be used directly by non-technical users to build their application.
  `.trim();
};

const buildBasicFeatureGenerationPrompt = (description: string, appType: string): string => {
  return `
Generate a comprehensive feature plan for this ${appType} project:

PROJECT DESCRIPTION:
${description}

CRITICAL INSTRUCTIONS - NO SHORTCUTS:
⚠️  Write out EVERY feature with complete specifications
⚠️  Include ALL user stories with detailed acceptance criteria  
⚠️  NO abbreviations like "etc." or "similar patterns"
⚠️  This is for non-technical users - be completely detailed
⚠️  Every user story needs realistic dependencies explained

Return ONLY valid JSON with this EXACT structure (no markdown, no code blocks):
{
  "features": [
    {
      "title": "Specific Feature Name (not vague)",
      "description": "Complete description of what this feature does, how it works, and why it's needed - minimum 100 words",
      "priority": "high|medium|low",
      "category": "core|ui|integration|admin|auth",
      "complexity": "low|medium|high",
      "estimatedHours": 8
    }
  ],
  "userStories": [
    {
      "featureTitle": "Exact matching feature title",
      "userStories": [
        {
          "title": "As a [specific user type], I can [specific action] so that [specific benefit]",
          "description": "Detailed description of the user story with technical context - minimum 50 words",
          "acceptanceCriteria": [
            "Given [specific context], when [specific action], then [specific measurable result]",
            "Given [specific context], when [specific action], then [specific measurable result]",
            "Given [error scenario], when [action], then [error handling result]"
          ],
          "priority": "high|medium|low",
          "complexity": "low|medium|high",
          "estimatedHours": 4,
          "dependencies": [
            {
              "targetStoryTitle": "Exact title of story this depends on",
              "type": "must_do_first",
              "reason": "Detailed technical explanation why this dependency exists and what would break without it"
            }
          ]
        }
      ]
    }
  ]
}

QUALITY REQUIREMENTS:
- Minimum 15,000 characters total
- Every feature fully specified
- Every user story has 3+ detailed acceptance criteria
- Every user story has meaningful dependencies with explanations
- No shortcuts or abbreviations anywhere

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

const validateResponse = (parsedContent: any): { isValid: boolean; error?: string; issues: string[] } => {
  const issues: string[] = [];
  
  // Check basic structure
  if (!parsedContent || typeof parsedContent !== 'object') {
    return { isValid: false, error: 'Response is not a valid object', issues: ['Invalid JSON structure'] };
  }
  
  if (!parsedContent.features || !Array.isArray(parsedContent.features)) {
    return { isValid: false, error: 'Missing or invalid features array', issues: ['No features array'] };
  }
  
  if (!parsedContent.userStories || !Array.isArray(parsedContent.userStories)) {
    return { isValid: false, error: 'Missing or invalid userStories array', issues: ['No userStories array'] };
  }

  // Check minimum feature count
  if (parsedContent.features.length < 8) {
    issues.push(`Not enough features generated: ${parsedContent.features.length} (minimum 8 required)`);
  }

  // Check for shortcuts in features
  parsedContent.features.forEach((feature: any, index: number) => {
    if (!feature.description || feature.description.length < 50) {
      issues.push(`Feature ${index + 1} description too short`);
    }
    if (feature.description && (
      feature.description.includes('etc.') || 
      feature.description.includes('...') ||
      feature.description.includes('similar to')
    )) {
      issues.push(`Feature ${index + 1} contains shortcuts`);
    }
  });

  // Check for shortcuts in user stories
  parsedContent.userStories.forEach((storyGroup: any, groupIndex: number) => {
    if (storyGroup.userStories) {
      storyGroup.userStories.forEach((story: any, storyIndex: number) => {
        if (!story.acceptanceCriteria || story.acceptanceCriteria.length < 3) {
          issues.push(`Story group ${groupIndex + 1}, story ${storyIndex + 1} has insufficient acceptance criteria`);
        }
        if (!story.dependencies || story.dependencies.length === 0) {
          issues.push(`Story group ${groupIndex + 1}, story ${storyIndex + 1} has no dependencies`);
        }
      });
    }
  });

  // Check content length for quality
  const totalContent = JSON.stringify(parsedContent).length;
  if (totalContent < 15000) {
    issues.push(`Response too short: ${totalContent} characters (minimum 15000 required)`);
  }

  return { 
    isValid: issues.length === 0, 
    issues 
  };
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

    console.log('Generating features with comprehensive specifications...');
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

CRITICAL INSTRUCTIONS - NO SHORTCUTS ALLOWED:
⚠️  NEVER use shortcuts like "similar to above", "etc.", or "..."
⚠️  ALWAYS include complete authentication system (registration, login, logout, password reset, profile management)
⚠️  Generate realistic dependency chains where authentication comes first
⚠️  Include the specified number of features covering all aspects of a complete app
⚠️  Ensure EVERY user story has meaningful dependencies (never empty arrays)
⚠️  Focus on creating a complete roadmap that prevents users from getting stuck
⚠️  Use detailed acceptance criteria (3-5 per story) with specific, testable conditions
⚠️  Provide realistic time estimates based on complexity with technical justification
⚠️  Return ONLY valid JSON, no markdown formatting or code blocks
⚠️  Write EVERYTHING out in complete detail - no abbreviations or shortcuts
⚠️  Each feature description must be minimum 100 words with implementation details
⚠️  Each user story must have detailed technical dependencies with explanations
⚠️  This is for NON-TECHNICAL users who need complete implementation guidance

You must generate a complete app plan, not just the business features described. Every section must be fully detailed without any shortcuts or truncation.`
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

    // Validate the response for quality and completeness
    const validation = validateResponse(parsedContent);
    if (!validation.isValid) {
      console.error('Response validation failed:', validation.error);
      console.error('Quality issues:', validation.issues);
      
      // Log issues but don't fail completely for minor issues
      if (validation.issues.length > 0) {
        console.warn('Quality issues detected:', validation.issues);
      }
      
      // Only fail for critical structural issues
      if (validation.error) {
        throw new Error(`AI response validation failed: ${validation.error}`);
      }
    }

    console.log(`Successfully generated ${parsedContent.features.length} features and ${parsedContent.userStories.length} user stories`);
    
    const storiesWithDependencies = parsedContent.userStories.filter(
      (storyGroup: any) => storyGroup.userStories.some((story: any) => story.dependencies && story.dependencies.length > 0)
    );
    console.log(`${storiesWithDependencies.length} feature groups have stories with dependencies`);

    // Log quality metrics
    const totalContent = JSON.stringify(parsedContent).length;
    console.log(`Response length: ${totalContent} characters`);
    console.log(`Quality issues: ${validation.issues.length}`);

    return new Response(JSON.stringify({
      ...parsedContent,
      qualityMetrics: {
        totalCharacters: totalContent,
        qualityIssues: validation.issues
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error('Error in generate-features function:', error);
    
    let errorMessage = 'Failed to generate comprehensive features';
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
