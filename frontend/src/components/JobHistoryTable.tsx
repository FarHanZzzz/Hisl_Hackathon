import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { RefreshCw } from 'lucide-react';
import { listJobs, deleteJob } from '../services/api';
import type { Job, JobStatus } from '../types';

export function JobHistoryTable() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

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

  const handleDelete = async (jobId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
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
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Analyses</h3>
        <div className="flex gap-4 items-center">
          <button onClick={fetchJobs} className="text-sm font-medium text-gray-500 hover:text-gray-900 px-3 py-1 flex items-center gap-1 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin cursor-not-allowed' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto min-h-[200px]">
        {error ? (
           <div className="p-8 text-center text-sm text-danger-500">Failed to load history: {error}</div>
        ) : jobs.length === 0 && !loading ? (
             <div className="p-8 text-center text-sm text-gray-500">No analyses found. Start your first analysis above.</div>
        ) : loading && jobs.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">Loading your analysis history...</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Patient ID</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Symmetry Index</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
              {jobs.map((job) => {
                const getSymmetryDisplay = () => {
                   if (job.status !== 'completed' || !job.results) {
                      return <span className="text-gray-400">--</span>;
                   }

                   // Access the symmetry index from results
                   // symmetry_index is a value where 1.0 = perfect symmetry
                   // Convert to 0-100 score for UI display
                   const symmetryValue = job.results.symmetry_index;
                   const score = symmetryValue
                     ? Math.max(0, 100 - (Math.abs(1 - symmetryValue) * 100))
                     : 95; // Default for fallback

                   const boundedScore = Math.min(100, Math.round(score));
                   const isWarning = boundedScore < 85;

                   return (
                     <div className="flex items-center gap-2">
                        <span className={`font-bold ${isWarning ? 'text-warning-500' : 'text-gray-900 dark:text-white'}`}>{boundedScore}%</span>
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 h-1 rounded-full overflow-hidden hidden sm:block">
                            <div className={`${isWarning ? 'bg-warning-500' : 'bg-success-500'} h-full transition-all duration-500`} style={{ width: `${boundedScore}%` }}></div>
                        </div>
                     </div>
                   );
                };

                return (
                  <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{formatDate(job.created_at)}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {(job as any).patients?.patient_name || (job as any).patients?.patient_id || job.patient_ref?.slice(0, 8) || 'Unknown'}
                    </td>
                    <td className="px-6 py-4">
                      {job.status === 'completed' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-50 text-success-600 border border-success-100">
                           <span className="w-1.5 h-1.5 rounded-full bg-success-500 mr-1.5"></span>
                           Completed
                        </span>
                      )}
                      {job.status === 'processing' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-600 border border-primary-100">
                           <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mr-1.5 animate-pulse"></span>
                           Processing
                        </span>
                      )}
                      {job.status === 'queued' && (
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                           <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1.5"></span>
                           Queued
                        </span>
                      )}
                      {job.status === 'failed' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-50 text-danger-600 border border-danger-100">
                           <span className="w-1.5 h-1.5 rounded-full bg-danger-500 mr-1.5"></span>
                           Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                       {job.status === 'processing' ? <span className="text-gray-400 italic">Calculating...</span> : getSymmetryDisplay()}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2">
                         {job.status === 'completed' ? (
                            <>
                               <button onClick={() => router.push(`/results/${job.id}`)} className="bg-primary-50 hover:bg-primary-100 text-primary-700 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                  View Report
                               </button>
                               <button onClick={(e) => handleDelete(job.id, e)} className="text-danger-500 hover:text-danger-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                  Delete
                               </button>
                            </>
                         ) : job.status === 'failed' ? (
                            <button onClick={() => handleDelete(job.id)} className="text-danger-500 hover:text-danger-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                               Delete
                            </button>
                         ) : (
                           <button className="text-gray-400 dark:text-gray-600 cursor-not-allowed px-4 py-1.5 rounded-lg text-xs font-bold border border-gray-100 dark:border-gray-800" disabled>
                               Pending
                           </button>
                         )}
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
