import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../src/components/Layout';
import { VisualLocalization } from '../../src/components/VisualLocalization';
import { getJob, getAISummary } from '../../src/services/api';
import type { Job, AISummary } from '../../src/types';
import Head from 'next/head';
import {
   LineChart, Line, XAxis, YAxis, CartesianGrid,
   Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function ResultsPage() {
   const router = useRouter();
   const { id } = router.query;
   const [job, setJob] = useState<Job | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [summary, setSummary] = useState<AISummary | null>(null);
   const [summaryLoading, setSummaryLoading] = useState(false);
   const [summaryError, setSummaryError] = useState<string | null>(null);
   const [showToast, setShowToast] = useState(false);
   const [videoError, setVideoError] = useState(false);
   const [videoUrl, setVideoUrl] = useState<string | null>(null);

   const handleShare = () => {
      navigator.clipboard.writeText(window.location.href).then(() => {
         setShowToast(true);
         setTimeout(() => setShowToast(false), 2500);
      });
   };

   useEffect(() => {
      if (!id) return;

      const fetchJob = async () => {
         try {
            const data = await getJob(id as string);
            if (data.status !== 'completed') {
               // Should ideally not be here unless completed, but handle just in case
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
   }, [id, router]);

   // Check which video file exists for this job
   useEffect(() => {
      if (!job?.id) return;
      const checkVideo = async () => {
         const baseUrl = 'http://localhost:8000/results';
         // Try MP4 first (newest format), then WebM
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
         // No video file found
         setVideoUrl(null);
         setVideoError(true);
      };
      checkVideo();
   }, [job?.id]);

   // Fetch AI summary when job is loaded
   const fetchSummary = async (jobId: string) => {
      setSummaryLoading(true);
      setSummaryError(null);
      try {
         const data = await getAISummary(jobId);
         setSummary(data);
      } catch (err: any) {
         setSummaryError(err?.response?.data?.detail || err.message || 'Failed to generate summary');
      } finally {
         setSummaryLoading(false);
      }
   };

   useEffect(() => {
      if (job?.id && job.status === 'completed') {
         fetchSummary(job.id);
      }
   }, [job?.id]);

   // Build chart data from angle series (must be before conditional returns)
   const chartData = useMemo(() => {
      if (!job?.results) return [];
      const resultsList = Array.isArray(job.results) ? job.results : [job.results];
      const r = resultsList[0];
      if (!r) return [];
      const left = r.left_angle_series || [];
      const right = r.right_angle_series || [];
      const len = Math.max(left.length, right.length);
      if (len === 0) return [];
      return Array.from({ length: len }, (_, i) => ({
         pct: Math.round((i / (len - 1)) * 100),
         left: left[i] ?? null,
         right: right[i] ?? null,
      }));
   }, [job?.results]);

   if (loading) {
      return (
         <Layout>
            <div className="flex h-[50vh] items-center justify-center">
               <div className="flex flex-col items-center gap-4">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500"></div>
                  <p className="text-gray-500 font-medium">Loading report data...</p>
               </div>
            </div>
         </Layout>
      );
   }

   if (error || !job || !job.results) {
      return (
         <Layout>
            <div className="flex h-[50vh] items-center justify-center">
               <div className="text-center bg-white dark:bg-gray-900 border border-danger-200 dark:border-danger-800 p-8 rounded-xl max-w-md shadow-sm text-danger-600">
                  <span className="material-icons text-5xl mb-4 text-danger-500">error_outline</span>
                  <h2 className="text-xl font-bold mb-2">Error Loading Results</h2>
                  <p className="text-sm opacity-80 mb-6">{error || 'Job data not found or analysis incomplete.'}</p>
                  <button
                     onClick={() => router.push('/')}
                     className="bg-danger-50 text-danger-600 hover:bg-danger-100 dark:bg-danger-900/30 dark:hover:bg-danger-900/50 px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                     Return Home
                  </button>
               </div>
            </div>
         </Layout>
      );
   }

   const resultsList = Array.isArray(job.results) ? job.results : [job.results];
   const firstResult = resultsList[0];

   // Calculate scores and determine risk based on symmetry index
   const rawScore = firstResult?.symmetry_index
      ? Math.max(0, 100 - (Math.abs(1 - firstResult.symmetry_index) * 100))
      : 95;
   const boundedScore = Math.min(100, Math.round(rawScore));
   const isHighRisk = boundedScore < 85;

   const statusColor = isHighRisk ? 'bg-danger-500' : 'bg-success-500';
   const statusLight = isHighRisk ? 'bg-danger-50 dark:bg-danger-900/20' : 'bg-success-50 dark:bg-success-900/20';
   const statusText = isHighRisk ? 'text-danger-700 dark:text-danger-400' : 'text-success-700 dark:text-success-400';
   const statusBorder = isHighRisk ? 'border-danger-200 dark:border-danger-800' : 'border-success-200 dark:border-success-800';

   const icon = isHighRisk ? 'warning' : 'check_circle';
   const title = isHighRisk ? 'High Risk Patterns Detected' : 'Normal Gait Pattern Detected';
   const statusSummary = isHighRisk
      ? 'Analysis indicates significant asymmetries and kinematic patterns outside of expected age-matched normative ranges. Clinical review recommended.'
      : 'Analysis indicates kinematic patterns within expected age-matched normative ranges. No significant asymmetries detected.';

   return (
      <Layout title={`Analysis Results | ${job.patient_ref}`}>
         <div className="max-w-7xl mx-auto space-y-6">

            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
               <button
                  onClick={() => router.push('/')}
                  className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
               >
                  <span className="material-icons text-sm">arrow_back</span>
                  <span className="text-sm font-medium">Back to Dashboard</span>
               </button>
               <div className="flex gap-3 w-full sm:w-auto">
                  <button onClick={() => window.print()} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                     <span className="material-icons text-sm">print</span>
                     Print Report
                  </button>
                  <button
                     onClick={() => window.print()}
                     className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm shadow-primary-500/20"
                  >
                     <span className="material-icons text-sm">download</span>
                     Export PDF
                  </button>
                  <button
                     onClick={handleShare}
                     className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                     <span className="material-icons text-sm">share</span>
                     Share
                  </button>
               </div>
            </div>

            {/* Status Banner */}
            <div className={`${statusLight} border ${statusBorder} rounded-xl p-5 sm:p-6 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between`}>
               <div className="flex items-start sm:items-center gap-4">
                  <div className={`w-12 h-12 rounded-full ${isHighRisk ? 'bg-danger-100 dark:bg-danger-900/50 text-danger-600' : 'bg-success-100 dark:bg-success-900/50 text-success-600'} flex items-center justify-center shrink-0`}>
                     <span className="material-icons text-2xl">{icon}</span>
                  </div>
                  <div>
                     <h2 className={`text-lg sm:text-xl font-bold ${statusText} mb-1 flex items-center gap-2`}>
                        {title}
                     </h2>
                     <p className={`text-sm ${isHighRisk ? 'text-danger-600/80 dark:text-danger-400/80' : 'text-success-600/80 dark:text-success-400/80'}`}>
                        {statusSummary}
                     </p>
                  </div>
               </div>

               <div className="flex items-center gap-4 shrink-0 w-full md:w-auto bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-white/20 dark:border-white/5">
                  <div className="text-right">
                     <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-0.5">Symmetry Score</div>
                     <div className="text-2xl font-bold">{boundedScore}<span className="text-lg opacity-70">%</span></div>
                  </div>
                  <div className="w-16 h-16 relative flex items-center justify-center shrink-0">
                     <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                           className="text-black/5 dark:text-white/5"
                           strokeWidth="3"
                           stroke="currentColor"
                           fill="none"
                           d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                           className={isHighRisk ? 'text-danger-500' : 'text-success-500'}
                           strokeDasharray={`${boundedScore}, 100`}
                           strokeWidth="3"
                           strokeLinecap="round"
                           stroke="currentColor"
                           fill="none"
                           d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                           style={{ animation: 'gauge-sweep 1.2s ease-out forwards' }}
                        />
                     </svg>
                     <div className="absolute inset-0 flex items-center justify-center font-bold text-sm">
                        {boundedScore}
                     </div>
                  </div>
               </div>
            </div>

            {/* Patient Info Bar (Horizontal) */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-6 py-4 flex flex-wrap gap-x-12 gap-y-4 items-center shadow-sm">
               <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Patient ID</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{job.patient_ref}</span>
               </div>
               <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Analysis Date</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{new Date(job.created_at).toLocaleDateString()}</span>
               </div>
            </div>

            {/* Metrics Grid (4 Cards Horizontal) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
               {/* Metric 1 */}
               <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between hover:border-primary-500/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                     <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Symmetry Index</span>
                     <span className="material-icons text-gray-300 dark:text-gray-600 text-lg">balance</span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-2">
                     <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{firstResult.symmetry_index.toFixed(3)}</span>
                     <span className="text-sm font-medium text-gray-400">Ratio</span>
                  </div>
               </div>

               {/* Metric 2 */}
               <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between hover:border-primary-500/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                     <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Range of Motion</span>
                     <span className="material-icons text-gray-300 dark:text-gray-600 text-lg">open_in_full</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                     <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{Math.round(firstResult.left_rom)}°<span className="text-sm font-normal text-gray-400 ml-1">L</span></span>
                     <span className="text-gray-300 mx-1">|</span>
                     <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{Math.round(firstResult.right_rom)}°<span className="text-sm font-normal text-gray-400 ml-1">R</span></span>
                  </div>
               </div>

               {/* Metric 3 */}
               <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between hover:border-primary-500/30 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                     <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Max Flexion</span>
                     <span className="material-icons text-gray-300 dark:text-gray-600 text-lg">straighten</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                     <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{Math.round(firstResult.left_max_flexion)}°<span className="text-sm font-normal text-gray-400 ml-1">L</span></span>
                     <span className="text-gray-300 mx-1">|</span>
                     <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{Math.round(firstResult.right_max_flexion)}°<span className="text-sm font-normal text-gray-400 ml-1">R</span></span>
                  </div>
               </div>

               {/* Metric 4 (Asymmetry/Risk Highlight) */}
               <div className={`bg-white dark:bg-gray-900 p-5 rounded-xl border-2 ${isHighRisk ? 'border-danger-500 shadow-lg shadow-danger-500/10' : 'border-success-500 shadow-lg shadow-success-500/10'} flex flex-col justify-between`}>
                  <div className="flex justify-between items-start mb-2">
                     <span className={`text-xs font-bold ${isHighRisk ? 'text-danger-600 dark:text-danger-400' : 'text-success-600 dark:text-success-400'} uppercase tracking-wider font-bold`}>Asymmetry</span>
                     <span className={`material-icons ${isHighRisk ? 'text-danger-500 animate-pulse' : 'text-success-500'} text-lg`}>
                        {isHighRisk ? 'priority_high' : 'check_circle'}
                     </span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-2">
                     <span className={`text-3xl font-bold tracking-tight ${isHighRisk ? 'text-danger-600 dark:text-danger-400' : 'text-success-600 dark:text-success-400'}`}>{firstResult.asymmetry_percentage.toFixed(1)}%</span>
                  </div>
               </div>

               {/* Metric 5 (Data Quality Badge) */}
               {(() => {
                  const rate = firstResult.detection_rate;
                  const quality = rate >= 90 ? 'high' : rate >= 70 ? 'medium' : 'low';
                  const qConfig = {
                     high: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', tc: 'text-green-700 dark:text-green-400', icon: 'signal_cellular_alt', label: 'HIGH FIDELITY' },
                     medium: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', tc: 'text-amber-700 dark:text-amber-400', icon: 'signal_cellular_alt_2_bar', label: 'MODERATE' },
                     low: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', tc: 'text-red-700 dark:text-red-400', icon: 'signal_cellular_alt_1_bar', label: 'LOW QUALITY' },
                  };
                  const q = qConfig[quality];
                  return (
                     <div className={`${q.bg} p-5 rounded-xl border ${q.border} shadow-sm flex flex-col justify-between`}>
                        <div className="flex justify-between items-start mb-2">
                           <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data Quality</span>
                           <span className={`material-icons ${q.tc} text-lg`}>{q.icon}</span>
                        </div>
                        <div className="flex items-baseline gap-1 mt-2">
                           <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{Math.round(rate)}%</span>
                        </div>
                        <div className={`mt-2 text-[10px] font-bold ${q.tc} uppercase tracking-widest`}>{q.label}</div>
                     </div>
                  );
               })()}
            </div>

            {/* Educational Note */}
            {isHighRisk && (
               <div className="bg-[#fffbeb] dark:bg-[#451a03]/30 border border-[#fde68a] dark:border-[#78350f]/50 rounded-lg p-5 flex gap-4">
                  <div className="flex-shrink-0">
                     <span className="material-icons text-[#d97706] dark:text-[#fbbf24] mt-0.5">info</span>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[#92400e] dark:text-[#fcd34d] font-bold text-sm">Clinical Interpretation Context</p>
                     <p className="text-[#b45309] dark:text-[#fde68a]/90 text-sm leading-relaxed font-medium">
                        An asymmetry percentage above 15% is typically considered clinically significant in pediatric gait patterns. The computed asymmetry of {firstResult.asymmetry_percentage.toFixed(1)}% indicates a notable difference in knee kinematics between the left and right sides during the gait cycle. Correlation with clinical examination is recommended.
                     </p>
                  </div>
               </div>
            )}

        {/* Video and Chart Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {/* Kinematic Overlay Video */}
               <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/20">
                     <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="material-icons text-primary-500 text-sm">videocam</span>
                        Kinematic Overlay
                     </h3>
                     <span className="px-2.5 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-bold tracking-wider">LATERAL VIEW</span>
                  </div>
                  <div className="aspect-video bg-gray-100 dark:bg-gray-950 relative group flex-grow">
                     <div className="absolute inset-0 flex items-center justify-center">
                        {videoUrl && !videoError ? (
                           <video
                              controls
                              className="w-full h-full object-contain bg-black"
                              crossOrigin="anonymous"
                              onError={() => setVideoError(true)}
                           >
                              <source src={videoUrl} type={videoUrl.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
                           </video>
                        ) : (
                           <div className="flex flex-col items-center gap-3 text-gray-400">
                              <span className="material-icons text-5xl opacity-50">slow_motion_video</span>
                              <p className="text-sm font-medium">
                                 {videoError ? 'Processed video not available for this analysis' : 'Loading video...'}
                              </p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>

               {/* Knee Flexion/Extension Chart */}
               <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                     <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Knee Flexion/Extension Angle</h3>
                        <p className="text-xs text-gray-500 mt-1">Comparing left vs right side over the recorded gait cycle.</p>
                     </div>
                     <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
                           <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Left Knee</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full bg-[#94a3b8]"></div>
                           <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Right Knee</span>
                        </div>
                     </div>
                  </div>
                  {firstResult.left_angle_series?.length > 0 ? (
                     <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                           <XAxis
                              dataKey="pct"
                              tick={{ fontSize: 10, fill: '#94a3b8' }}
                              tickFormatter={(v: number) => `${v}%`}
                              label={{ value: 'Gait Cycle %', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#94a3b8' }}
                           />
                           <YAxis
                              tick={{ fontSize: 10, fill: '#94a3b8' }}
                              tickFormatter={(v: number) => `${v}°`}
                              label={{ value: 'Angle (°)', angle: -90, position: 'insideLeft', offset: 5, fontSize: 10, fill: '#94a3b8' }}
                           />
                           <Tooltip
                              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: 12 }}
                              labelFormatter={(v: number) => `Gait Cycle: ${v}%`}
                              formatter={(value: number, name: string) => [`${value.toFixed(1)}°`, name]}
                           />
                           <Line type="monotone" dataKey="left" name="Left Knee" stroke="#ef4444" strokeWidth={2.5} dot={false} />
                           <Line type="monotone" dataKey="right" name="Right Knee" stroke="#94a3b8" strokeWidth={2} strokeDasharray="6 3" dot={false} />
                        </LineChart>
                     </ResponsiveContainer>
                  ) : (
                     <div className="flex-grow flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg min-h-[300px]">
                        <p className="text-sm text-gray-400 font-medium">No angle data recorded for this analysis</p>
                     </div>
                  )}
               </div>
        </div>

        {/* Visual Localization — Full Width Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
               <VisualLocalization
                  leftMaxFlexion={firstResult.left_max_flexion}
                  rightMaxFlexion={firstResult.right_max_flexion}
                  isHighRisk={isHighRisk}
               />
            </div>
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex flex-col justify-center">
               <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4">Bilateral Comparison</h3>
               <div className="grid grid-cols-2 gap-6">
                  {/* Left Leg Details */}
                  <div className="space-y-4">
                     <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">Left Leg</span>
                     </div>
                     <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                           <span className="text-xs font-medium text-gray-500">Max Flexion</span>
                           <span className="text-lg font-bold text-gray-900 dark:text-white">{firstResult.left_max_flexion.toFixed(1)}°</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-xs font-medium text-gray-500">Range of Motion</span>
                           <span className="text-lg font-bold text-gray-900 dark:text-white">{firstResult.left_rom.toFixed(1)}°</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                           <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, (firstResult.left_rom / 60) * 100)}%` }}></div>
                        </div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">ROM vs Normal (60°)</p>
                     </div>
                  </div>
                  {/* Right Leg Details */}
                  <div className="space-y-4">
                     <div className="flex items-center gap-2 mb-3">
                        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">Right Leg</span>
                     </div>
                     <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                           <span className="text-xs font-medium text-gray-500">Max Flexion</span>
                           <span className="text-lg font-bold text-gray-900 dark:text-white">{firstResult.right_max_flexion.toFixed(1)}°</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-xs font-medium text-gray-500">Range of Motion</span>
                           <span className="text-lg font-bold text-gray-900 dark:text-white">{firstResult.right_rom.toFixed(1)}°</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                           <div className="h-full bg-gray-400 rounded-full" style={{ width: `${Math.min(100, (firstResult.right_rom / 60) * 100)}%` }}></div>
                        </div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">ROM vs Normal (60°)</p>
                     </div>
                  </div>
               </div>
            </div>
        </div>
            {/* AI Clinical Summary Card */}
            <div className="bg-white dark:bg-[#18181b] rounded-xl shadow-sm border border-gray-100 dark:border-[#27272a] overflow-hidden no-print">
               {/* Header */}
               <div className="px-6 py-4 border-b border-gray-100 dark:border-[#27272a] flex justify-between items-center bg-gray-50/50 dark:bg-[#18181b]">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2.5 text-base">
                     <span className="material-icons text-[#137fec]">auto_awesome</span>
                     AI Clinical Summary
                  </h3>
                  <button
                     onClick={() => job?.id && fetchSummary(job.id)}
                     disabled={summaryLoading}
                     className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#3f3f46] text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#27272a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     <span className={`material-icons text-sm ${summaryLoading ? 'animate-spin' : ''}`}>
                        {summaryLoading ? 'progress_activity' : 'refresh'}
                     </span>
                     {summaryLoading ? 'Generating...' : 'Regenerate'}
                  </button>
               </div>

               {/* Content */}
               <div className="p-6">
                  {summaryLoading && !summary ? (
                     /* Loading Skeleton */
                     <div className="space-y-6 animate-pulse">
                        <div>
                           <div className="h-3 w-24 bg-gray-200 dark:bg-[#3f3f46] rounded mb-3"></div>
                           <div className="space-y-2">
                              <div className="h-3 w-full bg-gray-200 dark:bg-[#3f3f46] rounded"></div>
                              <div className="h-3 w-5/6 bg-gray-200 dark:bg-[#3f3f46] rounded"></div>
                              <div className="h-3 w-4/6 bg-gray-200 dark:bg-[#3f3f46] rounded"></div>
                           </div>
                        </div>
                        <div>
                           <div className="h-3 w-28 bg-gray-200 dark:bg-[#3f3f46] rounded mb-3"></div>
                           <div className="space-y-2">
                              <div className="h-3 w-3/4 bg-gray-200 dark:bg-[#3f3f46] rounded"></div>
                              <div className="h-3 w-2/3 bg-gray-200 dark:bg-[#3f3f46] rounded"></div>
                           </div>
                        </div>
                     </div>
                  ) : summaryError ? (
                     /* Error State */
                     <div className="flex items-center gap-3 p-4 bg-danger-50 dark:bg-danger-900/10 border border-danger-200 dark:border-danger-800/30 rounded-lg">
                        <span className="material-icons text-danger-500">error_outline</span>
                        <div>
                           <p className="text-sm font-semibold text-danger-700 dark:text-danger-400">Summary generation failed</p>
                           <p className="text-xs text-danger-600 dark:text-danger-500/80 mt-0.5">{summaryError && summaryError.length > 150 ? summaryError.substring(0, 150) + '…' : summaryError}</p>
                        </div>
                     </div>
                  ) : summary ? (
                     /* Rendered Summary */
                     <div className="space-y-6">
                        {/* Overview */}
                        <div>
                           <h4 className="text-[10px] font-bold text-gray-400 dark:text-[#a1a1aa] uppercase tracking-widest mb-2.5">Overview</h4>
                           <p className="text-sm text-gray-700 dark:text-[#d4d4d8] leading-relaxed">{summary.overview}</p>
                        </div>

                        {/* What This Means - Highlighted for parents */}
                        {summary.what_this_means && (
                           <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4">
                              <h4 className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                 <span className="material-icons text-sm">lightbulb</span>
                                 What This Means For You
                              </h4>
                              <p className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed">{summary.what_this_means}</p>
                           </div>
                        )}

                        {/* Key Findings */}
                        <div>
                           <h4 className="text-[10px] font-bold text-gray-400 dark:text-[#a1a1aa] uppercase tracking-widest mb-2.5">Key Findings</h4>
                           <ul className="space-y-2">
                              {summary.key_findings.map((finding, i) => (
                                 <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-[#d4d4d8]">
                                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${finding.toLowerCase().includes('normal') || finding.toLowerCase().includes('within')
                                          ? 'bg-green-500'
                                          : finding.toLowerCase().includes('concern') || finding.toLowerCase().includes('risk') || finding.toLowerCase().includes('below') || finding.toLowerCase().includes('significant') || finding.toLowerCase().includes('reduced')
                                             ? 'bg-danger-500'
                                             : 'bg-[#137fec]'
                                       }`}></span>
                                    <span className="leading-relaxed">{finding}</span>
                                 </li>
                              ))}
                           </ul>
                        </div>

                        {/* Risk Assessment */}
                        <div>
                           <div className="flex items-center gap-3 mb-2.5">
                              <h4 className="text-[10px] font-bold text-gray-400 dark:text-[#a1a1aa] uppercase tracking-widest">Risk Assessment</h4>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${isHighRisk
                                    ? 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-400'
                                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                 }`}>
                                 {isHighRisk ? 'HIGH RISK' : 'NORMAL'}
                              </span>
                           </div>
                           <p className="text-sm text-gray-700 dark:text-[#d4d4d8] leading-relaxed">{summary.risk_assessment}</p>
                        </div>

                        {/* Recommendations */}
                        <div>
                           <h4 className="text-[10px] font-bold text-gray-400 dark:text-[#a1a1aa] uppercase tracking-widest mb-2.5">Recommendations</h4>
                           <ol className="space-y-2 list-decimal list-inside">
                              {summary.recommendations.map((rec, i) => (
                                 <li key={i} className="text-sm text-gray-700 dark:text-[#d4d4d8] leading-relaxed">
                                    {rec}
                                 </li>
                              ))}
                           </ol>
                        </div>

                        {/* Disclaimer */}
                        <div className="flex items-start gap-2 pt-4 border-t border-gray-100 dark:border-[#27272a]">
                           <span className="material-icons text-gray-400 dark:text-[#52525b] text-sm mt-0.5">info</span>
                           <p className="text-xs text-gray-400 dark:text-[#52525b] italic leading-relaxed">
                              {summary.disclaimer}
                           </p>
                        </div>
                     </div>
                  ) : null}
               </div>
            </div>

         </div>

         {/* Share Toast Notification */}
         {showToast && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
               <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-sm font-medium">
                  <span className="material-icons text-success-500 dark:text-success-600 text-lg">check_circle</span>
                  Report link copied to clipboard!
               </div>
            </div>
         )}
      </Layout>
   );
}
