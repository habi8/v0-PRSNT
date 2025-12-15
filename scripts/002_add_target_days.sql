-- Add target_days column to classes table
ALTER TABLE classes ADD COLUMN IF NOT EXISTS target_days INTEGER DEFAULT NULL;
