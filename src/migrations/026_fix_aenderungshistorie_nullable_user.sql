-- Allow nullable benutzer_id for system operations
ALTER TABLE aenderungshistorie 
ALTER COLUMN benutzer_id DROP NOT NULL,
ALTER COLUMN benutzer_id SET DEFAULT NULL;

-- Update the trigger function to handle null user_id
CREATE OR REPLACE FUNCTION track_anlage_changes()
RETURNS TRIGGER AS $$
DECLARE
    changed_fields TEXT[];
    old_values JSONB;
    new_values JSONB;
    v_benutzer_id UUID;
    v_benutzer_name VARCHAR(255);
    v_benutzer_email VARCHAR(255);
    v_quelle VARCHAR(50);
BEGIN
    -- Get user context from session variables
    BEGIN
        v_benutzer_id := current_setting('app.current_user_id', true)::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_benutzer_id := NULL;
    END;
    
    v_benutzer_name := COALESCE(current_setting('app.current_user_name', true), 'System');
    v_benutzer_email := COALESCE(current_setting('app.current_user_email', true), 'system@example.com');
    v_quelle := COALESCE(current_setting('app.request_source', true), 'system');

    -- Bestimme geänderte Felder
    IF TG_OP = 'UPDATE' THEN
        changed_fields := ARRAY[]::TEXT[];
        
        IF OLD.name IS DISTINCT FROM NEW.name THEN
            changed_fields := array_append(changed_fields, 'name');
        END IF;
        IF OLD.t_nummer IS DISTINCT FROM NEW.t_nummer THEN
            changed_fields := array_append(changed_fields, 't_nummer');
        END IF;
        IF OLD.aks_code IS DISTINCT FROM NEW.aks_code THEN
            changed_fields := array_append(changed_fields, 'aks_code');
        END IF;
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            changed_fields := array_append(changed_fields, 'status');
        END IF;
        IF OLD.zustands_bewertung IS DISTINCT FROM NEW.zustands_bewertung THEN
            changed_fields := array_append(changed_fields, 'zustands_bewertung');
        END IF;
        IF OLD.description IS DISTINCT FROM NEW.description THEN
            changed_fields := array_append(changed_fields, 'description');
        END IF;
        IF OLD.metadaten IS DISTINCT FROM NEW.metadaten THEN
            changed_fields := array_append(changed_fields, 'metadaten');
        END IF;
        
        -- Nur relevante Werte speichern
        old_values := jsonb_build_object(
            'name', OLD.name,
            't_nummer', OLD.t_nummer,
            'aks_code', OLD.aks_code,
            'status', OLD.status,
            'zustands_bewertung', OLD.zustands_bewertung,
            'description', OLD.description,
            'metadaten', OLD.metadaten
        );
        
        new_values := jsonb_build_object(
            'name', NEW.name,
            't_nummer', NEW.t_nummer,
            'aks_code', NEW.aks_code,
            'status', NEW.status,
            'zustands_bewertung', NEW.zustands_bewertung,
            'description', NEW.description,
            'metadaten', NEW.metadaten
        );
        
        -- Eintrag nur erstellen wenn tatsächlich Änderungen vorhanden sind
        IF array_length(changed_fields, 1) > 0 THEN
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
                'aktualisiert',
                old_values,
                new_values,
                changed_fields,
                v_benutzer_id,
                v_benutzer_name,
                v_benutzer_email,
                v_quelle
            );
        END IF;
    ELSIF TG_OP = 'INSERT' THEN
        new_values := jsonb_build_object(
            'name', NEW.name,
            't_nummer', NEW.t_nummer,
            'aks_code', NEW.aks_code,
            'status', NEW.status,
            'zustands_bewertung', NEW.zustands_bewertung,
            'description', NEW.description,
            'metadaten', NEW.metadaten
        );
        
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
            'erstellt',
            new_values,
            v_benutzer_id,
            v_benutzer_name,
            v_benutzer_email,
            v_quelle
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_track_anlage_changes ON anlagen;
CREATE TRIGGER trigger_track_anlage_changes
AFTER INSERT OR UPDATE ON anlagen
FOR EACH ROW
EXECUTE FUNCTION track_anlage_changes();