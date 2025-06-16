
import { supabase } from '@/integrations/supabase/client';
import type { Feature } from '@/hooks/useFeatures';
import type { UserStory } from '@/hooks/useUserStories';
import type { Json } from '@/integrations/supabase/types';

export interface ExecutionPlan {
  id?: string;
  totalStories: number;
  executionOrder: string[];
  estimatedTotalHours: number;
  phases: Phase[];
}

export interface Phase {
  number: number;
  name: string;
  stories: string[];
  estimatedHours: number;
}

export interface Dependency {
  targetStoryTitle: string;
  type: 'must_do_first' | 'do_together';
  reason: string;
}

export interface GenerationResult {
  features: Feature[];
  userStories: UserStory[];
  executionPlan: ExecutionPlan;
}

export interface GenerationProgressData {
  stage: 'analyzing' | 'generating_features' | 'creating_stories' | 'calculating_order' | 'complete';
  progress: number;
  currentAction: string;
}

export class AIFeatureGenerator {
  private onProgress?: (progress: GenerationProgressData) => void;

  constructor(onProgress?: (progress: GenerationProgressData) => void) {
    this.onProgress = onProgress;
  }

  async generateFeaturesWithDependencies(
    projectId: string,
    projectDescription: string,
    appType: string = 'web_app'
  ): Promise<GenerationResult> {
    try {
      this.updateProgress('analyzing', 10, 'Analyzing project description...');

      const prompt = this.buildFeatureGenerationPrompt(projectDescription, appType);
      
      this.updateProgress('generating_features', 30, 'Generating features and stories with AI...');

      console.log('Calling Supabase function for feature generation...');
      
      const { data: aiResponse, error } = await supabase.functions.invoke('generate-features', {
        body: { prompt }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`AI generation failed: ${error.message || 'Unknown error from AI service'}`);
      }

      if (!aiResponse || !aiResponse.features || !aiResponse.userStories) {
        console.error('Invalid AI response structure:', aiResponse);
        throw new Error('Invalid response structure from AI service');
      }

      console.log('AI Response received:', aiResponse);
      
      this.updateProgress('creating_stories', 60, 'Creating features and user stories...');

      // 1. Create features with execution order
      const features = await this.createFeaturesWithOrder(projectId, aiResponse.features);
      
      // 2. Create user stories with dependencies
      const userStories = await this.createUserStoriesWithDependencies(features, aiResponse.userStories);
      
      this.updateProgress('calculating_order', 80, 'Calculating execution order...');
      
      // 3. Calculate and update execution order
      const executionPlan = await this.calculateExecutionOrder(projectId, userStories);
      
      this.updateProgress('complete', 100, 'Feature generation complete!');

      return { features, userStories, executionPlan };
    } catch (error) {
      console.error('AI feature generation failed:', error);
      
      let errorMessage = 'Failed to generate features. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('AI generation failed')) {
          errorMessage = 'AI service encountered an error. Please check your description and try again.';
        } else if (error.message.includes('No response')) {
          errorMessage = 'AI service is not responding. Please try again in a moment.';
        } else if (error.message.includes('Invalid response')) {
          errorMessage = 'AI service returned invalid data. Please try simplifying your description.';
        }
      }
      
