
-- Add metadata columns to project_templates table
ALTER TABLE project_templates 
ADD COLUMN tags TEXT[],
ADD COLUMN difficulty_level VARCHAR(20) DEFAULT 'beginner',
ADD COLUMN estimated_hours INTEGER,
ADD COLUMN version INTEGER DEFAULT 1,
ADD COLUMN parent_template_id UUID REFERENCES project_templates(id),
ADD COLUMN is_featured BOOLEAN DEFAULT false;

-- Create template usage tracking table
CREATE TABLE template_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES project_templates(id) NOT NULL,
  used_by UUID REFERENCES auth.users(id) NOT NULL,
  project_id UUID REFERENCES projects(id),
  used_at TIMESTAMP DEFAULT NOW(),
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_text TEXT
);

-- Create template categories table for better organization
CREATE TABLE template_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default categories
INSERT INTO template_categories (name, description, icon, display_order) VALUES
('Web Application', 'Full-stack web applications', 'Globe', 1),
('Mobile App', 'Mobile applications for iOS and Android', 'Smartphone', 2),
('SaaS Platform', 'Software as a Service platforms', 'Cloud', 3),
('E-commerce', 'Online stores and marketplaces', 'ShoppingCart', 4),
('Content Management', 'CMS and content platforms', 'FileText', 5),
('API & Backend', 'Backend services and APIs', 'Server', 6),
('Dashboard & Analytics', 'Admin panels and analytics', 'BarChart', 7),
('Portfolio & Blog', 'Personal websites and blogs', 'User', 8);

-- Add RLS policies for new tables
ALTER TABLE template_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;

-- Template usage policies
CREATE POLICY "Users can view all template usage" ON template_usage
FOR SELECT USING (true);

CREATE POLICY "Users can create their own usage records" ON template_usage
FOR INSERT WITH CHECK (auth.uid() = used_by);

CREATE POLICY "Users can update their own usage records" ON template_usage
FOR UPDATE USING (auth.uid() = used_by);

-- Template categories policies (public read)
CREATE POLICY "Anyone can view template categories" ON template_categories
FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can manage categories" ON template_categories
FOR ALL USING (false); -- Will be updated when admin system is implemented

-- Update existing RLS policies for project_templates
DROP POLICY IF EXISTS "Public templates are viewable by all" ON project_templates;
DROP POLICY IF EXISTS "Users can create templates" ON project_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON project_templates;

CREATE POLICY "Public templates are viewable by all" ON project_templates
FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create templates" ON project_templates
FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own templates" ON project_templates
FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own templates" ON project_templates
FOR DELETE USING (auth.uid() = created_by);

-- Add indexes for better performance
CREATE INDEX idx_project_templates_tags ON project_templates USING GIN(tags);
CREATE INDEX idx_project_templates_difficulty ON project_templates(difficulty_level);
CREATE INDEX idx_project_templates_featured ON project_templates(is_featured) WHERE is_featured = true;
CREATE INDEX idx_template_usage_template_id ON template_usage(template_id);
CREATE INDEX idx_template_usage_used_by ON template_usage(used_by);
CREATE INDEX idx_template_categories_active ON template_categories(is_active) WHERE is_active = true;
