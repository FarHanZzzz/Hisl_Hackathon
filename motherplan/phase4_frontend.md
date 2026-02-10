# Phase 4: Frontend Dashboard

> **LLM Execution Notes**: This phase refactors the existing `frontend/pages/index.tsx` (382 lines)
> into a component-based architecture. The existing page IS FUNCTIONAL — do not break it.
> All paths relative to `d:\Hisl_hackathon_project\`.

---

## Prerequisites (from Phases 1–3)
- [ ] Phase 3 complete — Backend API running at `http://localhost:8000`
- [ ] Frontend dependencies installed: `cd frontend && npm install`
- [ ] `frontend/.env.local` exists with `NEXT_PUBLIC_API_URL=http://localhost:8000`

## Existing Code Reference
- **Main page**: `d:\Hisl_hackathon_project\frontend\pages\index.tsx` (382 lines) — Contains inline PatientForm, VideoUpload, result display, MetricCard, and API calls. This IS the source of truth for current behavior.
- **Package.json**: Already has `next`, `react`, `axios`, `recharts`, `lucide-react`, `tailwindcss`
- **Tailwind config**: `d:\Hisl_hackathon_project\frontend\tailwind.config.js`
- **Styles**: `d:\Hisl_hackathon_project\frontend\styles\globals.css`

---

## Tasks

### 4.1 Create Directory Structure
```bash
mkdir -p frontend/src/components
mkdir -p frontend/src/hooks
mkdir -p frontend/src/services
mkdir -p frontend/src/types
```

> **Note**: The existing project uses `frontend/pages/` (Next.js pages dir) and does NOT
> currently have a `src/` directory. Decide whether to:
> - **Option A**: Keep `pages/` at root, add `src/` alongside it for components/hooks/services
> - **Option B**: Move everything into `src/` (requires Next.js config change)
> 
> **Recommended**: Option A (less risk). Components go in `frontend/src/`, pages stay in `frontend/pages/`.

### 4.2 Create TypeScript Types

**File**: `d:\Hisl_hackathon_project\frontend\src\types\index.ts`
```typescript
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
  results?: Result[];  // Nested from Supabase join
}

// --- Result ---
export type DiagnosisType = 'normal' | 'high_risk' | 'insufficient_data';

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
```

### 4.3 Create API Client

**File**: `d:\Hisl_hackathon_project\frontend\src\services\api.ts`
```typescript
/**
 * Axios API client for the Pedi-Growth backend.
 * Base URL comes from NEXT_PUBLIC_API_URL environment variable.
 */
import axios from 'axios';
import type { UploadResponse, CreateJobResponse, Job, PatientInput } from '../types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,  // 30s timeout for most requests
});

/**
 * Upload a video file. Uses multipart/form-data.
 * Timeout set to 120s for large files.
 */
export async function uploadVideo(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post<UploadResponse>('/api/v1/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,  // 2 min for large uploads
  });
  return res.data;
}

/**
 * Create a new analysis job.
 */
export async function createJob(patient: PatientInput, videoFilename: string): Promise<CreateJobResponse> {
  const res = await api.post<CreateJobResponse>('/api/v1/jobs', {
    patient,
    video_filename: videoFilename,
  });
  return res.data;
}

/**
 * Get job status and results.
 */
export async function getJob(jobId: string): Promise<Job> {
  const res = await api.get<Job>(`/api/v1/jobs/${jobId}`);
  return res.data;
}

/**
 * List all jobs, optionally filtered by status.
 */
export async function listJobs(status?: string, limit: number = 50): Promise<Job[]> {
  const params: Record<string, string | number> = { limit };
  if (status) params.status = status;
  const res = await api.get<Job[]>('/api/v1/jobs', { params });
  return res.data;
}

/**
 * Delete a completed/failed job.
 */
export async function deleteJob(jobId: string): Promise<void> {
  await api.delete(`/api/v1/jobs/${jobId}`);
}
```

### 4.4 Create `useJob` Hook — Polling

**File**: `d:\Hisl_hackathon_project\frontend\src\hooks\useJob.ts`
```typescript
/**
 * Custom hook for polling job status.
 * Polls every 1 second while job is active (queued/processing).
 * Stops polling when job is completed or failed.
 */
import { useState, useEffect, useCallback } from 'react';
import { getJob } from '../services/api';
import type { Job } from '../types';

interface UseJobReturn {
  job: Job | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useJob(jobId: string | null): UseJobReturn {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    if (!jobId) return;
    try {
      const data = await getJob(jobId);
      setJob(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message);
    }
  }, [jobId]);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetchJob();

    const interval = setInterval(async () => {
      await fetchJob();
    }, 1000);

    return () => clearInterval(interval);
  }, [jobId, fetchJob]);

  // Stop loading when terminal state reached
  useEffect(() => {
    if (job && ['completed', 'failed'].includes(job.status)) {
      setLoading(false);
    }
  }, [job?.status]);

  return { job, loading, error, refresh: fetchJob };
}
```

