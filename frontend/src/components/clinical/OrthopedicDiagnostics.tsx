/**
 * OrthopedicDiagnostics — Tab 3 of the clinical report.
 * 
 * Premium diagnostic cards for: Rickets Eval, LLD Eval, Clubfoot Eval
 * + Orthopedic kinematics chart with gait phase labels.
 */
import { useMemo } from 'react';
import type { Result } from '../../types';
import { DiagnosticsCard } from './DiagnosticsCard';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea
} from 'recharts';

interface OrthopedicDiagnosticsProps {
  result: Result;
  chartData: any[];
}

export function OrthopedicDiagnostics({ result, chartData }: OrthopedicDiagnosticsProps) {
  const valgus = result.knee_valgus_angle ?? 180;
  const isVarum = valgus < 170;
  const isValgum = valgus > 190;

  const lld = result.pelvic_tilt ?? 0;
  const isLLD = lld > 8;

  const equinus = result.ankle_dorsiflexion ?? 90;
  const isEquinus = equinus > 100;

  return (
    <div className="space-y-6">
      {/* Diagnostics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Rickets Eval */}
        <DiagnosticsCard
          title="Rickets Eval"
          subtitle={isVarum ? 'Genu Varum / Bowlegs detected' : isValgum ? 'Genu Valgum / Knock-knees detected' : 'Normal knee alignment'}
          status={isVarum || isValgum ? (valgus < 160 || valgus > 200 ? 'alert' : 'significant') : 'normal'}
          metricValue={`${valgus.toFixed(1)}°`}
          metricUnit="VALGUS ANGLE"
          normalRange="175° – 185° (neutral 180°)"
          interpretation={
            isVarum
              ? `Knee valgus angle of ${valgus.toFixed(1)}° indicates ${Math.round(180 - valgus)}° of outward curvature. This bowleg pattern may indicate nutritional rickets or physiologic genu varum.`
              : isValgum
                ? `Knee valgus angle of ${valgus.toFixed(1)}° indicates ${Math.round(valgus - 180)}° of inward angulation. May be physiologic (ages 3-7) or pathologic.`
                : 'Knee alignment is within normal limits. No significant varus or valgus deviation detected.'
          }
          thresholdExplanation="Below 170° = Genu Varum (bowlegs). Above 190° = Genu Valgum (knock-knees). Based on POSNA guidelines for pediatric frontal plane alignment."
          recommendations={
            isVarum || isValgum
              ? 'Recommend orthopedic consultation. Monitor progression with follow-up analysis in 3-6 months.'
              : 'No intervention needed. Continue routine monitoring.'
          }
        />

        {/* LLD Eval */}
        <DiagnosticsCard
          title="LLD Eval"
          subtitle={isLLD ? 'Potential LLD / Trendelenburg sign' : 'Normal pelvic tilt'}
          status={isLLD ? (lld > 12 ? 'alert' : 'significant') : 'normal'}
          metricValue={`${lld.toFixed(1)}°`}
          metricUnit="MAX TILT"
          normalRange="< 5° pelvic tilt variance"
          interpretation={
            isLLD
              ? `Pelvic tilt of ${lld.toFixed(1)}° exceeds normal range, suggesting possible leg length discrepancy or hip abductor weakness (Trendelenburg sign).`
              : 'Pelvic tilt is within normal limits. No significant asymmetry detected.'
          }
          thresholdExplanation="Pelvic tilt > 8° amplitude suggests LLD or hip weakness. > 10° variance indicates Trendelenburg pattern."
          recommendations={
            isLLD
              ? 'Consider standing AP pelvis X-ray to measure true vs apparent leg length. Refer to PT for hip abductor strengthening.'
              : 'No intervention needed.'
          }
        />

        {/* Clubfoot Eval */}
        <DiagnosticsCard
          title="Clubfoot Eval"
          subtitle={isEquinus ? 'Equinus gait / Limited dorsiflexion' : 'Normal foot progression'}
          status={isEquinus ? (equinus > 115 ? 'alert' : 'significant') : 'normal'}
          metricValue={`${equinus.toFixed(1)}°`}
          metricUnit="DORSIFLEXION"
          normalRange="85° – 95° (neutral 90°)"
          interpretation={
            isEquinus
              ? `Ankle dorsiflexion at ${equinus.toFixed(1)}° indicates sustained plantarflexion during gait. The heels are not contacting the ground properly.`
              : 'Ankle kinematics are within normal limits. Heel-toe pattern is appropriate.'
          }
          thresholdExplanation="Above 100° = equinus gait (toe-walking). Above 110° = severe sustained plantarflexion, suggesting tight Achilles/gastrocnemius."
          recommendations={
            isEquinus
              ? 'Serial casting may be considered for severe cases. Daily calf stretching program. Rule out underlying neuromuscular etiology.'
              : 'No intervention needed.'
          }
        />
      </div>

      {/* Kinematics Chart */}
      <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-6">
        <div className="mb-4">
          <h3 className="font-semibold text-white text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Kinematics Over Gait Cycle
          </h3>
          <p className="text-xs text-slate-400 mt-1">Real-time biomechanical data visualization</p>
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-[10px] font-semibold text-slate-400">Knee Valgus</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-[10px] font-semibold text-slate-400">Pelvic Tilt</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span className="text-[10px] font-semibold text-slate-400">Dorsiflexion</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
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
            <ReferenceArea x1={0} x2={60} fill="#06b6d4" fillOpacity={0.03} />
            <ReferenceArea x1={60} x2={100} fill="#8b5cf6" fillOpacity={0.03} />
            <ReferenceLine x={60} stroke="#475569" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="valgus" name="Knee Valgus" stroke="#3b82f6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="pelvicTilt" name="Pelvic Tilt" stroke="#f59e0b" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="dorsiflexion" name="Dorsiflexion" stroke="#8b5cf6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-8 mt-1">
          <span className="text-[10px] font-bold text-cyan-500/60 uppercase tracking-widest">Stance Phase</span>
          <span className="text-[10px] font-bold text-purple-500/60 uppercase tracking-widest">Swing Phase</span>
        </div>
      </div>
    </div>
  );
}
