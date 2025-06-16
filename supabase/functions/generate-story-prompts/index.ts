
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
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Gather project data with execution order
    const projectData = await gatherProjectDataWithOrder(supabase, projectId);
    
    // Generate prompts
    const prompts = await generateUserStoryPrompts(projectData, platform);
    
    // Save to database
    await saveGeneratedPrompts(supabase, projectId, prompts, platform);

    return new Response(JSON.stringify({ 
      success: true,
      prompts: prompts
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

async function gatherProjectDataWithOrder(supabase: any, projectId: string) {
  const [projectResult, featuresResult, userStoriesResult, executionPlanResult] = await Promise.all([
    supabase.from('projects').select('*').eq('id', projectId).single(),
    supabase.from('features').select('*').eq('project_id', projectId).order('execution_order'),
    supabase.from('user_stories').select('*').eq('feature_id', projectId).order('execution_order'),
    supabase.from('execution_plans').select('*').eq('project_id', projectId).single()
  ]);

  return {
    project: projectResult.data,
    features: featuresResult.data || [],
    userStories: userStoriesResult.data || [],
    executionPlan: executionPlanResult.data || { phases: [] }
  };
}

async function generateUserStoryPrompts(projectData: any, platform: string) {
  const userStories = projectData.userStories.sort((a: any, b: any) => (a.execution_order || 999) - (b.execution_order || 999));
  const phases = projectData.executionPlan.phases || [];
  
  const prompts: any = {
    phaseOverviews: [],
    storyPrompts: [],
    transitionPrompts: [],
    troubleshootingGuide: null
  };

  // Generate phase overview prompts
  for (const phase of phases) {
    const phaseOverview = await generatePhaseOverviewPrompt(phase, projectData, platform);
    prompts.phaseOverviews.push(phaseOverview);
  }

  // Generate individual story prompts
  for (let i = 0; i < userStories.length; i++) {
    const story = userStories[i];
    const previousStories = userStories.slice(0, i);
    const nextStory = userStories[i + 1];
    
    const storyPrompt = generateStoryPrompt(story, previousStories, nextStory, projectData, platform);
    prompts.storyPrompts.push(storyPrompt);

    // Generate transition prompt to next story
    if (nextStory) {
      const transitionPrompt = generateTransitionPrompt(story, nextStory, platform);
      prompts.transitionPrompts.push(transitionPrompt);
    }
  }

  // Generate comprehensive troubleshooting guide
  prompts.troubleshootingGuide = await generateTroubleshootingGuide(projectData, platform);

  return prompts;
}

function generatePhaseOverviewPrompt(phase: any, projectData: any, platform: string) {
  return {
    id: `phase-${phase.number}`,
    title: `Phase ${phase.number} Overview`,
    content: buildPhaseOverviewContent(phase, projectData, platform),
    phaseNumber: phase.number,
    platform
  };
}

function buildPhaseOverviewContent(phase: any, projectData: any, platform: string): string {
  return `
# PHASE ${phase.number} OVERVIEW: ${phase.name || 'Development Phase'}

## 🎯 PHASE OBJECTIVES
${phase.description || 'Complete the features in this development phase'}

## 📋 FEATURES IN THIS PHASE
${phase.features?.map((f: any, i: number) => `${i + 1}. **${f.title}** - ${f.description || 'Core functionality'}`).join('\n') || 'Features to be implemented'}

## 🔧 PLATFORM APPROACH
${getPlatformApproach(platform)}

## ⏱️ ESTIMATED TIME
**Total Phase Time:** ${phase.estimatedHours || 24} AI builder hours

## 🚀 GETTING STARTED
1. Review all user stories in this phase
2. Set up your development environment
3. Start with the first story in execution order
4. Test each feature before moving to the next

## 📈 SUCCESS CRITERIA
- All features in this phase are fully functional
- UI is responsive and user-friendly
- Code is clean and well-documented
- No console errors or warnings

Ready to begin this phase!
  `.trim();
}

function generateStoryPrompt(story: any, previousStories: any[], nextStory: any, projectData: any, platform: string) {
  return {
    id: story.id,
    title: `Story ${story.execution_order || 1}: ${story.title}`,
    content: buildStoryPromptContent(story, previousStories, nextStory, projectData, platform),
    executionOrder: story.execution_order || 1,
    platform,
    dependencies: story.dependencies || [],
    estimatedTime: story.estimated_hours || 4,
    acceptanceCriteria: story.acceptance_criteria || []
  };
}

function buildStoryPromptContent(story: any, previousStories: any[], nextStory: any, projectData: any, platform: string): string {
  return `
# STORY ${story.execution_order || 1}: ${story.title}

## 📋 CONTEXT
We are building ${projectData.project.title}: ${projectData.project.description}

${previousStories.length > 0 ? `
WHAT WE'VE BUILT SO FAR:
${previousStories.map((s: any, i: number) => `${i + 1}. ${s.title} ✅`).join('\n')}
` : ''}

${story.dependencies?.length > 0 ? `
DEPENDENCIES:
${story.dependencies.map((dep: any) => 
  `- ${dep.type === 'must_do_first' ? 'REQUIRES' : 'RELATED TO'}: "${dep.targetStoryTitle}" - ${dep.reason}`
).join('\n')}
` : ''}

CURRENT FOCUS: ${story.description}

## 🎯 TASK
${story.title}

DESCRIPTION: ${story.description}

${getPlatformApproach(platform)}

## 📝 REQUIREMENTS

FUNCTIONAL REQUIREMENTS:
${story.acceptance_criteria?.map((criteria: string, i: number) => `${i + 1}. ${criteria}`).join('\n') || '1. Feature works as described\n2. UI is responsive and user-friendly\n3. No console errors or warnings'}

TECHNICAL REQUIREMENTS:
${getTechnicalRequirements(platform)}

QUALITY REQUIREMENTS:
- Code should be readable and well-commented
- UI should be intuitive and user-friendly
- Functionality should work as expected
- No console errors or warnings

## ✅ ACCEPTANCE CRITERIA

DEFINITION OF DONE:
${story.acceptance_criteria?.map((criteria: string) => `✅ ${criteria}`).join('\n') || '✅ Feature works as described\n✅ UI is responsive and user-friendly\n✅ No console errors or warnings\n✅ Code is clean and well-organized'}

TESTING CHECKLIST:
□ Manual testing completed
□ Responsive design verified
□ Error handling tested
□ Integration with existing features verified

## 🔧 IMPLEMENTATION GUIDANCE

STEP-BY-STEP APPROACH:
${getImplementationSteps(story, platform)}

BEST PRACTICES:
- Start with the simplest implementation
- Test each piece as you build it
- Add error handling and loading states
- Keep components focused and reusable

## 🧪 TESTING & VALIDATION

MANUAL TESTING STEPS:
${story.acceptance_criteria?.map((criteria: string, i: number) => `${i + 1}. Test: ${criteria}`).join('\n') || '1. Test core functionality\n2. Test responsive design\n3. Test error handling'}

VERIFICATION CHECKLIST:
□ Feature works in desktop browser
□ Feature works on mobile devices
□ Error states are handled gracefully
□ Loading states are shown when appropriate
□ Data persists correctly (if applicable)
□ Integration with other features works

## ➡️ NEXT STEPS

COMPLETION CHECKLIST:
□ All acceptance criteria met
□ Manual testing completed
□ Code is clean and commented
□ No console errors or warnings

${nextStory ? `
NEXT STORY: Story ${nextStory.execution_order}
"${nextStory.title}"
Preview: ${nextStory.description}
` : `
🎉 CONGRATULATIONS!
You've completed all user stories for this project!
Time to test the complete application and deploy.
`}

${getPlatformSpecificFooter(platform)}
  `.trim();
}

function generateTransitionPrompt(story: any, nextStory: any, platform: string) {
  return {
    id: `transition-${story.id}-${nextStory.id}`,
    title: `Transition: ${story.title} → ${nextStory.title}`,
    content: `
# 🔄 TRANSITION CHECKLIST

## ✅ JUST COMPLETED
**Story ${story.execution_order}:** ${story.title}

Verify that:
□ All acceptance criteria are met
□ Feature is fully tested
□ No console errors
□ Code is committed/saved

## ➡️ NEXT UP
**Story ${nextStory.execution_order}:** ${nextStory.title}

Before starting:
□ Take a short break
□ Review the next story requirements
□ Ensure your development environment is ready
□ Commit your current progress

Ready to continue!
    `.trim(),
    executionOrder: story.execution_order + 0.5,
    platform
  };
}

async function generateTroubleshootingGuide(projectData: any, platform: string) {
  const prompt = buildTroubleshootingPrompt(projectData, platform);
  
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
          content: 'You are an expert developer who helps non-technical users troubleshoot issues with AI app builders. Create comprehensive, practical troubleshooting guidance.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 6000,
      temperature: 0.2
    }),
  });

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  return {
    projectId: projectData.project.id,
    platform,
    content,
    sections: parseTroubleshootingSections(content)
  };
}

