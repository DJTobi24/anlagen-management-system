-- Insert AKS codes needed for demo import
INSERT INTO aks_codes (id, code, name, description, is_active, created_at, updated_at)
VALUES 
-- General codes
(gen_random_uuid(), 'AKS.03.000', 'Diverse Anlagen', 'Nicht spezifizierte technische Anlagen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 330 - Sanitäranlagen
(gen_random_uuid(), 'AKS.03.330.01', 'Sanitärgrundinstallation', 'Grundlegende Sanitärinstallationen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.330.04', 'Sanitärarmaturen', 'Armaturen und Ventile', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.330.04.01', 'Absperrventile', 'Absperrventile und Schieber', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.330.04.02', 'Mischbatterien', 'Mischbatterien und Thermostate', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.330.04.03', 'Druckminderer', 'Druckminderer und Druckregler', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.330.04.04', 'Rückflussverhinderer', 'Rückflussverhinderer', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.330.04.05', 'Schmutzfänger', 'Schmutzfänger und Filter', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.330.04.15', 'Sicherheitsventile', 'Sicherheitsventile', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.330.04.17', 'Durchflussmesser', 'Durchflussmesser', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.330.04.18', 'Wasserzähler', 'Wasserzähler', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.330.04.19', 'Druckerhöhungsanlagen', 'Druckerhöhungsanlagen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.330.08', 'Sanitärobjekte', 'Sanitäre Einrichtungsgegenstände', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.330.08.02', 'WC-Anlagen', 'WC-Anlagen und Urinale', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 340 - Gasversorgung
(gen_random_uuid(), 'AKS.03.340', 'Gasversorgungsanlagen', 'Gasversorgung allgemein', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.340.01', 'Gasleitungen', 'Gasleitungen und Rohrsysteme', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.340.04.01', 'Gasabsperrventile', 'Gasabsperrventile', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.340.04.02', 'Gasdruckregler', 'Gasdruckregler', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.340.04.03', 'Gaszähler', 'Gaszähler', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.340.04.04', 'Gasfilter', 'Gasfilter', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.340.04.05', 'Gaswarnanlagen', 'Gaswarnanlagen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.340.04.07', 'Gasbrenner', 'Gasbrenner', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.340.04.09', 'Sicherheitsabsperrventile', 'Sicherheitsabsperrventile Gas', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 350 - Abwasseranlagen
(gen_random_uuid(), 'AKS.03.350', 'Abwasseranlagen', 'Abwasseranlagen allgemein', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.350.01', 'Abwasserleitungen', 'Abwasserleitungen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.350.02', 'Abwasserhebeanlagen', 'Abwasserhebeanlagen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.350.03', 'Abscheideranlagen', 'Abscheideranlagen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 360 - Sicherheitstechnik
(gen_random_uuid(), 'AKS.03.360.02', 'Brandschutztüren', 'Brandschutztüren und -tore', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.360.03', 'Rauch- und Wärmeabzugsanlagen', 'RWA-Anlagen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.360.09', 'Anschlagpunkte', 'Anschlagpunkte und Sekuranten', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 370 - Transportanlagen
(gen_random_uuid(), 'AKS.03.370.01', 'Aufzugsanlagen', 'Aufzugsanlagen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 410 - Heizungsanlagen
(gen_random_uuid(), 'AKS.03.410.01.03', 'Gasheizkessel', 'Gasheizkessel', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.410.01.04', 'Ölheizkessel', 'Ölheizkessel', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.410.01.06', 'Wärmepumpen', 'Wärmepumpen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.410.02', 'Wärmeverteilung', 'Wärmeverteilsysteme', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.410.02.09', 'Umwälzpumpen', 'Umwälzpumpen Heizung', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.410.02.10', 'Regelventile', 'Regelventile Heizung', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.410.02.11', 'Mischventile', 'Mischventile Heizung', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.410.02.12', 'Wärmetauscher', 'Wärmetauscher', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.410.02.13', 'Pufferspeicher', 'Pufferspeicher', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.410.02.20', 'Heizungsverteiler', 'Heizungsverteiler', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.410.02.23', 'Ausdehnungsgefäße', 'Ausdehnungsgefäße Heizung', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.410.09', 'Heizungsregelung', 'Heizungsregelungen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.410.09.04', 'Raumthermostate', 'Raumthermostate', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.410.09.07', 'Außentemperaturfühler', 'Außentemperaturfühler', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.410.09.08', 'Kesselsteuerung', 'Kesselsteuerungen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 420 - Lüftungsanlagen
(gen_random_uuid(), 'AKS.03.420.01.04', 'Zuluftgeräte', 'Zuluftgeräte', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.420.01.06', 'Abluftgeräte', 'Abluftgeräte', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.420.01.12', 'Lüftungszentralen', 'Zentrale Lüftungsanlagen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.420.01.13', 'Wärmerückgewinnung', 'Wärmerückgewinnungsanlagen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.420.01.15', 'Luftbefeuchter', 'Luftbefeuchtungsanlagen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.420.02.07', 'Luftfilter', 'Luftfilter', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.420.02.08', 'Schalldämpfer', 'Schalldämpfer Lüftung', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.420.03.09', 'Ventilatoren', 'Ventilatoren', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.420.03.13', 'Axialventilatoren', 'Axialventilatoren', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.420.09.10', 'Volumenstromregler', 'Volumenstromregler', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.420.09.11', 'Brandschutzklappen', 'Brandschutzklappen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.420.09.12', 'Luftklappen', 'Luftklappen motorisch', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 430 - Klimaanlagen
(gen_random_uuid(), 'AKS.03.430.01.01', 'Klimazentralen', 'Zentrale Klimaanlagen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.430.01.03', 'Kaltwassersätze', 'Kaltwassersätze', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.430.01.07', 'Rückkühler', 'Rückkühlanlagen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.430.01.09', 'Kühltürme', 'Kühltürme', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.430.01.16', 'Präzisionsklimaanlagen', 'Präzisionsklimaanlagen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.430.02.10', 'Kältemittelleitungen', 'Kältemittelleitungen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.430.03.11', 'Kompressoren', 'Kältekompressoren', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.430.04.14', 'Fancoils', 'Gebläsekonvektoren', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.430.04.18', 'Kühldecken', 'Kühldeckensysteme', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.430.04.20', 'Splitgeräte', 'Split-Klimageräte', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.430.04.21', 'VRF-Systeme', 'VRF/VRV-Systeme', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.430.04.24', 'Mobile Klimageräte', 'Mobile Klimageräte', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.430.09.04', 'Kälteregelung', 'Kälteregelungen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 440 - Elektroanlagen
(gen_random_uuid(), 'AKS.03.440.01.01', 'Transformatoren', 'Transformatoren', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.440.01.02', 'Niederspannungshauptverteilung', 'NSHV', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.440.01.03', 'Unterverteilungen', 'Elektrische Unterverteilungen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.440.01.04', 'Schaltschränke', 'Schaltschränke', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.440.01.05', 'Kompensationsanlagen', 'Blindleistungskompensation', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.440.01.06', 'Mittelspannungsanlagen', 'Mittelspannungsschaltanlagen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.440.02.07', 'Notstromaggregate', 'Notstromaggregate', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.440.02.08', 'USV-Anlagen', 'Unterbrechungsfreie Stromversorgung', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.440.02.10', 'Netzersatzanlagen', 'Netzersatzanlagen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.440.03.10', 'Stromschienen', 'Stromschienensysteme', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.440.03.11', 'Kabeltrassen', 'Kabeltrassen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.440.03.12', 'Erdungsanlagen', 'Erdungsanlagen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.440.03.13', 'Blitzschutzanlagen', 'Blitzschutzanlagen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.440.04.14', 'Leitungsschutzschalter', 'Leitungsschutzschalter', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.440.04.15', 'FI-Schutzschalter', 'Fehlerstromschutzschalter', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.440.04.17', 'Motorschutzschalter', 'Motorschutzschalter', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.440.04.19', 'Schütze', 'Schütze und Relais', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.440.04.20', 'Frequenzumrichter', 'Frequenzumrichter', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.440.05', 'Batterien und Ladegeräte', 'Batteriesysteme', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.440.05.16', 'Notbeleuchtung', 'Notbeleuchtungsanlagen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.440.05.17', 'Sicherheitsbeleuchtung', 'Sicherheitsbeleuchtung', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.440.05.21', 'Akkumulatoren', 'Akkumulatoren', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.440.05.22', 'Zentralbatterien', 'Zentralbatterieanlagen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.440.05.23', 'Ladegeräte', 'Batterieladegeräte', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.440.06.23', 'Photovoltaikanlagen', 'Photovoltaikanlagen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.440.06.26', 'Wechselrichter', 'Wechselrichter', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.440.09.25', 'Elektrozähler', 'Elektrozähler', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.440.09.26', 'Messeinrichtungen', 'Elektrische Messeinrichtungen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 450 - Beleuchtung
(gen_random_uuid(), 'AKS.03.450.02.03', 'Außenbeleuchtung', 'Außenbeleuchtungsanlagen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.450.02.05', 'Straßenbeleuchtung', 'Straßenbeleuchtung', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.450.03.07', 'LED-Beleuchtung', 'LED-Beleuchtungssysteme', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.450.04.08', 'Lichtsteuerung', 'Lichtsteuerungssysteme', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.450.05.10', 'Bewegungsmelder', 'Bewegungsmelder', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.450.06', 'Spezialbeleuchtung', 'Spezialbeleuchtung', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.450.06.11', 'Arbeitsplatzbeleuchtung', 'Arbeitsplatzbeleuchtung', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.450.06.12', 'Hallenbeleuchtung', 'Hallenbeleuchtung', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.450.06.13', 'Reinraumbeleuchtung', 'Reinraumbeleuchtung', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.450.06.14', 'Explosionsschutzbeleuchtung', 'Ex-Schutz Beleuchtung', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.450.06.15', 'Bühnentechnik', 'Bühnentechnik Beleuchtung', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.450.06.16', 'Medizinische Beleuchtung', 'Medizinische Beleuchtung', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.450.06.18', 'Laborbeleuchtung', 'Laborbeleuchtung', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 460 - Telekommunikation
(gen_random_uuid(), 'AKS.03.460.01.01', 'Telefonanlagen', 'Telefonanlagen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.460.01.02', 'Sprechanlagen', 'Sprechanlagen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.460.03.03', 'Netzwerkverkabelung', 'Strukturierte Verkabelung', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.460.05.08', 'Videoüberwachung', 'Videoüberwachungsanlagen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.460.05.09', 'Zutrittskontrolle', 'Zutrittskontrollsysteme', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 470 - Melde- und Alarmtechnik
(gen_random_uuid(), 'AKS.03.470', 'Melde- und Alarmtechnik', 'Melde- und Alarmanlagen allgemein', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.470.03.03', 'Brandmeldezentralen', 'Brandmeldezentralen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.470.03.05', 'Rauchmelder', 'Rauchmelder', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.470.05.04', 'Einbruchmeldeanlagen', 'Einbruchmeldeanlagen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.470.05.09', 'Überfallmeldeanlagen', 'Überfallmeldeanlagen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.470.05.10', 'Perimeterschutz', 'Perimeterschutz', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.470.09.01', 'Alarmierungsanlagen', 'Alarmierungsanlagen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.470.09.06', 'Notrufsysteme', 'Notrufsysteme', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.470.09.07', 'Personennotsignalanlagen', 'Personennotsignalanlagen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.470.09.08', 'Evakuierungsanlagen', 'Evakuierungsanlagen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.470.09.12', 'Störmeldeanlagen', 'Technische Störmeldeanlagen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 480 - Gebäudeautomation
(gen_random_uuid(), 'AKS.03.480.01.01', 'GLT-Zentralen', 'Gebäudeleittechnik-Zentralen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.480.01.03', 'DDC-Unterstationen', 'DDC-Unterstationen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.480.01.04', 'Automationsstationen', 'Automationsstationen', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'AKS.03.480.02.02', 'Raumautomation', 'Raumautomationssysteme', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 540 - Aufzugstechnik
(gen_random_uuid(), 'AKS.03.540.06.01', 'Lastenaufzüge', 'Lastenaufzüge', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = CURRENT_TIMESTAMP;