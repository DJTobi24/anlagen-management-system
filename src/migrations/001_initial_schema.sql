-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create mandanten table
CREATE TABLE mandanten (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'techniker', 'aufnehmer')),
    mandant_id UUID NOT NULL REFERENCES mandanten(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create refresh_tokens table
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create liegenschaften table
CREATE TABLE liegenschaften (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mandant_id UUID NOT NULL REFERENCES mandanten(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create objekte table
CREATE TABLE objekte (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    liegenschaft_id UUID NOT NULL REFERENCES liegenschaften(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    floor VARCHAR(50),
    room VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create anlagen table
CREATE TABLE anlagen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    objekt_id UUID NOT NULL REFERENCES objekte(id) ON DELETE CASCADE,
    t_nummer VARCHAR(100),
    aks_code VARCHAR(100) NOT NULL,
    qr_code VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'aktiv' CHECK (status IN ('aktiv', 'inaktiv', 'wartung', 'defekt')),
    zustands_bewertung INTEGER NOT NULL CHECK (zustands_bewertung >= 1 AND zustands_bewertung <= 5),
    dynamic_fields JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_mandant_id ON users(mandant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_liegenschaften_mandant_id ON liegenschaften(mandant_id);
CREATE INDEX idx_objekte_liegenschaft_id ON objekte(liegenschaft_id);
CREATE INDEX idx_anlagen_objekt_id ON anlagen(objekt_id);
CREATE INDEX idx_anlagen_aks_code ON anlagen(aks_code);
CREATE INDEX idx_anlagen_qr_code ON anlagen(qr_code);
CREATE INDEX idx_anlagen_status ON anlagen(status);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mandanten_updated_at BEFORE UPDATE ON mandanten FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_liegenschaften_updated_at BEFORE UPDATE ON liegenschaften FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_objekte_updated_at BEFORE UPDATE ON objekte FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_anlagen_updated_at BEFORE UPDATE ON anlagen FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();