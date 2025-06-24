
-- Increase the title field length to handle longer prompt titles
ALTER TABLE generated_prompts 
ALTER COLUMN title TYPE TEXT;

-- Also increase title length for troubleshooting_guides if needed
-- (checking if it has the same constraint)
SELECT column_name, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'troubleshooting_guides' AND column_name = 'title';
