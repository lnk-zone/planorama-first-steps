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
    console.log('Generating prompts for project:', projectId, 'platform:', platform);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Gather project data with proper user story fetching
    const projectData = await gatherProjectDataWithOrder(supabase, projectId);
    console.log('Project data gathered:', {
      projectTitle: projectData.project?.title,
      featuresCount: projectData.features?.length || 0,
      userStoriesCount: projectData.userStories?.length || 0,
      executionPlan: projectData.executionPlan
    });
    
    // Generate prompts
    const prompts = await generateUserStoryPrompts(projectData, platform);
    console.log('Generated prompts:', {
      phaseOverviews: prompts.phaseOverviews.length,
      storyPrompts: prompts.storyPrompts.length,
      transitionPrompts: prompts.transitionPrompts.length,
      hasTroubleshootingGuide: !!prompts.troubleshootingGuide
    });
    
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
  console.log('Fetching data for project:', projectId);

  // Fetch project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (projectError) {
    console.error('Error fetching project:', projectError);
    throw new Error(`Failed to fetch project: ${projectError.message}`);
  }

  // Fetch features for this project
  const { data: features, error: featuresError } = await supabase
    .from('features')
    .select('*')
    .eq('project_id', projectId)
    .order('execution_order');

  if (featuresError) {
    console.error('Error fetching features:', featuresError);
    throw new Error(`Failed to fetch features: ${featuresError.message}`);
  }

  console.log('Features fetched:', features?.length || 0);

  // Fetch user stories that belong to these features
  let userStories = [];
  if (features && features.length > 0) {
    const featureIds = features.map(f => f.id);
    const { data: storiesData, error: storiesError } = await supabase
      .from('user_stories')
      .select('*')
      .in('feature_id', featureIds)
      .order('execution_order');

    if (storiesError) {
      console.error('Error fetching user stories:', storiesError);
      throw new Error(`Failed to fetch user stories: ${storiesError.message}`);
    }

    userStories = storiesData || [];
  }

  console.log('User stories fetched:', userStories.length);

  // Fetch execution plan
  const { data: executionPlan, error: executionPlanError } = await supabase
    .from('execution_plans')
    .select('*')
    .eq('project_id', projectId)
    .single();

  if (executionPlanError && executionPlanError.code !== 'PGRST116') {
    console.error('Error fetching execution plan:', executionPlanError);
  }

  return {
    project,
    features: features || [],
    userStories: userStories || [],
    executionPlan: executionPlan || { phases: [], total_stories: userStories.length, estimated_total_hours: 0 }
  };
}

async function generateUserStoryPrompts(projectData: any, platform: string) {
  const userStories = (projectData.userStories || []).sort((a: any, b: any) => (a.execution_order || 999) - (b.execution_order || 999));
  const phases = projectData.executionPlan?.phases || [];
  
  console.log('Generating prompts for', userStories.length, 'user stories and', phases.length, 'phases');
  
  const prompts: any = {
    phaseOverviews: [],
    storyPrompts: [],
    transitionPrompts: [],
    troubleshootingGuide: null
  };

  // Create a map of story titles to phase numbers for easier lookup
  const storyToPhaseMap = new Map();
  phases.forEach((phase: any, index: number) => {
    const phaseNumber = index + 1;
    phase.stories?.forEach((storyTitle: string) => {
      storyToPhaseMap.set(storyTitle.toLowerCase().trim(), phaseNumber);
    });
  });

  // Generate phase overview prompts with proper story mapping
  if (phases.length > 0) {
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      const phaseStories = getStoriesForPhaseByTitle(userStories, phase);
      console.log(`Phase ${i + 1} mapped stories:`, phaseStories.length, 'out of', phase.stories?.length || 0, 'expected');
      
      const phaseOverview = generatePhaseOverviewPrompt(phase, phaseStories, projectData, platform, i + 1);
      prompts.phaseOverviews.push(phaseOverview);
    }
  } else if (userStories.length > 0) {
    // Create a single phase if no execution plan exists
    const singlePhase = {
      number: 1,
      name: 'Development Phase',
      description: 'Complete all user stories for this project',
      stories: userStories.map((story: any) => story.title)
    };
    const phaseOverview = generatePhaseOverviewPrompt(singlePhase, userStories, projectData, platform, 1);
    prompts.phaseOverviews.push(phaseOverview);
  }

  // Generate individual story prompts for ALL user stories
  for (let i = 0; i < userStories.length; i++) {
    const story = userStories[i];
    const previousStories = userStories.slice(0, i);
    const nextStory = userStories[i + 1];
    
    // Determine which phase this story belongs to
    const storyPhase = storyToPhaseMap.get(story.title.toLowerCase().trim()) || 1;
    
    const storyPrompt = generateStoryPrompt(story, previousStories, nextStory, projectData, platform, storyPhase);
    prompts.storyPrompts.push(storyPrompt);

    // Generate transition prompt to next story
    if (nextStory) {
      const nextStoryPhase = storyToPhaseMap.get(nextStory.title.toLowerCase().trim()) || 1;
      const transitionPrompt = generateTransitionPrompt(story, nextStory, platform, storyPhase);
      prompts.transitionPrompts.push(transitionPrompt);
    }
  }

  console.log('Generated individual story prompts:', prompts.storyPrompts.length);

  // Generate comprehensive troubleshooting guide
  if (openAIApiKey) {
    try {
      prompts.troubleshootingGuide = await generateTroubleshootingGuide(projectData, platform);
    } catch (error) {
      console.error('Error generating troubleshooting guide:', error);
      // Continue without troubleshooting guide if AI generation fails
    }
  }

  return prompts;
}

