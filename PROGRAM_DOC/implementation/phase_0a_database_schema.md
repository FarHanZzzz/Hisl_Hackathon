# Phase 0A: Database Schema Migration

## Goal
Create the foundational database tables including users, sessions, patient sharing, and the new consultation scheduling system for avoiding time clashes.

## Dependencies
- None (this is the starting point)

## What Gets Created

### Table 1: `profiles` (User Identity)
Links to Supabase Auth. Every user (clinician, patient, admin) gets a profile.

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('clinician', 'patient', 'admin')),
  display_name TEXT,
  phone TEXT,
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'bn')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Table 2: `sessions` (Group Analyses)
Groups analyses under a clinical visit.

```sql
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinician_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Table 3: Modify `jobs` and `patients`

```sql
ALTER TABLE public.jobs
  ADD COLUMN session_id UUID REFERENCES sessions(id) ON DELETE SET NULL;

ALTER TABLE public.patients
  ADD COLUMN owner_id UUID REFERENCES profiles(id);
```

### Table 4: `patient_access` (Shareable Links)
Allows secure sharing without login.

```sql
CREATE TABLE public.patient_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  access_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### Table 5: `doctor_availability` and `appointments` (Scheduling System)
Ensures patients can pick a specific time and date without clashes.

```sql
-- Represents blocks of time a clinician is available for consultation
CREATE TABLE public.doctor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinician_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- Represents a booked consultation
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinician_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL, -- The analysis report being discussed
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  meet_link TEXT, -- e.g., Google Meet or Zoom link
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Prevent double booking for the same clinician at the same time
  UNIQUE(clinician_id, appointment_date, start_time) 
);
```

---

### Row Level Security (RLS) policies
Admins can access EVERYTHING. Clinicians access their own. Patients access their own.

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Admins can do anything
CREATE POLICY "Admins full access profiles" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Users see own profile
CREATE POLICY "Users see own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Appointments visibility
CREATE POLICY "Users see related appointments" ON appointments
  FOR SELECT USING (
    clinician_id = auth.uid() OR 
    patient_id IN (SELECT id FROM patients WHERE owner_id = auth.uid() OR id IN (
        -- logic bridging patient login to patient record
    )) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

## Exit Criteria
Schema includes support for the clash-free scheduling system and admin roles.
