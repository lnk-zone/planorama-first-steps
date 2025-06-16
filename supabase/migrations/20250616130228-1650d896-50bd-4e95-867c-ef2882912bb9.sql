
-- Add execution order and dependency fields to user_stories table
ALTER TABLE user_stories ADD COLUMN execution_order INTEGER;
ALTER TABLE user_stories ADD COLUMN dependencies JSONB DEFAULT '[]';
ALTER TABLE user_stories ADD COLUMN estimated_hours INTEGER DEFAULT 4;
ALTER TABLE user_stories ADD COLUMN complexity VARCHAR(20) DEFAULT 'medium';

-- Add execution order and estimated hours to features table  
ALTER TABLE features ADD COLUMN execution_order INTEGER;
ALTER TABLE features ADD COLUMN estimated_hours INTEGER;

-- Create execution plan tracking table
CREATE TABLE execution_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  total_stories INTEGER NOT NULL,
  estimated_total_hours INTEGER NOT NULL,
  phases JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
