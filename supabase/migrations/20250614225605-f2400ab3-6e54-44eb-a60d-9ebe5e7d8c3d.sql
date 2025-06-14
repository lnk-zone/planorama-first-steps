
-- Add project_type column to the projects table
ALTER TABLE projects ADD COLUMN project_type VARCHAR(100) DEFAULT 'other';

-- Update existing projects to have a default project type
UPDATE projects SET project_type = 'other' WHERE project_type IS NULL;
