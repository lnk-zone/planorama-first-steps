
-- Generated prompts storage
CREATE TABLE generated_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_story_id UUID REFERENCES user_stories(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  prompt_type VARCHAR(50) NOT NULL, -- 'story', 'phase_overview', 'transition'
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  execution_order INTEGER NOT NULL,
  phase_number INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- General troubleshooting guide (one per project/platform)
CREATE TABLE troubleshooting_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  sections JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Story completion tracking
CREATE TABLE story_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_story_id UUID REFERENCES user_stories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at TIMESTAMP DEFAULT NOW(),
  platform VARCHAR(50) NOT NULL,
  notes TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_generated_prompts_project_platform ON generated_prompts(project_id, platform);
CREATE INDEX idx_generated_prompts_execution_order ON generated_prompts(execution_order);
CREATE INDEX idx_troubleshooting_guides_project_platform ON troubleshooting_guides(project_id, platform);
CREATE INDEX idx_story_completions_project_user ON story_completions(project_id, user_id);