### 4.5 Create `useUpload` Hook

**File**: `d:\Hisl_hackathon_project\frontend\src\hooks\useUpload.ts`
```typescript
/**
 * Custom hook for video file upload with progress tracking.
 */
import { useState } from 'react';
import { uploadVideo } from '../services/api';
import type { UploadResponse } from '../types';

interface UseUploadReturn {
  upload: (file: File) => Promise<UploadResponse>;
  uploading: boolean;
  error: string | null;
}

export function useUpload(): UseUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File): Promise<UploadResponse> => {
    setUploading(true);
    setError(null);
    try {
      const result = await uploadVideo(file);
      return result;
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message;
      setError(msg);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, error };
}
```

### 4.6 Create Components

Extract from existing `index.tsx`. Each component should be a separate file.

#### `DiagnosisBanner.tsx`
**File**: `d:\Hisl_hackathon_project\frontend\src\components\DiagnosisBanner.tsx`
```tsx
import { CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import type { DiagnosisType } from '../types';

interface Props {
  diagnosis: DiagnosisType;
  message: string;
  confidence: number;
  symmetryIndex: number;
}

const STYLES: Record<DiagnosisType, string> = {
  normal: 'bg-green-50 border-green-200 text-green-800',
  high_risk: 'bg-red-50 border-red-200 text-red-800',
  insufficient_data: 'bg-yellow-50 border-yellow-200 text-yellow-800',
};

const ICONS: Record<DiagnosisType, React.ReactNode> = {
  normal: <CheckCircle className="w-8 h-8 text-green-600" />,
  high_risk: <AlertTriangle className="w-8 h-8 text-red-600" />,
  insufficient_data: <HelpCircle className="w-8 h-8 text-yellow-600" />,
};

const LABELS: Record<DiagnosisType, string> = {
  normal: 'NORMAL',
  high_risk: 'HIGH RISK',
  insufficient_data: 'INSUFFICIENT DATA',
};

export function DiagnosisBanner({ diagnosis, message, confidence, symmetryIndex }: Props) {
  return (
    <div className={`rounded-xl p-6 border-2 ${STYLES[diagnosis]}`}>
      <div className="flex items-start gap-4">
        <div className="mt-1">{ICONS[diagnosis]}</div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-xl font-bold">{LABELS[diagnosis]}</h3>
            <span className="text-sm opacity-75">SI = {symmetryIndex.toFixed(2)}</span>
          </div>
          <p className="text-sm mb-2">{message}</p>
          <p className="text-xs opacity-60">
            Confidence: {(confidence * 100).toFixed(0)}%
          </p>
        </div>
      </div>
    </div>
  );
}
```

#### `MetricCard.tsx`
**File**: `d:\Hisl_hackathon_project\frontend\src\components\MetricCard.tsx`
```tsx
interface Props {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}

export function MetricCard({ label, value, unit, icon, highlight }: Props) {
  return (
    <div className={`rounded-lg p-4 border ${
      highlight ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
    } shadow-sm`}>
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-gray-500">{icon}</span>}
        <span className="text-xs uppercase tracking-wide text-gray-500 font-medium">
          {label}
        </span>
      </div>
      <div className="text-2xl font-bold text-gray-900">
        {typeof value === 'number' ? value.toFixed(1) : value}
        {unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
      </div>
    </div>
  );
}
```

#### `AngleChart.tsx`
**File**: `d:\Hisl_hackathon_project\frontend\src\components\AngleChart.tsx`
```tsx
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface Props {
  leftAngles: number[];
  rightAngles: number[];
}

export function AngleChart({ leftAngles, rightAngles }: Props) {
  const data = leftAngles.map((left, i) => ({
    frame: i + 1,
    left: Math.round(left * 10) / 10,
    right: Math.round((rightAngles[i] || 0) * 10) / 10,
  }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h4 className="text-sm font-medium text-gray-700 mb-3">
        Knee Flexion Angle — Left vs Right
      </h4>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="frame"
            label={{ value: 'Frame', position: 'insideBottom', offset: -5 }}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            label={{ value: 'Angle (°)', angle: -90, position: 'insideLeft' }}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            formatter={(value: number) => [`${value}°`]}
            labelFormatter={(label) => `Frame ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="left"
            stroke="#22c55e"
            name="Left Knee"
            dot={false}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="right"
            stroke="#ef4444"
            name="Right Knee"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

