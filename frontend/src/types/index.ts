/**
 * Shared TypeScript types matching the backend Supabase schema.
 * Keep in sync with backend/app/schemas.py and database tables.
 */

// --- Patient ---
export interface PatientInput {
  patient_id: string;
  patient_name?: string;
  age?: number;
  notes?: string;
}

// --- Job ---
export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface Job {
  id: string;
  patient_ref: string;
  status: JobStatus;
  progress: number;
  video_filename: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
  results?: Result;  // Nested from Supabase join (one-to-one)
}

// --- Result ---
export type DiagnosisType = 'normal' | 'high_risk' | 'insufficient_data' | 'dmd_risk' | 'scoliosis_risk';

export interface Result {
  id: string;
  job_id: string;
  left_max_flexion: number;
  left_min_flexion: number;
  left_rom: number;
  right_max_flexion: number;
  right_min_flexion: number;
  right_rom: number;
  symmetry_index: number;
  asymmetry_percentage: number;
  diagnosis: DiagnosisType;
  is_high_risk: boolean;
  confidence: number;
  detection_rate: number;
  frames_processed: number;
  frames_detected: number;
  left_angle_series: number[];
  right_angle_series: number[];
  
  // --- Orthopedic Features ---
  knee_valgus_angle?: number;
  knee_valgus_angle_array?: number[];

  pelvic_tilt?: number;
  pelvic_tilt_array?: number[];

  foot_progression_angle?: number;
  foot_progression_angle_array?: number[];

  ankle_dorsiflexion?: number;
  ankle_dorsiflexion_array?: number[];

  // --- Neuromuscular Features ---
  trunk_sway_array?: number[];
  shoulder_tilt_array?: number[];

  created_at: string;
}

// --- API Responses ---
export interface UploadResponse {
  filename: string;
  size_mb: number;
}

export interface CreateJobResponse {
  job_id: string;
  status: 'queued';
  message: string;
}

// --- AI Summary ---
export interface AISummary {
  overview: string;
  what_this_means: string;
  key_findings: string[];
  risk_assessment: string;
  recommendations: string[];
  disclaimer: string;
}
