-- Add detailed fields to anlagen table
ALTER TABLE anlagen 
ADD COLUMN IF NOT EXISTS etage VARCHAR(50),
ADD COLUMN IF NOT EXISTS raum VARCHAR(100),
ADD COLUMN IF NOT EXISTS anzahl INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS hersteller VARCHAR(255),
ADD COLUMN IF NOT EXISTS typ VARCHAR(255),
ADD COLUMN IF NOT EXISTS seriennummer VARCHAR(255),
ADD COLUMN IF NOT EXISTS baujahr INTEGER,
ADD COLUMN IF NOT EXISTS qr_code_manual VARCHAR(255),
ADD COLUMN IF NOT EXISTS hersteller_qr_data TEXT;

-- Add indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_anlagen_seriennummer ON anlagen(seriennummer) WHERE seriennummer IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_anlagen_hersteller ON anlagen(hersteller) WHERE hersteller IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_anlagen_etage_raum ON anlagen(etage, raum);

-- Add check constraint for baujahr
ALTER TABLE anlagen ADD CONSTRAINT chk_baujahr 
CHECK (baujahr IS NULL OR (baujahr >= 1900 AND baujahr <= EXTRACT(YEAR FROM CURRENT_DATE) + 1));

-- Add comment for documentation
COMMENT ON COLUMN anlagen.etage IS 'Etage/Stockwerk der Anlage';
COMMENT ON COLUMN anlagen.raum IS 'Raumnummer oder Raumbezeichnung';
COMMENT ON COLUMN anlagen.anzahl IS 'Anzahl/Stückzahl der Anlage';
COMMENT ON COLUMN anlagen.hersteller IS 'Hersteller der Anlage';
COMMENT ON COLUMN anlagen.typ IS 'Typ/Modell der Anlage';
COMMENT ON COLUMN anlagen.seriennummer IS 'Seriennummer der Anlage';
COMMENT ON COLUMN anlagen.baujahr IS 'Baujahr der Anlage';
COMMENT ON COLUMN anlagen.qr_code_manual IS 'Manuell eingegebener QR-Code';
COMMENT ON COLUMN anlagen.hersteller_qr_data IS 'Gescannte QR/Barcode-Daten vom Hersteller';