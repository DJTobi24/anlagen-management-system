-- Create AKS codes table
CREATE TABLE aks_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create AKS fields table
CREATE TABLE aks_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aks_code_id UUID NOT NULL REFERENCES aks_codes(id) ON DELETE CASCADE,
    kas_code VARCHAR(50) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    field_type VARCHAR(20) NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'boolean', 'select', 'multiselect', 'textarea', 'file', 'radio', 'checkbox')),
    data_type VARCHAR(20) NOT NULL CHECK (data_type IN ('string', 'integer', 'decimal', 'date', 'boolean', 'json')),
    unit VARCHAR(50),
    is_required BOOLEAN DEFAULT false,
    min_value DECIMAL,
    max_value DECIMAL,
    min_length INTEGER,
    max_length INTEGER,
    regex VARCHAR(500),
    options JSONB DEFAULT '[]',
    default_value TEXT,
    help_text TEXT,
    field_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(aks_code_id, kas_code)
);

-- Create table for tracking which fields have been filled for each anlage
CREATE TABLE anlage_aks_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    anlage_id UUID NOT NULL REFERENCES anlagen(id) ON DELETE CASCADE,
    aks_field_id UUID NOT NULL REFERENCES aks_fields(id) ON DELETE CASCADE,
    kas_code VARCHAR(50) NOT NULL,
    value TEXT,
    value_json JSONB,
    is_valid BOOLEAN DEFAULT true,
    validation_errors JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(anlage_id, aks_field_id)
);

-- Create indexes for performance
CREATE INDEX idx_aks_codes_code ON aks_codes(code);
CREATE INDEX idx_aks_codes_category ON aks_codes(category);
CREATE INDEX idx_aks_codes_is_active ON aks_codes(is_active);

CREATE INDEX idx_aks_fields_aks_code_id ON aks_fields(aks_code_id);
CREATE INDEX idx_aks_fields_kas_code ON aks_fields(kas_code);
CREATE INDEX idx_aks_fields_field_type ON aks_fields(field_type);
CREATE INDEX idx_aks_fields_is_required ON aks_fields(is_required);

CREATE INDEX idx_anlage_aks_values_anlage_id ON anlage_aks_values(anlage_id);
CREATE INDEX idx_anlage_aks_values_aks_field_id ON anlage_aks_values(aks_field_id);
CREATE INDEX idx_anlage_aks_values_kas_code ON anlage_aks_values(kas_code);

-- Create triggers for updated_at
CREATE TRIGGER update_aks_codes_updated_at 
    BEFORE UPDATE ON aks_codes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aks_fields_updated_at 
    BEFORE UPDATE ON aks_fields 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_anlage_aks_values_updated_at 
    BEFORE UPDATE ON anlage_aks_values 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample AKS codes and fields
INSERT INTO aks_codes (code, name, description, category) VALUES
('AKS.03.470.07.03', 'Enthärtungsanlage', 'Wasserenthärtung für Gebäudetechnik', 'Sanitär'),
('AKS.02.310.01.01', 'Lüftungsanlage', 'Raumlufttechnische Anlage', 'HLK'),
('AKS.05.110.02.01', 'Schaltanlage NS', 'Niederspannungshauptverteilung', 'Elektro');

-- Insert sample fields for AKS.03.470.07.03
INSERT INTO aks_fields (aks_code_id, kas_code, field_name, display_name, field_type, data_type, unit, is_required, min_value, max_value, field_order)
SELECT 
    id, 'KAS1273', '11_Leitfähigkeit', 'Leitfähigkeit', 'number', 'decimal', 'μS/cm', true, 0, 10000, 1
FROM aks_codes WHERE code = 'AKS.03.470.07.03';

INSERT INTO aks_fields (aks_code_id, kas_code, field_name, display_name, field_type, data_type, unit, is_required, min_value, max_value, field_order)
SELECT 
    id, 'KAS1274', '12_Nenndurchfluss', 'Nenndurchfluss', 'number', 'decimal', 'm³/h', true, 0, 1000, 2
FROM aks_codes WHERE code = 'AKS.03.470.07.03';

INSERT INTO aks_fields (aks_code_id, kas_code, field_name, display_name, field_type, data_type, unit, is_required, field_order)
SELECT 
    id, 'KAS1275', '13_Betriebsstunden', 'Betriebsstunden', 'number', 'integer', 'h', false, 0, NULL, 3
FROM aks_codes WHERE code = 'AKS.03.470.07.03';

