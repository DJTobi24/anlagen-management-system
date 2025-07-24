-- Add maintenance interval to AKS codes
ALTER TABLE aks_codes 
ADD COLUMN maintenance_interval_months INTEGER DEFAULT NULL,
ADD COLUMN maintenance_type VARCHAR(50) DEFAULT 'standard',
ADD COLUMN maintenance_description TEXT DEFAULT NULL;

-- Create AKS import log table
CREATE TABLE aks_import_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    total_records INTEGER NOT NULL,
    imported_records INTEGER NOT NULL,
    failed_records INTEGER NOT NULL,
    errors JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Function to validate AKS code format
CREATE OR REPLACE FUNCTION validate_aks_code_format(p_code VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if AKS code matches pattern AKS.XX.XXX.XX.XX
    RETURN p_code ~ '^AKS\.[0-9]{2}\.[0-9]{3}\.[0-9]{2}\.[0-9]{2}$';
END;
$$ LANGUAGE plpgsql;

-- Update existing sample data with maintenance intervals
UPDATE aks_codes 
SET 
    maintenance_interval_months = 12,
    maintenance_type = 'jährlich',
    maintenance_description = 'Jährliche Wartung und Funktionskontrolle'
WHERE code = 'AKS.03.470.07.03';

UPDATE aks_codes 
SET 
    maintenance_interval_months = 6,
    maintenance_type = 'halbjährlich', 
    maintenance_description = 'Halbjährliche Filter- und Funktionskontrolle'
WHERE code = 'AKS.02.310.01.01';

UPDATE aks_codes 
SET 
    maintenance_interval_months = 24,
    maintenance_type = 'alle 2 Jahre',
    maintenance_description = 'Prüfung nach DGUV V3'
WHERE code = 'AKS.05.110.02.01';

-- Create index for maintenance queries
CREATE INDEX idx_aks_codes_maintenance ON aks_codes(maintenance_interval_months);
CREATE INDEX idx_aks_import_logs_created_by ON aks_import_logs(created_by);
CREATE INDEX idx_aks_import_logs_created_at ON aks_import_logs(created_at);