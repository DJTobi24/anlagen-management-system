-- Fix QR code length issue
-- QR codes stored as base64 data URLs can be much longer than 255 characters

-- Alter the qr_code column to TEXT type
ALTER TABLE anlagen ALTER COLUMN qr_code TYPE TEXT;