function getStoriesForPhaseByTitle(userStories: any[], phase: any) {
  // Map phase story titles to actual user story objects
  const phaseStoryTitles = phase.stories || [];
  const mappedStories = [];
  
  for (const storyTitle of phaseStoryTitles) {
    // Find matching user story by title (with fuzzy matching)
    const matchingStory = userStories.find((story: any) => {
      // Direct match
      if (story.title === storyTitle) return true;
      
      // Clean and compare (remove extra spaces, case insensitive)
      const cleanStoryTitle = story.title.toLowerCase().trim();
      const cleanPhaseTitle = storyTitle.toLowerCase().trim();
      
      return cleanStoryTitle === cleanPhaseTitle;
    });
    
    if (matchingStory) {
      mappedStories.push(matchingStory);
    } else {
      console.warn(`Could not find user story for phase title: "${storyTitle}"`);
    }
  }
  
  return mappedStories;
}

function generatePhaseOverviewPrompt(phase: any, phaseStories: any[], projectData: any, platform: string, phaseNumber: number) {
  const estimatedHours = phaseStories.reduce((sum, story) => sum + (story.estimated_hours || 4), 0);
  
  return {
    id: `phase-${phaseNumber}`,
    title: `Phase ${phaseNumber} Overview: ${phase.name || 'Development Phase'}`,
    content: buildPhaseOverviewContent(phase, phaseStories, projectData, platform, estimatedHours),
    phaseNumber: phaseNumber,
    platform
  };
}

function buildPhaseOverviewContent(phase: any, phaseStories: any[], projectData: any, platform: string, estimatedHours: number): string {
  const storyList = phaseStories.length > 0 
    ? phaseStories.map((story: any, i: number) => `${i + 1}. **${story.title}** - ${story.description || 'Complete this user story'}`).join('\n')
    : 'No user stories mapped to this phase';

  return `
# PHASE ${phase.number || 1} OVERVIEW: ${phase.name || 'Development Phase'}

## 🎯 PHASE OBJECTIVES
${phase.description || 'Complete the user stories in this development phase'}

## 📋 USER STORIES IN THIS PHASE
${storyList}

## 🔧 PLATFORM APPROACH
${getPlatformApproach(platform)}

## ⏱️ ESTIMATED TIME
**Total Phase Time:** ${estimatedHours} AI builder hours
**Stories Count:** ${phaseStories.length} user stories

## 🚀 GETTING STARTED
1. Review all user stories in this phase below
2. Set up your development environment if not already done
3. Start with the first story in execution order
4. Test each feature thoroughly before moving to the next
5. Mark stories as complete as you finish them

## 📈 SUCCESS CRITERIA
- All user stories in this phase are fully functional
- UI is responsive and works on mobile and desktop
- Code is clean and well-documented
- No console errors or warnings
- All acceptance criteria are met for each story

## 🔄 WORKFLOW
1. **Read the story prompt** - Understand requirements and acceptance criteria
2. **Plan your approach** - Break down the story into smaller tasks
3. **Implement incrementally** - Build and test as you go
4. **Verify completion** - Check all acceptance criteria
5. **Mark as done** - Use the completion tracking
6. **Move to next story** - Follow the execution order

Ready to begin this phase! Start with the first user story below.
  `.trim();
}