function buildTroubleshootingPrompt(projectData: any, platform: string): string {
  return `
Create a comprehensive troubleshooting guide for this project:

PROJECT: ${projectData.project.title}
PLATFORM: ${platform}
FEATURES: ${projectData.features.map((f: any) => f.title).join(', ')}

Generate a troubleshooting guide with these sections:

## 🔧 GENERAL TROUBLESHOOTING

### Common Issues Across All Stories
1. **Feature not working as expected**
   - Symptoms and causes
   - Step-by-step debugging process
   - Common solutions

2. **Styling and layout problems**
   - Responsive design issues
   - CSS conflicts
   - Component styling problems

3. **Data not saving or loading**
   - Database connection issues
   - API problems
   - State management issues

4. **Integration problems**
   - Component integration failures
   - Dependency conflicts
   - State synchronization issues

## 🎯 PLATFORM-SPECIFIC TROUBLESHOOTING

### ${platform.toUpperCase()} Specific Issues
${getPlatformSpecificTroubleshooting(platform)}

## 🔍 DEBUGGING PROCESS

### Step-by-Step Debugging
1. Identify the problem
2. Check browser console
3. Verify requirements
4. Test with minimal data
5. Check integrations
6. Review recent changes

### Tools and Techniques
- Browser Developer Tools
- Console logging
- Network tab analysis
- Component inspection

## 🆘 WHEN TO ASK FOR HELP

### Before Asking for Help
- Try the solutions in this guide
- Check the browser console for errors
- Test with simplified data
- Review the story requirements

### How to Ask for Help Effectively
- Describe what you're trying to achieve
- Explain what you've tried
- Include error messages
- Share relevant code snippets

### Where to Get Help
- Platform documentation
- Community forums
- Stack Overflow
- Platform-specific Discord/Slack

## 🔄 ROLLBACK STRATEGIES

### When Things Go Wrong
1. Save your current progress
2. Identify the last working state
3. Revert to that point
4. Try a different approach
5. Ask for guidance on the new approach

### Backup Best Practices
- Commit changes frequently
- Test before moving to next story
- Keep notes of what works
- Document successful patterns

Make this guide practical and immediately useful for non-technical users!
  `.trim();
}

