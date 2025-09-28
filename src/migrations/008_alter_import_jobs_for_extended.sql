-- Drop existing import_jobs and recreate with new schema for extended import
DROP TABLE IF EXISTS import_jobs CASCADE;

-- Create import_jobs table to track all imports
CREATE TABLE IF NOT EXISTS import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    mandant_id UUID NOT NULL REFERENCES mandanten(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed, cancelled
    total_rows INTEGER DEFAULT 0,
    processed_rows INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    CONSTRAINT fk_import_jobs_mandant FOREIGN KEY (mandant_id) REFERENCES mandanten(id),
    CONSTRAINT fk_import_jobs_user FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create import_errors table to store detailed error information
CREATE TABLE IF NOT EXISTS import_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_job_id UUID NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
    row_number INTEGER NOT NULL,
    anlagencode VARCHAR(255),
    anlagenname VARCHAR(255),
    error_message TEXT NOT NULL,
    error_data JSONB, -- Store complete row data that failed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_import_errors_job FOREIGN KEY (import_job_id) REFERENCES import_jobs(id)
);

-- Create indexes for better query performance
CREATE INDEX idx_import_jobs_mandant_id ON import_jobs(mandant_id);
CREATE INDEX idx_import_jobs_status ON import_jobs(status);
CREATE INDEX idx_import_jobs_created_at ON import_jobs(created_at DESC);
CREATE INDEX idx_import_errors_job_id ON import_errors(import_job_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_import_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_import_jobs_updated_at_trigger
BEFORE UPDATE ON import_jobs
FOR EACH ROW
EXECUTE FUNCTION update_import_jobs_updated_at();