#### `ProgressBar.tsx`
**File**: `d:\Hisl_hackathon_project\frontend\src\components\ProgressBar.tsx`
```tsx
interface Props {
  progress: number;    // 0.0 to 1.0
  status: string;      // "queued" | "processing" | "completed" | "failed"
}

export function ProgressBar({ progress, status }: Props) {
  const percentage = Math.round(progress * 100);
  
  const bgColor = status === 'failed' ? 'bg-red-500' :
                  status === 'completed' ? 'bg-green-500' : 'bg-blue-500';

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600 capitalize">{status.replace('_', ' ')}...</span>
        <span className="font-medium">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${bgColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
```

### 4.7 Refactor `pages/index.tsx`

**Modify** `d:\Hisl_hackathon_project\frontend\pages\index.tsx`:
- Replace inline components with imports from `src/components/`
- Replace inline API calls with `useUpload` and `useJob` hooks
- Replace inline types with imports from `src/types/`
- Keep the same page layout and user flow

**Key imports to add**:
```tsx
import { DiagnosisBanner } from '../src/components/DiagnosisBanner';
import { MetricCard } from '../src/components/MetricCard';
import { AngleChart } from '../src/components/AngleChart';
import { ProgressBar } from '../src/components/ProgressBar';
import { useJob } from '../src/hooks/useJob';
import { useUpload } from '../src/hooks/useUpload';
import { uploadVideo, createJob } from '../src/services/api';
import type { PatientInput } from '../src/types';
```

**Important**: The refactored page should produce IDENTICAL behavior to the current version. Test by comparing the UI before and after.

### 4.8 Create Results Page

**File**: `d:\Hisl_hackathon_project\frontend\pages\results\[id].tsx`
```tsx
/**
 * Individual result page — accessed via /results/[jobId]
 * Shows full analysis results for a completed job.
 */
import { useRouter } from 'next/router';
import { useJob } from '../../src/hooks/useJob';
import { DiagnosisBanner } from '../../src/components/DiagnosisBanner';
import { MetricCard } from '../../src/components/MetricCard';
import { AngleChart } from '../../src/components/AngleChart';
import { ProgressBar } from '../../src/components/ProgressBar';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ResultPage() {
  const router = useRouter();
  const { id } = router.query;
  const { job, loading, error } = useJob(id as string);

  if (!id) return null;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!job) return <div className="p-8">Loading...</div>;

  const result = job.results?.[0];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link href="/" className="flex items-center gap-2 text-blue-600 hover:underline mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      <h1 className="text-2xl font-bold mb-6">Analysis Results</h1>

      {/* Show progress if still processing */}
      {['queued', 'processing'].includes(job.status) && (
        <ProgressBar progress={job.progress} status={job.status} />
      )}

      {/* Show error if failed */}
      {job.status === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-bold">Analysis Failed</p>
          <p className="text-sm mt-1">{job.error_message}</p>
        </div>
      )}

      {/* Show results if completed */}
      {job.status === 'completed' && result && (
        <div className="space-y-6">
          <DiagnosisBanner
            diagnosis={result.diagnosis}
            message=""
            confidence={result.confidence}
            symmetryIndex={result.symmetry_index}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Left Max" value={result.left_max_flexion} unit="°" />
            <MetricCard label="Right Max" value={result.right_max_flexion} unit="°" />
            <MetricCard label="Asymmetry" value={result.asymmetry_percentage} unit="%" highlight={result.is_high_risk} />
            <MetricCard label="Detection" value={result.detection_rate} unit="%" />
          </div>

          {result.left_angle_series && result.right_angle_series && (
            <AngleChart
              leftAngles={result.left_angle_series}
              rightAngles={result.right_angle_series}
            />
          )}

          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>Left ROM: {result.left_rom?.toFixed(1)}°</div>
            <div>Right ROM: {result.right_rom?.toFixed(1)}°</div>
            <div>Frames: {result.frames_processed}</div>
            <div>Detected: {result.frames_detected}</div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Verification Checklist

| Check | Command / Action | Expected |
|-------|-----------------|----------|
| Frontend starts | `cd frontend && npm run dev` | Runs on `http://localhost:3000` |
| Home page loads | Open `http://localhost:3000` in browser | Upload form + patient fields visible |
| Components render | Check DiagnosisBanner, MetricCard, AngleChart display after submit | Correct colors + values |
| Results page | Navigate to `http://localhost:3000/results/{jobId}` | Full results display |
| Mobile responsive | Resize browser to 375px width | Layout adjusts |
| TypeScript compiles | `cd frontend && npx tsc --noEmit` | No type errors |

---

## Outputs of This Phase
New files:
```
frontend/src/types/index.ts
frontend/src/services/api.ts
frontend/src/hooks/useJob.ts
frontend/src/hooks/useUpload.ts
frontend/src/components/DiagnosisBanner.tsx
frontend/src/components/MetricCard.tsx
frontend/src/components/AngleChart.tsx
frontend/src/components/ProgressBar.tsx
frontend/pages/results/[id].tsx
```
Modified files:
```
frontend/pages/index.tsx   (refactored to use extracted components)
```
