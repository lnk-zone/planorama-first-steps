
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

    // Generate prompts using enhanced templates
    const prompts = generatePromptsWithEnhancedTemplates(
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

// Enhanced template generation system
function generatePromptsWithEnhancedTemplates(
  project: any,
  features: any[],
  userStories: any[],
  structuredPhases: any[],
  platform: string
) {
  const phaseOverviews = [];
  const storyPrompts = [];
  const transitionPrompts = [];
  
  // Generate phase overview prompts using enhanced templates
  for (const phase of structuredPhases) {
    const phasePrompt = generateEnhancedPhaseOverviewTemplate(project, phase, platform);
    phaseOverviews.push({
      title: `Phase ${phase.number} Overview: ${phase.name}`,
      content: phasePrompt,
      execution_order: phase.number,
      phase_number: phase.number
    });
  }
  
  // Generate story prompts using enhanced templates
  for (let i = 0; i < userStories.length; i++) {
    const story = userStories[i];
    const feature = features.find(f => f.id === story.feature_id);
    const storyType = determineStoryType(story, feature);
    const complexity = determineComplexity(story);
    
    const storyPrompt = generateEnhancedStoryTemplate(project, story, feature, platform, storyType, complexity);
    storyPrompts.push({
      title: `Story ${i + 1}: ${story.title}`,
      content: storyPrompt,
      execution_order: i + 1,
      user_story_id: story.id,
      userStoryTitle: story.title
    });
  }
  
  // Generate transition prompts using enhanced templates
  for (let i = 0; i < userStories.length - 1; i++) {
    const currentStory = userStories[i];
    const nextStory = userStories[i + 1];
    const currentPhase = mapStoryToPhase(currentStory.title, structuredPhases);
    
    const transitionPrompt = generateEnhancedTransitionTemplate(project, currentStory, nextStory, platform);
    transitionPrompts.push({
      title: `Transition: ${currentStory.title} → ${nextStory.title}`,
      content: transitionPrompt,
      execution_order: i + 1,
      phase_number: currentPhase
    });
  }
  
  // Generate enhanced troubleshooting guide
  const troubleshootingGuide = generateEnhancedTroubleshootingTemplate(project, platform);
  
  return {
    phaseOverviews,
    storyPrompts,
    transitionPrompts,
    troubleshootingGuide
  };
}

// Enhanced story type determination
function determineStoryType(story: any, feature: any): string {
  const title = story.title.toLowerCase();
  const description = (story.description || '').toLowerCase();
  const featureTitle = (feature?.title || '').toLowerCase();
  
  // Authentication stories
  if (title.includes('login') || title.includes('register') || title.includes('auth') || 
      title.includes('password') || title.includes('sign')) {
    return 'authentication';
  }
  
  // CRUD operations
  if (title.includes('create') || title.includes('add') || title.includes('new')) {
    return 'crud-create';
  }
  if (title.includes('edit') || title.includes('update') || title.includes('modify')) {
    return 'crud-update';
  }
  if (title.includes('delete') || title.includes('remove')) {
    return 'crud-delete';
  }
  if (title.includes('view') || title.includes('display') || title.includes('show') || title.includes('list')) {
    return 'crud-read';
  }
  
  // UI/UX stories
  if (title.includes('dashboard') || title.includes('page') || title.includes('interface')) {
    return 'ui-page';
  }
  if (title.includes('form') || title.includes('input')) {
    return 'ui-form';
  }
  if (title.includes('navigation') || title.includes('menu')) {
    return 'ui-navigation';
  }
  
  // Data/API stories
  if (title.includes('api') || title.includes('endpoint') || title.includes('service')) {
    return 'api-integration';
  }
  if (title.includes('export') || title.includes('import') || title.includes('data')) {
    return 'data-management';
  }
  
  // Notification/Communication
  if (title.includes('notification') || title.includes('email') || title.includes('alert')) {
    return 'notification';
  }
  
  // Search/Filter
  if (title.includes('search') || title.includes('filter') || title.includes('sort')) {
    return 'search-filter';
  }
  
  // Settings/Configuration
  if (title.includes('setting') || title.includes('config') || title.includes('preference')) {
    return 'settings';
  }
  
  return 'general';
}

// Enhanced complexity determination
function determineComplexity(story: any): 'simple' | 'moderate' | 'complex' {
  const estimatedHours = story.estimated_hours || 0;
  const acceptanceCriteria = story.acceptance_criteria || [];
  const description = story.description || '';
  
  // Complex indicators
  if (estimatedHours > 8 || acceptanceCriteria.length > 5 || 
      description.includes('integration') || description.includes('complex') ||
      description.includes('multiple') || description.includes('advanced')) {
    return 'complex';
  }
  
  // Simple indicators
  if (estimatedHours <= 3 || acceptanceCriteria.length <= 2) {
    return 'simple';
  }
  
  return 'moderate';
}

// Enhanced Phase Overview Template
function generateEnhancedPhaseOverviewTemplate(project: any, phase: any, platform: string): string {
  const phaseName = phase.name || `Phase ${phase.number}`;
  const deliverables = Array.isArray(phase.deliverables) ? phase.deliverables : [];
  const estimatedHours = phase.estimatedHours || phase.estimated_hours || 'Not specified';
  const description = phase.description || 'No description available';

  const setupSection = generateSetupSection(project, platform);
  const strategySection = generateStrategySection(deliverables, phaseName);
  const bestPracticesSection = generateBestPracticesSection(platform);

  return `# ${phaseName} - AI Builder Implementation Guide

## Project Context
**Project:** ${project.title}
**Description:** ${project.description}
**Platform:** ${platform}
**Phase:** ${phaseName}
**Estimated Time:** ${estimatedHours} hours

## Phase Overview
${description}

This phase focuses on implementing the following deliverables:
${deliverables.map((item: string, index: number) => `${index + 1}. ${item}`).join('\n')}

${setupSection}

${strategySection}

${bestPracticesSection}

## Phase Completion Criteria
- [ ] All deliverables are fully implemented and tested
- [ ] Code is clean, documented, and follows best practices
- [ ] All functionality works as expected across different screen sizes
- [ ] No critical bugs or issues remain
- [ ] Integration with existing codebase is seamless
- [ ] Performance meets acceptable standards

## Success Metrics
- All acceptance criteria for phase deliverables are met
- Code passes review and testing standards
- User experience is intuitive and responsive
- Technical debt is minimized

Ready to start this phase? Begin with the first deliverable and work systematically through each one.`;
}

// Enhanced Story Template with intelligent adaptation
function generateEnhancedStoryTemplate(
  project: any, 
  story: any, 
  feature: any, 
  platform: string, 
  storyType: string, 
  complexity: 'simple' | 'moderate' | 'complex'
): string {
  const featureTitle = feature?.title || 'Unknown Feature';
  const storyDescription = story.description || 'No description provided';
  const acceptanceCriteria = story.acceptance_criteria?.join('\n- ') || 'Standard implementation and testing criteria';
  const estimatedHours = story.estimated_hours || 'Not specified';

  // Get type-specific content
  const typeSpecificContent = getTypeSpecificContent(storyType);
  const complexityContent = getComplexityContent(complexity);
  const platformContent = getPlatformContent(platform);

  return `# User Story Implementation: ${story.title}

## Project Context
**Project:** ${project.title}
**Feature:** ${featureTitle}
**Platform:** ${platform}
**Story Type:** ${storyType}
**Complexity:** ${complexity}
**Estimated Time:** ${estimatedHours} hours

## User Story Details
**Story:** ${story.title}
**Description:** ${storyDescription}

## Acceptance Criteria
- ${acceptanceCriteria}

${typeSpecificContent}

${complexityContent}

${platformContent}

## Implementation Workflow

### Phase 1: Analysis & Planning (10-15% of time)
1. **Requirements Analysis**
   - Break down the user story into specific tasks
   - Identify dependencies and prerequisites
   - Review similar implementations in the codebase

2. **Technical Design**
   - Plan component architecture
   - Design data flow and state management
   - Identify reusable components and utilities

### Phase 2: Development Setup (10-15% of time)
1. **Environment Preparation**
   - Set up necessary files and folder structure
   - Install any required dependencies
   - Configure development environment

2. **Foundation Code**
   - Create basic component structure
   - Set up routing if needed
   - Implement basic state management

### Phase 3: Core Implementation (50-60% of time)
1. **Feature Development**
   - Implement core functionality step by step
   - Add proper TypeScript types and interfaces
   - Integrate with backend services if needed

2. **User Interface**
   - Create responsive, accessible UI components
   - Implement proper error handling and loading states
   - Follow design system guidelines

### Phase 4: Integration & Testing (15-20% of time)
1. **System Integration**
   - Connect with existing application features
   - Test data flow and state management
   - Verify API integrations

2. **Quality Assurance**
   - Test across different devices and browsers
   - Validate all acceptance criteria
   - Check for edge cases and error scenarios

### Phase 5: Finalization (5-10% of time)
1. **Code Review & Cleanup**
   - Remove debugging code and console logs
   - Optimize performance if needed
   - Document any complex logic

2. **Final Testing**
   - Complete end-to-end testing
   - Verify accessibility compliance
   - Ensure mobile responsiveness

## Technical Requirements Checklist
- [ ] Component follows React best practices
- [ ] TypeScript types are properly defined
- [ ] Responsive design works on all screen sizes
- [ ] Accessibility standards are met (ARIA labels, keyboard navigation)
- [ ] Error handling is comprehensive
- [ ] Loading states are implemented
- [ ] Code is well-documented
- [ ] Performance is optimized

## Success Criteria
The user story is complete when:
- All acceptance criteria are satisfied
- Code follows project standards and best practices
- Feature integrates seamlessly with existing application
- User experience is intuitive and responsive
- No critical bugs or issues remain

Ready to implement? Follow the workflow phases systematically for best results.`;
}

// Type-specific content sections
function getTypeSpecificContent(storyType: string): string {
  const typeGuides = {
    'authentication': `
## Authentication Implementation Guide

### Key Components
- Authentication forms (login, register, reset password)
- Protected route components
- User session management
- Error handling for auth failures

### Common Patterns
- Use React hook form for form validation
- Implement proper password strength validation
- Add loading states during authentication
- Handle authentication errors gracefully

### Security Considerations
- Never store passwords in plain text
- Use secure session management
- Implement proper logout functionality
- Add CSRF protection where needed`,

    'crud-create': `
## Create Operation Implementation Guide

### Key Components
- Form components with validation
- API integration for data creation
- Success/error feedback
- Navigation after creation

### Common Patterns
- Use controlled form inputs
- Implement real-time validation
- Add confirmation dialogs if needed
- Redirect to appropriate page after creation

### Data Considerations
- Validate data on both client and server
- Handle unique constraint violations
- Implement proper error messages
- Consider optimistic updates`,

    'crud-read': `
## Read/Display Implementation Guide

### Key Components
- Data fetching and display components
- Loading and error states
- Pagination or infinite scroll
- Search and filtering capabilities

### Common Patterns
- Use React Query for data fetching
- Implement skeleton loading states
- Add empty states for no data
- Consider virtualization for large lists

### Performance Considerations
- Implement efficient data fetching
- Use memoization where appropriate
- Consider caching strategies
- Optimize re-renders`,

    'ui-form': `
## Form Implementation Guide

### Key Components
- Form validation logic
- Input components with proper types
- Error message display
- Submit handling

### Common Patterns
- Use React Hook Form for form management
- Implement field-level validation
- Add proper accessibility attributes
- Handle form submission states

### User Experience
- Provide clear validation feedback
- Implement auto-save if appropriate
- Add confirmation for destructive actions
- Ensure mobile-friendly interactions`,
  };

  return typeGuides[storyType] || `
## General Implementation Guide

### Key Components
- Main feature components
- Supporting utility functions
- Integration with existing systems
- User interface elements

### Common Patterns
- Follow established code patterns in the project
- Use existing components where possible
- Implement proper error handling
- Add appropriate loading states

### Best Practices
- Write clean, maintainable code
- Follow project coding standards
- Add proper documentation
- Test edge cases thoroughly`;
}

// Complexity-based content
function getComplexityContent(complexity: 'simple' | 'moderate' | 'complex'): string {
  const complexityGuides = {
    'simple': `
## Simple Implementation Approach

This is a straightforward implementation that should follow established patterns:

### Focus Areas
- Use existing components and patterns
- Keep implementation minimal and clean
- Focus on core functionality
- Ensure basic testing coverage

### Time Allocation
- Planning: 10%
- Implementation: 70%
- Testing: 20%`,

    'moderate': `
## Moderate Implementation Approach

This implementation requires some planning and may involve multiple components:

### Focus Areas
- Plan component architecture carefully
- Consider reusability of components
- Implement comprehensive error handling
- Add thorough testing

### Time Allocation
- Planning: 15%
- Implementation: 60%
- Testing: 25%`,

    'complex': `
## Complex Implementation Approach

This is a sophisticated implementation requiring careful architecture:

### Focus Areas
- Design robust component architecture
- Plan for scalability and maintainability
- Implement comprehensive error handling
- Create detailed tests and documentation
- Consider performance implications

### Time Allocation
- Planning: 20%
- Implementation: 50%
- Testing: 25%
- Documentation: 5%

### Additional Considerations
- Break down into smaller, manageable tasks
- Consider creating reusable utilities
- Plan for future extensibility
- Implement monitoring and logging`
  };

  return complexityGuides[complexity];
}

// Platform-specific content
function getPlatformContent(platform: string): string {
  return `
## ${platform} Platform Best Practices

### Technology Stack
- **Frontend:** React with TypeScript
- **Styling:** Tailwind CSS with shadcn/ui components
- **State Management:** React hooks and context
- **Data Fetching:** React Query
- **Forms:** React Hook Form
- **Routing:** React Router

### Development Standards
- Use TypeScript for type safety
- Follow React best practices (hooks, functional components)
- Implement responsive design with Tailwind
- Use shadcn/ui components for consistency
- Write clean, maintainable code

### Performance Guidelines
- Optimize component re-renders
- Use React.memo for expensive components
- Implement proper loading states
- Consider code splitting for large features
- Optimize images and assets

### Code Quality
- Follow established naming conventions
- Write self-documenting code
- Add comments for complex logic
- Use proper error boundaries
- Implement proper accessibility`;
}

// Enhanced Transition Template
function generateEnhancedTransitionTemplate(project: any, currentStory: any, nextStory: any, platform: string): string {
  const currentType = determineStoryType(currentStory, null);
  const nextType = determineStoryType(nextStory, null);
  
  return `# Transition Guide: ${currentStory.title} → ${nextStory.title}

## Project Context
**Project:** ${project.title}
**Platform:** ${platform}
**Current Story:** ${currentStory.title} (${currentType})
**Next Story:** ${nextStory.title} (${nextType})

## Pre-Transition Checklist

### Current Story Completion Verification
- [ ] All acceptance criteria have been met and tested
- [ ] Code follows project standards and conventions
- [ ] No critical bugs or issues remain
- [ ] Feature integrates properly with existing codebase
- [ ] Mobile responsiveness is working correctly
- [ ] Accessibility requirements are met

### Code Quality Review
- [ ] Remove any debugging code or console.log statements
- [ ] Ensure proper error handling is in place
- [ ] Verify TypeScript types are correctly defined
- [ ] Code is properly documented
- [ ] No unused imports or variables remain

### Testing & Validation
- [ ] Manual testing completed across different devices
- [ ] Integration with existing features verified
- [ ] Performance impact assessed and acceptable
- [ ] User experience flows work as expected

## Knowledge Transfer Preparation

### Current Implementation Summary
Document what was implemented in "${currentStory.title}":
- Key components created or modified
- New utilities or hooks added
- API endpoints or data models involved
- Important design decisions made

### Dependencies & Connections
Identify how the current story relates to upcoming work:
- Shared components that might be reused
- Data structures that will be extended
- Patterns established that should be followed
- Integration points that affect future stories

## Next Story Preparation

### Context Review for "${nextStory.title}"
- [ ] Review requirements and acceptance criteria
- [ ] Understand how it builds on current work
- [ ] Identify any new dependencies or prerequisites
- [ ] Plan the implementation approach

### Environment Setup
- [ ] Ensure development environment is clean
- [ ] Update any necessary dependencies
- [ ] Clear browser cache and localStorage if needed
- [ ] Verify all tools and extensions are working

## Transition Strategy

### Type-Specific Considerations
${getTransitionTypeGuidance(currentType, nextType)}

### Knowledge Continuity
- Maintain consistent coding patterns established
- Reuse components and utilities where appropriate
- Follow the same design system and styling approach
- Continue using established state management patterns

### Quality Assurance
- Apply the same testing rigor to the next story
- Maintain the same code quality standards
- Use similar documentation patterns
- Follow established git commit conventions

## Success Criteria for Transition
- [ ] Current story is fully complete and documented
- [ ] Code repository is clean and well-organized
- [ ] Next story requirements are clearly understood
- [ ] Development environment is prepared
- [ ] Any shared code is properly organized and documented

## Final Notes
Before starting "${nextStory.title}":
1. Take a brief break to clear your mind
2. Review the overall project goals and how this story fits
3. Consider any learnings from the current story that apply to the next
4. Ensure you have a clear plan for the next implementation

Ready to proceed? Ensure all checklist items are completed before moving forward.`;
}

function getTransitionTypeGuidance(currentType: string, nextType: string): string {
  if (currentType === 'authentication' && nextType.startsWith('crud')) {
    return `
**Authentication → CRUD Transition:**
- Ensure authentication state is properly managed
- Verify protected routes are working
- User session should persist for CRUD operations
- Consider how user permissions affect CRUD functionality`;
  }
  
  if (currentType.startsWith('crud') && nextType.startsWith('crud')) {
    return `
**CRUD → CRUD Transition:**
- Leverage existing data models and API patterns
- Reuse form components and validation logic
- Maintain consistent UI patterns across operations
- Consider optimistic updates and caching strategies`;
  }
  
  if (currentType.startsWith('ui') && nextType !== currentType) {
    return `
**UI → Feature Transition:**
- Ensure UI components are properly extracted and reusable
- Verify responsive design works across all screen sizes
- Document any new design patterns for consistency
- Test navigation and user flow transitions`;
  }
  
  return `
**General Transition:**
- Maintain consistency with established patterns
- Reuse common components and utilities
- Follow the same coding standards and conventions
- Consider how features will work together in the final application`;
}

// Enhanced Troubleshooting Template
function generateEnhancedTroubleshootingTemplate(project: any, platform: string): string {
  return `# Comprehensive Troubleshooting Guide - ${project.title}

## Project Context
**Project:** ${project.title}
**Platform:** ${platform}
**Project Type:** ${project.project_type || 'Web Application'}

## Quick Reference - Common Issues

### 🚀 Build & Compilation
| Issue | Quick Fix | Details |
|-------|-----------|---------|
| TypeScript errors | Check types, imports, props | See TypeScript section below |
| Module not found | Verify import paths, case sensitivity | See Import section below |
| Build fails | Clear cache, restart dev server | \`rm -rf node_modules .next && npm install\` |

### ⚛️ React Component Issues
| Issue | Quick Fix | Details |
|-------|-----------|---------|
| Component not rendering | Check export/import, JSX syntax | See React section below |
| State not updating | Use functional updates, check dependencies | See State section below |
| Props not passing | Verify prop names, types, destructuring | See Props section below |

### 🎨 Styling & UI
| Issue | Quick Fix | Details |
|-------|-----------|---------|
| Tailwind not working | Check class names, restart server | See Styling section below |
| Not responsive | Use responsive prefixes | \`sm:\`, \`md:\`, \`lg:\`, \`xl:\` |
| Components misaligned | Check flex/grid properties | See Layout section below |

## Detailed Troubleshooting Sections

### 1. TypeScript & Compilation Issues

**Problem: TypeScript compilation errors**
```bash
# Common fixes:
npm run type-check
# or
npx tsc --noEmit
```

**Solutions:**
- Check for missing type definitions
- Verify all imports have correct file paths
- Ensure all required props are provided to components
- Look for unused variables or imports

**Problem: Module resolution errors**
```typescript
// ❌ Wrong - case sensitive paths
import Component from './Component'
// ✅ Correct
import Component from './Component.tsx'
```

**Advanced TypeScript Debugging:**
```typescript
// Add explicit types to debug
const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  // implementation
}
```

### 2. React Component & State Management

**Problem: Component not rendering**
```jsx
// ✅ Ensure proper export/import
export default function MyComponent() {
  return <div>Content</div>
}

// ✅ Check JSX syntax
return (
  <div>
    <h1>Title</h1>
  </div>
)
```

**Problem: State not updating**
```jsx
// ❌ Wrong - direct mutation
setState(state.push(newItem))

// ✅ Correct - immutable update
setState(prev => [...prev, newItem])

// ✅ Functional updates
setCount(prevCount => prevCount + 1)
```

**Problem: useEffect issues**
```jsx
// ✅ Proper dependency array
useEffect(() => {
  fetchData(userId)
}, [userId]) // Include all dependencies

// ✅ Cleanup functions
useEffect(() => {
  const timer = setInterval(() => {}, 1000)
  return () => clearInterval(timer)
}, [])
```

### 3. Data Fetching & API Integration

**Problem: API calls failing**
```typescript
// ✅ Proper error handling
const { data, error, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: async () => {
    const response = await fetch('/api/users')
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`)
    }
    return response.json()
  }
})

if (error) {
  console.error('API Error:', error)
  return <div>Error loading data</div>
}
```

**Problem: Supabase integration issues**
```typescript
// ✅ Check Supabase connection
import { supabase } from '@/integrations/supabase/client'

const { data, error } = await supabase
  .from('table_name')
  .select('*')

if (error) {
  console.error('Supabase error:', error)
}
```

### 4. Styling & Layout Issues

**Problem: Tailwind classes not applying**
```jsx
// ✅ Check for typos in class names
<div className="bg-blue-500 text-white p-4">
  
// ✅ Use string literals, not template literals for static classes
<div className="bg-blue-500 hover:bg-blue-600">

// ✅ For dynamic classes, use full class names
<div className={isActive ? 'bg-blue-500' : 'bg-gray-500'}>
```

**Problem: Responsive design not working**
```jsx
// ✅ Mobile-first approach
<div className="w-full md:w-1/2 lg:w-1/3">
  
// ✅ Responsive text sizes
<h1 className="text-xl md:text-2xl lg:text-3xl">
```

**Problem: Layout issues**
```jsx
// ✅ Flexbox for alignment
<div className="flex items-center justify-between">
  
// ✅ Grid for complex layouts
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### 5. Form Handling & Validation

**Problem: Form submission issues**
```typescript
// ✅ Proper form handling with React Hook Form
import { useForm } from 'react-hook-form'

const { register, handleSubmit, formState: { errors } } = useForm()

const onSubmit = (data) => {
  console.log(data)
}

return (
  <form onSubmit={handleSubmit(onSubmit)}>
    <input {...register('email', { required: 'Email is required' })} />
    {errors.email && <span>{errors.email.message}</span>}
  </form>
)
```

### 6. Performance & Optimization

**Problem: Component re-rendering too often**
```typescript
// ✅ Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* expensive rendering */}</div>
})

// ✅ Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data)
}, [data])