function generateStoryPrompt(story: any, previousStories: any[], nextStory: any, projectData: any, platform: string, phaseNumber: number = 1) {
  return {
    id: story.id,
    title: `Story ${story.execution_order || 1}: ${story.title}`,
    content: buildStoryPromptContent(story, previousStories, nextStory, projectData, platform),
    executionOrder: story.execution_order || 1,
    platform,
    phaseNumber,
    dependencies: story.dependencies || [],
    estimatedTime: story.estimated_hours || 4,
    acceptanceCriteria: story.acceptance_criteria || []
  };
}

function buildStoryPromptContent(story: any, previousStories: any[], nextStory: any, projectData: any, platform: string): string {
  const previousStoriesList = previousStories.length > 0 
    ? previousStories.map((s: any, i: number) => `${i + 1}. ${s.title} ✅`).join('\n')
    : 'This is the first story in your project';

  const dependenciesList = story.dependencies?.length > 0 
    ? story.dependencies.map((dep: any) => 
        `- ${dep.type === 'must_do_first' ? 'REQUIRES' : 'RELATED TO'}: "${dep.targetStoryTitle}" - ${dep.reason}`
      ).join('\n')
    : '';

  const acceptanceCriteria = story.acceptance_criteria?.length > 0 
    ? story.acceptance_criteria.map((criteria: string, i: number) => `${i + 1}. ${criteria}`).join('\n')
    : '1. Feature works as described\n2. UI is responsive and user-friendly\n3. No console errors or warnings';

  const acceptanceCriteriaChecklist = story.acceptance_criteria?.length > 0 
    ? story.acceptance_criteria.map((criteria: string) => `✅ ${criteria}`).join('\n')
    : '✅ Feature works as described\n✅ UI is responsive and user-friendly\n✅ No console errors or warnings\n✅ Code is clean and well-organized';

  const testingSteps = story.acceptance_criteria?.length > 0 
    ? story.acceptance_criteria.map((criteria: string, i: number) => `${i + 1}. Test: ${criteria}`).join('\n')
    : '1. Test core functionality\n2. Test responsive design\n3. Test error handling';

  return `
# STORY ${story.execution_order || 1}: ${story.title}

## 📋 CONTEXT
We are building **${projectData.project?.title || 'this application'}**: ${projectData.project?.description || 'A comprehensive web application'}

${previousStories.length > 0 ? `
**WHAT WE'VE BUILT SO FAR:**
${previousStoriesList}
` : '**STARTING POINT:** This is your first user story - time to begin building!'}

${dependenciesList ? `
**DEPENDENCIES:**
${dependenciesList}
` : ''}

**CURRENT FOCUS:** ${story.description || 'Implement this user story functionality'}

## 🎯 TASK
**${story.title}**

**DESCRIPTION:** ${story.description || 'Complete this user story according to the acceptance criteria below'}

${getPlatformApproach(platform)}

## 📝 REQUIREMENTS

**FUNCTIONAL REQUIREMENTS:**
${acceptanceCriteria}

**TECHNICAL REQUIREMENTS:**
${getTechnicalRequirements(platform)}

**QUALITY REQUIREMENTS:**
- Code should be readable and well-commented
- UI should be intuitive and user-friendly
- Functionality should work as expected
- No console errors or warnings
- Follow established project patterns

## ✅ ACCEPTANCE CRITERIA

**DEFINITION OF DONE:**
${acceptanceCriteriaChecklist}

**TESTING CHECKLIST:**
□ Manual testing completed
□ Responsive design verified (mobile & desktop)
□ Error handling tested
□ Integration with existing features verified
□ All acceptance criteria validated

## 🔧 IMPLEMENTATION GUIDANCE

**STEP-BY-STEP APPROACH:**
${getImplementationSteps(story, platform)}

**BEST PRACTICES:**
- Start with the simplest implementation that works
- Test each piece as you build it
- Add error handling and loading states
- Keep components focused and reusable
- Follow the existing code structure and patterns

## 🧪 TESTING & VALIDATION

**MANUAL TESTING STEPS:**
${testingSteps}

**VERIFICATION CHECKLIST:**
□ Feature works in desktop browser
□ Feature works on mobile devices
□ Error states are handled gracefully
□ Loading states are shown when appropriate
□ Data persists correctly (if applicable)
□ Integration with other features works
□ No broken existing functionality

## ➡️ NEXT STEPS

**COMPLETION CHECKLIST:**
□ All acceptance criteria met
□ Manual testing completed
□ Code is clean and commented
□ No console errors or warnings
□ Story marked as complete in tracker

${nextStory ? `
**NEXT STORY:** Story ${nextStory.execution_order || 'Next'}
"${nextStory.title}"
Preview: ${nextStory.description || 'Continue with the next user story'}
` : `
🎉 **CONGRATULATIONS!**
You've completed all user stories for this project!
Time to test the complete application end-to-end and deploy.
`}

${getPlatformSpecificFooter(platform)}
  `.trim();
}

