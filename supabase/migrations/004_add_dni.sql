-- Add DNI column to clientes table
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS dni text;
