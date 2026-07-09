-- Migration 002: Add extra fields to saved_programs and programs
-- Run this in the Supabase SQL editor after migration 001.

-- Add application-specific fields to saved_programs (per-user data)
ALTER TABLE saved_programs
  ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS delivery_mode TEXT CHECK (delivery_mode IN ('in_person', 'online', 'hybrid', 'unknown')),
  ADD COLUMN IF NOT EXISTS app_fee TEXT;

-- Add program catalog fields to programs
ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS tuition_notes TEXT,
  ADD COLUMN IF NOT EXISTS field_of_study TEXT;

-- Update the updated_at trigger to cover the new columns (already set up by trigger in 001)
