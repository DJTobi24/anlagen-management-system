-- Add hierarchy fields to AKS codes table
ALTER TABLE aks_codes 
ADD COLUMN parent_code VARCHAR(50),
ADD COLUMN level INTEGER DEFAULT 0,
ADD COLUMN is_category BOOLEAN DEFAULT false,
ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Create index for parent-child relationships
CREATE INDEX idx_aks_codes_parent_code ON aks_codes(parent_code);
CREATE INDEX idx_aks_codes_level ON aks_codes(level);
CREATE INDEX idx_aks_codes_sort_order ON aks_codes(sort_order);

-- Function to calculate AKS level based on code format
CREATE OR REPLACE FUNCTION calculate_aks_level(p_code VARCHAR)
RETURNS INTEGER AS $$
DECLARE
    v_parts TEXT[];
    v_level INTEGER;
BEGIN
    -- Remove 'AKS.' prefix and split by dots
    v_parts := string_to_array(substring(p_code from 5), '.');
    v_level := array_length(v_parts, 1);
    
    -- Level 1: AKS.XX (e.g., AKS.03)
    -- Level 2: AKS.XX.XXX (e.g., AKS.03.330)
    -- Level 3: AKS.XX.XXX.XX (e.g., AKS.03.330.01)
    -- Level 4: AKS.XX.XXX.XX.XX (e.g., AKS.03.330.01.01)
    
    RETURN v_level;
END;
$$ LANGUAGE plpgsql;

-- Function to determine parent code
CREATE OR REPLACE FUNCTION get_parent_aks_code(p_code VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    v_parts TEXT[];
    v_parent_parts TEXT[];
BEGIN
    -- Remove 'AKS.' prefix and split by dots
    v_parts := string_to_array(substring(p_code from 5), '.');
    
    -- If only one part (e.g., AKS.03), no parent
    IF array_length(v_parts, 1) <= 1 THEN
        RETURN NULL;
    END IF;
    
    -- Remove the last part to get parent
    v_parent_parts := v_parts[1:array_length(v_parts, 1) - 1];
    
    -- Reconstruct parent code
    RETURN 'AKS.' || array_to_string(v_parent_parts, '.');
END;
$$ LANGUAGE plpgsql;

-- Update existing AKS codes with hierarchy information
UPDATE aks_codes 
SET 
    level = calculate_aks_level(code),
    parent_code = get_parent_aks_code(code),
    is_category = CASE 
        WHEN calculate_aks_level(code) < 4 THEN true 
        ELSE false 
    END;

-- Insert some example hierarchical AKS codes
INSERT INTO aks_codes (code, name, description, category, level, parent_code, is_category, sort_order) VALUES
-- Level 1: Main categories
('AKS.01', 'Grundstück', 'Grundstück und Außenanlagen', 'Gebäude', 1, NULL, true, 10),
('AKS.02', 'Baukonstruktion', 'Baukonstruktive Elemente', 'Gebäude', 1, NULL, true, 20),
('AKS.03', 'Gebäudehülle', 'Außenwände, Dächer, Fenster', 'Gebäude', 1, NULL, true, 30),
('AKS.04', 'Innenausbau', 'Innenwände, Decken, Böden', 'Gebäude', 1, NULL, true, 40),
('AKS.05', 'Technische Anlagen', 'Heizung, Lüftung, Sanitär, Elektro', 'Gebäudetechnik', 1, NULL, true, 50),

-- Level 2: Subcategories
('AKS.03.300', 'Außenwände allgemein', 'Alle Arten von Außenwänden', 'Gebäude', 2, 'AKS.03', true, 300),
('AKS.03.310', 'Außenwände unter Erdreich', 'Kellerwände, erdberührte Wände', 'Gebäude', 2, 'AKS.03', true, 310),
('AKS.03.320', 'Außenwände über Erdreich', 'Oberirdische Außenwände', 'Gebäude', 2, 'AKS.03', true, 320),
('AKS.03.330', 'Außenwände', 'Tragende und nichttragende Außenwände', 'Gebäude', 2, 'AKS.03', true, 330),

-- Level 3: Specific categories
('AKS.03.330.01', 'Tragende u. nichttr. Außenwände, Außenstützen', 'Alle tragenden Elemente der Außenwand', 'Gebäude', 3, 'AKS.03.330', true, 1),
('AKS.03.330.02', 'Außenwandbekleidungen', 'Fassadenverkleidungen, Putz', 'Gebäude', 3, 'AKS.03.330', true, 2),
('AKS.03.330.03', 'Außenwandöffnungen', 'Fenster, Türen in Außenwänden', 'Gebäude', 3, 'AKS.03.330', true, 3),

-- Level 4: Actual equipment/items
('AKS.03.330.01.01', 'Betonwand Nordseite', 'Tragende Betonwand Gebäude A', 'Gebäude', 4, 'AKS.03.330.01', false, 1),
('AKS.03.330.01.02', 'Ziegelwand Südseite', 'Nichttragende Ziegelwand', 'Gebäude', 4, 'AKS.03.330.01', false, 2),
('AKS.03.330.02.01', 'WDVS-Fassade', 'Wärmedämmverbundsystem 16cm', 'Gebäude', 4, 'AKS.03.330.02', false, 1),
('AKS.03.330.03.01', 'Haupteingang', 'Automatische Schiebetür', 'Gebäude', 4, 'AKS.03.330.03', false, 1)
ON CONFLICT (code) DO UPDATE
SET 
    level = EXCLUDED.level,
    parent_code = EXCLUDED.parent_code,
    is_category = EXCLUDED.is_category,
    sort_order = EXCLUDED.sort_order;

-- Function to get AKS tree structure
CREATE OR REPLACE FUNCTION get_aks_tree(p_parent_code VARCHAR DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    code VARCHAR,
    name VARCHAR,
    description TEXT,
    level INTEGER,
    parent_code VARCHAR,
    is_category BOOLEAN,
    has_children BOOLEAN,
    maintenance_interval_months INTEGER,
    path VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE aks_tree AS (
        -- Base case: root nodes or nodes with specific parent
        SELECT 
            ac.id,
            ac.code,
            ac.name,
            ac.description,
            ac.level,
            ac.parent_code,
            ac.is_category,
            EXISTS(SELECT 1 FROM aks_codes c WHERE c.parent_code = ac.code) as has_children,
            ac.maintenance_interval_months,
            ac.code::VARCHAR as path
        FROM aks_codes ac
        WHERE 
            CASE 
                WHEN p_parent_code IS NULL THEN ac.parent_code IS NULL
                ELSE ac.parent_code = p_parent_code
            END
            AND ac.is_active = true
        
        UNION ALL
        
        -- Recursive case: children of current nodes
        SELECT 
            ac.id,
            ac.code,
            ac.name,
            ac.description,
            ac.level,
            ac.parent_code,
            ac.is_category,
            EXISTS(SELECT 1 FROM aks_codes c WHERE c.parent_code = ac.code) as has_children,
            ac.maintenance_interval_months,
            at.path || ' > ' || ac.code as path
        FROM aks_codes ac
        INNER JOIN aks_tree at ON ac.parent_code = at.code
        WHERE ac.is_active = true
    )
    SELECT * FROM aks_tree
    ORDER BY path;
END;
$$ LANGUAGE plpgsql;