
-- Delete duplicate mindmaps, keeping only the most recent one per project
WITH ranked_mindmaps AS (
  SELECT 
    id,
    project_id,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at DESC) as rn
  FROM mindmaps
)
DELETE FROM mindmaps 
WHERE id IN (
  SELECT id 
  FROM ranked_mindmaps 
  WHERE rn > 1
);
