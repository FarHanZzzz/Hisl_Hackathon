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
    <div className="bg-slate-900/40 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] border border-cyan-500/20 backdrop-blur-md overflow-hidden">
      <div className="px-6 py-4 border-b border-cyan-500/20 flex justify-between items-center bg-slate-900/60 shadow-inner">
        <h3 className="text-lg font-semibold text-slate-50">Recent Analyses</h3>
        <div className="flex gap-4 items-center">
          <button onClick={fetchJobs} className="text-sm font-medium text-cyan-400/80 hover:text-cyan-400 px-3 py-1 flex items-center gap-1 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin cursor-not-allowed' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto min-h-[200px]">
        {error ? (
           <div className="p-8 text-center text-sm text-red-400">Failed to load history: {error}</div>
        ) : jobs.length === 0 && !loading ? (
             <div className="p-8 text-center text-sm text-slate-400">No analyses found. Start your first analysis above.</div>
        ) : loading && jobs.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">Loading your analysis history...</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-cyan-500/20">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Patient ID</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Symmetry Index</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-500/10 text-sm">
              {jobs.map((job) => {
                const getSymmetryDisplay = () => {
                   if (job.status !== 'completed' || !job.results) {
                      return <span className="text-slate-500">--</span>;
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
                        <span className={`font-bold ${isWarning ? 'text-amber-400' : 'text-slate-50'}`}>{boundedScore}%</span>
                        <div className="w-16 bg-slate-800 border border-slate-700 h-1 rounded-full overflow-hidden hidden sm:block">
                            <div className={`${isWarning ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.8)]'} h-full transition-all duration-500`} style={{ width: `${boundedScore}%` }}></div>
                        </div>
                     </div>
                   );
                };

                return (
                  <tr key={job.id} className="hover:bg-cyan-500/10 transition-colors">
                    <td className="px-6 py-4 text-slate-400">{formatDate(job.created_at)}</td>
                    <td className="px-6 py-4 font-semibold text-slate-50">
                      {(job as any).patients?.patient_name || (job as any).patients?.patient_id || job.patient_ref?.slice(0, 8) || 'Unknown'}
                    </td>
                    <td className="px-6 py-4">
                      {job.status === 'completed' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-500/30">
                           <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 shadow-[0_0_5px_rgba(74,222,128,0.8)]"></span>
                           Completed
                        </span>
                      )}
                      {job.status === 'processing' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-900/30 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                           <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-1.5 animate-pulse shadow-[0_0_5px_rgba(34,211,238,0.8)]"></span>
                           Processing
                        </span>
                      )}
                      {job.status === 'queued' && (
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                           <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>
                           Queued
                        </span>
                      )}
                      {job.status === 'failed' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-500/30">
                           <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 shadow-[0_0_5px_rgba(239,68,68,0.8)]"></span>
                           Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                       {job.status === 'processing' ? <span className="text-slate-500 italic">Calculating...</span> : getSymmetryDisplay()}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2">
                         {job.status === 'completed' ? (
                            <>
                               <button onClick={() => router.push(`/results/${job.id}`)} className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                  View Report
                               </button>
                               <button onClick={(e) => handleDelete(job.id, e)} className="text-red-400 hover:bg-red-900/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                  Delete
                               </button>
                            </>
                         ) : job.status === 'failed' ? (
                            <button onClick={() => handleDelete(job.id)} className="text-red-400 hover:bg-red-900/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                               Delete
                            </button>
                         ) : (
                           <button className="text-slate-600 cursor-not-allowed border border-slate-800 px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-900/50" disabled>
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
