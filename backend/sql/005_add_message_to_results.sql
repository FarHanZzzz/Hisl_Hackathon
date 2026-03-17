-- =============================================================================
-- Migration: Add Clinical Message Column
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- =============================================================================

ALTER TABLE results 
ADD COLUMN IF NOT EXISTS message TEXT DEFAULT '';

COMMENT ON COLUMN results.message IS 'Stores the human-readable clinical explanation of the diagnosis.';
