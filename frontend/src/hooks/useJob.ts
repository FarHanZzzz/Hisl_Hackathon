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
