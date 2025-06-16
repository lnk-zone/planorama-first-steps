
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
      this.updateProgress('analyzing', 10, 'Analyzing project requirements...');

      this.updateProgress('generating_features', 30, 'Generating comprehensive features with AI...');

      console.log('Calling enhanced feature generation service...');
      
      const { data: aiResponse, error } = await supabase.functions.invoke('generate-features', {
        body: { 
          description: projectDescription,
          appType: appType
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`AI generation failed: ${error.message || 'Unknown error from AI service'}`);
      }

      if (!aiResponse || !aiResponse.features || !aiResponse.userStories) {
        console.error('Invalid AI response structure:', aiResponse);
        throw new Error('Invalid response structure from AI service');
      }

      console.log(`AI Response: ${aiResponse.features.length} features, ${aiResponse.userStories.length} user stories`);
      
      // Validate we have authentication features
      const authFeatures = aiResponse.features.filter((f: any) => 
        f.category === 'auth' || 
        f.title.toLowerCase().includes('auth') ||
        f.title.toLowerCase().includes('login') ||
        f.title.toLowerCase().includes('register')
      );
      
      if (authFeatures.length < 3) {
        console.warn('Few authentication features detected, but proceeding...');
      }
      
      this.updateProgress('creating_stories', 60, 'Creating features and user stories...');

      const features = await this.createFeaturesWithOrder(projectId, aiResponse.features);
      const userStories = await this.createUserStoriesWithDependencies(features, aiResponse.userStories);
      
      this.updateProgress('calculating_order', 80, 'Calculating execution order and phases...');
      
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

  private async createFeaturesWithOrder(projectId: string, aiFeatures: any[]): Promise<Feature[]> {
    // Sort features to put authentication features first
    const sortedFeatures = aiFeatures.sort((a, b) => {
      const aIsAuth = a.category === 'auth' || a.title.toLowerCase().includes('auth') || 
                     a.title.toLowerCase().includes('login') || a.title.toLowerCase().includes('register');
      const bIsAuth = b.category === 'auth' || b.title.toLowerCase().includes('auth') || 
                     b.title.toLowerCase().includes('login') || b.title.toLowerCase().includes('register');
      
      if (aIsAuth && !bIsAuth) return -1;
      if (!aIsAuth && bIsAuth) return 1;
      
      // Then sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
    });

    const features = sortedFeatures.map((f, index) => ({
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
        generation_timestamp: new Date().toISOString(),
        enhanced_generation: true
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
        // Ensure dependencies are properly structured
        let dependencies = story.dependencies || [];
        
        // Validate and fix dependency structure
        dependencies = dependencies.filter((dep: any) => 
          dep && dep.targetStoryTitle && dep.type && dep.reason
        );

        userStories.push({
          feature_id: matchingFeature.id,
          title: story.title,
          description: story.description,
          acceptance_criteria: story.acceptanceCriteria || [],
          priority: story.priority || 'medium',
          complexity: story.complexity || 'medium',
          estimated_hours: story.estimatedHours || 4,
          dependencies: dependencies as Json,
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
    const storyMap = new Map(userStories.map(s => [s.title, s]));
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (storyTitle: string) => {
      if (visiting.has(storyTitle)) {
        console.warn(`Circular dependency detected involving: ${storyTitle}, skipping...`);
        return;
      }
      if (visited.has(storyTitle)) return;

      visiting.add(storyTitle);
      
      const story = storyMap.get(storyTitle);
      if (story?.dependencies) {
        try {
          const deps = story.dependencies as unknown as Dependency[];
          for (const dep of deps) {
            if (dep && dep.type === 'must_do_first' && dep.targetStoryTitle) {
              if (storyMap.has(dep.targetStoryTitle)) {
                visit(dep.targetStoryTitle);
              }
            }
          }
        } catch (e) {
          console.warn(`Error processing dependencies for ${storyTitle}:`, e);
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

    const phasesJson = phases.map(phase => ({
      number: phase.number,
      name: phase.name,
      stories: phase.stories,
      estimatedHours: phase.estimatedHours
    })) as Json;

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
    let phaseNumber = 1;
    
    // Create meaningful phase names based on content
    const getPhaseNameForStories = (stories: string[], phaseNum: number): string => {
      const authStories = stories.filter(title => 
        title.toLowerCase().includes('register') ||
        title.toLowerCase().includes('login') ||
        title.toLowerCase().includes('auth') ||
        title.toLowerCase().includes('password')
      );
      
      if (authStories.length > stories.length * 0.6) {
        return 'Phase 1: Authentication & User Management';
      } else if (phaseNum === 2) {
        return 'Phase 2: Core Features';
      } else if (phaseNum === 3) {
        return 'Phase 3: Advanced Features';
      } else {
        return `Phase ${phaseNum}: Additional Features`;
      }
    };
    
    for (const storyTitle of order) {
      const story = storyMap.get(storyTitle);
      if (!story) continue;
      
      // Start new phase if current phase is getting too big (30+ hours) or we have too many stories
      if ((phaseHours > 30 && currentPhase.length > 0) || currentPhase.length >= 8) {
        phases.push({
          number: phaseNumber,
          name: getPhaseNameForStories(currentPhase, phaseNumber),
          stories: [...currentPhase],
          estimatedHours: phaseHours
        });
        currentPhase = [];
        phaseHours = 0;
        phaseNumber++;
      }
      
      currentPhase.push(storyTitle);
      phaseHours += story.estimated_hours || 0;
    }
    
    // Add final phase
    if (currentPhase.length > 0) {
      phases.push({
        number: phaseNumber,
        name: getPhaseNameForStories(currentPhase, phaseNumber),
        stories: currentPhase,
        estimatedHours: phaseHours
      });
    }
    
    return phases;
  }
}
