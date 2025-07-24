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
INSERT INTO users (email, password, first_name, last_name, role, mandant_id, is_active) VALUES
-- Stadtwerke München
('admin@swm.de', '$2a$10$YourHashedPasswordHere', 'Admin', 'SWM', 'admin', 1, true),
('technik@swm.de', '$2a$10$YourHashedPasswordHere', 'Max', 'Müller', 'techniker', 1, true),
('aufnehmer@swm.de', '$2a$10$YourHashedPasswordHere', 'Anna', 'Schmidt', 'aufnehmer', 1, true),

-- Immobilien Berlin GmbH
('admin@ibg.de', '$2a$10$YourHashedPasswordHere', 'Admin', 'IBG', 'admin', 2, true),
('technik@ibg.de', '$2a$10$YourHashedPasswordHere', 'Lisa', 'Weber', 'techniker', 2, true),
('aufnehmer@ibg.de', '$2a$10$YourHashedPasswordHere', 'Michael', 'Becker', 'aufnehmer', 2, true),

-- Klinikum Frankfurt
('admin@klf.de', '$2a$10$YourHashedPasswordHere', 'Admin', 'KLF', 'admin', 3, true),
('technik@klf.de', '$2a$10$YourHashedPasswordHere', 'Frank', 'Hoffmann', 'techniker', 3, true),
('aufnehmer@klf.de', '$2a$10$YourHashedPasswordHere', 'Julia', 'Schulz', 'aufnehmer', 3, true);

-- Liegenschaften einfügen
INSERT INTO liegenschaften (mandant_id, name, address, description, is_active) VALUES
-- Stadtwerke München
(1, 'Kraftwerk Nord', 'Kraftwerkstraße 1, 80333 München', 'Hauptkraftwerk der Stadtwerke München', true),
(1, 'Hauptverwaltung', 'Emmy-Noether-Straße 2, 80287 München', 'Verwaltungsgebäude der Stadtwerke München', true),

-- Immobilien Berlin GmbH
(2, 'Bürogebäude A', 'Alexanderplatz 1, 10178 Berlin', 'Hauptbürogebäude der Immobilien Berlin GmbH', true),
(2, 'Wohnanlage Mitte', 'Unter den Linden 50, 10117 Berlin', 'Wohnkomplex in Berlin Mitte', true),

-- Klinikum Frankfurt
(3, 'Hauptgebäude', 'Theodor-Stern-Kai 7, 60590 Frankfurt am Main', 'Hauptgebäude des Universitätsklinikums', true),
(3, 'Chirurgie', 'Theodor-Stern-Kai 9, 60590 Frankfurt am Main', 'Chirurgisches Zentrum', true);

-- Objekte einfügen
INSERT INTO objekte (liegenschaft_id, name, description, floor, room, is_active) VALUES
-- Kraftwerk Nord (liegenschaft_id = 1)
(1, 'Gebäude A', 'Hauptgebäude des Kraftwerks', 'UG', '1.15', true),
(1, 'Lagerhalle', 'Lager für Ersatzteile', 'EG', '1.01', true),

-- Hauptverwaltung SWM (liegenschaft_id = 2)
(2, 'Hauptgebäude', 'Verwaltungsgebäude', '3.OG', '2.12', true),
(2, 'IT-Zentrum', 'Rechenzentrum', 'KG', '2.03', true),

-- Bürogebäude A Berlin (liegenschaft_id = 3)
(3, 'Hauptgebäude', 'Büroräume', 'Dach', NULL, true),
(3, 'Alle Ebenen', 'Videoüberwachung', 'Diverse', NULL, true),

-- Wohnanlage Mitte (liegenschaft_id = 4)
(4, 'Block C', 'Wohnblock C', 'TG', '1.05', true),
(4, 'Alle Etagen', 'Brandmeldeanlage', 'EG', '0.15', true),

-- Hauptgebäude Klinikum (liegenschaft_id = 5)
(5, 'Hauptgebäude', 'Zentralgebäude', 'TG', '2.01', true),
(5, 'Station 3', 'Innere Medizin', '2.OG', '3.45', true),

-- Chirurgie (liegenschaft_id = 6)
(6, 'OP-Bereich', 'Operationssäle', '4.OG', NULL, true),
(6, 'Alle Zugänge', 'Zugangskontrolle', 'Diverse', NULL, true);

-- Anlagen einfügen
INSERT INTO anlagen (objekt_id, t_nummer, aks_code, qr_code, name, description, status, zustands_bewertung, is_active) VALUES
-- Kraftwerk Nord - Gebäude A (objekt_id = 1)
(1, 'SWM-00001', '112', 'QR001', 'Mittelspannungsanlage Hauptverteilung', 'Hauptverteilung 20kV, Siemens NXPLUS C', 'aktiv', 2, true),

-- Kraftwerk Nord - Lagerhalle (objekt_id = 2)
(2, 'SWM-00002', '512', 'QR002', 'Sprinkleranlage Lager', 'Minimax MX 5000, Wartung läuft', 'wartung', 3, true),

-- Hauptverwaltung - Hauptgebäude (objekt_id = 3)
(3, 'SWM-00003', '133', 'QR003', 'Serveranlage Rechenzentrum', 'Dell PowerEdge R750, Redundanter Server', 'aktiv', 1, true),

-- Hauptverwaltung - IT-Zentrum (objekt_id = 4)
(4, 'SWM-00004', '211', 'QR004', 'Gasheizung Verwaltung', 'Viessmann Vitoplex 300, Leistung: 500kW', 'aktiv', 2, true),

-- Bürogebäude A - Hauptgebäude (objekt_id = 5)
(5, 'IBG-00001', '221', 'QR005', 'Zentrale Lüftung Bürogebäude', 'Wolf CKL-A-9000, Mit Wärmerückgewinnung', 'aktiv', 2, true),

-- Bürogebäude A - Alle Ebenen (objekt_id = 6)
(6, 'IBG-00002', '522', 'QR006', 'Videoüberwachung Parkhaus', 'Bosch AUTODOME IP 5000, 24 Kameras', 'aktiv', 1, true),

-- Wohnanlage Mitte - Block C (objekt_id = 7)
(7, 'IBG-00003', '213', 'QR007', 'Wärmepumpe Wohnanlage', 'Vaillant aroTHERM plus, Luft-Wasser-WP', 'aktiv', 1, true),

-- Wohnanlage Mitte - Alle Etagen (objekt_id = 8)
(8, 'IBG-00004', '510', 'QR008', 'Brandmeldeanlage Büro', 'Siemens Cerberus PRO, Vernetzt mit Feuerwehr', 'aktiv', 2, true),

-- Hauptgebäude Klinikum (objekt_id = 9)
(9, 'KLF-00001', '113', 'QR009', 'Notstromanlage Chirurgie', 'MTU Series 4000, 2000 kVA', 'aktiv', 1, true),

-- Station 3 (objekt_id = 10)
(10, 'KLF-00002', '312', 'QR010', 'Aufbereitungsanlage', 'Belimed WD290, Instrumentenaufbereitung', 'aktiv', 2, true),

-- OP-Bereich (objekt_id = 11)
(11, 'KLF-00003', '232', 'QR011', 'VRF-Klimasystem OP', 'Daikin VRV IV+, Reinraum-Klimatisierung', 'aktiv', 1, true),

-- Alle Zugänge (objekt_id = 12)
(12, 'KLF-00004', '523', 'QR012', 'Zugangskontrolle', 'dormakaba Matrix Pro, Chipkarten-System', 'aktiv', 1, true);