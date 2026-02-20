/**
 * Axios API client for the Pedi-Growth backend.
 * Base URL comes from NEXT_PUBLIC_API_URL environment variable.
 * Next.js rewrites /api/* to backend, so we use relative paths.
 */
import axios from 'axios';
import type { UploadResponse, CreateJobResponse, Job, PatientInput, AISummary } from '../types';

const api = axios.create({
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

/**
 * Upload a video file. Uses multipart/form-data.
 */
export async function uploadVideo(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post<UploadResponse>('/api/v1/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
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

/**
 * Generate AI clinical summary for a completed job.
 */
export async function getAISummary(jobId: string): Promise<AISummary> {
  const res = await api.post<AISummary>(`/api/v1/summary/${jobId}`, {}, {
    timeout: 60000, // AI calls can take longer
  });
  return res.data;
}
