-- Fix the trigger to properly capture user names

-- Update the trigger function to get user info from the users table if session vars are empty
CREATE OR REPLACE FUNCTION anlage_aenderung_trigger() RETURNS TRIGGER AS $$
DECLARE
    v_benutzer_id UUID;
    v_benutzer_name VARCHAR(255);
    v_benutzer_email VARCHAR(255);
    v_quelle VARCHAR(50);
    v_geaenderte_felder TEXT[];
    v_feld TEXT;
    v_alte_werte JSONB;
    v_neue_werte JSONB;
BEGIN
    -- Get user context from session variables
    v_benutzer_id := current_setting('app.user_id', true)::UUID;
    v_benutzer_name := current_setting('app.user_name', true);
    v_benutzer_email := current_setting('app.user_email', true);
    v_quelle := COALESCE(current_setting('app.source', true), 'web');
    
    -- If user name is empty, get it from the users table
    IF v_benutzer_name IS NULL OR v_benutzer_name = '' THEN
        SELECT CONCAT(first_name, ' ', last_name) INTO v_benutzer_name
        FROM users
        WHERE id = v_benutzer_id;
    END IF;
    
    -- If email is empty, get it from the users table
    IF v_benutzer_email IS NULL OR v_benutzer_email = '' THEN
        SELECT email INTO v_benutzer_email
        FROM users
        WHERE id = v_benutzer_id;
    END IF;
    
    -- Use defaults if still empty
    v_benutzer_name := COALESCE(v_benutzer_name, 'System');
    v_benutzer_email := COALESCE(v_benutzer_email, 'system@example.com');

    IF TG_OP = 'UPDATE' THEN
        -- Find changed fields
        v_geaenderte_felder := ARRAY[]::TEXT[];
        v_alte_werte := '{}'::JSONB;
        v_neue_werte := '{}'::JSONB;
        
        -- Check each field for changes
        IF OLD.name IS DISTINCT FROM NEW.name THEN
            v_geaenderte_felder := array_append(v_geaenderte_felder, 'name');
            v_alte_werte := v_alte_werte || jsonb_build_object('name', OLD.name);
            v_neue_werte := v_neue_werte || jsonb_build_object('name', NEW.name);
        END IF;
        
        IF OLD.t_nummer IS DISTINCT FROM NEW.t_nummer THEN
            v_geaenderte_felder := array_append(v_geaenderte_felder, 't_nummer');
            v_alte_werte := v_alte_werte || jsonb_build_object('t_nummer', OLD.t_nummer);
            v_neue_werte := v_neue_werte || jsonb_build_object('t_nummer', NEW.t_nummer);
        END IF;
        
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            v_geaenderte_felder := array_append(v_geaenderte_felder, 'status');
            v_alte_werte := v_alte_werte || jsonb_build_object('status', OLD.status);
            v_neue_werte := v_neue_werte || jsonb_build_object('status', NEW.status);
        END IF;
        
        IF OLD.zustands_bewertung IS DISTINCT FROM NEW.zustands_bewertung THEN
            v_geaenderte_felder := array_append(v_geaenderte_felder, 'zustands_bewertung');
            v_alte_werte := v_alte_werte || jsonb_build_object('zustands_bewertung', OLD.zustands_bewertung);
            v_neue_werte := v_neue_werte || jsonb_build_object('zustands_bewertung', NEW.zustands_bewertung);
        END IF;
        
        IF OLD.description IS DISTINCT FROM NEW.description THEN
            v_geaenderte_felder := array_append(v_geaenderte_felder, 'description');
            v_alte_werte := v_alte_werte || jsonb_build_object('description', OLD.description);
            v_neue_werte := v_neue_werte || jsonb_build_object('description', NEW.description);
        END IF;
        
        IF OLD.aks_code IS DISTINCT FROM NEW.aks_code THEN
            v_geaenderte_felder := array_append(v_geaenderte_felder, 'aks_code');
            v_alte_werte := v_alte_werte || jsonb_build_object('aks_code', OLD.aks_code);
            v_neue_werte := v_neue_werte || jsonb_build_object('aks_code', NEW.aks_code);
        END IF;
        
        IF OLD.dynamic_fields::text IS DISTINCT FROM NEW.dynamic_fields::text THEN
            v_geaenderte_felder := array_append(v_geaenderte_felder, 'dynamic_fields');
            v_alte_werte := v_alte_werte || jsonb_build_object('dynamic_fields', OLD.dynamic_fields);
            v_neue_werte := v_neue_werte || jsonb_build_object('dynamic_fields', NEW.dynamic_fields);
        END IF;
        
        IF OLD.metadaten::text IS DISTINCT FROM NEW.metadaten::text THEN
            v_geaenderte_felder := array_append(v_geaenderte_felder, 'metadaten');
            v_alte_werte := v_alte_werte || jsonb_build_object('metadaten', OLD.metadaten);
            v_neue_werte := v_neue_werte || jsonb_build_object('metadaten', NEW.metadaten);
        END IF;
        
        -- Only log if there were actual changes
        IF array_length(v_geaenderte_felder, 1) > 0 THEN
            INSERT INTO aenderungshistorie (
                entity_type,
                entity_id,
                aktion,
                alte_werte,
                neue_werte,
                geaenderte_felder,
                benutzer_id,
                benutzer_name,
                benutzer_email,
                quelle
            ) VALUES (
                'anlage',
                NEW.id,
                'UPDATE',
                v_alte_werte,
                v_neue_werte,
                v_geaenderte_felder,
                v_benutzer_id,
                v_benutzer_name,
                v_benutzer_email,
                v_quelle
            );
        END IF;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO aenderungshistorie (
            entity_type,
            entity_id,
            aktion,
            neue_werte,
            benutzer_id,
            benutzer_name,
            benutzer_email,
            quelle
        ) VALUES (
            'anlage',
            NEW.id,
            'CREATE',
            to_jsonb(NEW),
            v_benutzer_id,
            v_benutzer_name,
            v_benutzer_email,
            v_quelle
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO aenderungshistorie (
            entity_type,
            entity_id,
            aktion,
            alte_werte,
            benutzer_id,
            benutzer_name,
            benutzer_email,
            quelle
        ) VALUES (
            'anlage',
            OLD.id,
            'DELETE',
            to_jsonb(OLD),
            v_benutzer_id,
            v_benutzer_name,
            v_benutzer_email,
            v_quelle
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Also update the existing empty records to get user names from the users table
UPDATE aenderungshistorie ah
SET benutzer_name = CONCAT(u.first_name, ' ', u.last_name)
FROM users u
WHERE ah.benutzer_id = u.id 
  AND (ah.benutzer_name IS NULL OR ah.benutzer_name = '');