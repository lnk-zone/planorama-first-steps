
-- PRD storage table
CREATE TABLE prds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  template VARCHAR(50) NOT NULL DEFAULT 'comprehensive',
  sections JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- PRD sections for granular editing
CREATE TABLE prd_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prd_id UUID REFERENCES prds(id) ON DELETE CASCADE,
  section_name VARCHAR(100) NOT NULL,
  section_order INTEGER NOT NULL,
  content TEXT NOT NULL,
  is_editable BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
