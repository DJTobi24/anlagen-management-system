-- Insert default mandant
INSERT INTO mandanten (id, name, description) VALUES 
('00000000-0000-0000-0000-000000000001', 'Standard Mandant', 'Default mandant for initial setup');

-- Insert admin user (password: admin123)
INSERT INTO users (id, email, password, first_name, last_name, role, mandant_id) VALUES 
('00000000-0000-0000-0000-000000000001', 'admin@example.com', '$2a$10$rOyZQzhUPjmvTnOcbL9Y8u8K.GQVN9CUBl8cUKhKlL5WJ3O8k0mzi', 'System', 'Administrator', 'admin', '00000000-0000-0000-0000-000000000001');

-- Insert sample liegenschaft
INSERT INTO liegenschaften (id, mandant_id, name, address, description) VALUES 
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Hauptgebäude', 'Musterstraße 123, 12345 Musterstadt', 'Hauptgebäude der Liegenschaft');

-- Insert sample objekt
INSERT INTO objekte (id, liegenschaft_id, name, description, floor, room) VALUES 
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Technikraum EG', 'Haupttechnikraum im Erdgeschoss', 'EG', 'T001');