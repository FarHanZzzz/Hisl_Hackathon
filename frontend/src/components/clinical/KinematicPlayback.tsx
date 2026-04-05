/**
 * KinematicPlayback — Tab 2 of the clinical report.
 * 
 * Contains:
 *  - Interactive Video Player with clickable problem markers
 *  - Problem timeline bar below video
 *  - Knee Flexion/Extension chart
 *  - VisualLocalization body diagram
 *  - Bilateral Comparison cards
 */
import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { VisualLocalization } from '../VisualLocalization';
import type { Result } from '../../types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea
} from 'recharts';

// ─── Problem Detection ───────────────────────────────────────────────────────

interface DetectedProblem {
  id: string;
  name: string;
  bodyPart: string;
  /** Vertical position as % from top (0 = head, 100 = feet) */
  yPosition: number;
  measuredValue: string;
  normalRange: string;
  explanation: string;
  severity: 'mild' | 'concern';
  /** Frame range as % of total frames where this issue appears */
  startPct: number;
  endPct: number;
  tabLink?: string;
}

function detectProblems(result: Result): DetectedProblem[] {
  const problems: DetectedProblem[] = [];

  // Knee Valgus
  const valgusArr = result.knee_valgus_angle_array || [];
  if (valgusArr.length > 0) {
    const abnormalFrames = valgusArr.map((v, i) => ({ v, i })).filter(f => f.v < 170 || f.v > 190);
    if (abnormalFrames.length > 0) {
      const start = Math.round((abnormalFrames[0].i / valgusArr.length) * 100);
      const end = Math.round((abnormalFrames[abnormalFrames.length - 1].i / valgusArr.length) * 100);
      const avg = result.knee_valgus_angle ?? (valgusArr.reduce((a, b) => a + b, 0) / valgusArr.length);
      problems.push({
        id: 'knee-valgus',
        name: avg < 170 ? 'Genu Varum (Bowlegs)' : 'Genu Valgum (Knock-knees)',
        bodyPart: 'Knee',
        yPosition: 60,
        measuredValue: `${avg.toFixed(1)}°`,
        normalRange: '175° – 185°',
        explanation: avg < 170
          ? 'The knees are curving outward more than expected, causing an increased distance between the knees while the ankles are together.'
          : 'The knees are angling inward, coming close together while the ankles stay apart.',
        severity: (avg < 160 || avg > 200) ? 'concern' : 'mild',
        startPct: start,
        endPct: Math.max(end, start + 5),
        tabLink: 'orthopedic',
      });
    }
  }

  // Trunk Sway
  const trunkArr = result.trunk_sway_array || [];
  if (trunkArr.length > 2) {
    const mean = trunkArr.reduce((a, b) => a + b, 0) / trunkArr.length;
    const variance = trunkArr.reduce((s, x) => s + (x - mean) ** 2, 0) / trunkArr.length;
    if (variance > 15) {
      const highFrames = trunkArr.map((v, i) => ({ v: Math.abs(v - mean), i })).filter(f => f.v > Math.sqrt(15));
      const start = highFrames.length > 0 ? Math.round((highFrames[0].i / trunkArr.length) * 100) : 0;
      const end = highFrames.length > 0 ? Math.round((highFrames[highFrames.length - 1].i / trunkArr.length) * 100) : 100;
      problems.push({
        id: 'trunk-sway',
        name: 'Excessive Trunk Sway',
        bodyPart: 'Trunk',
        yPosition: 30,
        measuredValue: `${variance.toFixed(1)}`,
        normalRange: '< 15 variance',
        explanation: 'The upper body is swaying side-to-side more than typical, suggesting the core muscles are working extra hard to maintain balance while walking.',
        severity: variance > 25 ? 'concern' : 'mild',
        startPct: start,
        endPct: Math.max(end, start + 5),
        tabLink: 'neuromuscular',
      });
    }
  }

  // Ankle Dorsiflexion (Toe-Walking)
  const ankleArr = result.ankle_dorsiflexion_array || [];
  if (ankleArr.length > 0) {
    const abnormalFrames = ankleArr.map((v, i) => ({ v, i })).filter(f => f.v > 100);
    if (abnormalFrames.length > 0) {
      const start = Math.round((abnormalFrames[0].i / ankleArr.length) * 100);
      const end = Math.round((abnormalFrames[abnormalFrames.length - 1].i / ankleArr.length) * 100);
      const avg = result.ankle_dorsiflexion ?? (ankleArr.reduce((a, b) => a + b, 0) / ankleArr.length);
      problems.push({
        id: 'toe-walking',
        name: 'Toe-Walking Detected',
        bodyPart: 'Ankle',
        yPosition: 85,
        measuredValue: `${avg.toFixed(1)}°`,
        normalRange: '85° – 95°',
        explanation: 'The heels are staying off the ground more than expected, causing a tiptoe-walking pattern that can tighten calf muscles over time.',
        severity: avg > 115 ? 'concern' : 'mild',
        startPct: start,
        endPct: Math.max(end, start + 5),
        tabLink: 'orthopedic',
      });
    }
  }

  return problems;
}

