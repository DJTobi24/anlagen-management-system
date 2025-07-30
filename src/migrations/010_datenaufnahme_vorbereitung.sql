-- Migration: Datenaufnahme-Vorbereitung System
-- Erstellt Tabellen für die Vorbereitung und Zuweisung von Datenaufnahmen

-- Tabelle für Datenaufnahme-Aufträge
CREATE TABLE IF NOT EXISTS datenaufnahme_auftraege (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mandant_id UUID NOT NULL REFERENCES mandanten(id) ON DELETE CASCADE,
    titel VARCHAR(255) NOT NULL,
    beschreibung TEXT,
    erstellt_von UUID NOT NULL REFERENCES users(id),
    zugewiesen_an UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'vorbereitet',
    start_datum DATE,
    end_datum DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT check_status CHECK (status IN ('vorbereitet', 'in_bearbeitung', 'abgeschlossen', 'pausiert'))
);

-- Tabelle für zugewiesene Liegenschaften
CREATE TABLE IF NOT EXISTS datenaufnahme_liegenschaften (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aufnahme_id UUID NOT NULL REFERENCES datenaufnahme_auftraege(id) ON DELETE CASCADE,
    liegenschaft_id UUID NOT NULL REFERENCES liegenschaften(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(aufnahme_id, liegenschaft_id)
);

-- Tabelle für zugewiesene Objekte/Gebäude
CREATE TABLE IF NOT EXISTS datenaufnahme_objekte (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aufnahme_id UUID NOT NULL REFERENCES datenaufnahme_auftraege(id) ON DELETE CASCADE,
    objekt_id UUID NOT NULL REFERENCES objekte(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(aufnahme_id, objekt_id)
);

-- Tabelle für Anlagen mit Such-Status
CREATE TABLE IF NOT EXISTS datenaufnahme_anlagen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aufnahme_id UUID NOT NULL REFERENCES datenaufnahme_auftraege(id) ON DELETE CASCADE,
    anlage_id UUID NOT NULL REFERENCES anlagen(id) ON DELETE CASCADE,
    sichtbar BOOLEAN DEFAULT true,
    such_modus BOOLEAN DEFAULT false,
    notizen TEXT,
    bearbeitet BOOLEAN DEFAULT false,
    bearbeitet_am TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(aufnahme_id, anlage_id)
);

-- Tabelle für Aufnahme-Fortschritt
CREATE TABLE IF NOT EXISTS datenaufnahme_fortschritt (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aufnahme_id UUID NOT NULL REFERENCES datenaufnahme_auftraege(id) ON DELETE CASCADE,
    anlage_id UUID NOT NULL REFERENCES anlagen(id) ON DELETE CASCADE,
    aktion VARCHAR(100) NOT NULL,
    alte_werte JSONB,
    neue_werte JSONB,
    benutzer_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indizes für Performance
CREATE INDEX idx_datenaufnahme_auftraege_mandant ON datenaufnahme_auftraege(mandant_id);
CREATE INDEX idx_datenaufnahme_auftraege_zugewiesen ON datenaufnahme_auftraege(zugewiesen_an);
CREATE INDEX idx_datenaufnahme_auftraege_status ON datenaufnahme_auftraege(status);
CREATE INDEX idx_datenaufnahme_liegenschaften_aufnahme ON datenaufnahme_liegenschaften(aufnahme_id);
CREATE INDEX idx_datenaufnahme_objekte_aufnahme ON datenaufnahme_objekte(aufnahme_id);
CREATE INDEX idx_datenaufnahme_anlagen_aufnahme ON datenaufnahme_anlagen(aufnahme_id);
CREATE INDEX idx_datenaufnahme_anlagen_such_modus ON datenaufnahme_anlagen(aufnahme_id, such_modus);
CREATE INDEX idx_datenaufnahme_fortschritt_aufnahme ON datenaufnahme_fortschritt(aufnahme_id);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_datenaufnahme_auftraege_updated_at 
    BEFORE UPDATE ON datenaufnahme_auftraege 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_datenaufnahme_anlagen_updated_at 
    BEFORE UPDATE ON datenaufnahme_anlagen 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();