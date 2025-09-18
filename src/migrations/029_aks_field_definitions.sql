-- Migration: AKS Field Definitions
-- Adds support for required and optional fields per AKS code

-- Create field types enum
CREATE TYPE field_type AS ENUM (
    'text',
    'number',
    'decimal',
    'date',
    'boolean',
    'select',
    'multiselect',
    'unit_value'  -- Wert mit Einheit (z.B. 100 Liter, 5 bar)
);

-- Create field validation rules enum
CREATE TYPE field_validation AS ENUM (
    'required',
    'min_value',
    'max_value',
    'regex',
    'min_length',
    'max_length',
    'custom'
);

-- AKS Field Definitions table
CREATE TABLE IF NOT EXISTS aks_field_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aks_code VARCHAR(50) NOT NULL REFERENCES aks_codes(code) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    field_label VARCHAR(200) NOT NULL,
    field_type field_type NOT NULL DEFAULT 'text',
    is_required BOOLEAN NOT NULL DEFAULT false,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(50), -- z.B. 'Liter', 'bar', 'm³', 'kW'
    default_value TEXT,
    placeholder TEXT,
    help_text TEXT,
    min_value NUMERIC,
    max_value NUMERIC,
    regex_pattern VARCHAR(500),
    select_options JSONB, -- Für select/multiselect Felder
    validation_rules JSONB, -- Zusätzliche Validierungsregeln
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(aks_code, field_name)
);

-- Create index for faster lookups
CREATE INDEX idx_aks_field_definitions_aks_code ON aks_field_definitions(aks_code);
CREATE INDEX idx_aks_field_definitions_required ON aks_field_definitions(aks_code, is_required);

-- Table to store actual field values for anlagen
CREATE TABLE IF NOT EXISTS anlage_field_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anlage_id UUID NOT NULL REFERENCES anlagen(id) ON DELETE CASCADE,
    field_definition_id UUID NOT NULL REFERENCES aks_field_definitions(id) ON DELETE CASCADE,
    field_value TEXT,
    numeric_value NUMERIC, -- Für numerische Werte zur besseren Filterung
    unit VARCHAR(50), -- Überschreibbare Einheit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    UNIQUE(anlage_id, field_definition_id)
);

-- Create indexes for field values
CREATE INDEX idx_anlage_field_values_anlage ON anlage_field_values(anlage_id);
CREATE INDEX idx_anlage_field_values_field ON anlage_field_values(field_definition_id);

-- Insert common field definitions for existing AKS codes
-- Lüftungsanlagen
INSERT INTO aks_field_definitions (aks_code, field_name, field_label, field_type, is_required, unit, display_order, help_text) VALUES
('480.010', 'volumenstrom', 'Volumenstrom', 'unit_value', true, 'm³/h', 1, 'Nennvolumenstrom der Anlage'),
('480.010', 'leistung', 'Leistung', 'unit_value', true, 'kW', 2, 'Elektrische Leistung'),
('480.010', 'baujahr', 'Baujahr', 'number', true, NULL, 3, 'Baujahr der Anlage'),
('480.010', 'wartungsintervall', 'Wartungsintervall', 'select', false, 'Monate', 4, 'Empfohlenes Wartungsintervall'),
('480.010', 'filter_typ', 'Filtertyp', 'text', false, NULL, 5, 'Typ des eingebauten Filters');

-- Kältemaschinen
INSERT INTO aks_field_definitions (aks_code, field_name, field_label, field_type, is_required, unit, display_order, help_text, select_options) VALUES
('452.010', 'kaelteleistung', 'Kälteleistung', 'unit_value', true, 'kW', 1, 'Nennkälteleistung', NULL),
('452.010', 'kaeltemittel', 'Kältemittel', 'select', true, NULL, 2, 'Verwendetes Kältemittel', '["R410A", "R32", "R134a", "R404A", "R407C", "R290"]'::jsonb),
('452.010', 'fuellmenge', 'Füllmenge', 'unit_value', true, 'kg', 3, 'Kältemittelfüllmenge', NULL),
('452.010', 'cop', 'COP-Wert', 'decimal', false, NULL, 4, 'Coefficient of Performance', NULL),
('452.010', 'betriebsdruck', 'Betriebsdruck', 'unit_value', false, 'bar', 5, 'Maximaler Betriebsdruck', NULL);

