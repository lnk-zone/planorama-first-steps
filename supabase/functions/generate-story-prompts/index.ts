
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    const { projectId, platform } = await req.json();
    console.log(`Generating story prompts for project ${projectId}, platform: ${platform}`);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch project data
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (!project) {
      throw new Error('Project not found');
    }

    // Fetch features and user stories
    const { data: features } = await supabase
      .from('features')
      .select('*')
      .eq('project_id', projectId)
      .order('execution_order');

    const { data: userStories } = await supabase
      .from('user_stories')
      .select('*')
      .in('feature_id', features?.map(f => f.id) || [])
      .order('execution_order');

    // Get structured phases from PRD metadata or generate fallback
    const { data: prd } = await supabase
      .from('prds')
      .select('metadata')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let structuredPhases: any[] = [];
    if (prd?.metadata?.implementationPhases) {
      structuredPhases = prd.metadata.implementationPhases;
      console.log('✓ Using structured phases from PRD:', structuredPhases.length, 'phases');
    } else {
      console.log('No structured phases found in PRD, generating fallback phases...');
      
      // Generate structured phases using the existing edge function
      const { data: phasesResponse, error: phasesError } = await supabase
        .functions
        .invoke('generate-implementation-phases', {
          body: { 
            projectData: {
              project,
              features: features || [],
              userStories: userStories || []
            }
          }
        });

      if (phasesError) {
        console.error('Failed to generate phases:', phasesError);
        structuredPhases = createFallbackPhases(userStories || []);
      } else {
        structuredPhases = phasesResponse?.phases || [];
        console.log('✓ Generated structured phases on-the-fly:', structuredPhases.length, 'phases');
      }
    }

    // Clear existing prompts for this project and platform
    console.log('✓ Clearing existing prompts...');
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

    console.log('✓ Successfully cleared existing prompts');

    // Generate prompts using templates instead of AI calls
    const prompts = generatePromptsWithTemplates(
      project, 
      features || [], 
      userStories || [], 
      structuredPhases,
      platform
    );

    // Save to database
    console.log('💾 Saving new prompts to database...');
    
    // Save phase overview prompts
    for (const prompt of prompts.phaseOverviews) {
      console.log(`Saving phase overview: ${prompt.title}`);
      const { error } = await supabase
        .from('generated_prompts')
        .insert({
          project_id: projectId,
          platform,
          prompt_type: 'phase_overview',
          title: prompt.title,
          content: prompt.content,
          execution_order: prompt.execution_order,
          phase_number: prompt.phase_number
        });
      
      if (error) {
        console.error('Error saving phase overview:', error);
        throw error;
      }
      console.log(`✓ Successfully saved phase overview for Phase ${prompt.phase_number}`);
    }

    // Save story prompts with accurate phase mapping
    for (const prompt of prompts.storyPrompts) {
      const phaseNumber = mapStoryToPhase(prompt.userStoryTitle, structuredPhases);
      
      console.log(`💾 Saving story: "${prompt.title}" with phase_number: ${phaseNumber}, execution_order: ${prompt.execution_order}`);
      
      const insertData = {
        project_id: projectId,
        user_story_id: prompt.user_story_id,
        platform,
        prompt_type: 'story' as const,
        title: prompt.title,
        content: prompt.content,
        execution_order: prompt.execution_order,
        phase_number: phaseNumber
      };
      
      const { error } = await supabase
        .from('generated_prompts')
        .insert(insertData);
      
      if (error) {
        console.error(`Error saving story "${prompt.title}":`, error);
        throw error;
      }
      console.log(`✅ Successfully saved story "${prompt.title}" with phase_number: ${phaseNumber}`);
    }

    // Save transition prompts
    for (const prompt of prompts.transitionPrompts) {
      console.log(`Saving transition prompt: ${prompt.title}`);
      const { error } = await supabase
        .from('generated_prompts')
        .insert({
          project_id: projectId,
          platform,
          prompt_type: 'transition',
          title: prompt.title,
          content: prompt.content,
          execution_order: prompt.execution_order,
          phase_number: prompt.phase_number
        });
      
      if (error) {
        console.error('Error saving transition:', error);
        throw error;
      }
      console.log(`✓ Successfully saved transition for Phase ${prompt.phase_number}`);
    }

    // Save troubleshooting guide
    console.log('Saving troubleshooting guide...');
    const { error: troubleshootingError } = await supabase
      .from('troubleshooting_guides')
      .insert({
        project_id: projectId,
        platform,
        content: prompts.troubleshootingGuide,
        sections: {}
      });

    if (troubleshootingError) {
      console.error('Error saving troubleshooting guide:', troubleshootingError);
      throw troubleshootingError;
    }
    console.log('✓ Successfully saved troubleshooting guide');

    console.log('🎉 Successfully saved all generated prompts to database');

    // Verification query
    const { data: savedPrompts } = await supabase
      .from('generated_prompts')
      .select('title, phase_number, execution_order')
      .eq('project_id', projectId)
      .eq('platform', platform)
      .eq('prompt_type', 'story')
      .order('execution_order');

    console.log('✅ VERIFICATION - Saved prompts in database:');
    savedPrompts?.forEach((prompt: any) => {
      console.log(`  - story: "${prompt.title}" | phase: ${prompt.phase_number} | order: ${prompt.execution_order}`);
    });

    return new Response(JSON.stringify({ 
      success: true,
      promptsGenerated: prompts.storyPrompts.length + prompts.phaseOverviews.length + prompts.transitionPrompts.length,
      phases: structuredPhases.length
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

// Helper function to map stories to phases using structured phase data
function mapStoryToPhase(storyTitle: string, structuredPhases: any[]): number {
  // Try to find exact match in deliverables
  for (const phase of structuredPhases) {
    if (phase.deliverables && phase.deliverables.includes(storyTitle)) {
      return phase.number;
    }
  }
  
  // Try partial matching for similar titles
  for (const phase of structuredPhases) {
    if (phase.deliverables) {
      for (const deliverable of phase.deliverables) {
        // Check if story title is similar to any deliverable (simple keyword matching)
        const storyWords = storyTitle.toLowerCase().split(' ');
        const deliverableWords = deliverable.toLowerCase().split(' ');
        const commonWords = storyWords.filter(word => deliverableWords.includes(word) && word.length > 3);
        
        if (commonWords.length >= 2) {
          return phase.number;
        }
      }
    }
  }
  
  // Fallback to phase 1 if no match found
  return 1;
}

// Fallback function to create basic phases if no structured phases available
function createFallbackPhases(userStories: any[]): any[] {
  const totalStories = userStories.length;
  const storiesPerPhase = Math.ceil(totalStories / 3);
  
  const phases = [];
  for (let i = 0; i < 3; i++) {
    const startIndex = i * storiesPerPhase;
    const endIndex = Math.min(startIndex + storiesPerPhase, totalStories);
    const phaseStories = userStories.slice(startIndex, endIndex);
    
    phases.push({
      number: i + 1,
      name: `Phase ${i + 1}: ${i === 0 ? 'Foundation' : i === 1 ? 'Core Features' : 'Advanced Features'}`,
      deliverables: phaseStories.map((story: any) => story.title),
      estimatedHours: phaseStories.reduce((sum: number, story: any) => sum + (story.estimated_hours || 2), 0),
      description: `Phase ${i + 1} of development`
    });
  }
  
  return phases;
}

// Main generation function using templates instead of AI calls
function generatePromptsWithTemplates(
  project: any,
  features: any[],
  userStories: any[],
  structuredPhases: any[],
  platform: string
) {
  const phaseOverviews = [];
  const storyPrompts = [];
  const transitionPrompts = [];
  
  // Generate phase overview prompts using templates
  for (const phase of structuredPhases) {
    const phasePrompt = generatePhaseOverviewTemplate(project, phase, platform);
    phaseOverviews.push({
      title: `Phase ${phase.number} Overview: ${phase.name}`,
      content: phasePrompt,
      execution_order: phase.number,
      phase_number: phase.number
    });
  }
  
  // Generate story prompts using templates
  for (let i = 0; i < userStories.length; i++) {
    const story = userStories[i];
    const feature = features.find(f => f.id === story.feature_id);
    const storyPrompt = generateStoryTemplate(project, story, feature, platform);
    storyPrompts.push({
      title: `Story ${i + 1}: ${story.title}`,
      content: storyPrompt,
      execution_order: i + 1,
      user_story_id: story.id,
      userStoryTitle: story.title
    });
  }
  
  // Generate transition prompts using templates
  for (let i = 0; i < userStories.length - 1; i++) {
    const currentStory = userStories[i];
    const nextStory = userStories[i + 1];
    const currentPhase = mapStoryToPhase(currentStory.title, structuredPhases);
    
    const transitionPrompt = generateTransitionTemplate(project, currentStory, nextStory, platform);
    transitionPrompts.push({
      title: `Transition: ${currentStory.title} → ${nextStory.title}`,
      content: transitionPrompt,
      execution_order: i + 1,
      phase_number: currentPhase
    });
  }
  
  // Generate troubleshooting guide using template
  const troubleshootingGuide = generateTroubleshootingTemplate(project, platform);
  
  return {
    phaseOverviews,
    storyPrompts,
    transitionPrompts,
    troubleshootingGuide
  };
}

function generatePhaseOverviewTemplate(project: any, phase: any, platform: string): string {
  const phaseName = phase.name || `Phase ${phase.number}`;
  const deliverables = Array.isArray(phase.deliverables) ? phase.deliverables : [];
  const estimatedHours = phase.estimatedHours || phase.estimated_hours || 'Not specified';
  const description = phase.description || 'No description available';

  return `# ${phaseName} - Implementation Guide

## Project Context
**Project:** ${project.title}
**Description:** ${project.description}
**Platform:** ${platform}

## Phase Overview
**Phase:** ${phaseName}
**Estimated Time:** ${estimatedHours} hours
**Description:** ${description}

## Phase Objectives
This phase focuses on implementing the following deliverables:

${deliverables.map((item: string, index: number) => `${index + 1}. ${item}`).join('\n')}

## Implementation Strategy
1. **Setup & Planning**
   - Review all deliverables for this phase
   - Ensure previous phase dependencies are complete
   - Set up any necessary development environment configurations

2. **Development Approach**
   - Work through deliverables in the order listed above
   - Test each component thoroughly before moving to the next
   - Maintain clean, well-documented code throughout

3. **${platform} Best Practices**
   - Use proper component structure and naming conventions
   - Implement responsive design principles
   - Follow accessibility guidelines
   - Optimize for performance

## Phase Completion Criteria
- All deliverables are fully implemented and tested
- Code is clean, documented, and follows best practices
- All functionality works as expected across different screen sizes
- No critical bugs or issues remain

## Tips for Success
- Break down complex deliverables into smaller, manageable tasks
- Test frequently during development
- Keep the user experience at the forefront of all decisions
- Don't hesitate to refactor code for clarity and maintainability

Ready to start this phase? Begin with the first deliverable and work your way through the list systematically.`;
}

function generateStoryTemplate(project: any, story: any, feature: any, platform: string): string {
  const featureTitle = feature?.title || 'Unknown Feature';
  const storyDescription = story.description || 'No description provided';
  const acceptanceCriteria = story.acceptance_criteria?.join('\n- ') || 'Standard implementation and testing criteria';
  const estimatedHours = story.estimated_hours || 'Not specified';

  return `# User Story Implementation: ${story.title}

## Project Context
**Project:** ${project.title}
**Feature:** ${featureTitle}
**Platform:** ${platform}
**Estimated Time:** ${estimatedHours} hours

## User Story Details
**Story:** ${story.title}
**Description:** ${storyDescription}

## Acceptance Criteria
- ${acceptanceCriteria}

## Implementation Guide

### Step 1: Analysis & Planning
1. **Understand the Requirements**
   - Review the user story and acceptance criteria carefully
   - Identify the core functionality needed
   - Consider how this fits into the overall application flow

2. **Technical Planning**
   - Determine which components need to be created or modified
   - Identify any data models or API endpoints required
   - Plan the user interface and user experience

### Step 2: Development Setup
1. **File Structure**
   - Create or identify the relevant component files
   - Set up any necessary utility functions or hooks
   - Plan the component hierarchy

2. **Dependencies**
   - Ensure all required packages are available
   - Import necessary UI components from the design system
   - Set up any external integrations if needed

### Step 3: Core Implementation
1. **Component Development**
   - Start with the basic component structure
   - Implement the core functionality step by step
   - Add proper TypeScript types and interfaces

2. **State Management**
   - Set up local component state as needed
   - Implement any global state management if required
   - Handle data flow between components

3. **User Interface**
   - Create a clean, intuitive user interface
   - Ensure responsive design across all screen sizes
   - Follow accessibility best practices

### Step 4: Integration & Testing
1. **Component Integration**
   - Connect the component to the overall application
   - Test all user interactions and edge cases
   - Verify data persistence if applicable

2. **Quality Assurance**
   - Test across different browsers and devices
   - Verify all acceptance criteria are met
   - Check for any performance issues

### Step 5: ${platform} Specific Considerations
- **Performance:** Optimize for fast loading and smooth interactions
- **Responsiveness:** Ensure the feature works well on mobile and desktop
- **Accessibility:** Include proper ARIA labels and keyboard navigation
- **Code Quality:** Write clean, maintainable code with proper documentation

## Common Implementation Patterns
- Use React hooks for state management and side effects
- Implement proper error handling and loading states
- Follow the established design system and component patterns
- Ensure proper form validation where applicable

## Testing Checklist
- [ ] All acceptance criteria are met
- [ ] Component renders correctly on different screen sizes
- [ ] All user interactions work as expected
- [ ] Error handling works properly
- [ ] Data is saved/retrieved correctly
- [ ] Performance is acceptable
- [ ] Code is clean and well-documented

## Success Criteria
The user story is complete when:
- All acceptance criteria are satisfied
- The implementation follows best practices
- The code is properly tested and documented
- The feature integrates seamlessly with the rest of the application

Ready to implement? Start with Step 1 and work through each phase systematically.`;
}

function generateTransitionTemplate(project: any, currentStory: any, nextStory: any, platform: string): string {
  return `# Transition Guide: ${currentStory.title} → ${nextStory.title}

## Project Context
**Project:** ${project.title}
**Platform:** ${platform}
**Current Story:** ${currentStory.title}
**Next Story:** ${nextStory.title}

## Transition Checklist

### 1. Complete Current Story
Before moving to the next story, ensure:
- [ ] All functionality from "${currentStory.title}" is fully implemented
- [ ] All acceptance criteria have been met and tested
- [ ] Code is clean, documented, and follows best practices
- [ ] No critical bugs or issues remain

### 2. Code Review & Cleanup
- [ ] Review the code for any potential improvements
- [ ] Remove any console.log statements or debugging code
- [ ] Ensure proper error handling is in place
- [ ] Verify that all TypeScript types are correctly defined

### 3. Testing & Validation
- [ ] Test the completed functionality across different devices
- [ ] Verify integration with existing features
- [ ] Check for any regression issues
- [ ] Validate that performance remains optimal

### 4. Preparation for Next Story
- [ ] Review the requirements for "${nextStory.title}"
- [ ] Identify any dependencies or prerequisites
- [ ] Consider how the next story will build upon current work
- [ ] Plan the implementation approach

### 5. ${platform} Specific Checks
- [ ] Ensure responsive design is working properly
- [ ] Verify accessibility features are functioning
- [ ] Check that all UI components are consistent with the design system
- [ ] Validate that the code follows platform best practices

## Technical Considerations
- **Data Flow:** Ensure any data changes from the current story are properly handled
- **State Management:** Verify that component state is properly managed and cleaned up
- **API Integration:** Check that any API calls are working correctly and handling errors
- **UI Consistency:** Maintain consistent styling and interaction patterns

## Next Steps
Once you've completed this transition checklist:
1. Commit your current changes with a clear commit message
2. Take a moment to review the overall application flow
3. Begin planning the implementation of "${nextStory.title}"
4. Start the next story with a fresh perspective and clear objectives

Remember: Quality over speed. It's better to have fewer, well-implemented features than many incomplete ones.

Ready to move to the next story? Ensure all items in the checklist above are completed first.`;
}

function generateTroubleshootingTemplate(project: any, platform: string): string {
  return `# Troubleshooting Guide - ${project.title}

## Project Context
**Project:** ${project.title}
**Platform:** ${platform}
**Project Type:** ${project.project_type || 'Web Application'}

## Common Issues & Solutions

### 1. Build & Compilation Issues

**Problem:** TypeScript compilation errors
**Solutions:**
- Check for missing type definitions in interfaces
- Ensure all imports have correct file paths
- Verify that all required props are passed to components
- Check for unused variables or imports

**Problem:** Module not found errors
**Solutions:**
- Verify import paths are correct (case-sensitive)
- Check that all required dependencies are installed
- Ensure file extensions are correct (.tsx for JSX, .ts for TypeScript)
- Clear the build cache and restart the development server

### 2. React Component Issues

**Problem:** Component not rendering
**Solutions:**
- Check that the component is properly exported and imported
- Verify JSX syntax is correct (proper closing tags, fragments)
- Ensure all required props are provided
- Check for conditional rendering logic errors

**Problem:** State not updating
**Solutions:**
- Verify useState is imported from React
- Check that state setter functions are called correctly
- Ensure state updates are not mutating the original state
- Use useEffect dependencies correctly

### 3. Styling & UI Issues

**Problem:** Tailwind classes not working
**Solutions:**
- Verify Tailwind CSS is properly configured
- Check for typos in class names
- Ensure responsive prefixes are correct (sm:, md:, lg:)
- Clear browser cache and restart development server

**Problem:** Layout not responsive
**Solutions:**
- Use Tailwind responsive utilities (sm:, md:, lg:, xl:)
- Test on different screen sizes during development
- Use flexbox and grid utilities appropriately
- Check for fixed widths that might break on mobile

### 4. Data & API Issues

**Problem:** Data not loading
**Solutions:**
- Check network tab in browser dev tools for API errors
- Verify API endpoints are correct
- Ensure proper error handling is implemented
- Check for authentication issues

**Problem:** Form submission issues
**Solutions:**
- Verify form validation logic
- Check that all required fields are properly handled
- Ensure form data is being serialized correctly
- Test both success and error scenarios

### 5. ${platform} Specific Issues

**Development Environment:**
- Clear browser cache and cookies
- Restart the development server
- Check browser console for JavaScript errors
- Update dependencies if needed

**Performance Issues:**
- Optimize component re-renders with React.memo
- Use proper dependency arrays in useEffect hooks
- Lazy load components where appropriate
- Optimize images and assets

### 6. Authentication & Security

**Problem:** User authentication not working
**Solutions:**
- Check authentication provider configuration
- Verify API keys and credentials are correct
- Ensure proper session management
- Test login/logout flows thoroughly

**Problem:** Authorization issues
**Solutions:**
- Check user permissions and roles
- Verify protected route configurations
- Ensure proper access control implementation
- Test with different user types

### 7. Database & Storage Issues

**Problem:** Data not persisting
**Solutions:**
- Check database connection configuration
- Verify table schemas and relationships
- Ensure proper error handling for database operations
- Check for transaction rollbacks

**Problem:** Query performance issues
**Solutions:**
- Review database indexes
- Optimize query structure
- Consider pagination for large datasets
- Monitor query execution times

## Debugging Strategies

### 1. Browser Developer Tools
- **Console:** Check for JavaScript errors and logs
- **Network:** Monitor API calls and responses
- **Elements:** Inspect HTML structure and CSS
- **Sources:** Set breakpoints and debug JavaScript

### 2. React Developer Tools
- Inspect component props and state
- Monitor component re-renders
- Check component hierarchy
- Debug hooks and context

### 3. Code Review Checklist
- [ ] All imports are correct and necessary
- [ ] Components are properly structured
- [ ] State management is appropriate
- [ ] Error handling is implemented
- [ ] Code follows project conventions
- [ ] Performance considerations are addressed

### 4. Testing Approach
- Test individual components in isolation
- Verify integration between components
- Test different user scenarios
- Check edge cases and error conditions
- Validate across different browsers and devices

## Getting Help

If you're still stuck after trying these solutions:

1. **Check the Documentation**
   - Review framework-specific documentation
   - Check component library documentation
   - Look for similar issues in community forums

2. **Debugging Steps**
   - Isolate the problem to a specific component or function
   - Create a minimal reproduction of the issue
   - Check recent changes that might have caused the problem
   - Test with different data or user scenarios

3. **Code Review**
   - Review recent commits for potential issues
   - Check for any missing dependencies or configurations
   - Verify that all environment variables are set correctly
   - Ensure proper error handling is in place

Remember: Most issues are caused by simple mistakes like typos, missing imports, or incorrect prop passing. Start with the basics and work your way up to more complex debugging.

## Best Practices to Prevent Issues

- Write clean, well-documented code
- Test functionality as you build it
- Use TypeScript properly with correct types
- Follow consistent naming conventions
- Implement proper error handling from the start
- Keep components small and focused
- Use version control effectively with clear commit messages

Happy debugging! 🐛→🚀`;
}