INSERT INTO aks_fields (aks_code_id, kas_code, field_name, display_name, field_type, data_type, is_required, options, field_order)
SELECT 
    id, 'KAS1276', '14_Wartungsstatus', 'Wartungsstatus', 'select', 'string', true, 
    '[{"value": "gewartet", "label": "Gewartet", "order": 1}, {"value": "wartung_faellig", "label": "Wartung fällig", "order": 2}, {"value": "defekt", "label": "Defekt", "order": 3}]'::jsonb, 4
FROM aks_codes WHERE code = 'AKS.03.470.07.03';

-- Function to get all required fields for an AKS code
CREATE OR REPLACE FUNCTION get_aks_required_fields(p_aks_code VARCHAR)
RETURNS TABLE (
    field_id UUID,
    kas_code VARCHAR,
    field_name VARCHAR,
    display_name VARCHAR,
    field_type VARCHAR,
    data_type VARCHAR,
    unit VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.kas_code,
        f.field_name,
        f.display_name,
        f.field_type,
        f.data_type,
        f.unit
    FROM aks_fields f
    JOIN aks_codes c ON f.aks_code_id = c.id
    WHERE c.code = p_aks_code 
    AND f.is_required = true
    AND c.is_active = true
    ORDER BY f.field_order;
END;
$$ LANGUAGE plpgsql;

-- Function to validate AKS field value
CREATE OR REPLACE FUNCTION validate_aks_field_value(
    p_field_id UUID,
    p_value TEXT
) RETURNS JSONB AS $$
DECLARE
    v_field RECORD;
    v_errors JSONB := '[]'::jsonb;
    v_numeric_value DECIMAL;
BEGIN
    SELECT * INTO v_field FROM aks_fields WHERE id = p_field_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_array('Field not found');
    END IF;
    
    -- Required field check
    IF v_field.is_required AND (p_value IS NULL OR p_value = '') THEN
        v_errors := v_errors || jsonb_build_object('error', 'Required field is empty');
        RETURN v_errors;
    END IF;
    
    -- Skip validation if value is empty and not required
    IF p_value IS NULL OR p_value = '' THEN
        RETURN v_errors;
    END IF;
    
    -- Type-specific validation
    CASE v_field.data_type
        WHEN 'integer', 'decimal' THEN
            BEGIN
                v_numeric_value := p_value::DECIMAL;
                
                IF v_field.min_value IS NOT NULL AND v_numeric_value < v_field.min_value THEN
                    v_errors := v_errors || jsonb_build_object('error', 'Value below minimum: ' || v_field.min_value);
                END IF;
                
                IF v_field.max_value IS NOT NULL AND v_numeric_value > v_field.max_value THEN
                    v_errors := v_errors || jsonb_build_object('error', 'Value above maximum: ' || v_field.max_value);
                END IF;
            EXCEPTION WHEN OTHERS THEN
                v_errors := v_errors || jsonb_build_object('error', 'Invalid numeric value');
            END;
            
        WHEN 'string' THEN
            IF v_field.min_length IS NOT NULL AND length(p_value) < v_field.min_length THEN
                v_errors := v_errors || jsonb_build_object('error', 'Value too short, minimum length: ' || v_field.min_length);
            END IF;
            
            IF v_field.max_length IS NOT NULL AND length(p_value) > v_field.max_length THEN
                v_errors := v_errors || jsonb_build_object('error', 'Value too long, maximum length: ' || v_field.max_length);
            END IF;
            
            IF v_field.regex IS NOT NULL AND p_value !~ v_field.regex THEN
                v_errors := v_errors || jsonb_build_object('error', 'Value does not match required pattern');
            END IF;
            
        WHEN 'date' THEN
            BEGIN
                PERFORM p_value::DATE;
            EXCEPTION WHEN OTHERS THEN
                v_errors := v_errors || jsonb_build_object('error', 'Invalid date format');
            END;
            
        WHEN 'boolean' THEN
            IF p_value NOT IN ('true', 'false', '1', '0', 't', 'f') THEN
                v_errors := v_errors || jsonb_build_object('error', 'Invalid boolean value');
            END IF;
    END CASE;
    
    -- Check if value is in options for select/radio fields
    IF v_field.field_type IN ('select', 'radio') AND v_field.options IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM jsonb_array_elements(v_field.options) AS opt
            WHERE opt->>'value' = p_value
        ) THEN
            v_errors := v_errors || jsonb_build_object('error', 'Value not in allowed options');
        END IF;
    END IF;
    
    RETURN v_errors;
END;
$$ LANGUAGE plpgsql;