// ✅ Use useCallback for stable function references
const handleClick = useCallback(() => {
  // handler logic
}, [dependency])
```

## Debugging Strategies

### 1. Browser Developer Tools
```javascript
// Add strategic console.logs
console.log('Component rendered with props:', props)
console.log('State updated:', state)

// Use debugger statements
debugger; // Execution will pause here

// Check React Developer Tools
// Install React DevTools browser extension
```

### 2. Network & API Debugging
```javascript
// Monitor network requests in DevTools
// Check request/response in Network tab
// Verify API endpoints and payload

// Add request logging
fetch('/api/endpoint')
  .then(response => {
    console.log('Response status:', response.status)
    return response.json()
  })
  .then(data => console.log('Response data:', data))
```

### 3. State Debugging
```typescript
// Use React DevTools to inspect state
// Add state logging in useEffect
useEffect(() => {
  console.log('State changed:', state)
}, [state])

// Use Redux DevTools for complex state
// Add state snapshots for debugging
```

## Platform-Specific Issues

### React + Vite Issues
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev

# Check Vite config
# Verify import paths are correct
# Ensure all file extensions are included
```

### Tailwind CSS Issues
```bash
# Regenerate Tailwind
npm run build:css

# Check tailwind.config.js
# Verify content paths are correct
# Check for conflicting styles
```

