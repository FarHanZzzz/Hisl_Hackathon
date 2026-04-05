/**
 * ExecutiveSummary — Tab 1 of the clinical report.
 * 
 * Contains:
 *  - Redesigned ParentInsightsPanel (always open, 2-col grid, expandable cards)
 *  - 5 Metric Cards grid
 *  - Educational Note (high-risk only)
 *  - AI Summary Card
 */
import { useState, useMemo } from 'react';
import type { Result, AISummary } from '../../types';

// ─── Severity helpers ────────────────────────────────────────────────────────

type Severity = 'good' | 'mild' | 'concern';

interface InsightCard {
  title: string;
  icon: string;
  severity: Severity;
  shortSummary: string;
  detail: string;
  metricValue: string;
  metricLabel: string;
}

const SEV_BG: Record<Severity, string> = {
  good:    'bg-emerald-500/10 border-emerald-500/20',
  mild:    'bg-amber-500/10 border-amber-500/20',
  concern: 'bg-red-500/10 border-red-500/20',
};
const SEV_ICON_BG: Record<Severity, string> = {
  good:    'bg-emerald-500/20 text-emerald-400',
  mild:    'bg-amber-500/20 text-amber-400',
  concern: 'bg-red-500/20 text-red-400',
};
const SEV_PILL: Record<Severity, { bg: string; text: string; label: string }> = {
  good:    { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Good' },
  mild:    { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Mild' },
  concern: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Concern' },
};

// ─── Insight Card Component ──────────────────────────────────────────────────

function InsightCardUI({ card }: { card: InsightCard }) {
  const [expanded, setExpanded] = useState(false);
  const pill = SEV_PILL[card.severity];

  return (
    <div className={`rounded-xl border p-5 ${SEV_BG[card.severity]} transition-all duration-200`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${SEV_ICON_BG[card.severity]}`}>
          <span className="material-icons text-lg">{card.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          {/* Title + Pill */}
          <div className="flex items-center gap-2 mb-1.5">
            <h4 className="text-sm font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {card.title}
            </h4>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${pill.bg} ${pill.text}`}>
              {pill.label}
            </span>
          </div>
          {/* Metric */}
          <div className="mb-2">
            <span className="text-2xl font-bold text-white tracking-tight">{card.metricValue}</span>
            <span className="text-xs text-slate-400 ml-1.5 uppercase tracking-wider">{card.metricLabel}</span>
          </div>
          {/* Short summary */}
          <p className="text-sm text-slate-300 leading-relaxed">{card.shortSummary}</p>
          {/* Expand */}
          {card.detail && (
            <>
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
              >
                {expanded ? 'Show Less' : 'Read More ▸'}
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-[600px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                <p className="text-sm text-slate-400 leading-relaxed border-t border-slate-700/30 pt-3">{card.detail}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Build Insights from Result ──────────────────────────────────────────────

function useInsights(result: Result): InsightCard[] {
  return useMemo(() => {
    const cards: InsightCard[] = [];
    const si = result.symmetry_index;

    // Walking Symmetry
    if (si < 0.85 || si > 1.15) {
      const pct = Math.round(result.asymmetry_percentage ?? Math.abs(1 - si) * 100);
      const side = si < 1.0 ? 'right' : 'left';
      cards.push({
        title: 'Walking Symmetry',
        icon: 'swap_horiz',
        severity: si < 0.75 || si > 1.25 ? 'concern' : 'mild',
        shortSummary: `Your child favors their ${side} side with a ${pct}% difference between legs.`,
        detail: `One leg is doing more work than the other — similar to carrying a heavy bag on one shoulder. This can cause faster fatigue during walking and less steadiness on uneven surfaces. A physical therapist can help correct with targeted exercises.`,
        metricValue: `${(si * 100).toFixed(0)}%`,
        metricLabel: 'Balance Ratio',
      });
    } else {
      cards.push({
        title: 'Walking Symmetry',
        icon: 'check_circle',
        severity: 'good',
        shortSummary: 'Both legs are moving with strong symmetry — even weight distribution.',
        detail: `This means your child's left and right sides share work evenly during walking, supporting good posture and reducing strain on joints.`,
        metricValue: `${(si * 100).toFixed(0)}%`,
        metricLabel: 'Balance Ratio',
      });
    }

    // Range of Motion
    const leftRom = result.left_rom;
    const rightRom = result.right_rom;
    if (leftRom < 35 || rightRom < 35) {
      const stiffSide = leftRom < rightRom ? 'left' : 'right';
      const stiffVal = Math.round(Math.min(leftRom, rightRom));
      cards.push({
        title: 'Knee Mobility',
        icon: 'accessibility_new',
        severity: stiffVal < 25 ? 'concern' : 'mild',
        shortSummary: `The ${stiffSide} knee bends only ${stiffVal}° — healthy range is 40°-60°.`,
        detail: 'Reduced knee bending is like trying to walk without fully lifting the foot. It can affect running, climbing stairs, and keeping up with peers. Stretching exercises or PT can help.',
        metricValue: `${stiffVal}°`,
        metricLabel: 'Min ROM',
      });
    } else {
      cards.push({
        title: 'Knee Mobility',
        icon: 'check_circle',
        severity: 'good',
        shortSummary: `Both knees bend within healthy range (L: ${Math.round(leftRom)}°, R: ${Math.round(rightRom)}°).`,
        detail: 'Good knee mobility supports running, jumping, and stair climbing — all important for development.',
        metricValue: `${Math.round(Math.max(leftRom, rightRom))}°`,
        metricLabel: 'ROM',
      });
    }

    // Knee Valgus
    const valgus = result.knee_valgus_angle;
    if (valgus != null) {
      if (valgus < 170) {
        cards.push({
          title: 'Knee Alignment',
          icon: 'straighten',
          severity: valgus < 160 ? 'concern' : 'mild',
          shortSummary: `Outward knee curvature of ${Math.round(180 - valgus)}° (Genu Varum / Bowlegs).`,
          detail: 'In toddlers (ages 1-3), bowlegs usually correct naturally. If persistent past age 3 or increasing, discuss with your pediatrician.',
          metricValue: `${valgus.toFixed(1)}°`,
          metricLabel: 'Valgus Angle',
        });
      } else if (valgus > 190) {
        cards.push({
          title: 'Knee Alignment',
          icon: 'straighten',
          severity: valgus > 200 ? 'concern' : 'mild',
          shortSummary: `Inward knee angling of ${Math.round(valgus - 180)}° (Genu Valgum / Knock-knees).`,
          detail: 'Mild knock-knees between ages 3-7 are a normal phase. If persistent past 7-8 or causing knee pain, follow-up is recommended.',
          metricValue: `${valgus.toFixed(1)}°`,
          metricLabel: 'Valgus Angle',
        });
      }
    }

    // Ankle Dorsiflexion (Toe-Walking)
    const ankle = result.ankle_dorsiflexion;
    if (ankle != null && ankle > 100) {
      cards.push({
        title: 'Toe-Walking',
        icon: 'directions_walk',
        severity: ankle > 115 ? 'concern' : 'mild',
        shortSummary: `Ankle at ${ankle.toFixed(1)}° — heels staying off the ground more than expected.`,
        detail: 'Walking on tiptoes can tighten calf muscles over time, affecting balance and running efficiency. Gentle calf stretches can help.',
        metricValue: `${ankle.toFixed(1)}°`,
        metricLabel: 'Dorsiflexion',
      });
    }

    // Trunk Sway
    const trunkArr = result.trunk_sway_array;
    if (trunkArr && trunkArr.length > 2) {
      const mean = trunkArr.reduce((a, b) => a + b, 0) / trunkArr.length;
      const variance = trunkArr.reduce((s, x) => s + (x - mean) ** 2, 0) / trunkArr.length;
      if (variance > 15) {
        cards.push({
          title: 'Core Stability',
          icon: 'self_improvement',
          severity: variance > 25 ? 'concern' : 'mild',
          shortSummary: `Upper body sway variance of ${variance.toFixed(1)} — indicates extra effort to maintain balance.`,
          detail: 'Core muscle strengthening through swimming, yoga, or balance games can improve stability over time.',
          metricValue: `${variance.toFixed(1)}`,
          metricLabel: 'Sway Variance',
        });
      }
    }

    return cards;
  }, [result]);
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface ExecutiveSummaryProps {
  result: Result;
  isHighRisk: boolean;
  summary: AISummary | null;
  summaryLoading: boolean;
  summaryError: string | null;
  onRegenerate: () => void;
}

export function ExecutiveSummary({ result, isHighRisk, summary, summaryLoading, summaryError, onRegenerate }: ExecutiveSummaryProps) {
  const insights = useInsights(result);
  const concernCount = insights.filter(i => i.severity === 'concern').length;
  const mildCount = insights.filter(i => i.severity === 'mild').length;

  // Overall severity
  const overallSeverity: Severity = concernCount > 0 ? 'concern' : mildCount > 0 ? 'mild' : 'good';
  const overallConfig = {
    good:    { badge: '🟢 Healthy Gait', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', verdict: 'All gait parameters are within normal ranges.' },
    mild:    { badge: '🟡 Areas to Monitor', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', verdict: `${mildCount} area${mildCount > 1 ? 's' : ''} show mild findings worth monitoring.` },
    concern: { badge: '🔴 Needs Attention', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', verdict: `${concernCount} area${concernCount > 1 ? 's' : ''} require clinical follow-up.` },
  };
  const overall = overallConfig[overallSeverity];

  return (
    <div className="space-y-6">
      {/* ── Overview Severity Bar ── */}
      <div className={`rounded-xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${overall.bg}`}>
        <span className="text-3xl">{overall.badge.split(' ')[0]}</span>
        <div className="flex-1">
          <h3 className={`text-lg font-bold ${overall.color}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
            {overall.badge.substring(2)}
          </h3>
          <p className="text-sm text-slate-300 mt-0.5">{overall.verdict}</p>
        </div>
        {(concernCount > 0 || mildCount > 0) && (
          <div className="flex gap-2">
            {concernCount > 0 && (
              <span className="text-xs font-bold bg-red-500/20 text-red-400 px-3 py-1 rounded-full">
                {concernCount} flagged
              </span>
            )}
            {mildCount > 0 && (
              <span className="text-xs font-bold bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full">
                {mildCount} to monitor
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Insight Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((card, i) => (
          <InsightCardUI key={i} card={card} />
        ))}
      </div>

      {/* ── 5 Metric Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard label="Symmetry Index" value={result.symmetry_index.toFixed(3)} unit="Ratio" icon="balance" />
        <MetricCard label="ROM Left" value={`${Math.round(result.left_rom)}°`} unit="" icon="open_in_full" />
        <MetricCard label="ROM Right" value={`${Math.round(result.right_rom)}°`} unit="" icon="open_in_full" />
        <MetricCard
          label="Asymmetry"
          value={`${result.asymmetry_percentage.toFixed(1)}%`}
          unit=""
          icon={isHighRisk ? 'priority_high' : 'check_circle'}
          highlight={isHighRisk ? 'danger' : 'success'}
        />
        <MetricCard
          label="Data Quality"
          value={`${Math.round(result.detection_rate)}%`}
          unit={result.detection_rate >= 90 ? 'HIGH' : result.detection_rate >= 70 ? 'MODERATE' : 'LOW'}
          icon="signal_cellular_alt"
        />
      </div>

      {/* ── Educational Note (high-risk only) ── */}
      {isHighRisk && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 flex gap-4">
          <span className="material-icons text-amber-400 mt-0.5 shrink-0">info</span>
          <div>
            <p className="text-amber-300 font-bold text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>Clinical Interpretation Context</p>
            <p className="text-sm text-amber-200/80 leading-relaxed mt-1">
              An asymmetry percentage above 15% is typically considered clinically significant in pediatric gait patterns. 
              The computed asymmetry of {result.asymmetry_percentage.toFixed(1)}% indicates a notable difference. 
              Correlation with clinical examination is recommended.
            </p>
          </div>
        </div>
      )}

      {/* ── Suggested Next Steps ── */}
      {(concernCount > 0 || mildCount > 0) && (
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-5 flex gap-4">
          <span className="material-icons text-cyan-400 mt-0.5 shrink-0">arrow_forward</span>
          <div>
            <p className="text-white font-bold text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>Suggested Next Steps</p>
            <ul className="text-sm text-slate-300 leading-relaxed mt-2 space-y-1.5 list-disc list-inside">
              <li>Discuss these insights with your child's pediatrician or physical therapist</li>
              <li>Use the detailed clinical graphs in the other tabs as reference during your visit</li>
              {concernCount > 0 && <li className="text-amber-300">Schedule a follow-up evaluation within 2-4 weeks</li>}
            </ul>
          </div>
        </div>
      )}

      {/* ── AI Summary ── */}
      <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/50 flex justify-between items-center">
          <h3 className="font-bold text-white flex items-center gap-2.5 text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <span className="material-icons text-cyan-400">auto_awesome</span>
            AI Clinical Summary
          </h3>
          <button
            onClick={onRegenerate}
            disabled={summaryLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-600 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <span className={`material-icons text-sm ${summaryLoading ? 'animate-spin' : ''}`}>
              {summaryLoading ? 'progress_activity' : 'refresh'}
            </span>
            {summaryLoading ? 'Generating...' : 'Regenerate'}
          </button>
        </div>
        <div className="p-5">
          {summaryLoading && !summary ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-3 w-full bg-slate-700 rounded" />
              <div className="h-3 w-5/6 bg-slate-700 rounded" />
              <div className="h-3 w-4/6 bg-slate-700 rounded" />
            </div>
          ) : summaryError ? (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <span className="material-icons text-red-400">error_outline</span>
              <p className="text-sm text-red-300">{summaryError}</p>
            </div>
          ) : summary ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-300 leading-relaxed">{summary.overview}</p>
              {summary.what_this_means && (
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                  <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <span className="material-icons text-sm">lightbulb</span>
                    What This Means For You
                  </h4>
                  <p className="text-sm text-cyan-100 leading-relaxed">{summary.what_this_means}</p>
                </div>
              )}
              {summary.recommendations?.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Recommendations</h4>
                  <ol className="space-y-1.5 list-decimal list-inside">
                    {summary.recommendations.slice(0, 3).map((rec, i) => (
                      <li key={i} className="text-sm text-slate-300 leading-relaxed">{rec}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({
  label, value, unit, icon, highlight,
}: {
  label: string; value: string; unit: string; icon: string;
  highlight?: 'danger' | 'success';
}) {
  const borderClass = highlight === 'danger'
    ? 'border-red-500/50 shadow-lg shadow-red-500/10'
    : highlight === 'success'
      ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10'
      : 'border-slate-700/50 hover:border-cyan-500/30';
  const valueColor = highlight === 'danger'
    ? 'text-red-400'
    : highlight === 'success'
      ? 'text-emerald-400'
      : 'text-white';

  return (
    <div className={`bg-slate-900/80 p-4 rounded-xl border ${borderClass} transition-colors`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="material-icons text-slate-600 text-base">{icon}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold tracking-tight ${valueColor}`}>{value}</span>
        {unit && <span className="text-xs text-slate-500">{unit}</span>}
      </div>
    </div>
  );
}
