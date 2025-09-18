-- Mandant Settings Table
CREATE TABLE IF NOT EXISTS mandant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandant_id UUID NOT NULL REFERENCES mandanten(id) ON DELETE CASCADE,
  logo VARCHAR(255),
  primary_color VARCHAR(7) DEFAULT '#4F46E5',
  secondary_color VARCHAR(7) DEFAULT '#7C3AED',
  custom_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(mandant_id)
);

-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(10) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  language VARCHAR(2) DEFAULT 'de' CHECK (language IN ('de', 'en')),
  high_contrast BOOLEAN DEFAULT false,
  notifications JSONB DEFAULT '{"email": true, "inApp": true}',
  table_rows_per_page INTEGER DEFAULT 25 CHECK (table_rows_per_page IN (10, 25, 50, 100)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX idx_mandant_settings_mandant_id ON mandant_settings(mandant_id);
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);