import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Layout } from '../src/components/Layout';
import { listJobs } from '../src/services/api';
import type { Job } from '../src/types';

const statusOptions = [
  { value: 'all', label: 'All Reports' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'processing', label: 'Processing' },
];

export default function ReportsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'failed' | 'processing'>('completed');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const data = await listJobs(undefined, 100);
        setJobs(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const filteredJobs = useMemo(() => {
    const search = query.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
      const patientName = job.patients?.patient_name?.toLowerCase() || '';
      const patientId = job.patients?.patient_id?.toLowerCase() || '';
      const jobId = job.id.toLowerCase();
      const matchesSearch = !search || patientName.includes(search) || patientId.includes(search) || jobId.includes(search);
      return matchesStatus && matchesSearch;
    });
  }, [jobs, query, statusFilter]);

  const formatDate = (value: string) =>
    new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  return (
    <Layout title="Reports | Pedi-Growth">
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400/80 mb-2">Report Library</p>
            <h2 className="text-3xl font-bold text-slate-50 tracking-tight">Completed gait reports</h2>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl">
              Browse finished analyses separately from the upload dashboard. Open any report to review the full clinical summary or export a professional PDF.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-colors text-sm font-medium"
            >
              New analysis
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              Dashboard
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/40 border border-cyan-500/20 rounded-2xl p-4 backdrop-blur-md">
          <label className="md:col-span-2 flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Search reports</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by patient name, patient ID, or job ID"
              className="w-full rounded-xl bg-slate-950/60 border border-slate-700 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status filter</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="w-full rounded-xl bg-slate-950/60 border border-slate-700 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="bg-slate-900/40 rounded-2xl border border-cyan-500/20 backdrop-blur-md overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.35)]">
          <div className="px-6 py-4 border-b border-cyan-500/20 flex items-center justify-between bg-slate-900/60">
            <div>
              <h3 className="text-lg font-semibold text-slate-50">Report index</h3>
              <p className="text-xs text-slate-400 mt-1">{filteredJobs.length} of {jobs.length} reports</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-300">Dedicated Reports Page</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading reports...</div>
          ) : error ? (
            <div className="p-8 text-center text-sm text-red-300">{error}</div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No reports match your current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-cyan-500/20">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Patient</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Symmetry</th>
                    <th className="px-6 py-4">Risk</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-500/10 text-sm">
                  {filteredJobs.map((job) => {
                    const symmetryValue = job.results?.symmetry_index;
                    const symmetryScore = typeof symmetryValue === 'number'
                      ? Math.max(0, 100 - (Math.abs(1 - symmetryValue) * 100))
                      : null;
                    const boundedScore = symmetryScore !== null ? Math.round(symmetryScore) : null;
                    return (
                      <tr key={job.id} className="hover:bg-cyan-500/10 transition-colors">
                        <td className="px-6 py-4 text-slate-400">{formatDate(job.created_at)}</td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-50">{job.patients?.patient_name || 'Unknown patient'}</div>
                          <div className="text-xs text-slate-500 font-mono mt-1">{job.patients?.patient_id || job.id.slice(0, 8)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${job.status === 'completed'
                            ? 'bg-green-900/30 text-green-400 border-green-500/30'
                            : job.status === 'processing'
                              ? 'bg-cyan-900/30 text-cyan-400 border-cyan-500/30'
                              : job.status === 'failed'
                                ? 'bg-red-900/30 text-red-400 border-red-500/30'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {boundedScore !== null ? `${boundedScore}%` : '--'}
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {job.results?.is_high_risk ? 'High risk' : job.status === 'completed' ? 'Normal' : '--'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {job.status === 'completed' ? (
                              <>
                                <Link
                                  href={`/results/${job.id}?mode=normal`}
                                  className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                >
                                  Open report
                                </Link>
                                <Link
                                  href={`/results/${job.id}?mode=technician`}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                >
                                  Technician view
                                </Link>
                              </>
                            ) : (
                              <span className="text-slate-500 text-xs px-3 py-1.5">Unavailable</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
