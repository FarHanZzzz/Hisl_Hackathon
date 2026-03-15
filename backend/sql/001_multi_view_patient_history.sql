-- =============================================================================
-- Migration: Multi-View Support & Patient History
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Safe to run on existing data — all changes are additive / nullable.
-- =============================================================================

-- 1. Add video_view_type to the jobs table (default 'sagittal' for backward compat)
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS video_view_type TEXT NOT NULL DEFAULT 'sagittal'
  CHECK (video_view_type IN ('sagittal', 'frontal', 'posterior'));

-- 2. Add optional multi-view metric columns to the results table
ALTER TABLE results
  ADD COLUMN IF NOT EXISTS frontal_symmetry_index    DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS shoulder_asymmetry_angle  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS hip_knee_ankle_angle      DOUBLE PRECISION;

-- 3. Create a view for longitudinal symmetry-score tracking per patient
CREATE OR REPLACE VIEW patient_symmetry_history AS
SELECT
    p.id            AS patient_id,
    p.patient_id    AS patient_external_id,
    p.patient_name,
    r.symmetry_index,
    r.frontal_symmetry_index,
    j.video_view_type,
    j.completed_at  AS recorded_at
FROM patients p
JOIN jobs    j ON j.patient_ref = p.id
JOIN results r ON r.job_id      = j.id
WHERE j.status = 'completed'
ORDER BY p.id, j.completed_at ASC;
