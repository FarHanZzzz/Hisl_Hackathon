/**
 * Clinician Report Page — /clinician/reports/[jobId]
 * 
 * Full clinical report with 4-tab layout:
 *  - Always visible: Header actions, Diagnosis Banner + Symmetry Ring, Patient Info
 *  - Tabs: Executive Summary, Kinematic Playback, Orthopedic, Neuromuscular
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Layout } from '../../../src/components/Layout';
import { DiagnosisBanner } from '../../../src/components/DiagnosisBanner';
import { ReportTabs, ExecutiveSummary, KinematicPlayback, OrthopedicDiagnostics, NeuromuscularDiagnostics } from '../../../src/components/clinical';
import type { TabId } from '../../../src/components/clinical';
import { downloadReportPdf, getJob, getAISummary } from '../../../src/services/api';
import type { Job, AISummary } from '../../../src/types';

export default function ClinicianReportPage() {
  const router = useRouter();
  const { jobId } = router.query;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // ─── Data Fetching ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!jobId) return;
    const fetchJob = async () => {
      try {
        const data = await getJob(jobId as string);
        if (data.status !== 'completed') {
          router.push('/');
          return;
        }
        setJob(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [jobId, router]);

  // Video check with retry
  useEffect(() => {
    if (!job?.id) return;
    const check = async (retry = false) => {
      const baseUrl = '/api/results';
      for (const ext of ['mp4', 'webm']) {
        try {
          const url = `${baseUrl}/${job.id}_processed.${ext}`;
          const res = await fetch(url, { method: 'HEAD' });
          if (res.ok) {
            setVideoUrl(url);
            setVideoError(false);
            return;
          }
        } catch {}
      }
      if (!retry) {
        setTimeout(() => check(true), 2000);
      } else {
        setVideoUrl(null);
        setVideoError(true);
      }
    };
    check();
  }, [job?.id]);

  // AI Summary
  const fetchSummary = useCallback(async () => {
    if (!job?.id) return;
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const data = await getAISummary(job.id);
      setSummary(data);
    } catch (err: any) {
      setSummaryError(err?.response?.data?.detail || err.message || 'Failed to generate summary');
    } finally {
      setSummaryLoading(false);
    }
  }, [job?.id]);

  useEffect(() => {
    if (job?.id && job.status === 'completed') fetchSummary();
  }, [job?.id, fetchSummary]);

  // ─── Chart Data ──────────────────────────────────────────────────────────

  const chartData = useMemo(() => {
    if (!job?.results) return [];
    const r = Array.isArray(job.results) ? job.results[0] : job.results;
    if (!r) return [];
    const left = r.left_angle_series || [];
    const right = r.right_angle_series || [];
    const valgus = r.knee_valgus_angle_array || [];
    const tilt = r.pelvic_tilt_array || [];
    const dorsi = r.ankle_dorsiflexion_array || [];
    const trunk = r.trunk_sway_array || [];
    const shoulder = r.shoulder_tilt_array || [];
    const len = Math.max(left.length, right.length, valgus.length, tilt.length, dorsi.length, trunk.length, shoulder.length);
    if (len === 0) return [];
    return Array.from({ length: len }, (_, i) => ({
      pct: Math.round((i / (len - 1)) * 100),
      left: left[i] ?? null,
      right: right[i] ?? null,
      valgus: valgus[i] ?? null,
      pelvicTilt: tilt[i] ?? null,
      dorsiflexion: dorsi[i] ?? null,
      trunkSway: trunk[i] ?? null,
      shoulderTilt: shoulder[i] ?? null,
    }));
  }, [job?.results]);

  // ─── Action Handlers ─────────────────────────────────────────────────────

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    });
  };

  const handleExportPdf = async () => {
    if (!job?.id) return;
    try {
      await downloadReportPdf(job.id);
    } catch (err: any) {
      alert(err?.response?.data?.detail || err.message || 'Failed to export PDF');
    }
  };

  // ─── Loading / Error States ──────────────────────────────────────────────

  if (loading) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-500/30 border-t-cyan-500" />
            <p className="text-slate-400 font-medium">Loading clinical report...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !job || !job.results || (Array.isArray(job.results) && job.results.length === 0)) {
    return (
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="text-center bg-slate-900/80 border border-red-500/20 p-8 rounded-xl max-w-md">
            <span className="material-icons text-5xl mb-4 text-red-400">error_outline</span>
            <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>Error Loading Report</h2>
            <p className="text-sm text-slate-400 mb-6">{error || 'Job data not found or analysis incomplete.'}</p>
            <button
              onClick={() => router.push('/reports')}
              className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Back to Reports
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  const result = Array.isArray(job.results) ? job.results[0] : job.results;
  const diagnosis = result?.diagnosis || 'normal';
  const isHighRisk = result?.is_high_risk || false;
  const symmetryScore = result?.symmetry_index
    ? Math.max(0, 100 - (Math.abs(1 - result.symmetry_index) * 100))
    : 95;
  const boundedScore = Math.min(100, Math.round(symmetryScore));

  return (
    <Layout title={`Clinical Report | ${job.patients?.patient_name || job.patient_ref}`}>
      <Head>
        <meta name="description" content={`Clinical gait analysis report for ${job.patients?.patient_name || 'patient'}`} />
      </Head>

      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* ── Header Actions ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <button
            onClick={() => router.push('/reports')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <span className="material-icons text-sm">arrow_back</span>
            <span className="text-sm font-medium">Back to Reports</span>
          </button>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <span className="material-icons text-sm">print</span>
              Print
            </button>
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-cyan-500/20"
            >
              <span className="material-icons text-sm">download</span>
              Export PDF
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <span className="material-icons text-sm">share</span>
              Share
            </button>
          </div>
        </div>

        {/* ── Diagnosis Banner + Symmetry Ring ── */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1 w-full">
            <DiagnosisBanner
              diagnosis={diagnosis}
              message={result.message || (isHighRisk ? 'Clinical review recommended.' : 'Gait patterns within normal limits.')}
              confidence={result.confidence || 0.95}
              symmetryIndex={result.symmetry_index}
              detectionRate={result.detection_rate}
            />
          </div>
          {/* Symmetry Ring */}
          <div className="shrink-0 w-full md:w-48 bg-slate-900/80 border border-slate-700/50 p-4 rounded-xl flex flex-col items-center justify-center">
            <div className="text-center mb-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Symmetry Score</div>
              <div className="text-3xl font-bold text-white">{boundedScore}<span className="text-lg opacity-70">%</span></div>
            </div>
            <div className="w-24 h-24 relative flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={isHighRisk ? 'text-red-500' : 'text-emerald-500'}
                  strokeDasharray={`${boundedScore}, 100`}
                  strokeWidth="3"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  style={{ animation: 'gauge-sweep 1.2s ease-out forwards' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-bold text-base text-white">
                {boundedScore}
              </div>
            </div>
          </div>
        </div>

        {/* ── Patient Info Bar ── */}
        <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl px-6 py-4 flex flex-col gap-4">
          <div className="flex flex-wrap gap-x-12 gap-y-4 items-center">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Patient ID</span>
              <span className="font-semibold text-white">{job.patients?.patient_id || job.patient_ref.substring(0, 8)}</span>
            </div>
            {job.patients?.patient_name && (
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Patient Name</span>
                <span className="font-semibold text-white">{job.patients.patient_name}</span>
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Analysis Date</span>
              <span className="font-semibold text-white">{new Date(job.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Job ID</span>
              <span className="text-sm text-slate-400 font-mono">{job.id.substring(0, 12)}...</span>
            </div>
          </div>
          {job.patients?.notes && (
            <div className="pt-4 border-t border-slate-700/50">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <span className="material-icons text-sm">assignment</span>Clinical Notes
              </span>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/50 p-3 rounded-lg border border-slate-700/30 mt-2">
                {job.patients.notes}
              </p>
            </div>
          )}
        </div>

        {/* ── Tabbed Report ── */}
        <ReportTabs>
          {{
            summary: (
              <ExecutiveSummary
                result={result}
                isHighRisk={isHighRisk}
                summary={summary}
                summaryLoading={summaryLoading}
                summaryError={summaryError}
                onRegenerate={fetchSummary}
              />
            ),
            kinematic: (
              <KinematicPlayback
                result={result}
                chartData={chartData}
                videoUrl={videoUrl}
                videoError={videoError}
                isHighRisk={isHighRisk}
                jobId={job.id}
              />
            ),
            orthopedic: (
              <OrthopedicDiagnostics
                result={result}
                chartData={chartData}
              />
            ),
            neuromuscular: (
              <NeuromuscularDiagnostics
                result={result}
                chartData={chartData}
              />
            ),
          }}
        </ReportTabs>
      </div>

      {/* Share Toast */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-slate-800 text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2.5 text-sm font-medium">
            <span className="material-icons text-emerald-400 text-lg">check_circle</span>
            Report link copied to clipboard!
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes gauge-sweep {
          from { stroke-dasharray: 0, 100; }
        }
      `}</style>
    </Layout>
  );
}