-- Pumpen
INSERT INTO aks_field_definitions (aks_code, field_name, field_label, field_type, is_required, unit, display_order, help_text, min_value, max_value) VALUES
('446.010', 'foerdermenge', 'Fördermenge', 'unit_value', true, 'l/min', 1, 'Nenndurchfluss', 0, NULL),
('446.010', 'foerderhoehe', 'Förderhöhe', 'unit_value', true, 'm', 2, 'Maximale Förderhöhe', 0, NULL),
('446.010', 'leistung', 'Leistung', 'unit_value', true, 'kW', 3, 'Motorleistung', 0, NULL),
('446.010', 'drehzahl', 'Drehzahl', 'unit_value', false, 'U/min', 4, 'Nenndrehzahl', 0, 3600),
('446.010', 'pumpentyp', 'Pumpentyp', 'select', false, NULL, 5, 'Art der Pumpe', '["Kreiselpumpe", "Umwälzpumpe", "Druckerhöhungspumpe", "Zirkulationspumpe"]'::jsonb);

-- Heizkessel
INSERT INTO aks_field_definitions (aks_code, field_name, field_label, field_type, is_required, unit, display_order, help_text, select_options) VALUES
('434.100', 'heizleistung', 'Heizleistung', 'unit_value', true, 'kW', 1, 'Nennwärmeleistung', NULL),
('434.100', 'brennstoff', 'Brennstoff', 'select', true, NULL, 2, 'Verwendeter Brennstoff', '["Erdgas", "Heizöl", "Pellets", "Fernwärme", "Strom"]'::jsonb),
('434.100', 'wirkungsgrad', 'Wirkungsgrad', 'unit_value', false, '%', 3, 'Kesselwirkungsgrad', NULL),
('434.100', 'vorlauftemperatur', 'Vorlauftemperatur', 'unit_value', false, '°C', 4, 'Max. Vorlauftemperatur', NULL),
('434.100', 'kesseltyp', 'Kesseltyp', 'select', false, NULL, 5, 'Bauart des Kessels', '["Brennwertkessel", "Niedertemperaturkessel", "Standardkessel"]'::jsonb);

-- Brandschutztüren
INSERT INTO aks_field_definitions (aks_code, field_name, field_label, field_type, is_required, unit, display_order, help_text, select_options) VALUES
('381.200', 'feuerwiderstand', 'Feuerwiderstandsklasse', 'select', true, NULL, 1, 'Feuerwiderstandsklasse nach DIN', '["T30", "T60", "T90", "T120"]'::jsonb),
('381.200', 'breite', 'Türbreite', 'unit_value', true, 'mm', 2, 'Lichte Breite', NULL),
('381.200', 'hoehe', 'Türhöhe', 'unit_value', true, 'mm', 3, 'Lichte Höhe', NULL),
('381.200', 'schliessfolge', 'Schließfolgeregler', 'boolean', false, NULL, 4, 'Schließfolgeregler vorhanden', NULL),
('381.200', 'feststellanlage', 'Feststellanlage', 'boolean', false, NULL, 5, 'Feststellanlage vorhanden', NULL);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_aks_field_definitions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_aks_field_definitions_updated_at 
    BEFORE UPDATE ON aks_field_definitions 
    FOR EACH ROW EXECUTE FUNCTION update_aks_field_definitions_updated_at();

CREATE TRIGGER update_anlage_field_values_updated_at 
    BEFORE UPDATE ON anlage_field_values 
    FOR EACH ROW EXECUTE FUNCTION update_aks_field_definitions_updated_at();

-- Add column to anlagen table to track field validation status
ALTER TABLE anlagen ADD COLUMN IF NOT EXISTS fields_validated BOOLEAN DEFAULT false;
ALTER TABLE anlagen ADD COLUMN IF NOT EXISTS field_validation_date TIMESTAMP;
ALTER TABLE anlagen ADD COLUMN IF NOT EXISTS missing_required_fields JSONB;