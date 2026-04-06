-- Add categoria column to servicios
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS categoria text;

-- Add horario columns to personal (for display in cards)
ALTER TABLE personal ADD COLUMN IF NOT EXISTS horario_inicio time DEFAULT '09:00';
ALTER TABLE personal ADD COLUMN IF NOT EXISTS horario_fin time DEFAULT '18:00';
