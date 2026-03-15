-- Migration: Add Orthopedic Feature Columns to results table
-- Phase 2: Rickets (Valgus)
ALTER TABLE results ADD COLUMN IF NOT EXISTS knee_valgus_angle FLOAT8;
ALTER TABLE results ADD COLUMN IF NOT EXISTS knee_valgus_angle_array JSONB;

-- Phase 3: LLD (Pelvic Tilt)
ALTER TABLE results ADD COLUMN IF NOT EXISTS pelvic_tilt FLOAT8;
ALTER TABLE results ADD COLUMN IF NOT EXISTS pelvic_tilt_array JSONB;

-- Phase 4: Clubfoot (Progression & Dorsiflexion)
ALTER TABLE results ADD COLUMN IF NOT EXISTS foot_progression_angle FLOAT8;
ALTER TABLE results ADD COLUMN IF NOT EXISTS foot_progression_angle_array JSONB;
ALTER TABLE results ADD COLUMN IF NOT EXISTS ankle_dorsiflexion FLOAT8;
ALTER TABLE results ADD COLUMN IF NOT EXISTS ankle_dorsiflexion_array JSONB;

COMMENT ON COLUMN results.knee_valgus_angle IS 'Average knee valgus angle (Frontal plane)';
COMMENT ON COLUMN results.pelvic_tilt IS 'Max pelvic tilt amplitude (Frontal plane)';
COMMENT ON COLUMN results.ankle_dorsiflexion IS 'Ankle dorsiflexion limit (Sagittal plane)';
