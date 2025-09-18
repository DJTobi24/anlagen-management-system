-- Add fotos column to anlagen table
ALTER TABLE anlagen 
ADD COLUMN IF NOT EXISTS fotos TEXT[];

-- Add comment for documentation
COMMENT ON COLUMN anlagen.fotos IS 'Array von Base64-kodierten Fotos der Anlage';

-- Create index for checking if fotos exist
CREATE INDEX IF NOT EXISTS idx_anlagen_has_fotos ON anlagen((fotos IS NOT NULL AND array_length(fotos, 1) > 0));