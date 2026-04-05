-- =============================================================================
-- Migration 006: Auth, Roles, Sessions & Scheduling (Phase 0A)
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- DDL-only — does NOT modify existing data.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PROFILES — extends auth.users with role + display info
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
    id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role         TEXT NOT NULL CHECK (role IN ('clinician', 'patient', 'admin')),
    display_name TEXT,
    phone        TEXT,
    language     TEXT DEFAULT 'en' CHECK (language IN ('en', 'bn')),
    created_at   TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE profiles IS 'User identity layer — maps auth.users to a Pedi-Growth role.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. SESSIONS — groups multiple jobs into one clinical visit
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sessions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id    UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    clinician_id  UUID NOT NULL REFERENCES profiles(id),
    title         TEXT,
    notes         TEXT,
    created_at    TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE sessions IS 'Clinical visit session grouping multiple analysis jobs.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ALTER jobs — link to session (nullable, backward-compatible)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE jobs
    ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES sessions(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. ALTER patients — assign an owner (clinician who created the record)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE patients
    ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. PATIENT_ACCESS — shareable links / token-based access for parents
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS patient_access (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id   UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    profile_id   UUID REFERENCES profiles(id),
    access_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    expires_at   TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
    created_at   TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE patient_access IS 'Token-based access grants — lets parents view their child''s reports.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. DOCTOR_AVAILABILITY — weekly recurring schedule
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS doctor_availability (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinician_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    day_of_week   INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time    TIME NOT NULL,
    end_time      TIME NOT NULL,
    is_active     BOOLEAN DEFAULT TRUE,
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

COMMENT ON TABLE doctor_availability IS 'Recurring weekly availability slots for clinicians.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. APPOINTMENTS — booked consultation slots
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS appointments (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id       UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    clinician_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    job_id           UUID REFERENCES jobs(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    start_time       TIME NOT NULL,
    end_time         TIME NOT NULL,
    status           TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    meet_link        TEXT,
    created_at       TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT no_double_booking UNIQUE (clinician_id, appointment_date, start_time)
);

COMMENT ON TABLE appointments IS 'One-off consultation appointments between clinicians and patients.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS on all new tables
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_access     ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments       ENABLE ROW LEVEL SECURITY;

-- ── PROFILES ────────────────────────────────────────────────────────────────

-- Users can read their own profile
CREATE POLICY profiles_select_own ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY profiles_update_own ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admins can do everything on profiles
CREATE POLICY profiles_admin_all ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Service role (backend) can insert new profiles during registration
CREATE POLICY profiles_insert_service ON profiles
    FOR INSERT WITH CHECK (true);

-- ── SESSIONS ────────────────────────────────────────────────────────────────

-- Clinician who owns the session can see it
CREATE POLICY sessions_select_clinician ON sessions
    FOR SELECT USING (clinician_id = auth.uid());

-- Admins full access on sessions
CREATE POLICY sessions_admin_all ON sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Clinicians can create sessions
CREATE POLICY sessions_insert_clinician ON sessions
    FOR INSERT WITH CHECK (clinician_id = auth.uid());

-- ── PATIENT_ACCESS ──────────────────────────────────────────────────────────

-- Users can see their own access grants
CREATE POLICY patient_access_select_own ON patient_access
    FOR SELECT USING (profile_id = auth.uid());

-- Admins full access on patient_access
CREATE POLICY patient_access_admin_all ON patient_access
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Clinicians can grant access to their patients
CREATE POLICY patient_access_insert_clinician ON patient_access
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM patients pat
            WHERE pat.id = patient_access.patient_id AND pat.owner_id = auth.uid()
        )
    );

-- ── DOCTOR_AVAILABILITY ─────────────────────────────────────────────────────

-- Anyone authenticated can view doctor availability (needed for booking)
CREATE POLICY availability_select_authenticated ON doctor_availability
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Clinicians can manage their own availability
CREATE POLICY availability_manage_own ON doctor_availability
    FOR ALL USING (clinician_id = auth.uid())
    WITH CHECK (clinician_id = auth.uid());

-- Admins full access on availability
CREATE POLICY availability_admin_all ON doctor_availability
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- ── APPOINTMENTS ────────────────────────────────────────────────────────────

-- Clinicians can see their own appointments
CREATE POLICY appointments_select_clinician ON appointments
    FOR SELECT USING (clinician_id = auth.uid());

-- Patients (owners of the patient record) can see related appointments
CREATE POLICY appointments_select_patient_owner ON appointments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM patients pat
            WHERE pat.id = appointments.patient_id AND pat.owner_id = auth.uid()
        )
    );

-- Admins full access on appointments
CREATE POLICY appointments_admin_all ON appointments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
        )
    );

-- Authenticated users can book appointments
CREATE POLICY appointments_insert_authenticated ON appointments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Clinicians can update their own appointments (status, meet_link)
CREATE POLICY appointments_update_clinician ON appointments
    FOR UPDATE USING (clinician_id = auth.uid())
    WITH CHECK (clinician_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. INDEXES for common query patterns
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_sessions_patient ON sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_clinician ON sessions(clinician_id);
CREATE INDEX IF NOT EXISTS idx_jobs_session ON jobs(session_id);
CREATE INDEX IF NOT EXISTS idx_patients_owner ON patients(owner_id);
CREATE INDEX IF NOT EXISTS idx_patient_access_token ON patient_access(access_token);
CREATE INDEX IF NOT EXISTS idx_patient_access_patient ON patient_access(patient_id);
CREATE INDEX IF NOT EXISTS idx_availability_clinician ON doctor_availability(clinician_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinician_date ON appointments(clinician_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);

-- =============================================================================
-- END Migration 006
-- =============================================================================
