-- Test-Daten für Anlagen-Management-System
-- Generiert am: 2025-01-24

-- Lösche vorhandene Daten
TRUNCATE TABLE anlagen, users, mandanten, aks_codes RESTART IDENTITY CASCADE;

-- AKS-Codes einfügen
INSERT INTO aks_codes (code, bezeichnung, kategorie, aktiv) VALUES
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
INSERT INTO mandanten (name, code, beschreibung, aktiv) VALUES
('Stadtwerke München', 'SWM', 'Kommunaler Energieversorger und Infrastrukturdienstleister', true),
('Immobilien Berlin GmbH', 'IBG', 'Verwaltung städtischer Immobilien in Berlin', true),
('Klinikum Frankfurt', 'KLF', 'Universitätsklinikum mit mehreren Standorten', true);

-- Benutzer einfügen (Passwort: Admin123! für Admins, User123! für andere)
INSERT INTO users (email, passwort, name, rolle, mandant_id, aktiv) VALUES
-- Stadtwerke München
('admin@swm.de', '$2a$10$YourHashedPasswordHere', 'Admin Stadtwerke München', 'admin', 1, true),
('technik@swm.de', '$2a$10$YourHashedPasswordHere', 'Max Müller', 'techniker', 1, true),
('manager@swm.de', '$2a$10$YourHashedPasswordHere', 'Anna Schmidt', 'manager', 1, true),
('viewer@swm.de', '$2a$10$YourHashedPasswordHere', 'Tom Wagner', 'viewer', 1, true),

-- Immobilien Berlin GmbH
('admin@ibg.de', '$2a$10$YourHashedPasswordHere', 'Admin Immobilien Berlin', 'admin', 2, true),
('technik@ibg.de', '$2a$10$YourHashedPasswordHere', 'Lisa Weber', 'techniker', 2, true),
('manager@ibg.de', '$2a$10$YourHashedPasswordHere', 'Michael Becker', 'manager', 2, true),
('viewer@ibg.de', '$2a$10$YourHashedPasswordHere', 'Sarah Klein', 'viewer', 2, true),

-- Klinikum Frankfurt
('admin@klf.de', '$2a$10$YourHashedPasswordHere', 'Admin Klinikum Frankfurt', 'admin', 3, true),
('technik@klf.de', '$2a$10$YourHashedPasswordHere', 'Frank Hoffmann', 'techniker', 3, true),
('manager@klf.de', '$2a$10$YourHashedPasswordHere', 'Julia Schulz', 'manager', 3, true),
('viewer@klf.de', '$2a$10$YourHashedPasswordHere', 'Peter Meyer', 'viewer', 3, true);

-- Beispiel-Anlagen für jeden Mandanten
-- Stadtwerke München
INSERT INTO anlagen (anlagen_nummer, bezeichnung, liegenschaft, objekt, aks_code, hersteller, modell, seriennummer, baujahr, letzte_wartung, naechste_wartung, status, mandant_id, wartungsintervall_monate, anschaffungswert, standort, verantwortlicher, bemerkungen) VALUES
('SWM-00001', 'Mittelspannungsanlage Hauptverteilung', 'Kraftwerk Nord', 'Gebäude A', '112', 'Siemens', 'NXPLUS C', 'SN2024001', 2020, '2024-06-15', '2024-12-15', 'aktiv', 1, 6, 250000, 'UG.1.15', 'Max Müller', 'Hauptverteilung 20kV'),
('SWM-00002', 'Gasheizung Verwaltung', 'Hauptverwaltung', 'Hauptgebäude', '211', 'Viessmann', 'Vitoplex 300', 'VIT2021234', 2021, '2024-09-01', '2025-03-01', 'aktiv', 1, 6, 85000, 'KG.2.03', 'Anna Schmidt', 'Leistung: 500kW'),
('SWM-00003', 'Serveranlage Rechenzentrum', 'Hauptverwaltung', 'IT-Zentrum', '133', 'Dell', 'PowerEdge R750', 'DELL2023567', 2023, '2024-11-01', '2025-02-01', 'aktiv', 1, 3, 120000, '3.OG.2.12', 'Tom Wagner', 'Redundanter Server'),
('SWM-00004', 'Sprinkleranlage Lager', 'Kraftwerk Nord', 'Lagerhalle', '512', 'Minimax', 'MX 5000', 'MX2022789', 2022, '2024-07-15', '2025-01-15', 'wartung', 1, 6, 180000, 'EG.1.01', 'Max Müller', 'Wartung läuft'),
('SWM-00005', 'Personenaufzug Verwaltung', 'Hauptverwaltung', 'Hauptgebäude', '411', 'KONE', 'MonoSpace 500', 'KONE2019345', 2019, '2024-10-01', '2025-01-01', 'aktiv', 1, 3, 95000, 'Schacht 1', 'Anna Schmidt', '8 Personen, 630kg'),

