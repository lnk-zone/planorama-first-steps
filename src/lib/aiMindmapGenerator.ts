
import { supabase } from '@/integrations/supabase/client';
import type { Feature } from '@/hooks/useFeatures';
import type { UserStory } from '@/hooks/useUserStories';

export interface MindmapData {
  id: string;
  project_id: string;
  data: any;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface GenerationResult {
  mindmapData: MindmapData;
  features: Feature[];
  userStories: UserStory[];
}

export interface GenerationProgress {
  stage: 'analyzing' | 'generating_structure' | 'creating_features' | 'generating_stories' | 'complete';
  progress: number;
  currentAction: string;
}

export class AIMindmapGenerator {
  private onProgress?: (progress: GenerationProgress) => void;

  constructor(onProgress?: (progress: GenerationProgress) => void) {
    this.onProgress = onProgress;
  }

  async generateMindmapFromDescription(
    projectId: string,
    projectDescription: string,
    appType: string = 'web_app'
  ): Promise<GenerationResult> {
    try {
      this.updateProgress('analyzing', 10, 'Analyzing project description...');

      const prompt = this.buildMindmapGenerationPrompt(projectDescription, appType);
      
      this.updateProgress('generating_structure', 30, 'Generating mindmap structure with AI...');

      const response = await fetch('/api/generate-mindmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          projectDescription,
          appType
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate mindmap');
      }

      const aiResponse = await response.json();
      
      this.updateProgress('creating_features', 60, 'Creating features from mindmap...');

      // 1. Create mindmap record with JSONB structure
      const mindmapData = await this.createMindmapRecord(projectId, aiResponse.mindmap);
      
      // 2. Create features from mindmap nodes
      const features = await this.createFeaturesFromNodes(projectId, aiResponse.features);
      
      this.updateProgress('generating_stories', 80, 'Generating user stories...');
      
      // 3. Create user stories for each feature
      const userStories = await this.createUserStoriesFromFeatures(features, aiResponse.userStories);
      
      // 4. Update mindmap with feature IDs for synchronization
      await this.linkMindmapToFeatures(mindmapData.id, features);

      this.updateProgress('complete', 100, 'Mindmap generation complete!');

      return { mindmapData, features, userStories };
    } catch (error) {
      console.error('AI mindmap generation failed:', error);
      throw new Error('Failed to generate mindmap. Please try again.');
    }
  }

  private updateProgress(stage: GenerationProgress['stage'], progress: number, currentAction: string) {
    if (this.onProgress) {
      this.onProgress({ stage, progress, currentAction });
    }
  }

  private buildMindmapGenerationPrompt(description: string, appType: string): string {
    return `
Generate a comprehensive mindmap structure and detailed features for this ${appType} project:

PROJECT DESCRIPTION:
${description}

Return JSON with this EXACT structure:
{
  "mindmap": {
    "rootNode": {
      "id": "root",
      "title": "App Name",
      "description": "Brief app description",
      "position": { "x": 0, "y": 0 },
      "style": { "color": "#1f2937", "size": "large" }
    },
    "nodes": [
      {
        "id": "unique_id",
        "title": "Feature Name",
        "description": "Feature description",
        "parentId": "root",
        "position": { "x": 200, "y": -100 },
        "style": { "color": "#3b82f6", "size": "medium" },
        "metadata": {
          "priority": "high|medium|low",
          "complexity": "low|medium|high",
          "category": "core|ui|integration|admin"
        }
      }
    ],
    "connections": [
      { "from": "root", "to": "node_id" }
    ]
  },
  "features": [
    {
      "nodeId": "matching_node_id",
      "title": "Feature Name",
      "description": "Detailed feature description",
      "priority": "high|medium|low",
      "category": "core|ui|integration|admin",
      "complexity": "low|medium|high"
    }
  ],
  "userStories": [
    {
      "featureTitle": "Matching feature title",
      "title": "As a [user type], I can [action]",
      "description": "Detailed user story description",
      "acceptanceCriteria": ["Criteria 1", "Criteria 2", "Criteria 3"],
      "priority": "high|medium|low"
    }
  ]
}

REQUIREMENTS:
- Generate 8-15 main feature nodes with 2-4 sub-features each
- Position nodes in a logical visual hierarchy
- Include rich descriptions and metadata
- Generate 2-3 user stories per feature
- Focus on core functionality first, then supporting features
- Use consistent color coding by category
    `.trim();
  }

  private async createMindmapRecord(projectId: string, mindmapData: any): Promise<MindmapData> {
    const { data, error } = await supabase
      .from('mindmaps')
      .insert({
        project_id: projectId,
        data: mindmapData,
        version: 1
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async createFeaturesFromNodes(projectId: string, aiFeatures: any[]): Promise<Feature[]> {
    const features = aiFeatures.map(f => ({
      project_id: projectId,
      title: f.title,
      description: f.description,
      priority: f.priority || 'medium',
      category: f.category || 'core',
      complexity: f.complexity || 'medium',
      metadata: {
        generated_by_ai: true,
        node_id: f.nodeId,
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

  private async createUserStoriesFromFeatures(features: Feature[], aiUserStories: any[]): Promise<UserStory[]> {
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

  private async linkMindmapToFeatures(mindmapId: string, features: Feature[]): Promise<void> {
    const featureMap = features.reduce((acc, feature) => {
      const nodeId = feature.metadata?.node_id;
      if (nodeId) {
        acc[nodeId] = feature.id;
      }
      return acc;
    }, {} as Record<string, string>);

    const { error } = await supabase
      .from('mindmaps')
      .update({
        metadata: { feature_mapping: featureMap },
        updated_at: new Date().toISOString()
      })
      .eq('id', mindmapId);

    if (error) throw error;
  }
}
