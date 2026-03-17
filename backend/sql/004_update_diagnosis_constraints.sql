-- Migration: Update Diagnosis Check Constraint
-- This allows the new 'dmd_risk' and 'scoliosis_risk' labels to be saved in the database.

-- 1. Drop the old restriction
ALTER TABLE results 
DROP CONSTRAINT IF EXISTS results_diagnosis_check;

-- 2. Add the updated restriction with new categories


ALTER TABLE results 
ADD CONSTRAINT results_diagnosis_check 
CHECK (diagnosis IN ('normal', 'high_risk', 'insufficient_data', 'dmd_risk', 'scoliosis_risk'));



COMMENT ON CONSTRAINT results_diagnosis_check ON results IS 'Ensures diagnosis follows the valid enum values including Neuromuscular risks.';