function generateTransitionPrompt(story: any, nextStory: any, platform: string, phaseNumber: number = 1) {
  return {
    id: `transition-${story.id}-${nextStory.id}`,
    title: `Transition: ${story.title} → ${nextStory.title}`,
    content: `
# 🔄 TRANSITION CHECKPOINT

## ✅ JUST COMPLETED
**Story ${story.execution_order || 'Previous'}:** ${story.title}

**Verify that:**
□ All acceptance criteria are met
□ Feature is fully tested
□ No console errors or warnings
□ Code is clean and committed/saved
□ Story is marked as complete

## ➡️ NEXT UP
**Story ${nextStory.execution_order || 'Next'}:** ${nextStory.title}

**Before starting:**
□ Take a short break if needed
□ Review the next story requirements carefully
□ Ensure your development environment is ready
□ Save/commit your current progress

**Preview:** ${nextStory.description || 'Ready to tackle the next user story'}

Ready to continue building! 🚀
    `.trim(),
    executionOrder: Math.floor((story.execution_order || 0) * 1000) + 500, // Use integer for transition order
    platform,
    phaseNumber
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
  const featuresList = projectData.features?.map((f: any) => f.title).join(', ') || 'Various features';
  
  return `
Create a comprehensive troubleshooting guide for this project:

PROJECT: ${projectData.project?.title || 'Web Application'}
PLATFORM: ${platform}
FEATURES: ${featuresList}
USER STORIES: ${projectData.userStories?.length || 0} total stories

Generate a practical troubleshooting guide with these sections:

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
1. Identify the problem clearly
2. Check browser console for errors
3. Verify requirements and acceptance criteria
4. Test with minimal/simple data first
5. Check integrations with other components
6. Review recent changes that might have caused issues

### Tools and Techniques
- Browser Developer Tools (F12)
- Console logging for debugging
- Network tab for API issues
- React Developer Tools (if applicable)
- Component inspection

## 🆘 WHEN TO ASK FOR HELP

### Before Asking for Help
- Try the solutions in this guide first
- Check the browser console for specific error messages
- Test with simplified data or isolated components
- Review the story requirements and acceptance criteria
- Document what you've already tried

### How to Ask for Help Effectively
- Describe clearly what you're trying to achieve
- Explain step-by-step what you've tried
- Include specific error messages (copy & paste)
- Share relevant code snippets if needed
- Mention which user story you're working on

### Where to Get Help
- Platform documentation and community
- Stack Overflow for technical questions
- GitHub issues for platform-specific problems
- Discord/Slack communities for real-time help

## 🔄 ROLLBACK STRATEGIES

### When Things Go Wrong
1. Don't panic - save your current progress first
2. Identify the last known working state
3. Consider reverting to that point if necessary
4. Try a different, simpler approach
5. Break the problem into smaller pieces
6. Ask for guidance on alternative approaches

### Backup Best Practices
- Save/commit changes frequently
- Test thoroughly before moving to next story
- Keep notes of what works and what doesn't
- Document successful patterns for reuse

Make this guide immediately actionable for non-technical users building their app story by story!
  `.trim();
}

function getPlatformApproach(platform: string): string {
  const approaches: { [key: string]: string } = {
    lovable: `
**LOVABLE APPROACH:**
- Use React with TypeScript and Tailwind CSS
- Implement with shadcn-ui components where appropriate
- Use Supabase for any backend functionality
- Follow React best practices and hooks patterns`,
    bolt: `
**BOLT APPROACH:**
- Create clean, modern web application code
- Use best practices for file organization
- Implement responsive design principles
- Focus on user experience and performance`,
    cursor: `
**CURSOR APPROACH:**
- Write clean, well-documented code
- Use appropriate design patterns
- Implement proper error handling
- Follow coding best practices`,
    claude: `
**CLAUDE APPROACH:**
- Focus on clear, maintainable code structure
- Implement comprehensive error handling
- Use modern development patterns
- Prioritize code readability and documentation`,
    replit: `
**REPLIT APPROACH:**
- Build with collaborative development in mind
- Use environment-specific configurations
- Implement clean separation of concerns
- Focus on rapid prototyping and iteration`,
    windsurf: `
**WINDSURF APPROACH:**
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
   - Create necessary interfaces/types (if using TypeScript)
   - Implement basic component structure

3. **Implement Core Functionality**
   - Add the main business logic
   - Implement data fetching/saving if needed
   - Handle user interactions and events

4. **Style and Polish**
   - Apply appropriate styling (Tailwind/CSS)
   - Ensure responsive design works properly
   - Add loading and error states

5. **Test and Validate**
   - Test all acceptance criteria thoroughly
   - Check for edge cases and error scenarios
   - Verify integration with existing features`;
}

function getPlatformSpecificFooter(platform: string): string {
  const footers: { [key: string]: string } = {
    lovable: `
## 💡 LOVABLE-SPECIFIC TIPS
- Use the built-in components from shadcn-ui when possible
- Leverage Supabase for data persistence and real-time features
- Take advantage of TypeScript for better development experience
- Use Tailwind classes for consistent styling
- Test in the preview pane as you build`,
    bolt: `
## 💡 BOLT-SPECIFIC TIPS
- Focus on clean, maintainable code structure
- Use environment variables for configuration
- Implement proper error handling throughout
- Test across different browsers and devices
- Optimize for performance and loading speed`,
    cursor: `
## 💡 CURSOR-SPECIFIC TIPS
- Leverage AI assistance for code generation
- Use proper code organization patterns
- Implement comprehensive error handling
- Document your code for future reference
- Use version control for tracking changes`
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
  console.log('Saving generated prompts to database...');

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
    const { error } = await supabase
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

    if (error) {
      console.error('Error saving phase overview:', error);
    }
  }

  // Save story prompts with phase_number
  for (const story of prompts.storyPrompts) {
    const { error } = await supabase
      .from('generated_prompts')
      .insert({
        project_id: projectId,
        user_story_id: story.id,
        platform,
        prompt_type: 'story',
        title: story.title,
        content: story.content,
        execution_order: story.executionOrder,
        phase_number: story.phaseNumber
      });

    if (error) {
      console.error('Error saving story prompt:', error);
    }
  }

  // Save transition prompts with phase_number
  for (const transition of prompts.transitionPrompts) {
    const { error } = await supabase
      .from('generated_prompts')
      .insert({
        project_id: projectId,
        user_story_id: null,
        platform,
        prompt_type: 'transition',
        title: transition.title,
        content: transition.content,
        execution_order: transition.executionOrder,
        phase_number: transition.phaseNumber
      });

    if (error) {
      console.error('Error saving transition prompt:', error);
    }
  }

  // Save troubleshooting guide
  if (prompts.troubleshootingGuide) {
    const { error } = await supabase
      .from('troubleshooting_guides')
      .insert({
        project_id: projectId,
        platform,
        content: prompts.troubleshootingGuide.content,
        sections: prompts.troubleshootingGuide.sections
      });

    if (error) {
      console.error('Error saving troubleshooting guide:', error);
    }
  }

  console.log('Successfully saved generated prompts to database');
}
