-- Tabelle für Änderungshistorie
CREATE TABLE IF NOT EXISTS aenderungshistorie (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL, -- 'anlage', 'datenaufnahme', etc.
    entity_id UUID NOT NULL,
    aktion VARCHAR(50) NOT NULL, -- 'erstellt', 'aktualisiert', 'status_geaendert', etc.
    alte_werte JSONB,
    neue_werte JSONB,
    geaenderte_felder TEXT[],
    benutzer_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    benutzer_name VARCHAR(255) NOT NULL,
    benutzer_email VARCHAR(255) NOT NULL,
    quelle VARCHAR(50) NOT NULL DEFAULT 'web', -- 'web', 'pwa', 'api', 'import'
    ip_adresse VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indizes für Performance
CREATE INDEX idx_aenderungshistorie_entity ON aenderungshistorie(entity_type, entity_id);
CREATE INDEX idx_aenderungshistorie_benutzer ON aenderungshistorie(benutzer_id);
CREATE INDEX idx_aenderungshistorie_created ON aenderungshistorie(created_at DESC);

-- Funktion zum Tracken von Änderungen an Anlagen
CREATE OR REPLACE FUNCTION track_anlage_changes()
RETURNS TRIGGER AS $$
DECLARE
    changed_fields TEXT[];
    old_values JSONB;
    new_values JSONB;
BEGIN
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
                COALESCE(current_setting('app.current_user_id', true)::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
                COALESCE(current_setting('app.current_user_name', true), 'System'),
                COALESCE(current_setting('app.current_user_email', true), 'system@example.com'),
                COALESCE(current_setting('app.request_source', true), 'system')
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
            COALESCE(current_setting('app.current_user_id', true)::UUID, '00000000-0000-0000-0000-000000000000'::UUID),
            COALESCE(current_setting('app.current_user_name', true), 'System'),
            COALESCE(current_setting('app.current_user_email', true), 'system@example.com'),
            COALESCE(current_setting('app.request_source', true), 'system')
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für Anlagen
DROP TRIGGER IF EXISTS trigger_track_anlage_changes ON anlagen;
CREATE TRIGGER trigger_track_anlage_changes
AFTER INSERT OR UPDATE ON anlagen
FOR EACH ROW
EXECUTE FUNCTION track_anlage_changes();

-- Funktion zum Setzen der Session-Variablen
CREATE OR REPLACE FUNCTION set_session_context(
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    request_source TEXT DEFAULT 'web'
)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_user_id', user_id::TEXT, true);
    PERFORM set_config('app.current_user_name', user_name, true);
    PERFORM set_config('app.current_user_email', user_email, true);
    PERFORM set_config('app.request_source', request_source, true);
END;
$$ LANGUAGE plpgsql;