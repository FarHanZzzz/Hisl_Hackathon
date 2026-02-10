import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, CheckCircle, AlertTriangle, Loader2, Trash2, RefreshCw } from 'lucide-react';
import { listJobs, deleteJob } from '../services/api';
import type { Job, JobStatus } from '../types';

const STATUS_CONFIG: Record<JobStatus, { icon: React.ReactNode; label: string; color: string }> = {
  queued: {
    icon: <Clock className="w-4 h-4" />,
    label: 'Queued',
    color: 'bg-gray-100 text-gray-600',
  },
  processing: {
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
    label: 'Processing',
    color: 'bg-primary-50 text-primary-600',
  },
  completed: {
    icon: <CheckCircle className="w-4 h-4" />,
    label: 'Completed',
    color: 'bg-success-50 text-success-600',
  },
  failed: {
    icon: <AlertTriangle className="w-4 h-4" />,
    label: 'Failed',
    color: 'bg-danger-50 text-danger-600',
  },
};

export function JobHistoryTable() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await listJobs(undefined, 20);
      setJobs(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async (jobId: string) => {
    if (!confirm('Delete this analysis?')) return;
    try {
      await deleteJob(jobId);
      setJobs(prev => prev.filter(j => j.id !== jobId));
    } catch (err: any) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <Loader2 className="h-6 w-6 text-gray-400 animate-spin mx-auto" />
        <p className="text-sm text-gray-500 mt-2">Loading history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
        <p className="text-sm text-danger-600">Failed to load history: {error}</p>
        <button onClick={fetchJobs} className="text-xs text-primary-600 hover:underline mt-2">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Recent Analyses</h3>
        <button
          onClick={fetchJobs}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <p className="text-sm text-gray-400">No analyses yet. Start your first analysis above.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider hidden sm:table-cell">Date</th>
                <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs.map((job) => {
                const config = STATUS_CONFIG[job.status];
                return (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 text-sm">{job.patient_ref}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[200px]">{job.video_filename}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                        {config.icon}
                        {config.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs hidden sm:table-cell">
                      {formatDate(job.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {job.status === 'completed' && (
                        <Link
                          href={`/results/${job.id}`}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                        >
                          View Results
                        </Link>
                      )}
                      {['completed', 'failed'].includes(job.status) && (
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="inline-flex items-center p-1.5 text-gray-400 hover:text-danger-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
