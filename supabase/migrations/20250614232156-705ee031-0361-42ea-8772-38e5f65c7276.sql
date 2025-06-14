
-- Project templates table
CREATE TABLE project_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  features JSONB NOT NULL DEFAULT '[]',
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Features table
CREATE TABLE features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'planned',
  category VARCHAR(100),
  complexity VARCHAR(20) DEFAULT 'medium',
  parent_id UUID REFERENCES features(id),
  order_index INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User stories table
CREATE TABLE user_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID REFERENCES features(id) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  acceptance_criteria TEXT[],
  priority VARCHAR(20) DEFAULT 'medium',
  story_points INTEGER,
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default templates
INSERT INTO project_templates (name, description, category, features) VALUES
('SaaS Web Application', 'Complete SaaS platform with user management, billing, and core features', 'web_app', '[
  {"title": "User Authentication", "description": "Login, registration, password reset", "priority": "high"},
  {"title": "User Dashboard", "description": "Main user interface and navigation", "priority": "high"},
  {"title": "Billing & Subscriptions", "description": "Payment processing and subscription management", "priority": "medium"},
  {"title": "Admin Panel", "description": "Administrative interface for managing users and content", "priority": "medium"},
  {"title": "API Integration", "description": "RESTful API for mobile and third-party integrations", "priority": "low"}
]'),
('E-commerce Platform', 'Online store with product catalog, shopping cart, and payment processing', 'ecommerce', '[
  {"title": "Product Catalog", "description": "Product listings, categories, and search", "priority": "high"},
  {"title": "Shopping Cart", "description": "Add to cart, cart management, and checkout", "priority": "high"},
  {"title": "Payment Processing", "description": "Secure payment gateway integration", "priority": "high"},
  {"title": "User Accounts", "description": "Customer registration and order history", "priority": "medium"},
  {"title": "Admin Dashboard", "description": "Inventory management and order processing", "priority": "medium"},
  {"title": "Reviews & Ratings", "description": "Customer feedback and product reviews", "priority": "low"}
]'),
('Mobile App', 'Cross-platform mobile application with core features', 'mobile_app', '[
  {"title": "User Onboarding", "description": "App introduction and account setup", "priority": "high"},
  {"title": "Core Features", "description": "Main application functionality", "priority": "high"},
  {"title": "Push Notifications", "description": "Real-time notifications and alerts", "priority": "medium"},
  {"title": "Offline Support", "description": "Offline functionality and data sync", "priority": "medium"},
  {"title": "Social Features", "description": "User profiles and social interactions", "priority": "low"},
  {"title": "Analytics", "description": "User behavior tracking and insights", "priority": "low"}
]'),
('Content Management System', 'CMS for managing and publishing content', 'cms', '[
  {"title": "Content Editor", "description": "Rich text editor for creating content", "priority": "high"},
  {"title": "Media Management", "description": "Upload and organize images, videos, files", "priority": "high"},
  {"title": "User Roles", "description": "Different permission levels for users", "priority": "medium"},
  {"title": "SEO Tools", "description": "Meta tags, sitemaps, and SEO optimization", "priority": "medium"},
  {"title": "Content Scheduling", "description": "Schedule content publication", "priority": "low"},
  {"title": "Multi-language", "description": "Support for multiple languages", "priority": "low"}
]');

-- RLS Policies
CREATE POLICY "Public templates are viewable by all" ON project_templates
  FOR SELECT USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create templates" ON project_templates
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own templates" ON project_templates
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can view own features" ON features
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM projects WHERE id = project_id)
  );

CREATE POLICY "Users can manage own features" ON features
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM projects WHERE id = project_id)
  );

CREATE POLICY "Users can view own user stories" ON user_stories
  FOR SELECT USING (
    auth.uid() = (SELECT p.user_id FROM projects p
      JOIN features f ON f.project_id = p.id
      WHERE f.id = feature_id)
  );

CREATE POLICY "Users can manage own user stories" ON user_stories
  FOR ALL USING (
    auth.uid() = (SELECT p.user_id FROM projects p
      JOIN features f ON f.project_id = p.id
      WHERE f.id = feature_id)
  );

-- Enable RLS
ALTER TABLE project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stories ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_features_project_id ON features(project_id);
CREATE INDEX idx_features_parent_id ON features(parent_id);
CREATE INDEX idx_user_stories_feature_id ON user_stories(feature_id);
CREATE INDEX idx_project_templates_category ON project_templates(category);
