-- ==============================================================================
-- Migration: 003_neuromuscular_features
-- Description: Adds Neuromuscular arrays (DMD, Scoliosis) to the results table
-- Action: Safe additive migration (Total System Isolation Rule)
-- ==============================================================================

-- 1. Add Trunk Sway Array (Duchenne Muscular Dystrophy - Waddling)
ALTER TABLE public.results 
ADD COLUMN IF NOT EXISTS trunk_sway_array JSONB DEFAULT '[]'::jsonb;

-- 2. Add Shoulder Tilt Array (Early-Onset Scoliosis - Postural Asymmetry Vector)
ALTER TABLE public.results 
ADD COLUMN IF NOT EXISTS shoulder_tilt_array JSONB DEFAULT '[]'::jsonb;

-- Indexing for performance on large arrays is generally not done on the JSONB itself unless querying inside
-- However, we comment here that these support the Phase 7 Neuromuscular Integration.
