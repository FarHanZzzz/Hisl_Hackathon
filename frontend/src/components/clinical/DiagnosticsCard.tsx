/**
 * Premium Diagnostics Card — shared between Orthopedic and Neuromuscular tabs.
 * 
 * Dark card with status icon, status badge, title, subtitle,
 * large metric, and expandable detail section.
 */
import { useState } from 'react';

type CardStatus = 'alert' | 'significant' | 'normal';

interface DiagnosticsCardProps {
  title: string;
  subtitle: string;
  status: CardStatus;
  statusLabel?: string;
  metricValue: string;
  metricUnit: string;
  normalRange?: string;
  interpretation?: string;
  thresholdExplanation?: string;
  recommendations?: string;
}

const STATUS_CONFIG: Record<CardStatus, {
  icon: string; iconBg: string; pillBg: string; pillText: string; label: string;
}> = {
  alert: {
    icon: 'warning',
    iconBg: 'bg-red-500/20 text-red-400',
    pillBg: 'bg-red-500/20',
    pillText: 'text-red-400',
    label: 'ALERT',
  },
  significant: {
    icon: 'bolt',
    iconBg: 'bg-amber-500/20 text-amber-400',
    pillBg: 'bg-amber-500/20',
    pillText: 'text-amber-400',
    label: 'SIGNIFICANT',
  },
  normal: {
    icon: 'check_circle',
    iconBg: 'bg-emerald-500/20 text-emerald-400',
    pillBg: 'bg-emerald-500/20',
    pillText: 'text-emerald-400',
    label: 'NORMAL',
  },
};

export function DiagnosticsCard(props: DiagnosticsCardProps) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[props.status];
  const label = props.statusLabel || cfg.label;

  return (
    <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-5 flex flex-col transition-all hover:border-slate-600/50">
      {/* Top row: icon and badge */}
      <div className="flex justify-between items-start mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${cfg.iconBg}`}>
          <span className="material-icons text-lg">{cfg.icon}</span>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${cfg.pillBg} ${cfg.pillText}`}>
          {label}
        </span>
      </div>

      {/* Title / Subtitle */}
      <h4 className="text-white font-bold text-sm mb-0.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
        {props.title}
      </h4>
      <p className="text-xs text-slate-400 mb-3">{props.subtitle}</p>

      {/* Large Metric */}
      <div className="mb-4">
        <span className="text-3xl font-bold text-white tracking-tight">{props.metricValue}</span>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-2">{props.metricUnit}</span>
      </div>

      {/* Expandable Detail */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 mt-auto"
      >
        <span className="material-icons text-sm" style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
          chevron_right
        </span>
        VIEW DETAIL
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-[400px] opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
        <div className="border-t border-slate-700/50 pt-3 space-y-2.5">
          {props.normalRange && (
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Normal Range</span>
              <p className="text-sm text-emerald-400">{props.normalRange}</p>
            </div>
          )}
          {props.interpretation && (
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Clinical Interpretation</span>
              <p className="text-sm text-slate-300 leading-relaxed">{props.interpretation}</p>
            </div>
          )}
          {props.thresholdExplanation && (
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Threshold</span>
              <p className="text-sm text-slate-400 leading-relaxed">{props.thresholdExplanation}</p>
            </div>
          )}
          {props.recommendations && (
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recommended Actions</span>
              <p className="text-sm text-cyan-300 leading-relaxed">{props.recommendations}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