function getPlatformApproach(platform: string): string {
  const approaches: { [key: string]: string } = {
    lovable: `
LOVABLE APPROACH:
- Use React with TypeScript and Tailwind CSS
- Implement with shadcn-ui components where appropriate
- Use Supabase for any backend functionality
- Follow React best practices and hooks patterns`,
    bolt: `
BOLT APPROACH:
- Create clean, modern web application code
- Use best practices for file organization
- Implement responsive design principles
- Focus on user experience and performance`,
    cursor: `
CURSOR APPROACH:
- Write clean, well-documented code
- Use appropriate design patterns
- Implement proper error handling
- Follow coding best practices`,
    claude: `
CLAUDE APPROACH:
- Focus on clear, maintainable code structure
- Implement comprehensive error handling
- Use modern development patterns
- Prioritize code readability and documentation`,
    replit: `
REPLIT APPROACH:
- Build with collaborative development in mind
- Use environment-specific configurations
- Implement clean separation of concerns
- Focus on rapid prototyping and iteration`,
    windsurf: `
WINDSURF APPROACH:
- Leverage AI-assisted development workflows
- Implement efficient code generation patterns
- Use modern tooling and frameworks
- Focus on developer productivity`
  };
  
  return approaches[platform] || approaches.lovable;
}

function getTechnicalRequirements(platform: string): string {
  const requirements: { [key: string]: string } = {
    lovable: `
- Use TypeScript for type safety
- Implement with Tailwind CSS for styling
- Use shadcn-ui components when applicable
- Integrate with Supabase for backend needs
- Follow React hooks patterns`,
    bolt: `
- Use modern JavaScript/TypeScript
- Implement responsive CSS design
- Follow component-based architecture
- Use proper state management
- Implement error boundaries`,
    cursor: `
- Write clean, documented code
- Use appropriate design patterns
- Implement proper error handling
- Follow coding best practices
- Use modern development tools`
  };
  
  return requirements[platform] || requirements.lovable;
}

