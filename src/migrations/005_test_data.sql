-- Test-Daten für Anlagen-Management-System
-- Generiert am: 2025-01-24

-- Lösche vorhandene Daten
TRUNCATE TABLE anlagen, objekte, liegenschaften, users, mandanten, aks_codes RESTART IDENTITY CASCADE;

-- AKS-Codes einfügen
INSERT INTO aks_codes (code, name, category, is_active) VALUES
('110', 'Allgemeine elektrische Anlagen', 'Elektro', true),
('111', 'Niederspannungsanlagen', 'Elektro', true),
('112', 'Mittelspannungsanlagen', 'Elektro', true),
('113', 'Hochspannungsanlagen', 'Elektro', true),
('120', 'Beleuchtungsanlagen', 'Elektro', true),
('121', 'Innenbeleuchtung', 'Elektro', true),
('122', 'Außenbeleuchtung', 'Elektro', true),
('123', 'Notbeleuchtung', 'Elektro', true),
('130', 'Kommunikationsanlagen', 'IT', true),
('131', 'Telefonanlagen', 'IT', true),
('132', 'Netzwerkinfrastruktur', 'IT', true),
('133', 'Serveranlagen', 'IT', true),
('210', 'Heizungsanlagen', 'HVAC', true),
('211', 'Gasheizung', 'HVAC', true),
('212', 'Ölheizung', 'HVAC', true),
('213', 'Wärmepumpen', 'HVAC', true),
('220', 'Lüftungsanlagen', 'HVAC', true),
('221', 'Zentrale Lüftung', 'HVAC', true),
('222', 'Dezentrale Lüftung', 'HVAC', true),
('230', 'Klimaanlagen', 'HVAC', true),
('231', 'Split-Klimaanlagen', 'HVAC', true),
('232', 'VRF-Systeme', 'HVAC', true),
('310', 'Wasserversorgung', 'Sanitär', true),
('311', 'Trinkwasseranlagen', 'Sanitär', true),
('312', 'Warmwasserbereitung', 'Sanitär', true),
('320', 'Abwasseranlagen', 'Sanitär', true),
('321', 'Schmutzwasser', 'Sanitär', true),
('322', 'Regenwasser', 'Sanitär', true),
('410', 'Aufzugsanlagen', 'Transport', true),
('411', 'Personenaufzüge', 'Transport', true),
('412', 'Lastenaufzüge', 'Transport', true),
('420', 'Fahrtreppen', 'Transport', true),
('510', 'Brandmeldeanlagen', 'Sicherheit', true),
('511', 'Rauchmelder', 'Sicherheit', true),
('512', 'Sprinkleranlagen', 'Sicherheit', true),
('520', 'Sicherheitsanlagen', 'Sicherheit', true),
('521', 'Einbruchmeldeanlagen', 'Sicherheit', true),
('522', 'Videoüberwachung', 'Sicherheit', true),
('523', 'Zugangskontrolle', 'Sicherheit', true);

-- Mandanten einfügen
INSERT INTO mandanten (name, description, is_active) VALUES
('Stadtwerke München', 'Kommunaler Energieversorger und Infrastrukturdienstleister', true),
('Immobilien Berlin GmbH', 'Verwaltung städtischer Immobilien in Berlin', true),
('Klinikum Frankfurt', 'Universitätsklinikum mit mehreren Standorten', true);

-- Benutzer einfügen (Passwort: Admin123! für Admins, User123! für andere)
INSERT INTO users (email, password, first_name, last_name, role, mandant_id, is_active)
SELECT 'admin@swm.de', '$2a$10$YourHashedPasswordHere', 'Admin', 'SWM', 'admin', id, true FROM mandanten WHERE name = 'Stadtwerke München'
UNION ALL
SELECT 'technik@swm.de', '$2a$10$YourHashedPasswordHere', 'Max', 'Müller', 'techniker', id, true FROM mandanten WHERE name = 'Stadtwerke München'
UNION ALL
SELECT 'aufnehmer@swm.de', '$2a$10$YourHashedPasswordHere', 'Anna', 'Schmidt', 'aufnehmer', id, true FROM mandanten WHERE name = 'Stadtwerke München'
UNION ALL
SELECT 'admin@ibg.de', '$2a$10$YourHashedPasswordHere', 'Admin', 'IBG', 'admin', id, true FROM mandanten WHERE name = 'Immobilien Berlin GmbH'
UNION ALL
SELECT 'technik@ibg.de', '$2a$10$YourHashedPasswordHere', 'Lisa', 'Weber', 'techniker', id, true FROM mandanten WHERE name = 'Immobilien Berlin GmbH'
UNION ALL
SELECT 'aufnehmer@ibg.de', '$2a$10$YourHashedPasswordHere', 'Michael', 'Becker', 'aufnehmer', id, true FROM mandanten WHERE name = 'Immobilien Berlin GmbH'
UNION ALL
SELECT 'admin@klf.de', '$2a$10$YourHashedPasswordHere', 'Admin', 'KLF', 'admin', id, true FROM mandanten WHERE name = 'Klinikum Frankfurt'
UNION ALL
SELECT 'technik@klf.de', '$2a$10$YourHashedPasswordHere', 'Frank', 'Hoffmann', 'techniker', id, true FROM mandanten WHERE name = 'Klinikum Frankfurt'
UNION ALL
SELECT 'aufnehmer@klf.de', '$2a$10$YourHashedPasswordHere', 'Julia', 'Schulz', 'aufnehmer', id, true FROM mandanten WHERE name = 'Klinikum Frankfurt';

