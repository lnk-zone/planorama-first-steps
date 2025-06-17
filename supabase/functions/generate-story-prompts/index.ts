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
    console.log('Generating enhanced prompts for project:', projectId, 'platform:', platform);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Gather project data with proper user story fetching
    const projectData = await gatherProjectDataWithOrder(supabase, projectId);
    console.log('Project data gathered:', {
      projectTitle: projectData.project?.title,
      featuresCount: projectData.features?.length || 0,
      userStoriesCount: projectData.userStories?.length || 0,
      phasesCount: projectData.executionPlan?.phases?.length || 0
    });
    
    // Generate enhanced prompts
    const prompts = await generateEnhancedUserStoryPrompts(projectData, platform);
    console.log('Generated enhanced prompts:', {
      phaseOverviews: prompts.phaseOverviews.length,
      storyPrompts: prompts.storyPrompts.length,
      transitionPrompts: prompts.transitionPrompts.length,
      hasTroubleshootingGuide: !!prompts.troubleshootingGuide
    });
    
    // Save to database - this will clear existing prompts first
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

async function generateEnhancedUserStoryPrompts(projectData: any, platform: string) {
  const userStories = (projectData.userStories || []).sort((a: any, b: any) => (a.execution_order || 999) - (b.execution_order || 999));
  const phases = projectData.executionPlan?.phases || [];
  
  console.log('Generating enhanced prompts for', userStories.length, 'user stories and', phases.length, 'phases');
  
  const prompts: any = {
    phaseOverviews: [],
    storyPrompts: [],
    transitionPrompts: [],
    troubleshootingGuide: null
  };

  // Create phase assignment map - improved logic
  const storyToPhaseMap = new Map();
  
  console.log('Creating phase assignment mapping...');
  
  if (phases.length > 0) {
    phases.forEach((phase: any, index: number) => {
      const phaseNumber = index + 1;
      console.log(`Processing phase ${phaseNumber}: "${phase.name}" with ${phase.stories?.length || 0} stories`);
      
      if (phase.stories && Array.isArray(phase.stories)) {
        phase.stories.forEach((storyTitle: string) => {
          // Store the phase number for each story title
          storyToPhaseMap.set(storyTitle.toLowerCase().trim(), phaseNumber);
          console.log(`Mapped story "${storyTitle}" to phase ${phaseNumber}`);
        });
      }
    });
  }

  console.log('Phase mapping complete. Total mappings:', storyToPhaseMap.size);

  // Generate enhanced phase overview prompts
  if (phases.length > 0) {
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      const phaseStories = getStoriesForPhaseByTitle(userStories, phase);
      console.log(`Phase ${i + 1} "${phase.name}" mapped stories:`, phaseStories.length, 'out of', phase.stories?.length || 0, 'expected');
      
      const phaseOverview = generateEnhancedPhaseOverviewPrompt(phase, phaseStories, projectData, platform, i + 1);
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
    const phaseOverview = generateEnhancedPhaseOverviewPrompt(singlePhase, userStories, projectData, platform, 1);
    prompts.phaseOverviews.push(phaseOverview);
  }

  // Generate enhanced individual story prompts with correct phase assignment
  for (let i = 0; i < userStories.length; i++) {
    const story = userStories[i];
    const previousStories = userStories.slice(0, i);
    const nextStory = userStories[i + 1];
    
    // Determine phase using improved logic
    let storyPhase = 1; // Default to phase 1
    
    console.log(`\n--- Assigning phase for story: "${story.title}" ---`);
    
    // Try exact title match first
    const storyTitleLower = story.title.toLowerCase().trim();
    if (storyToPhaseMap.has(storyTitleLower)) {
      storyPhase = storyToPhaseMap.get(storyTitleLower);
      console.log(`✓ Direct match: "${story.title}" -> Phase ${storyPhase}`);
    } else {
      // Try fuzzy matching - look for partial matches
      let bestMatch = null;
      let bestMatchPhase = 1;
      
      for (const [mappedTitle, phaseNum] of storyToPhaseMap.entries()) {
        // Check if either title contains key words from the other
        const storyWords = storyTitleLower.split(' ').filter(w => w.length > 3);
        const mappedWords = mappedTitle.split(' ').filter(w => w.length > 3);
        
        const commonWords = storyWords.filter(word => mappedWords.some(mw => mw.includes(word) || word.includes(mw)));
        
        if (commonWords.length > 0) {
          bestMatch = mappedTitle;
          bestMatchPhase = phaseNum;
          console.log(`⚡ Fuzzy match: "${story.title}" matches "${mappedTitle}" -> Phase ${phaseNum} (common words: ${commonWords.join(', ')})`);
          break;
        }
      }
      
      if (bestMatch) {
        storyPhase = bestMatchPhase;
      } else {
        // Fallback: distribute by execution order if no match found
        const executionOrder = story.execution_order || i + 1;
        if (phases.length >= 3) {
          if (executionOrder <= 6) storyPhase = 1;
          else if (executionOrder <= 10) storyPhase = 2;
          else storyPhase = 3;
        } else if (phases.length >= 2) {
          if (executionOrder <= Math.ceil(userStories.length / 2)) storyPhase = 1;
          else storyPhase = 2;
        }
        console.log(`⚠ No match found, using execution order fallback: "${story.title}" -> Phase ${storyPhase} (execution_order: ${executionOrder})`);
      }
    }
    
    console.log(`Final assignment: Story "${story.title}" -> Phase ${storyPhase}`);
    
    const storyPrompt = generateEnhancedStoryPrompt(story, previousStories, nextStory, projectData, platform, storyPhase);
    prompts.storyPrompts.push(storyPrompt);

    // Generate transition prompt to next story
    if (nextStory) {
      const transitionPrompt = generateEnhancedTransitionPrompt(story, nextStory, platform, storyPhase);
      prompts.transitionPrompts.push(transitionPrompt);
    }
  }

  console.log('\n=== FINAL PHASE ASSIGNMENTS ===');
  prompts.storyPrompts.forEach((s: any) => {
    console.log(`Story: "${s.title}" -> Phase ${s.phaseNumber}`);
  });

  // Generate comprehensive troubleshooting guide
  if (openAIApiKey) {
    try {
      prompts.troubleshootingGuide = await generateEnhancedTroubleshootingGuide(projectData, platform);
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

function generateEnhancedPhaseOverviewPrompt(phase: any, phaseStories: any[], projectData: any, platform: string, phaseNumber: number) {
  const estimatedHours = phaseStories.reduce((sum, story) => sum + (story.estimated_hours || 4), 0);
  
  return {
    id: `phase-${phaseNumber}`,
    title: `Phase ${phaseNumber} Overview: ${phase.name || 'Development Phase'}`,
    content: buildEnhancedPhaseOverviewContent(phase, phaseStories, projectData, platform, estimatedHours),
    phaseNumber: phaseNumber,
    platform
  };
}

function buildEnhancedPhaseOverviewContent(phase: any, phaseStories: any[], projectData: any, platform: string, estimatedHours: number): string {
  const storyList = phaseStories.length > 0 
    ? phaseStories.map((story: any, i: number) => `${i + 1}. **${story.title}** - ${story.description || 'Complete this user story'}`).join('\n')
    : 'No user stories mapped to this phase';

  return `
# PHASE ${phase.number || 1} OVERVIEW: ${phase.name || 'Development Phase'}

## 🤖 AI BUILDER CONTEXT
You are an expert full-stack developer building **${projectData.project?.title || 'this application'}** using modern web technologies. You specialize in creating production-ready, user-friendly applications with clean code architecture.

**Tech Stack:** React with TypeScript, Tailwind CSS, shadcn/ui components, and Supabase for backend services

## 🎯 PHASE OBJECTIVES
${phase.description || 'Complete the user stories in this development phase'}

## 📋 USER STORIES IN THIS PHASE
${storyList}

## 🏗️ DEVELOPMENT APPROACH
**Best Practices to Follow:**
- Write clean, maintainable TypeScript code with proper type definitions
- Use Tailwind CSS for all styling with responsive design principles
- Implement shadcn/ui components for consistent, accessible interface elements
- Follow React best practices with hooks and proper state management
- Include comprehensive error handling and loading states
- Add proper form validation and user feedback
- Ensure accessibility standards are met (ARIA labels, keyboard navigation)
- Write modular, reusable components

**Security & Quality Standards:**
- Never expose sensitive data or API keys in frontend code
- Implement proper input validation and sanitization
- Use Supabase Row Level Security (RLS) for data protection
- Include proper error boundaries and fallback UI
- Test all user interactions and edge cases
- Ensure responsive design works on mobile and desktop

## ⏱️ ESTIMATED TIME
**Total Phase Time:** ${estimatedHours} development hours
**Stories Count:** ${phaseStories.length} user stories
**Average per Story:** ${phaseStories.length > 0 ? Math.ceil(estimatedHours / phaseStories.length) : 4} hours

## 🚀 PHASE WORKFLOW
1. **Setup & Review** - Understand existing codebase structure and dependencies
2. **Story Implementation** - Work through stories in the specified execution order
3. **Integration Testing** - Ensure new features work with existing functionality
4. **Quality Assurance** - Verify all acceptance criteria and test edge cases
5. **Code Review** - Check for best practices, security, and maintainability
6. **User Testing** - Validate user experience and accessibility

## 📈 SUCCESS CRITERIA
**Phase Completion Requirements:**
- ✅ All user stories fully functional with no console errors
- ✅ UI is responsive and works on mobile and desktop
- ✅ All forms include proper validation and error handling
- ✅ Loading states are implemented for async operations
- ✅ Code is well-organized with reusable components
- ✅ Security best practices are followed
- ✅ All acceptance criteria met for each story
- ✅ Integration with existing features works seamlessly

## 🔄 IMPLEMENTATION WORKFLOW
**For Each User Story:**
1. **Read the detailed prompt** - Understand all requirements and acceptance criteria
2. **Plan your implementation** - Break down into smaller, manageable tasks
3. **Code incrementally** - Build and test as you implement each piece
4. **Test thoroughly** - Verify all functionality and edge cases
5. **Refine and polish** - Ensure code quality and user experience
6. **Mark as complete** - Use the completion tracking system

**Ready to begin Phase ${phase.number || 1}!** Start with the first user story and work through them systematically. Each story prompt contains comprehensive implementation guidance.
  `.trim();
}

function generateEnhancedStoryPrompt(story: any, previousStories: any[], nextStory: any, projectData: any, platform: string, phaseNumber: number = 1) {
  return {
    id: story.id,
    title: `Story ${story.execution_order || 1}: ${story.title}`,
    content: buildEnhancedStoryPromptContent(story, previousStories, nextStory, projectData, platform),
    executionOrder: story.execution_order || 1,
    platform,
    phaseNumber, // CRITICAL: This must be set correctly
    dependencies: story.dependencies || [],
    estimatedTime: story.estimated_hours || 4,
    acceptanceCriteria: story.acceptance_criteria || []
  };
}

function buildEnhancedStoryPromptContent(story: any, previousStories: any[], nextStory: any, projectData: any, platform: string): string {
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
    : '1. Feature works as described with no console errors\n2. UI is responsive and accessible on mobile and desktop\n3. Proper loading states and error handling implemented\n4. Code is clean, well-organized, and follows best practices';

  const acceptanceCriteriaChecklist = story.acceptance_criteria?.length > 0 
    ? story.acceptance_criteria.map((criteria: string) => `□ ${criteria}`).join('\n')
    : '□ Feature works as described with no console errors\n□ UI is responsive and accessible on mobile and desktop\n□ Proper loading states and error handling implemented\n□ Code is clean, well-organized, and follows best practices\n□ All user interactions provide appropriate feedback\n□ Form validation (if applicable) works correctly';

  return `
# STORY ${story.execution_order || 1}: ${story.title}

## 🤖 AI BUILDER INSTRUCTIONS
You are an expert full-stack developer building **${projectData.project?.title || 'this application'}**. Create production-ready, fully functional code that follows modern web development best practices.

**Tech Stack Requirements:**
- **Frontend:** React 18+ with TypeScript, Tailwind CSS for styling, shadcn/ui components
- **Backend:** Supabase for database, authentication, and API functionality
- **Code Quality:** Clean, maintainable code with proper TypeScript types
- **UI/UX:** Responsive design, accessible components, smooth user interactions

## 📋 PROJECT CONTEXT
**Application:** ${projectData.project?.title || 'Web Application'}
**Description:** ${projectData.project?.description || 'A comprehensive web application'}

${previousStories.length > 0 ? `
**IMPLEMENTED FEATURES:**
${previousStoriesList}
` : '**STARTING POINT:** This is your first user story - time to begin building!'}

${dependenciesList ? `
**DEPENDENCIES:**
${dependenciesList}
` : ''}

## 🎯 CURRENT TASK
**User Story:** ${story.title}
**Description:** ${story.description || 'Implement this user story functionality according to the requirements below'}

## 📝 DETAILED REQUIREMENTS

### Functional Requirements
${acceptanceCriteria}

### Technical Implementation Standards
- **Code Quality:** Write clean, readable TypeScript with proper type definitions
- **Component Structure:** Create focused, reusable React components with clear props interfaces
- **Styling:** Use Tailwind CSS utility classes for all styling with responsive design
- **UI Components:** Utilize shadcn/ui components for consistent, accessible interface elements
- **State Management:** Use React hooks (useState, useEffect, etc.) appropriately
- **Error Handling:** Implement comprehensive error boundaries and user-friendly error messages
- **Loading States:** Show appropriate loading indicators for async operations
- **Form Validation:** Include real-time validation with clear error messages (if forms are involved)
- **Data Management:** Use Supabase client for all database operations with proper error handling

### Security & Best Practices
- **Input Validation:** Sanitize and validate all user inputs
- **Authentication:** Integrate with Supabase Auth if user management is required
- **Data Security:** Use Supabase Row Level Security (RLS) policies for data protection
- **API Security:** Never expose sensitive keys or tokens in frontend code
- **Accessibility:** Include proper ARIA labels, keyboard navigation, and screen reader support
- **Performance:** Optimize for fast loading and smooth interactions

### UI/UX Requirements
- **Responsive Design:** Ensure functionality works perfectly on mobile, tablet, and desktop
- **Visual Consistency:** Follow established design patterns and color schemes
- **User Feedback:** Provide clear feedback for all user actions (success, error, loading states)
- **Intuitive Interface:** Design for ease of use with clear navigation and labels
- **Accessibility:** Meet WCAG 2.1 AA standards for accessibility

## ✅ ACCEPTANCE CRITERIA CHECKLIST

**Definition of Done:**
${acceptanceCriteriaChecklist}

**Quality Assurance Checklist:**
□ No console errors or warnings in browser developer tools
□ All TypeScript types are properly defined with no 'any' types
□ Component props have proper TypeScript interfaces
□ Responsive design tested on mobile, tablet, and desktop viewports
□ All interactive elements are accessible via keyboard navigation
□ Loading states are implemented for all async operations
□ Error handling provides user-friendly messages
□ Form validation (if applicable) provides real-time feedback
□ All Supabase operations include proper error handling
□ Code is well-commented and follows consistent formatting

## 🔧 IMPLEMENTATION APPROACH

### Step-by-Step Development Process
1. **Plan Component Architecture**
   - Identify the main components needed
   - Design the data flow and state management
   - Plan the file structure and component organization

2. **Implement Core Functionality**
   - Add the main business logic
   - Implement data fetching/saving if needed
   - Handle user interactions and events

3. **Build User Interface**
   - Apply appropriate styling (Tailwind/CSS)
   - Ensure responsive design works properly
   - Add loading and error states

4. **Add Interactivity & Validation**
   - Implement form handling with validation (if applicable)
   - Add loading states and error handling
   - Include user feedback for all actions

5. **Test & Refine**
   - Test all functionality thoroughly
   - Check for edge cases and error scenarios
   - Verify integration with existing features

### Code Organization Guidelines
- Create separate files for different components
- Use descriptive names for components, functions, and variables
- Group related functionality together
- Keep components focused on a single responsibility
- Extract reusable logic into custom hooks when appropriate

## 🧪 TESTING & VALIDATION

### Manual Testing Steps
1. **Functionality Testing**
   - Test all features work as expected
   - Verify edge cases and error scenarios
   - Check data persistence (if applicable)

2. **Responsive Design Testing**
   - Test on mobile devices (320px+ width)
   - Test on tablets (768px+ width)
   - Test on desktop screens (1024px+ width)

3. **Accessibility Testing**
   - Navigate using only keyboard (Tab, Enter, Space, Arrow keys)
   - Test with screen reader software
   - Verify color contrast meets accessibility standards

4. **Performance Testing**
   - Check page load times
   - Verify smooth animations and transitions
   - Test with slow network connections

### Browser Developer Tools Verification
□ No errors in Console tab
□ No TypeScript errors in editor
□ Network tab shows successful API calls
□ Elements tab shows proper HTML structure
□ Lighthouse score shows good performance and accessibility

## ➡️ COMPLETION & NEXT STEPS

**Before Marking Complete:**
□ All acceptance criteria verified and working
□ Code is clean, commented, and follows best practices
□ Manual testing completed successfully
□ No console errors or TypeScript warnings
□ Responsive design confirmed on all screen sizes
□ Accessibility requirements met

${nextStory ? `
**Next Story Preview:** Story ${nextStory.execution_order || 'Next'}
"${nextStory.title}"
${nextStory.description ? `Description: ${nextStory.description}` : ''}
` : `
🎉 **CONGRATULATIONS!**
You've completed all user stories for this project!
Time to perform end-to-end testing and prepare for deployment.
`}

## 📚 ADDITIONAL RESOURCES

**Key Documentation:**
- [React TypeScript Best Practices](https://react-typescript-cheatsheet.netlify.app/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/docs)
- [Supabase JavaScript Guide](https://supabase.com/docs/reference/javascript)

**Development Tools:**
- Use browser developer tools (F12) for debugging
- Leverage TypeScript compiler for type checking
- Use React Developer Tools extension for component debugging
- Test accessibility with axe-core browser extension

---

**🚀 Ready to implement this story!** Follow the step-by-step approach above and create production-ready code that meets all requirements. Focus on quality, accessibility, and user experience.
  `.trim();
}

function generateEnhancedTransitionPrompt(story: any, nextStory: any, platform: string, phaseNumber: number = 1) {
  return {
    id: `transition-${story.id}-${nextStory.id}`,
    title: `Transition: ${story.title} → ${nextStory.title}`,
    content: `
# 🔄 DEVELOPMENT CHECKPOINT

## ✅ STORY COMPLETED
**Just Finished:** Story ${story.execution_order || 'Previous'} - ${story.title}

### Final Verification Checklist
Before proceeding to the next story, ensure you have completed:

□ **Functionality:** All features work as expected with no bugs
□ **Code Quality:** Clean, well-organized TypeScript code with proper types
□ **UI/UX:** Responsive design works on mobile, tablet, and desktop
□ **Testing:** Manual testing completed for all user scenarios
□ **Error Handling:** Proper error states and user feedback implemented
□ **Accessibility:** Keyboard navigation and screen reader compatibility verified
□ **Performance:** No console errors or warnings in browser developer tools
□ **Integration:** New features work seamlessly with existing functionality
□ **Documentation:** Code is properly commented and self-documenting

### Success Indicators
✅ **No console errors or TypeScript warnings**
✅ **All acceptance criteria met and verified**
✅ **Responsive design tested across different screen sizes**
✅ **User interactions provide appropriate feedback**
✅ **Code follows established patterns and best practices**

## ➡️ NEXT STORY PREPARATION
**Coming Up:** Story ${nextStory.execution_order || 'Next'} - ${nextStory.title}

### Before Starting the Next Story
□ **Save Progress:** Ensure all changes are saved/committed
□ **Clear Console:** Start with a clean browser console
□ **Review Context:** Understand how the next story builds on current progress
□ **Environment Check:** Verify development environment is ready
□ **Take a Break:** Consider a short break if needed for mental clarity

### Preview of Next Story
**Title:** ${nextStory.title}
**Expected Work:** ${nextStory.description || 'Continue building the application with the next user story'}

This story will build upon the foundation you've just created. Review the detailed prompt for comprehensive implementation guidance.

---

**🚀 Excellent Progress!** You've successfully completed another story. The application is growing stronger with each implementation. Ready to continue building!
    `.trim(),
    executionOrder: Math.floor((story.execution_order || 0) * 1000) + 500,
    platform,
    phaseNumber
  };
}

async function generateEnhancedTroubleshootingGuide(projectData: any, platform: string) {
  const prompt = buildEnhancedTroubleshootingPrompt(projectData, platform);
  
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
          content: 'You are an expert developer who helps users troubleshoot issues with AI app builders. Create comprehensive, practical troubleshooting guidance that is immediately actionable.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 8000,
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

function buildEnhancedTroubleshootingPrompt(projectData: any, platform: string): string {
  const featuresList = projectData.features?.map((f: any) => f.title).join(', ') || 'Various features';
  
  return `
Create a comprehensive troubleshooting guide for AI-assisted development of this project:

PROJECT: ${projectData.project?.title || 'Web Application'}
FEATURES: ${featuresList}
USER STORIES: ${projectData.userStories?.length || 0} total stories
TECH STACK: React, TypeScript, Tailwind CSS, shadcn/ui, Supabase

Generate a practical troubleshooting guide with these sections:

## 🔧 COMMON DEVELOPMENT ISSUES

### Code Generation Problems
1. **AI Builder Not Following Instructions**
   - Symptoms: Generated code doesn't match requirements
   - Root Causes: Unclear prompts, missing context, ambiguous requirements
   - Solutions: Be more specific, provide examples, break down complex requests

2. **TypeScript Errors and Type Issues**
   - Symptoms: Red squiggly lines, compilation errors, 'any' types everywhere
   - Root Causes: Missing type definitions, incorrect imports, incompatible versions
   - Solutions: Step-by-step type debugging, proper interface definitions

3. **Component Integration Failures**
   - Symptoms: Components don't work together, props errors, rendering issues
   - Root Causes: Mismatched interfaces, incorrect prop passing, state management problems
   - Solutions: Component architecture best practices, debugging techniques

### UI/UX Implementation Issues
1. **Styling and Layout Problems**
   - Symptoms: Elements not positioned correctly, responsive design broken
   - Root Causes: Incorrect Tailwind classes, CSS conflicts, missing responsive prefixes
   - Solutions: Tailwind debugging techniques, responsive design patterns

2. **shadcn/ui Component Issues**
   - Symptoms: Components not rendering, styling conflicts, accessibility problems
   - Root Causes: Incorrect installation, version conflicts, improper usage
   - Solutions: Component troubleshooting, proper implementation patterns

### Data Management Problems
1. **Supabase Integration Issues**
   - Symptoms: Database calls failing, authentication problems, RLS policy errors
   - Root Causes: Incorrect configuration, missing permissions, network issues
   - Solutions: Database debugging, authentication troubleshooting, policy testing

2. **State Management Confusion**
   - Symptoms: UI not updating, stale data, race conditions
   - Root Causes: Incorrect hook usage, missing dependencies, async handling
   - Solutions: React hooks best practices, state debugging techniques

## 🛠️ DEBUGGING PROCESS

### Step-by-Step Debugging Methodology
1. **Identify the Problem Clearly**
   - What exactly is not working?
   - When does the problem occur?
   - What was the expected behavior?

2. **Check Browser Developer Tools**
   - Console tab: Look for JavaScript errors and warnings
   - Network tab: Check API calls and responses
   - Elements tab: Inspect HTML structure and styling
   - React DevTools: Examine component state and props

3. **Analyze the Code**
   - Review recent changes that might have caused the issue
   - Check TypeScript compiler output
   - Verify import statements and file paths
   - Examine component props and state management

4. **Test Systematically**
   - Isolate the problem to a specific component or function
   - Test with minimal examples
   - Use console.log statements to trace execution
   - Test different data inputs and edge cases

5. **Implement and Verify Fix**
   - Make targeted changes based on findings
   - Test the fix thoroughly
   - Ensure no new issues were introduced
   - Document the solution for future reference

### Essential Debugging Tools
- **Browser Developer Tools (F12)**
  - Console: Error messages and custom logging
  - Network: API call inspection
  - Elements: DOM structure and CSS debugging
  - Application: Local storage and session data

- **React Developer Tools**
  - Component tree inspection
  - Props and state examination
  - Performance profiling
  - Hook debugging

- **TypeScript Compiler**
  - Type checking and error reporting
  - Unused code detection
  - Import/export validation

## 🚨 SPECIFIC ISSUE SOLUTIONS

### TypeScript & React Issues
**Problem:** "Property 'X' does not exist on type 'Y'"
**Solution:** Define proper interfaces, check import statements, verify prop types

**Problem:** "Hook called conditionally"
**Solution:** Ensure hooks are always called in the same order, move conditional logic inside hooks

**Problem:** "Cannot read property of undefined"
**Solution:** Add null/undefined checks, use optional chaining, provide default values

### Styling & UI Issues
**Problem:** Styles not applying correctly
**Solution:** Check Tailwind class names, verify CSS specificity, inspect element styles

**Problem:** Components not responsive
**Solution:** Use Tailwind responsive prefixes (sm:, md:, lg:, xl:), test on different screen sizes

**Problem:** shadcn/ui components not working
**Solution:** Verify installation, check component documentation, ensure proper imports

### Supabase & Data Issues
**Problem:** Database queries failing
**Solution:** Check RLS policies, verify table permissions, test queries in Supabase dashboard

**Problem:** Authentication not working
**Solution:** Verify Auth configuration, check redirect URLs, test login flow

**Problem:** Real-time updates not working
**Solution:** Check subscription setup, verify table permissions, test connection

## 🔍 ADVANCED TROUBLESHOOTING

### Performance Issues
- Use React Profiler to identify slow components
- Optimize re-renders with useMemo and useCallback
- Implement code splitting for large applications
- Monitor bundle size and loading times

### Accessibility Problems
- Use axe-core browser extension for automated testing
- Test keyboard navigation thoroughly
- Verify screen reader compatibility
- Check color contrast ratios

### Mobile-Specific Issues
- Test on actual devices, not just browser simulation
- Check touch interactions and gestures
- Verify viewport meta tag configuration
- Test offline functionality if applicable

## 🆘 WHEN TO ASK FOR HELP

### Before Seeking Help
□ Tried all relevant solutions in this guide
□ Checked official documentation
□ Searched for similar issues online
□ Isolated the problem to specific code/components
□ Prepared clear error messages and code examples

### How to Ask for Help Effectively
1. **Describe the Problem Clearly**
   - What you're trying to achieve
   - What actually happens
   - Error messages (exact text)
   - Steps to reproduce

2. **Provide Context**
   - Which user story you're working on
   - Recent changes made
   - Browser and device information
   - Relevant code snippets

3. **Show What You've Tried**
   - Solutions attempted
   - Debugging steps taken
   - Research conducted
   - Partial progress made

### Where to Get Help
- **Official Documentation:** React, TypeScript, Tailwind, Supabase, shadcn/ui
- **Stack Overflow:** For specific technical questions
- **GitHub Issues:** For tool-specific problems
- **Community Discord/Slack:** For real-time assistance
- **AI Builders:** For code generation and implementation help

## 🔄 PREVENTION STRATEGIES

### Best Practices to Avoid Issues
1. **Code Organization**
   - Keep components small and focused
   - Use consistent naming conventions
   - Implement proper error boundaries
   - Write self-documenting code

2. **Testing Strategy**
   - Test incrementally as you build
   - Verify functionality before moving to next story
   - Check responsive design regularly
   - Test accessibility continuously

3. **Version Control**
   - Commit working code frequently
   - Use descriptive commit messages
   - Create branches for experimental features
   - Keep backup of working versions

Remember: Every developer encounters issues - the key is systematic debugging and continuous learning!
  `.trim();
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
  console.log('🧹 Clearing existing prompts for project/platform...');

  // CRITICAL: Clear existing prompts FIRST to ensure regeneration replaces old data
  const { error: deletePromptsError } = await supabase
    .from('generated_prompts')
    .delete()
    .eq('project_id', projectId)
    .eq('platform', platform);

  if (deletePromptsError) {
    console.error('Error clearing existing prompts:', deletePromptsError);
  } else {
    console.log('✓ Successfully cleared existing prompts');
  }

  const { error: deleteGuideError } = await supabase
    .from('troubleshooting_guides')
    .delete()
    .eq('project_id', projectId)
    .eq('platform', platform);

  if (deleteGuideError) {
    console.error('Error clearing existing troubleshooting guide:', deleteGuideError);
  } else {
    console.log('✓ Successfully cleared existing troubleshooting guide');
  }

  console.log('💾 Saving new prompts to database...');

  // Save phase overviews
  for (const phase of prompts.phaseOverviews) {
    console.log(`Saving phase overview: ${phase.title} (Phase ${phase.phaseNumber})`);
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
    } else {
      console.log(`✓ Successfully saved phase overview for Phase ${phase.phaseNumber}`);
    }
  }

  // Save story prompts with CORRECT phase_number - THIS IS THE CRITICAL FIX
  for (const story of prompts.storyPrompts) {
    console.log(`💾 Saving story: "${story.title}" with phase_number: ${story.phaseNumber}, execution_order: ${story.executionOrder}`);
    
    const insertData = {
      project_id: projectId,
      user_story_id: story.id,
      platform,
      prompt_type: 'story',
      title: story.title,
      content: story.content,
      execution_order: story.executionOrder,
      phase_number: story.phaseNumber // CRITICAL: Ensure this is set correctly
    };
    
    console.log(`Database insert data for "${story.title}":`, {
      phase_number: insertData.phase_number,
      execution_order: insertData.execution_order,
      prompt_type: insertData.prompt_type
    });

    const { error } = await supabase
      .from('generated_prompts')
      .insert(insertData);

    if (error) {
      console.error(`❌ Error saving story "${story.title}":`, error);
    } else {
      console.log(`✅ Successfully saved story "${story.title}" with phase_number: ${story.phaseNumber}`);
    }
  }

  // Save transition prompts with phase_number
  for (const transition of prompts.transitionPrompts) {
    console.log(`Saving transition prompt: ${transition.title} (Phase ${transition.phaseNumber})`);
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
    } else {
      console.log(`✓ Successfully saved transition for Phase ${transition.phaseNumber}`);
    }
  }

  // Save troubleshooting guide
  if (prompts.troubleshootingGuide) {
    console.log('Saving troubleshooting guide...');
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
    } else {
      console.log('✓ Successfully saved troubleshooting guide');
    }
  }

  console.log('🎉 Successfully saved all generated prompts to database');
  
  // Verify what was saved
  const { data: savedPrompts } = await supabase
    .from('generated_prompts')
    .select('id, title, prompt_type, phase_number, execution_order')
    .eq('project_id', projectId)
    .eq('platform', platform)
    .order('execution_order');

  console.log('✅ VERIFICATION - Saved prompts in database:');
  savedPrompts?.forEach((p: any) => {
    console.log(`  - ${p.prompt_type}: "${p.title}" | phase: ${p.phase_number} | order: ${p.execution_order}`);
  });
}
