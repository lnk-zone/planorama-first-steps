
-- Add story dependencies table
CREATE TABLE story_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES user_stories(id) ON DELETE CASCADE,
  depends_on_story_id UUID NOT NULL REFERENCES user_stories(id) ON DELETE CASCADE,
  dependency_type VARCHAR(50) DEFAULT 'blocks',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(story_id, depends_on_story_id)
);

-- Add story templates table
CREATE TABLE story_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  title_template TEXT NOT NULL,
  description_template TEXT,
  acceptance_criteria_template TEXT[],
  category VARCHAR(100),
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add story relationships tracking
CREATE TABLE story_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_story_id UUID REFERENCES user_stories(id) ON DELETE CASCADE,
  child_story_id UUID REFERENCES user_stories(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) DEFAULT 'split_from',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add bulk operation tracking for audit
CREATE TABLE story_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_type VARCHAR(50) NOT NULL,
  story_ids UUID[] NOT NULL,
  changes JSONB,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policies for story_dependencies
ALTER TABLE story_dependencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view dependencies for their stories" ON story_dependencies
FOR SELECT USING (
  auth.uid() = (SELECT p.user_id FROM projects p
  JOIN features f ON f.project_id = p.id
  JOIN user_stories s ON s.feature_id = f.id
  WHERE s.id = story_id)
);
CREATE POLICY "Users can manage dependencies for their stories" ON story_dependencies
FOR ALL USING (
  auth.uid() = (SELECT p.user_id FROM projects p
  JOIN features f ON f.project_id = p.id
  JOIN user_stories s ON s.feature_id = f.id
  WHERE s.id = story_id)
);

-- RLS Policies for story_templates
ALTER TABLE story_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public templates are viewable by all" ON story_templates
FOR SELECT USING (is_public = true OR created_by = auth.uid());
CREATE POLICY "Users can create templates" ON story_templates
FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update own templates" ON story_templates
FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own templates" ON story_templates
FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for story_relationships
ALTER TABLE story_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view relationships for their stories" ON story_relationships
FOR SELECT USING (
  auth.uid() = (SELECT p.user_id FROM projects p
  JOIN features f ON f.project_id = p.id
  JOIN user_stories s ON s.feature_id = f.id
  WHERE s.id = parent_story_id OR s.id = child_story_id)
);
CREATE POLICY "Users can manage relationships for their stories" ON story_relationships
FOR ALL USING (
  auth.uid() = (SELECT p.user_id FROM projects p
  JOIN features f ON f.project_id = p.id
  JOIN user_stories s ON s.feature_id = f.id
  WHERE s.id = parent_story_id OR s.id = child_story_id)
);

-- RLS Policies for story_operations
ALTER TABLE story_operations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own operations" ON story_operations
FOR SELECT USING (auth.uid() = performed_by);
CREATE POLICY "Users can create operations" ON story_operations
FOR INSERT WITH CHECK (auth.uid() = performed_by);

-- Insert default story templates
INSERT INTO story_templates (name, description, title_template, description_template, acceptance_criteria_template, category, created_by) VALUES
('User Registration', 'Template for user registration stories', 'As a new user, I want to register for an account', 'So that I can access the platform and save my data', ARRAY['Registration form displays all required fields', 'User can submit form with valid data', 'System validates email format', 'User receives confirmation email', 'Account is created successfully'], 'Authentication', NULL),
('Data Export', 'Template for data export functionality', 'As a user, I want to export my data', 'So that I can backup or transfer my information', ARRAY['Export button is visible and accessible', 'User can select data format (CSV, JSON, PDF)', 'Export includes all relevant data', 'Downloaded file is properly formatted', 'Large datasets are handled efficiently'], 'Data Management', NULL),
('Payment Processing', 'Template for payment-related stories', 'As a customer, I want to make a payment', 'So that I can complete my purchase', ARRAY['Payment form accepts valid card details', 'System validates payment information', 'Payment is processed securely', 'User receives payment confirmation', 'Transaction is recorded correctly'], 'E-commerce', NULL),
('Search Functionality', 'Template for search features', 'As a user, I want to search for content', 'So that I can quickly find what I need', ARRAY['Search input is prominently displayed', 'Search returns relevant results', 'Results are displayed clearly', 'Search handles typos gracefully', 'Advanced filters are available'], 'Search', NULL);

-- Indexes for performance
CREATE INDEX idx_story_dependencies_story_id ON story_dependencies(story_id);
CREATE INDEX idx_story_dependencies_depends_on ON story_dependencies(depends_on_story_id);
CREATE INDEX idx_story_relationships_parent ON story_relationships(parent_story_id);
CREATE INDEX idx_story_relationships_child ON story_relationships(child_story_id);
CREATE INDEX idx_story_templates_category ON story_templates(category);
CREATE INDEX idx_story_operations_performed_by ON story_operations(performed_by);