-- Create temporary variables for the mandant IDs
DO $$
DECLARE
    swm_id UUID;
    ibg_id UUID;
    klf_id UUID;
    kraftwerk_id UUID;
    verwaltung_id UUID;
    buero_id UUID;
    wohn_id UUID;
    haupt_id UUID;
    chir_id UUID;
BEGIN
    -- Get mandant IDs
    SELECT id INTO swm_id FROM mandanten WHERE name = 'Stadtwerke München';
    SELECT id INTO ibg_id FROM mandanten WHERE name = 'Immobilien Berlin GmbH';
    SELECT id INTO klf_id FROM mandanten WHERE name = 'Klinikum Frankfurt';

    -- Insert Liegenschaften
    INSERT INTO liegenschaften (mandant_id, name, address, description, is_active) VALUES
    (swm_id, 'Kraftwerk Nord', 'Kraftwerkstraße 1, 80333 München', 'Hauptkraftwerk der Stadtwerke München', true),
    (swm_id, 'Hauptverwaltung', 'Emmy-Noether-Straße 2, 80287 München', 'Verwaltungsgebäude der Stadtwerke München', true),
    (ibg_id, 'Bürogebäude A', 'Alexanderplatz 1, 10178 Berlin', 'Hauptbürogebäude der Immobilien Berlin GmbH', true),
    (ibg_id, 'Wohnanlage Mitte', 'Unter den Linden 50, 10117 Berlin', 'Wohnkomplex in Berlin Mitte', true),
    (klf_id, 'Hauptgebäude Klinikum', 'Theodor-Stern-Kai 7, 60590 Frankfurt am Main', 'Hauptgebäude des Universitätsklinikums', true),
    (klf_id, 'Chirurgie', 'Theodor-Stern-Kai 9, 60590 Frankfurt am Main', 'Chirurgisches Zentrum', true);

    -- Get liegenschaft IDs
    SELECT id INTO kraftwerk_id FROM liegenschaften WHERE name = 'Kraftwerk Nord';
    SELECT id INTO verwaltung_id FROM liegenschaften WHERE name = 'Hauptverwaltung';
    SELECT id INTO buero_id FROM liegenschaften WHERE name = 'Bürogebäude A';
    SELECT id INTO wohn_id FROM liegenschaften WHERE name = 'Wohnanlage Mitte';
    SELECT id INTO haupt_id FROM liegenschaften WHERE name = 'Hauptgebäude Klinikum';
    SELECT id INTO chir_id FROM liegenschaften WHERE name = 'Chirurgie';

    -- Insert Objekte
    INSERT INTO objekte (liegenschaft_id, name, description, floor, room, is_active) VALUES
    (kraftwerk_id, 'Gebäude A', 'Hauptgebäude des Kraftwerks', 'UG', '1.15', true),
    (kraftwerk_id, 'Lagerhalle', 'Lager für Ersatzteile', 'EG', '1.01', true),
    (verwaltung_id, 'Hauptgebäude', 'Verwaltungsgebäude', '3.OG', '2.12', true),
    (verwaltung_id, 'IT-Zentrum', 'Rechenzentrum', 'KG', '2.03', true),
    (buero_id, 'Hauptgebäude', 'Büroräume', 'Dach', NULL, true),
    (buero_id, 'Alle Ebenen', 'Videoüberwachung', 'Diverse', NULL, true),
    (wohn_id, 'Block C', 'Wohnblock C', 'TG', '1.05', true),
    (wohn_id, 'Alle Etagen', 'Brandmeldeanlage', 'EG', '0.15', true),
    (haupt_id, 'Hauptgebäude', 'Zentralgebäude', 'TG', '2.01', true),
    (haupt_id, 'Station 3', 'Innere Medizin', '2.OG', '3.45', true),
    (chir_id, 'OP-Bereich', 'Operationssäle', '4.OG', NULL, true),
    (chir_id, 'Alle Zugänge', 'Zugangskontrolle', 'Diverse', NULL, true);

    -- Insert Anlagen using the objekt references
    INSERT INTO anlagen (objekt_id, t_nummer, aks_code, qr_code, name, description, status, zustands_bewertung, is_active)
    SELECT o.id, 'SWM-00001', '112', 'QR001', 'Mittelspannungsanlage Hauptverteilung', 'Hauptverteilung 20kV, Siemens NXPLUS C', 'aktiv', 2, true
    FROM objekte o JOIN liegenschaften l ON o.liegenschaft_id = l.id WHERE l.name = 'Kraftwerk Nord' AND o.name = 'Gebäude A'
    UNION ALL
    SELECT o.id, 'SWM-00002', '512', 'QR002', 'Sprinkleranlage Lager', 'Minimax MX 5000, Wartung läuft', 'wartung', 3, true
    FROM objekte o JOIN liegenschaften l ON o.liegenschaft_id = l.id WHERE l.name = 'Kraftwerk Nord' AND o.name = 'Lagerhalle'
    UNION ALL
    SELECT o.id, 'SWM-00003', '133', 'QR003', 'Serveranlage Rechenzentrum', 'Dell PowerEdge R750, Redundanter Server', 'aktiv', 1, true
    FROM objekte o JOIN liegenschaften l ON o.liegenschaft_id = l.id WHERE l.name = 'Hauptverwaltung' AND o.name = 'Hauptgebäude'
    UNION ALL
    SELECT o.id, 'SWM-00004', '211', 'QR004', 'Gasheizung Verwaltung', 'Viessmann Vitoplex 300, Leistung: 500kW', 'aktiv', 2, true
    FROM objekte o JOIN liegenschaften l ON o.liegenschaft_id = l.id WHERE l.name = 'Hauptverwaltung' AND o.name = 'IT-Zentrum'
    UNION ALL
    SELECT o.id, 'IBG-00001', '221', 'QR005', 'Zentrale Lüftung Bürogebäude', 'Wolf CKL-A-9000, Mit Wärmerückgewinnung', 'aktiv', 2, true
    FROM objekte o JOIN liegenschaften l ON o.liegenschaft_id = l.id WHERE l.name = 'Bürogebäude A' AND o.name = 'Hauptgebäude'
    UNION ALL
    SELECT o.id, 'IBG-00002', '522', 'QR006', 'Videoüberwachung Parkhaus', 'Bosch AUTODOME IP 5000, 24 Kameras', 'aktiv', 1, true
    FROM objekte o JOIN liegenschaften l ON o.liegenschaft_id = l.id WHERE l.name = 'Bürogebäude A' AND o.name = 'Alle Ebenen'
    UNION ALL
    SELECT o.id, 'IBG-00003', '213', 'QR007', 'Wärmepumpe Wohnanlage', 'Vaillant aroTHERM plus, Luft-Wasser-WP', 'aktiv', 1, true
    FROM objekte o JOIN liegenschaften l ON o.liegenschaft_id = l.id WHERE l.name = 'Wohnanlage Mitte' AND o.name = 'Block C'
    UNION ALL
    SELECT o.id, 'IBG-00004', '510', 'QR008', 'Brandmeldeanlage Büro', 'Siemens Cerberus PRO, Vernetzt mit Feuerwehr', 'aktiv', 2, true
    FROM objekte o JOIN liegenschaften l ON o.liegenschaft_id = l.id WHERE l.name = 'Wohnanlage Mitte' AND o.name = 'Alle Etagen'
    UNION ALL
    SELECT o.id, 'KLF-00001', '113', 'QR009', 'Notstromanlage Chirurgie', 'MTU Series 4000, 2000 kVA', 'aktiv', 1, true
    FROM objekte o JOIN liegenschaften l ON o.liegenschaft_id = l.id WHERE l.name = 'Hauptgebäude Klinikum' AND o.name = 'Hauptgebäude'
    UNION ALL
    SELECT o.id, 'KLF-00002', '312', 'QR010', 'Aufbereitungsanlage', 'Belimed WD290, Instrumentenaufbereitung', 'aktiv', 2, true
    FROM objekte o JOIN liegenschaften l ON o.liegenschaft_id = l.id WHERE l.name = 'Hauptgebäude Klinikum' AND o.name = 'Station 3'
    UNION ALL
    SELECT o.id, 'KLF-00003', '232', 'QR011', 'VRF-Klimasystem OP', 'Daikin VRV IV+, Reinraum-Klimatisierung', 'aktiv', 1, true
    FROM objekte o JOIN liegenschaften l ON o.liegenschaft_id = l.id WHERE l.name = 'Chirurgie' AND o.name = 'OP-Bereich'
    UNION ALL
    SELECT o.id, 'KLF-00004', '523', 'QR012', 'Zugangskontrolle', 'dormakaba Matrix Pro, Chipkarten-System', 'aktiv', 1, true
    FROM objekte o JOIN liegenschaften l ON o.liegenschaft_id = l.id WHERE l.name = 'Chirurgie' AND o.name = 'Alle Zugänge';
END
$$;