// ─── Interactive Video Player ────────────────────────────────────────────────

interface VideoPlayerProps {
  videoUrl: string | null;
  videoError: boolean;
  problems: DetectedProblem[];
  onProblemClick: (p: DetectedProblem) => void;
  jobId: string;
}

function InteractiveVideoPlayer({ videoUrl, videoError, problems, onProblemClick, jobId }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentPct, setCurrentPct] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(videoUrl);

  // Retry logic for video loading
  useEffect(() => {
    if (videoUrl) {
      setResolvedUrl(videoUrl);
      return;
    }
    if (retryCount > 0 || !jobId) return;

    const timer = setTimeout(async () => {
      const baseUrl = '/api/results';
      for (const ext of ['mp4', 'webm']) {
        try {
          const url = `${baseUrl}/${jobId}_processed.${ext}`;
          const res = await fetch(url, { method: 'HEAD' });
          if (res.ok) {
            setResolvedUrl(url);
            return;
          }
        } catch {}
      }
      setRetryCount(1);
    }, 2000);
    return () => clearTimeout(timer);
  }, [videoUrl, jobId, retryCount]);

  // Track current playback position
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const update = () => {
      if (video.duration) setCurrentPct((video.currentTime / video.duration) * 100);
    };
    video.addEventListener('timeupdate', update);
    return () => video.removeEventListener('timeupdate', update);
  }, [resolvedUrl]);

  // Active problems at current time
  const activeProblems = problems.filter(p => currentPct >= p.startPct && currentPct <= p.endPct);

  return (
    <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-700/50 flex justify-between items-center">
        <h3 className="font-semibold text-white flex items-center gap-2 text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
          <span className="material-icons text-cyan-400 text-base">videocam</span>
          Kinematic Overlay
        </h3>
        <span className="px-2.5 py-1 bg-slate-700 text-slate-300 rounded text-[10px] font-bold tracking-wider">LATERAL VIEW</span>
      </div>

      {/* Video with overlay markers */}
      <div className="relative aspect-video bg-black">
        {resolvedUrl && !videoError ? (
          <>
            <video
              ref={videoRef}
              controls
              playsInline
              webkit-playsinline=""
              crossOrigin="anonymous"
              preload="metadata"
              className="w-full h-full object-contain"
            >
              {resolvedUrl.endsWith('.webm') ? (
                <>
                  <source src={`${resolvedUrl}#t=0.001`} type="video/webm" />
                </>
              ) : (
                <>
                  <source src={`${resolvedUrl}#t=0.001`} type="video/mp4" />
                  <source src={resolvedUrl.replace('.mp4', '.webm') + '#t=0.001'} type="video/webm" />
                </>
              )}
            </video>

            {/* Problem Markers Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {activeProblems.map((p) => (
                <button
                  key={p.id}
                  onClick={(e) => { e.stopPropagation(); onProblemClick(p); }}
                  className="absolute pointer-events-auto cursor-pointer group"
                  style={{ top: `${p.yPosition}%`, right: '12%', transform: 'translate(50%, -50%)' }}
                  title={p.name}
                >
                  <span className={`
                    block w-6 h-6 rounded-full border-2
                    ${p.severity === 'concern' ? 'bg-red-500/60 border-red-400' : 'bg-amber-500/60 border-amber-400'}
                    animate-pulse shadow-lg
                  `} />
                  <span className={`
                    absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded text-[10px] font-bold
                    opacity-0 group-hover:opacity-100 transition-opacity
                    ${p.severity === 'concern' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}
                  `}>
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
            <span className="material-icons text-5xl opacity-50">slow_motion_video</span>
            <p className="text-sm font-medium mt-2">
              {videoError ? 'Processed video not available' : 'Loading video...'}
            </p>
          </div>
        )}
      </div>

      {/* Problem Timeline Bar */}
      {problems.length > 0 && (
        <div className="px-5 py-3 border-t border-slate-700/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Problem Timeline</span>
          </div>
          <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
            {problems.map((p) => (
              <div
                key={p.id}
                className={`absolute top-0 h-full rounded-full ${p.severity === 'concern' ? 'bg-red-500/70' : 'bg-amber-500/70'}`}
                style={{ left: `${p.startPct}%`, width: `${Math.max(p.endPct - p.startPct, 3)}%` }}
                title={p.name}
              />
            ))}
            {/* Current position indicator */}
            <div
              className="absolute top-0 w-0.5 h-full bg-cyan-400"
              style={{ left: `${currentPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-slate-500">0%</span>
            <span className="text-[9px] text-slate-500">STANCE — 60% — SWING</span>
            <span className="text-[9px] text-slate-500">100%</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Problem Detail Panel ────────────────────────────────────────────────────

function ProblemDetailPanel({ problem, onClose, onTabSwitch }: {
  problem: DetectedProblem;
  onClose: () => void;
  onTabSwitch: (tab: string) => void;
}) {
  const severityColor = problem.severity === 'concern'
    ? 'border-red-500/30 bg-red-500/5'
    : 'border-amber-500/30 bg-amber-500/5';

  return (
    <div className={`rounded-xl border p-5 ${severityColor} animate-in slide-in-from-right`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className={`material-icons text-lg ${problem.severity === 'concern' ? 'text-red-400' : 'text-amber-400'}`}>
            warning
          </span>
          <h4 className="text-white font-bold text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>{problem.name}</h4>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
          <span className="material-icons text-sm">close</span>
        </button>
      </div>
      <div className="space-y-3">
        <div className="flex gap-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Measured</span>
            <p className="text-xl font-bold text-white">{problem.measuredValue}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Normal Range</span>
            <p className="text-xl font-bold text-emerald-400">{problem.normalRange}</p>
          </div>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{problem.explanation}</p>
        {problem.tabLink && (
          <button
            onClick={() => onTabSwitch(problem.tabLink!)}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            View in Diagnostics Tab ▸
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface KinematicPlaybackProps {
  result: Result;
  chartData: any[];
  videoUrl: string | null;
  videoError: boolean;
  isHighRisk: boolean;
  jobId: string;
  onTabSwitch?: (tab: string) => void;
}

export function KinematicPlayback({ result, chartData, videoUrl, videoError, isHighRisk, jobId, onTabSwitch }: KinematicPlaybackProps) {
  const [selectedProblem, setSelectedProblem] = useState<DetectedProblem | null>(null);
  const problems = useMemo(() => detectProblems(result), [result]);

  const handleTabSwitch = useCallback((tab: string) => {
    window.location.hash = tab;
    onTabSwitch?.(tab);
  }, [onTabSwitch]);

  return (
    <div className="space-y-6">
      {/* Video + Problem Detail side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <InteractiveVideoPlayer
            videoUrl={videoUrl}
            videoError={videoError}
            problems={problems}
            onProblemClick={setSelectedProblem}
            jobId={jobId}
          />
        </div>
        <div className="lg:col-span-1">
          {selectedProblem ? (
            <ProblemDetailPanel
              problem={selectedProblem}
              onClose={() => setSelectedProblem(null)}
              onTabSwitch={handleTabSwitch}
            />
          ) : problems.length > 0 ? (
            <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-5 h-full flex flex-col justify-center items-center text-center">
              <span className="material-icons text-4xl text-slate-600 mb-3">touch_app</span>
              <p className="text-sm text-slate-400">Click a pulsing marker on the video to see problem details</p>
              <p className="text-xs text-slate-500 mt-2">{problems.length} issue{problems.length > 1 ? 's' : ''} detected</p>
            </div>
          ) : (
            <div className="bg-slate-900/80 border border-emerald-500/20 rounded-xl p-5 h-full flex flex-col justify-center items-center text-center">
              <span className="material-icons text-4xl text-emerald-500 mb-3">check_circle</span>
              <p className="text-sm text-emerald-400 font-semibold">No Issues Detected</p>
              <p className="text-xs text-slate-400 mt-1">All metrics within normal ranges</p>
            </div>
          )}
        </div>
      </div>

      {/* Knee Flexion/Extension Chart */}
      <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-semibold text-white text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Knee Flexion/Extension Angle
            </h3>
            <p className="text-xs text-slate-400 mt-1">Left vs Right knee over the gait cycle</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-[10px] font-semibold text-slate-400">Left Knee</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span className="text-[10px] font-semibold text-slate-400">Right Knee</span>
            </div>
          </div>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis
                dataKey="pct"
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(v: number) => `${v}%`}
              />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v: number) => `${v}°`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: 12, color: '#fff' }}
                labelFormatter={(v: number) => `Gait Cycle: ${v}%`}
                formatter={(value: number, name: string) => [`${value.toFixed(1)}°`, name]}
              />
              {/* Gait phase reference areas */}
              <ReferenceArea x1={0} x2={60} fill="#06b6d4" fillOpacity={0.03} />
              <ReferenceArea x1={60} x2={100} fill="#8b5cf6" fillOpacity={0.03} />
              <ReferenceLine x={60} stroke="#475569" strokeDasharray="4 4" label={{ value: '60%', position: 'top', fontSize: 9, fill: '#64748b' }} />
              <Line type="monotone" dataKey="left" name="Left Knee" stroke="#ef4444" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="right" name="Right Knee" stroke="#94a3b8" strokeWidth={2} strokeDasharray="6 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[280px] bg-slate-800/30 rounded-lg border border-dashed border-slate-700">
            <p className="text-sm text-slate-500">No angle data recorded</p>
          </div>
        )}
        {/* Phase labels */}
        <div className="flex justify-center gap-8 mt-1">
          <span className="text-[10px] font-bold text-cyan-500/60 uppercase tracking-widest">Stance Phase</span>
          <span className="text-[10px] font-bold text-purple-500/60 uppercase tracking-widest">Swing Phase</span>
        </div>
      </div>

      {/* Visual Localization + Bilateral Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <VisualLocalization
            leftMaxFlexion={result.left_max_flexion}
            rightMaxFlexion={result.right_max_flexion}
            isHighRisk={isHighRisk}
          />
        </div>
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Bilateral Comparison</h3>
          <div className="grid grid-cols-2 gap-6">
            {/* Left Leg */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm font-bold text-white">Left Leg</span>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Max Flexion</span>
                  <span className="text-lg font-bold text-white">{result.left_max_flexion.toFixed(1)}°</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Range of Motion</span>
                  <span className="text-lg font-bold text-white">{result.left_rom.toFixed(1)}°</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${Math.min(100, (result.left_rom / 60) * 100)}%` }} />
                </div>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest">ROM vs Normal (60°)</p>
              </div>
            </div>
            {/* Right Leg */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-slate-400" />
                <span className="text-sm font-bold text-white">Right Leg</span>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Max Flexion</span>
                  <span className="text-lg font-bold text-white">{result.right_max_flexion.toFixed(1)}°</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">Range of Motion</span>
                  <span className="text-lg font-bold text-white">{result.right_rom.toFixed(1)}°</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-400 rounded-full transition-all" style={{ width: `${Math.min(100, (result.right_rom / 60) * 100)}%` }} />
                </div>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest">ROM vs Normal (60°)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