      throw new Error(errorMessage);
    }
  }

  private updateProgress(stage: GenerationProgressData['stage'], progress: number, currentAction: string) {
    if (this.onProgress) {
      this.onProgress({ stage, progress, currentAction });
    }
  }

  private buildFeatureGenerationPrompt(description: string, appType: string): string {
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
  }

  private async createFeaturesWithOrder(projectId: string, aiFeatures: any[]): Promise<Feature[]> {
    const features = aiFeatures.map((f, index) => ({
      project_id: projectId,
      title: f.title,
      description: f.description,
      priority: f.priority || 'medium',
      category: f.category || 'core',
      complexity: f.complexity || 'medium',
      estimated_hours: f.estimatedHours || 8,
      execution_order: index + 1,
      metadata: {
        generated_by_ai: true,
        generation_timestamp: new Date().toISOString()
      }
    }));

    const { data, error } = await supabase
      .from('features')
      .insert(features)
      .select();

    if (error) throw error;
    return data;
  }

  private async createUserStoriesWithDependencies(features: Feature[], aiUserStories: any[]): Promise<UserStory[]> {
    const userStories = [];
    
    for (const story of aiUserStories) {
      const matchingFeature = features.find(f => f.title === story.featureTitle);
      if (matchingFeature) {
        userStories.push({
          feature_id: matchingFeature.id,
          title: story.title,
          description: story.description,
          acceptance_criteria: story.acceptanceCriteria,
          priority: story.priority || 'medium',
          complexity: story.complexity || 'medium',
          estimated_hours: story.estimatedHours || 4,
          dependencies: (story.dependencies || []) as Json,
          status: 'draft'
        });
      }
    }

    if (userStories.length === 0) return [];

    const { data, error } = await supabase
      .from('user_stories')
      .insert(userStories)
      .select();

    if (error) throw error;
    return data;
  }

  private async calculateExecutionOrder(projectId: string, userStories: UserStory[]): Promise<ExecutionPlan> {
    // Simple topological sort based on dependencies
    const storyMap = new Map(userStories.map(s => [s.title, s]));
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (storyTitle: string) => {
      if (visiting.has(storyTitle)) {
        throw new Error(`Circular dependency detected involving: ${storyTitle}`);
      }
      if (visited.has(storyTitle)) return;

      visiting.add(storyTitle);
      
      const story = storyMap.get(storyTitle);
      if (story?.dependencies) {
        const deps = story.dependencies as Dependency[];
        for (const dep of deps) {
          if (dep.type === 'must_do_first') {
            visit(dep.targetStoryTitle);
          }
        }
      }
      
      visiting.delete(storyTitle);
      visited.add(storyTitle);
      order.push(storyTitle);
    };

    // Visit all stories
    for (const story of userStories) {
      visit(story.title);
    }

    // Update execution order in database
    for (let i = 0; i < order.length; i++) {
      const story = storyMap.get(order[i]);
      if (story) {
        await supabase
          .from('user_stories')
          .update({ execution_order: i + 1 })
          .eq('id', story.id);
      }
    }

    const phases = this.groupIntoPhases(order, storyMap);
    const totalHours = userStories.reduce((sum, s) => sum + (s.estimated_hours || 0), 0);

    // Convert phases to Json for database storage
    const phasesJson = phases.map(phase => ({
      number: phase.number,
      name: phase.name,
      stories: phase.stories,
      estimatedHours: phase.estimatedHours
    })) as Json;

    // Save execution plan
    const { data: planData, error } = await supabase
      .from('execution_plans')
      .insert({
        project_id: projectId,
        total_stories: userStories.length,
        estimated_total_hours: totalHours,
        phases: phasesJson
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: planData.id,
      totalStories: userStories.length,
      executionOrder: order,
      estimatedTotalHours: totalHours,
      phases: phases
    };
  }

  private groupIntoPhases(order: string[], storyMap: Map<string, UserStory>): Phase[] {
    const phases: Phase[] = [];
    let currentPhase: string[] = [];
    let phaseHours = 0;
    
    for (const storyTitle of order) {
      const story = storyMap.get(storyTitle);
      if (!story) continue;
      
      // Start new phase if current phase is getting too big (40+ hours)
      if (phaseHours > 40 && currentPhase.length > 0) {
        phases.push({
          number: phases.length + 1,
          name: `Phase ${phases.length + 1}`,
          stories: [...currentPhase],
          estimatedHours: phaseHours
        });
        currentPhase = [];
        phaseHours = 0;
      }
      
      currentPhase.push(storyTitle);
      phaseHours += story.estimated_hours || 0;
    }
    
    // Add final phase
    if (currentPhase.length > 0) {
      phases.push({
        number: phases.length + 1,
        name: `Phase ${phases.length + 1}`,
        stories: currentPhase,
        estimatedHours: phaseHours
      });
    }
    
    return phases;
  }

  private buildFeatureGenerationPrompt(description: string, appType: string): string {
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
  }
}
