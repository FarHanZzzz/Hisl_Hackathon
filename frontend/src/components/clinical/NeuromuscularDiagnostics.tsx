/**
 * NeuromuscularDiagnostics — Tab 4 of the clinical report.
 * 
 * Premium diagnostic cards for: DMD Status, Trunk Sway, Scoliosis Risk
 * + Neuromuscular kinematics chart with gait phase labels.
 */
import { useMemo } from 'react';
import type { Result } from '../../types';
import { DiagnosticsCard } from './DiagnosticsCard';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea
} from 'recharts';

interface NeuromuscularDiagnosticsProps {
  result: Result;
  chartData: any[];
}

export function NeuromuscularDiagnostics({ result, chartData }: NeuromuscularDiagnosticsProps) {
  // Compute heuristics (same as original)
  const trunkSway = result.trunk_sway_array || [];
  const meanSway = trunkSway.length ? trunkSway.reduce((a, b) => a + b, 0) / trunkSway.length : 0;
  const swayVar = trunkSway.length ? trunkSway.reduce((a, b) => a + Math.pow(b - meanSway, 2), 0) / trunkSway.length : 0;
  const isDMDWaddling = swayVar > 15.0;

  const shoulderTilt = result.shoulder_tilt_array || [];
  const pelvicTilt = result.pelvic_tilt_array || [];
  let avgDivergence = 0;
  if (shoulderTilt.length && pelvicTilt.length) {
    const len = Math.min(shoulderTilt.length, pelvicTilt.length);
    const divergences = shoulderTilt.slice(0, len).map((s, i) => Math.abs(s - (pelvicTilt[i] || 0)));
    avgDivergence = divergences.reduce((a, b) => a + b, 0) / (divergences.length || 1);
  }
  const isScoliosis = avgDivergence > 10.0;

  const mostEquinus = (result.ankle_dorsiflexion_array || []).reduce((max, val) => Math.max(max, val), 0);
  const isToeWalking = mostEquinus > 110.0;
  const isDMD = isDMDWaddling || isToeWalking;

  return (
    <div className="space-y-6">
      {/* Diagnostics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* DMD Status */}
        <DiagnosticsCard
          title="DMD Status"
          subtitle={isDMD ? 'DMD risk indicators present' : 'DMD markers within normal limits'}
          status={isDMD ? (isDMDWaddling && isToeWalking ? 'alert' : 'significant') : 'normal'}
          metricValue={swayVar.toFixed(1)}
          metricUnit="SWAY VAR"
          normalRange="< 15 trunk sway variance"
          interpretation={
            isDMD
              ? `Combined analysis shows ${isDMDWaddling ? 'waddling gait pattern (trunk sway variance: ' + swayVar.toFixed(1) + ')' : ''} ${isDMDWaddling && isToeWalking ? 'and ' : ''} ${isToeWalking ? 'persistent toe-walking (max ankle angle: ' + mostEquinus.toFixed(1) + '°)' : ''}. These are recognized early indicators of Duchenne Muscular Dystrophy.`
              : 'No significant DMD-associated gait patterns detected. Trunk stability and plantarflexion are within normal ranges.'
          }
          thresholdExplanation="DMD screening uses waddling (sway variance > 15) and persistent equinus (ankle > 110°). The combination increases specificity for neuromuscular weakness."
          recommendations={
            isDMD
              ? 'Recommend pediatric neurology referral. Consider CK blood test and genetic testing for dystrophin gene mutations. Early intervention significantly improves outcomes.'
              : 'No neuromuscular referral needed based on gait analysis.'
          }
        />

        {/* Trunk Sway */}
        <DiagnosticsCard
          title="Trunk Sway"
          subtitle={isDMDWaddling ? 'Excessive lateral trunk oscillation' : 'Normal trunk stability'}
          status={isDMDWaddling ? (swayVar > 25 ? 'alert' : 'significant') : 'normal'}
          metricValue={swayVar.toFixed(1)}
          metricUnit="VARIANCE"
          normalRange="< 15 (standard deviation < 3.9°)"
          interpretation={
            isDMDWaddling
              ? `Trunk sway variance of ${swayVar.toFixed(1)} exceeds the normal threshold, indicating the upper body is oscillating excessively during gait. This may indicate proximal muscle weakness or poor core stability.`
              : 'Upper body remains stable during the gait cycle. Core muscle activation is adequate for age.'
          }
          thresholdExplanation="Variance > 15 suggests proximal weakness. > 25 indicates severe instability typically associated with neuromuscular conditions."
          recommendations={
            isDMDWaddling
              ? 'Core strengthening program. Swimming and balance exercises recommended. Monitor for progression.'
              : 'Continue age-appropriate physical activity.'
          }
        />

        {/* Scoliosis Risk */}
        <DiagnosticsCard
          title="Scoliosis Risk"
          subtitle={isScoliosis ? 'Shoulder-pelvis divergence detected' : 'Spine alignment within normal limits'}
          status={isScoliosis ? (avgDivergence > 15 ? 'alert' : 'significant') : 'normal'}
          metricValue={`${avgDivergence.toFixed(1)}°`}
          metricUnit="DIVERGENCE"
          normalRange="< 10° shoulder-pelvic divergence"
          interpretation={
            isScoliosis
              ? `Average shoulder-pelvis divergence of ${avgDivergence.toFixed(1)}° exceeds normal limits, suggesting possible functional or structural spinal curvature affecting dynamic posture during ambulation.`
              : 'Shoulder and pelvis track symmetrically during gait, indicating normal spinal alignment under dynamic load.'
          }
          thresholdExplanation="Divergence > 10° triggers scoliosis screening protocol. > 15° suggests structural component requiring imaging (standing AP spine)."
          recommendations={
            isScoliosis
              ? 'Adam\'s forward bend test recommended. Consider standing full-spine X-ray if clinical exam positive. Refer to orthopedics for Cobb angle measurement.'
              : 'No scoliosis screening indicated.'
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
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span className="text-[10px] font-semibold text-slate-400">Trunk Sway</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-pink-500" />
            <span className="text-[10px] font-semibold text-slate-400">Shoulder Tilt</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full border-2 border-amber-500" style={{ borderStyle: 'dashed', width: 10, height: 10 }} />
            <span className="text-[10px] font-semibold text-slate-400">Pelvic Tilt</span>
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
              formatter={(value: number, name: string) => [`${(value as number)?.toFixed(1)}°`, name]}
            />
            <ReferenceArea x1={0} x2={60} fill="#06b6d4" fillOpacity={0.03} />
            <ReferenceArea x1={60} x2={100} fill="#8b5cf6" fillOpacity={0.03} />
            <ReferenceLine x={60} stroke="#475569" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="trunkSway" name="Trunk Sway" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="shoulderTilt" name="Shoulder Tilt" stroke="#ec4899" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="pelvicTilt" name="Pelvic Tilt" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
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