function getImplementationSteps(story: any, platform: string): string {
  return `
1. **Plan the Implementation**
   - Review the acceptance criteria carefully
   - Identify the main components needed
   - Plan the data flow and state management

2. **Create the Basic Structure**
   - Set up the main component files
   - Create necessary interfaces/types
   - Implement basic component structure

3. **Implement Core Functionality**
   - Add the main business logic
   - Implement data fetching/saving
   - Handle user interactions

4. **Style and Polish**
   - Apply appropriate styling
   - Ensure responsive design
   - Add loading and error states

5. **Test and Validate**
   - Test all acceptance criteria
   - Check for edge cases
   - Verify integration with existing features`;
}

function getPlatformSpecificFooter(platform: string): string {
  const footers: { [key: string]: string } = {
    lovable: `
## 💡 LOVABLE-SPECIFIC TIPS
- Use the built-in components from shadcn-ui when possible
- Leverage Supabase for data persistence
- Take advantage of TypeScript for better development experience
- Use Tailwind classes for consistent styling`,
    bolt: `
## 💡 BOLT-SPECIFIC TIPS
- Focus on clean, maintainable code structure
- Use environment variables for configuration
- Implement proper error handling throughout
- Test across different browsers and devices`,
    cursor: `
## 💡 CURSOR-SPECIFIC TIPS
- Leverage AI assistance for code generation
- Use proper code organization patterns
- Implement comprehensive error handling
- Document your code for future reference`
  };
  
  return footers[platform] || footers.lovable;
}

function getPlatformSpecificTroubleshooting(platform: string): string {
  const troubleshooting: { [key: string]: string } = {
    lovable: `
- **Supabase connection issues**: Check environment variables and API keys
- **shadcn-ui component problems**: Verify component imports and props
- **TypeScript errors**: Check type definitions and interfaces
- **Tailwind CSS not working**: Verify class names and configuration
- **React hooks issues**: Check dependency arrays and state updates`,
    bolt: `
- **Build errors**: Check file structure and imports
- **Styling issues**: Verify CSS and responsive design
- **JavaScript errors**: Check syntax and browser compatibility
- **Performance problems**: Optimize images and code splitting`,
    cursor: `
- **Code completion issues**: Check language server and extensions
- **Refactoring problems**: Verify code structure and dependencies
- **Debugging difficulties**: Use proper debugging tools and techniques
- **Integration issues**: Check API connections and data flow`
  };
  
  return troubleshooting[platform] || troubleshooting.lovable;
}

function parseTroubleshootingSections(content: string) {
  const sections: { [key: string]: string } = {};
  const lines = content.split('\n');
  let currentSection = '';
  let currentContent = '';
  
  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentSection) {
        sections[currentSection] = currentContent.trim();
      }
      currentSection = line.replace('## ', '').trim();
      currentContent = '';
    } else {
      currentContent += line + '\n';
    }
  }
  
  if (currentSection) {
    sections[currentSection] = currentContent.trim();
  }
  
  return sections;
}

async function saveGeneratedPrompts(supabase: any, projectId: string, prompts: any, platform: string) {
  // Clear existing prompts for this project/platform
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

  // Save phase overviews
  for (const phase of prompts.phaseOverviews) {
    await supabase
      .from('generated_prompts')
      .insert({
        project_id: projectId,
        user_story_id: null,
        platform,
        prompt_type: 'phase_overview',
        title: phase.title,
        content: phase.content,
        execution_order: phase.phaseNumber * 1000,
        phase_number: phase.phaseNumber
      });
  }

  // Save story prompts
  for (const story of prompts.storyPrompts) {
    await supabase
      .from('generated_prompts')
      .insert({
        project_id: projectId,
        user_story_id: story.id,
        platform,
        prompt_type: 'story',
        title: story.title,
        content: story.content,
        execution_order: story.executionOrder
      });
  }

  // Save transition prompts
  for (const transition of prompts.transitionPrompts) {
    await supabase
      .from('generated_prompts')
      .insert({
        project_id: projectId,
        user_story_id: null,
        platform,
        prompt_type: 'transition',
        title: transition.title,
        content: transition.content,
        execution_order: transition.executionOrder
      });
  }

  // Save troubleshooting guide
  if (prompts.troubleshootingGuide) {
    await supabase
      .from('troubleshooting_guides')
      .insert({
        project_id: projectId,
        platform,
        content: prompts.troubleshootingGuide.content,
        sections: prompts.troubleshootingGuide.sections
      });
  }
}