### TypeScript Issues
```bash
# Type check without build
npx tsc --noEmit

# Check tsconfig.json
# Verify path mappings
# Check for strict mode issues
```

## Best Practices for Prevention

### 1. Code Organization
- Keep components small and focused
- Use proper file and folder structure
- Follow consistent naming conventions
- Separate concerns (UI, logic, data)

### 2. Error Handling
```typescript
// ✅ Comprehensive error boundaries
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true }
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>
    }
    return this.props.children
  }
}
```

### 3. Testing Strategy
```typescript
// ✅ Test components in isolation
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

test('component renders correctly', () => {
  render(<MyComponent />)
  expect(screen.getByText('Expected Text')).toBeInTheDocument()
})
```

### 4. Development Workflow
- Use consistent git commit messages
- Test frequently during development
- Keep dependencies up to date
- Use linting and formatting tools
- Document complex logic

## Getting Additional Help

### 1. Documentation Resources
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Query Docs](https://tanstack.com/query)

### 2. Debugging Tools
- React Developer Tools
- Browser DevTools
- TypeScript Error Messages
- Vite Development Server Logs

### 3. Community Resources
- Stack Overflow for specific issues
- GitHub Issues for library-specific problems
- Discord/Slack communities for real-time help
- Official documentation and guides

Remember: Most issues are caused by simple mistakes. Start with the basics and work your way up to more complex debugging.

Happy debugging! 🐛→✨`;
}
