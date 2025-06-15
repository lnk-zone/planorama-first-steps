
-- Enable RLS on user_stories table (it should already exist based on the schema)
ALTER TABLE user_stories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_stories
CREATE POLICY "Users can view their own user stories" ON user_stories
FOR SELECT USING (
  auth.uid() = (SELECT p.user_id FROM projects p
  JOIN features f ON f.project_id = p.id
  WHERE f.id = feature_id)
);

CREATE POLICY "Users can create user stories for their features" ON user_stories
FOR INSERT WITH CHECK (
  auth.uid() = (SELECT p.user_id FROM projects p
  JOIN features f ON f.project_id = p.id
  WHERE f.id = feature_id)
);

CREATE POLICY "Users can update their own user stories" ON user_stories
FOR UPDATE USING (
  auth.uid() = (SELECT p.user_id FROM projects p
  JOIN features f ON f.project_id = p.id
  WHERE f.id = feature_id)
);

CREATE POLICY "Users can delete their own user stories" ON user_stories
FOR DELETE USING (
  auth.uid() = (SELECT p.user_id FROM projects p
  JOIN features f ON f.project_id = p.id
  WHERE f.id = feature_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_stories_feature_id ON user_stories(feature_id);
CREATE INDEX IF NOT EXISTS idx_user_stories_status ON user_stories(status);
CREATE INDEX IF NOT EXISTS idx_user_stories_priority ON user_stories(priority);
