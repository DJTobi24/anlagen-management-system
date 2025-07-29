-- Add metadata columns to anlagen table
ALTER TABLE anlagen
ADD COLUMN IF NOT EXISTS pruefpflichtig BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS metadaten JSONB DEFAULT '{}';

-- Create index for metadata search
CREATE INDEX IF NOT EXISTS idx_anlagen_metadaten ON anlagen USING gin(metadaten);

-- Add comment
COMMENT ON COLUMN anlagen.pruefpflichtig IS 'Indicates if the equipment requires mandatory inspection';
COMMENT ON COLUMN anlagen.metadaten IS 'Additional metadata from import (contract, search terms, etc.)';