-- Immobilien Berlin GmbH
('IBG-00006', 'Zentrale Lüftung Bürogebäude', 'Bürogebäude A', 'Hauptgebäude', '221', 'Wolf', 'CKL-A-9000', 'WOLF2022123', 2022, '2024-08-15', '2025-02-15', 'aktiv', 2, 6, 75000, 'Dach', 'Lisa Weber', 'Mit Wärmerückgewinnung'),
('IBG-00007', 'Videoüberwachung Parkhaus', 'Parkhaus Nord', 'Alle Ebenen', '522', 'Bosch', 'AUTODOME IP 5000', 'BOSCH2023456', 2023, '2024-09-01', '2024-12-01', 'aktiv', 2, 3, 45000, 'Diverse', 'Michael Becker', '24 Kameras'),
('IBG-00008', 'Wärmepumpe Wohnanlage', 'Wohnanlage Mitte', 'Block C', '213', 'Vaillant', 'aroTHERM plus', 'VAIL2024001', 2024, '2024-10-15', '2025-04-15', 'aktiv', 2, 6, 65000, 'TG.1.05', 'Lisa Weber', 'Luft-Wasser-WP'),
('IBG-00009', 'Brandmeldeanlage Büro', 'Bürogebäude A', 'Alle Etagen', '510', 'Siemens', 'Cerberus PRO', 'SIE2021789', 2021, '2024-07-01', '2025-01-01', 'aktiv', 2, 6, 120000, 'EG.0.15', 'Michael Becker', 'Vernetzt mit Feuerwehr'),
('IBG-00010', 'Trinkwasseranlage', 'Gewerbezentrum West', 'Hauptgebäude', '311', 'Grundfos', 'Hydro MPC', 'GRU2020567', 2020, '2024-11-15', '2025-05-15', 'aktiv', 2, 6, 35000, 'KG.1.22', 'Lisa Weber', 'Druckerhöhung'),

-- Klinikum Frankfurt
('KLF-00011', 'Notstromanlage Chirurgie', 'Chirurgie', 'Hauptgebäude', '113', 'MTU', 'Series 4000', 'MTU2022234', 2022, '2024-08-01', '2025-02-01', 'aktiv', 3, 6, 450000, 'TG.2.01', 'Frank Hoffmann', '2000 kVA'),
('KLF-00012', 'VRF-Klimasystem OP', 'Chirurgie', 'OP-Bereich', '232', 'Daikin', 'VRV IV+', 'DAI2023890', 2023, '2024-09-15', '2024-12-15', 'aktiv', 3, 3, 280000, '4.OG', 'Julia Schulz', 'Reinraum-Klimatisierung'),
('KLF-00013', 'Aufbereitungsanlage', 'Innere Medizin', 'Station 3', '312', 'Belimed', 'WD290', 'BEL2021456', 2021, '2024-10-01', '2025-04-01', 'aktiv', 3, 6, 95000, '2.OG.3.45', 'Frank Hoffmann', 'Instrumentenaufbereitung'),
('KLF-00014', 'Patientenaufzug', 'Hauptgebäude', 'Schacht 2', '411', 'Schindler', '3300', 'SCH2020123', 2020, '2024-11-01', '2025-02-01', 'aktiv', 3, 3, 125000, 'Schacht 2', 'Peter Meyer', 'Bettenaufzug 2500kg'),
('KLF-00015', 'Zugangskontrolle', 'Psychiatrie', 'Alle Zugänge', '523', 'dormakaba', 'Matrix Pro', 'DOR2024567', 2024, '2024-06-15', '2024-12-15', 'aktiv', 3, 6, 85000, 'Diverse', 'Julia Schulz', 'Chipkarten-System');

-- Weitere Anlagen für realistische Datenmenge (insgesamt ~200)
-- Diese würden in einer echten Implementierung durch das Skript generiert werden