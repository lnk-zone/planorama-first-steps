
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GenerationResult {
  features: any[];
  userStories: any[];
  executionPlan: {
    phases: any[];
    executionOrder: string[];
    estimatedTotalHours: number;
  };
}

export interface GenerationProgressData {
  stage: 'analyzing' | 'generating_features' | 'creating_stories' | 'calculating_order' | 'complete';
  progress: number;
  currentAction: string;
}

export interface EnhancedProjectInput {
  projectTitle: string;
  projectDescription: string;
  appType: 'saas' | 'marketplace' | 'ecommerce' | 'ai_tool' | 'social' | 'productivity' | 'other';
  targetUsers: string;
  coreUserActions: string;
  monetizationModel: 'subscription' | 'one_time' | 'freemium' | 'ads' | 'marketplace_fees' | 'other';
  specificRequirements: string[];
  technicalPreferences?: string;
  complexity: 'simple' | 'medium' | 'complex';
  includeAdvancedFeatures: boolean;
}

export class AIFeatureGenerator {
  private progressCallback?: (progress: GenerationProgressData) => void;

  constructor(progressCallback?: (progress: GenerationProgressData) => void) {
    this.progressCallback = progressCallback;
  }

  private updateProgress(stage: GenerationProgressData['stage'], progress: number, currentAction: string) {
    if (this.progressCallback) {
      this.progressCallback({ stage, progress, currentAction });
    }
  }

  async generateFeaturesWithDependencies(
    projectId: string,
    description: string,
    appType: string,
    enhancedInput?: EnhancedProjectInput,
    isRegeneration = false
  ): Promise<GenerationResult> {
    try {
      this.updateProgress('analyzing', 10, 'Analyzing project requirements...');

      // If regeneration, clear existing features and stories
      if (isRegeneration) {
        this.updateProgress('analyzing', 20, 'Clearing existing features...');
        await this.clearExistingData(projectId);
      }

      this.updateProgress('generating_features', 30, 'Generating comprehensive features...');

      // Call the enhanced generate-features edge function
      const { data: generationResult, error: functionError } = await supabase
        .functions
        .invoke('generate-features', {
          body: {
            description,
            appType,
            enhancedInput
          }
        });

      if (functionError) {
        console.error('Generation function error:', functionError);
        throw new Error(`Feature generation failed: ${functionError.message}`);
      }

      if (!generationResult?.features || !generationResult?.userStories) {
        throw new Error('Invalid response from feature generation service');
      }

      this.updateProgress('creating_stories', 60, 'Processing user stories...');

      // Process and save features
      const features = await this.processAndSaveFeatures(projectId, generationResult.features);
      
      this.updateProgress('creating_stories', 80, 'Creating user stories with dependencies...');

      // Process and save user stories
      const userStories = await this.processAndSaveUserStories(projectId, features, generationResult.userStories);

      this.updateProgress('calculating_order', 90, 'Calculating execution order...');

      // Generate execution plan
      const executionPlan = this.generateExecutionPlan(features, userStories);

      this.updateProgress('complete', 100, 'Generation complete!');

      return {
        features,
        userStories,
        executionPlan
      };

    } catch (error) {
      console.error('Feature generation failed:', error);
      throw error;
    }
  }

  private async clearExistingData(projectId: string) {
    // Delete user stories first (due to foreign key constraints)
    const { data: features } = await supabase
      .from('features')
      .select('id')
      .eq('project_id', projectId);

    if (features && features.length > 0) {
      const featureIds = features.map(f => f.id);
      
      await supabase
        .from('user_stories')
        .delete()
        .in('feature_id', featureIds);
    }

    // Then delete features
    await supabase
      .from('features')
      .delete()
      .eq('project_id', projectId);
  }

  private async processAndSaveFeatures(projectId: string, rawFeatures: any[]): Promise<any[]> {
    const features = [];
    
    for (let i = 0; i < rawFeatures.length; i++) {
      const feature = rawFeatures[i];
      
      const { data: savedFeature, error } = await supabase
        .from('features')
        .insert({
          project_id: projectId,
          title: feature.title || feature.name,
          description: feature.description,
          priority: feature.priority || 'medium',
          complexity: feature.complexity || 'medium',
          category: feature.category || 'core',
          status: 'planned',
          estimated_hours: feature.estimatedHours || 8,
          execution_order: i + 1
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving feature:', error);
        throw new Error(`Failed to save feature: ${feature.title}`);
      }

      features.push(savedFeature);
    }

    return features;
  }

  private async processAndSaveUserStories(projectId: string, features: any[], rawUserStories: any[]): Promise<any[]> {
    const userStories = [];
    let executionOrder = 1;

    for (const storyGroup of rawUserStories) {
      const feature = features.find(f => f.title === storyGroup.featureTitle);
      
      if (!feature) {
        console.warn(`Feature not found for stories: ${storyGroup.featureTitle}`);
        continue;
      }

      for (const story of storyGroup.userStories || []) {
        const { data: savedStory, error } = await supabase
          .from('user_stories')
          .insert({
            feature_id: feature.id,
            title: typeof story === 'string' ? story : story.title,
            description: typeof story === 'string' ? story : story.description,
            acceptance_criteria: typeof story === 'object' ? story.acceptanceCriteria : [],
            priority: typeof story === 'object' ? story.priority : 'medium',
            complexity: typeof story === 'object' ? story.complexity : 'medium',
            estimated_hours: typeof story === 'object' ? story.estimatedHours : 4,
            execution_order: executionOrder++,
            status: 'draft',
            dependencies: typeof story === 'object' ? story.dependencies : []
          })
          .select()
          .single();

        if (error) {
          console.error('Error saving user story:', error);
          throw new Error(`Failed to save user story: ${typeof story === 'string' ? story : story.title}`);
        }

        userStories.push(savedStory);
      }
    }

    return userStories;
  }

  private generateExecutionPlan(features: any[], userStories: any[]) {
    const sortedStories = [...userStories].sort((a, b) => (a.execution_order || 0) - (b.execution_order || 0));
    const executionOrder = sortedStories.map(story => story.title);
    
    // Group stories into logical phases
    const phases = [];
    const storiesPerPhase = Math.ceil(sortedStories.length / 3);
    
    for (let i = 0; i < sortedStories.length; i += storiesPerPhase) {
      const phaseStories = sortedStories.slice(i, i + storiesPerPhase);
      const phaseNumber = Math.floor(i / storiesPerPhase) + 1;
      
      phases.push({
        number: phaseNumber,
        name: `Phase ${phaseNumber}: ${this.getPhaseNameFromStories(phaseStories)}`,
        stories: phaseStories.map(s => s.title),
        estimatedHours: phaseStories.reduce((sum, s) => sum + (s.estimated_hours || 4), 0)
      });
    }

    const estimatedTotalHours = userStories.reduce((sum, story) => sum + (story.estimated_hours || 4), 0);

    return {
      phases,
      executionOrder,
      estimatedTotalHours
    };
  }

  private getPhaseNameFromStories(stories: any[]): string {
    const authStories = stories.filter(s => 
      s.title.toLowerCase().includes('auth') || 
      s.title.toLowerCase().includes('login') || 
      s.title.toLowerCase().includes('register')
    );
    
    if (authStories.length > 0) {
      return 'Authentication & Foundation';
    }
    
    const coreStories = stories.filter(s => s.priority === 'high');
    if (coreStories.length > stories.length / 2) {
      return 'Core Features';
    }
    
    return 'Advanced Features';
  }
}
