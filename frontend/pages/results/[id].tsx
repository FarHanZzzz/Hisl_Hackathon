import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../../src/components/Layout';
import { VisualLocalization } from '../../src/components/VisualLocalization';
import { getJob, getAISummary } from '../../src/services/api';
import { DiagnosisBanner } from '../../src/components/DiagnosisBanner';
import type { Job, AISummary, Result, DiagnosisType } from '../../src/types';
import Head from 'next/head';
import {
   LineChart, Line, XAxis, YAxis, CartesianGrid,
   Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// --- Parent Insights Panel ---
const ParentInsightsPanel = ({ result }: { result: Result }) => {
   const [isOpen, setIsOpen] = useState(false);

   // Calculate trunk sway variance
   const trunkVariance = useMemo(() => {
      const arr = result.trunk_sway_array;
      if (!arr || arr.length < 2) return null;
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      return arr.reduce((sum, x) => sum + (x - mean) ** 2, 0) / arr.length;
   }, [result.trunk_sway_array]);

   // Calculate shoulder tilt variance
   const shoulderVariance = useMemo(() => {
      const arr = result.shoulder_tilt_array;
      if (!arr || arr.length < 2) return null;
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      return arr.reduce((sum, x) => sum + (x - mean) ** 2, 0) / arr.length;
   }, [result.shoulder_tilt_array]);

   // Build personalized insights
   const insights: { icon: string; text: string; severity: 'good' | 'mild' | 'concern' }[] = [];

   // Symmetry
   const si = result.symmetry_index;
   if (si < 0.85 || si > 1.15) {
      const pct = Math.round(result.asymmetry_percentage ?? Math.abs(1 - si) * 100);
      const favoredSide = si < 1.0 ? 'right' : 'left';
      insights.push({
         icon: 'swap_horiz',
         text: `Your child appears to favor their ${favoredSide} side while walking, with a ${pct}% difference in how each leg moves. In everyday terms, this means one leg is doing more work than the other — similar to how carrying a heavy bag on one shoulder makes you lean. This imbalance can cause your child to tire more quickly during long walks, feel less steady on uneven surfaces like playground gravel, and may lead to soreness in the leg or hip that's compensating. Over time, persistent asymmetry is something a physical therapist can help correct with targeted exercises.`,
         severity: si < 0.75 || si > 1.25 ? 'concern' : 'mild'
      });
   } else {
      insights.push({
         icon: 'check_circle',
         text: `Great news — both legs are moving with strong symmetry (${(si * 100).toFixed(0)}% balanced). This means your child's left and right sides are sharing the work evenly during walking, which is a sign of healthy, well-coordinated movement. Even weight distribution reduces strain on joints and muscles, and supports good posture as they grow. This is exactly what we like to see in a developing child.`,
         severity: 'good'
      });
   }

   // Range of Motion
   const leftRom = result.left_rom;
   const rightRom = result.right_rom;
   if (leftRom < 35 || rightRom < 35) {
      const stiffSide = leftRom < rightRom ? 'left' : 'right';
      const stiffVal = Math.round(Math.min(leftRom, rightRom));
      const otherVal = Math.round(Math.max(leftRom, rightRom));
      insights.push({
         icon: 'accessibility_new',
         text: `The ${stiffSide} knee is bending only about ${stiffVal}° during walking, while the other side reaches ${otherVal}°. For context, a healthy walking knee typically bends between 40° and 60° with each step — think of how a door swings open and closed. When the knee doesn't bend enough, it's like trying to walk without fully lifting your foot, which can cause a shuffling or stiff-legged gait. Your child might find it harder to run freely, climb stairs comfortably, or keep up with peers during active play. This reduced range of motion can sometimes be improved with stretching exercises or physical therapy.`,
         severity: stiffVal < 25 ? 'concern' : 'mild'
      });
   } else {
      insights.push({
         icon: 'check_circle',
         text: `Both knees are bending within a healthy range during walking (Left: ${Math.round(leftRom)}°, Right: ${Math.round(rightRom)}°). The normal range for walking is between 40° and 60°. This means your child's knees are flexing and extending properly with each step, allowing for smooth, efficient movement. Good knee mobility supports everything from running and jumping to climbing stairs — all the activities that are important for a growing child's development and daily life.`,
         severity: 'good'
      });
   }

   // Knee Valgus (Bowlegs / Knock-knees)
   const valgus = result.knee_valgus_angle;
   if (valgus != null) {
      if (valgus < 170) {
         const deviation = Math.round(180 - valgus);
         insights.push({
            icon: 'straighten',
            text: `The knee alignment shows an outward curvature of about ${deviation}° beyond neutral (measured at ${valgus.toFixed(1)}°, where 180° is perfectly straight). This is sometimes called "Bowlegs" or Genu Varum. Imagine standing with your ankles together — if the knees don't touch and curve outward, that's what we're seeing here. In toddlers (ages 1-3), this is usually part of normal development and corrects itself naturally. However, if your child is older than 3 or the curvature seems to be increasing, it's worth discussing with your pediatrician. Persistent bowlegs can affect how forces distribute through the leg during walking and running.`,
            severity: valgus < 160 ? 'concern' : 'mild'
         });
      } else if (valgus > 190) {
         const deviation = Math.round(valgus - 180);
         insights.push({
            icon: 'straighten',
            text: `The knees are angling inward by about ${deviation}° beyond neutral (measured at ${valgus.toFixed(1)}°). This is commonly called "Knock-knees" or Genu Valgum, where the knees come close together while the ankles stay apart. Between ages 3 and 7, a mild degree of knock-knees is actually a very normal phase of leg development — most children naturally grow out of it. However, if it persists past age 7-8 or if your child complains of knee pain during activities, a follow-up orthopedic check is recommended. Knock-knees can sometimes affect running form and may cause discomfort during prolonged physical activity.`,
            severity: valgus > 200 ? 'concern' : 'mild'
         });
      }
   }

   // Ankle Dorsiflexion (Toe-Walking)
   const ankle = result.ankle_dorsiflexion;
   if (ankle != null && ankle > 100) {
      const deviation = Math.round(ankle - 90);
      insights.push({
         icon: 'directions_walk',
         text: `The ankle angle during walking is ${ankle.toFixed(1)}°, which is ${deviation}° above the neutral 90° position. This means the heels are staying off the ground more than expected — a pattern often called "Toe-Walking." Think of it like walking on tiptoes: the calf muscles are staying shortened instead of stretching with each step. Over time, this can cause the calf muscles and Achilles tendon to tighten, making it harder for your child to put their heels down flat. This pattern can affect balance, make running less efficient, and increase the risk of tripping. Many children who toe-walk benefit from gentle calf stretching exercises, and in some cases a pediatrician may recommend further evaluation to understand the underlying cause.`,
         severity: ankle > 115 ? 'concern' : 'mild'
      });
   }

   // Trunk Sway
   if (trunkVariance != null && trunkVariance > 15) {
      insights.push({
         icon: 'self_improvement',
         text: `The upper body shows more side-to-side swaying motion than typical during walking (measured variance: ${trunkVariance.toFixed(1)}, where values above 15 indicate significant movement). Imagine trying to walk on a balance beam — your body naturally sways to keep centered. When this swaying happens during normal flat-ground walking, it suggests your child's core muscles are working extra hard to maintain balance. This can lead to quicker fatigue during walks, less confidence on unstable surfaces, and a "waddling" appearance to the gait. Strengthening the core muscles through age-appropriate exercises like swimming, yoga poses, or balance games can often help improve stability over time.`,
         severity: trunkVariance > 25 ? 'concern' : 'mild'
      });
   }

   // Shoulder Tilt
   if (shoulderVariance != null && shoulderVariance > 10) {
      insights.push({
         icon: 'accessibility',
         text: `The shoulders are tilting unevenly during walking (measured variance: ${shoulderVariance.toFixed(1)}, where values above 10 suggest asymmetry). During a healthy walk, both shoulders should stay relatively level — like a balanced seesaw. When one shoulder consistently dips or rises more than the other, it can mean the spine or trunk is compensating for an imbalance somewhere else in the body, such as a leg length difference or hip weakness. This doesn't necessarily mean there's a spinal problem, but it is a pattern worth discussing with your pediatrician, who may recommend a closer look or referral to an orthopedic specialist.`,
         severity: shoulderVariance > 20 ? 'concern' : 'mild'
      });
   }

   // Pelvic Tilt
   const pelvic = result.pelvic_tilt;
   if (pelvic != null && pelvic > 5) {
      insights.push({
         icon: 'height',
         text: `There is a noticeable tilt in the pelvis during walking (${pelvic.toFixed(1)}°, where less than 5° is considered normal). The pelvis is like the body's foundation — if it's tilted, everything above and below has to adjust. This tilt can sometimes indicate a difference in leg length, hip muscle weakness, or a habitual posture pattern. Your child might unconsciously compensate by slightly limping, leaning to one side, or taking uneven steps. A physical therapist can assess whether this tilt is structural (bone-related) or functional (muscle-related) and recommend appropriate stretches or strengthening exercises.`,
         severity: pelvic > 10 ? 'concern' : 'mild'
      });
   }

   // Foot Progression
   const footProg = result.foot_progression_angle;
   if (footProg != null) {
      if (footProg < 0) {
         insights.push({
            icon: 'do_not_step',
            text: `The feet are pointing inward during walking at ${footProg.toFixed(1)}° (normal is 10-15° outward). This is commonly called "In-toeing" or "Pigeon-toed" walking. It can originate from the foot, shin bone, or hip rotating inward. The good news is that most children naturally outgrow in-toeing as their bones mature and muscles strengthen — typically by age 8-10. However, if your child frequently trips over their own feet during running or play, it's worth mentioning to your pediatrician. In rare cases, persistent in-toeing may benefit from physical therapy or monitoring.`,
            severity: footProg < -10 ? 'concern' : 'mild'
         });
      } else if (footProg > 30) {
         insights.push({
            icon: 'do_not_step',
            text: `The feet are pointing outward more than the typical range during walking (${footProg.toFixed(1)}° vs. the normal 10-15°). This "Out-toeing" pattern means the feet splay outward with each step, which can reduce walking and running efficiency — imagine trying to run fast with your feet pointing sideways instead of forward. While some outward rotation is normal, particularly in younger children who are still developing their walking pattern, a more pronounced angle can affect how muscles and joints work together. If this persists or your child seems to tire easily during physical activities, discussing it with a pediatrician or physical therapist would be a good next step.`,
            severity: 'mild'
         });
      }
   }

   const concernCount = insights.filter(i => i.severity === 'concern').length;
   const mildCount = insights.filter(i => i.severity === 'mild').length;

   const severityColors = {
      good: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-300',
      mild: 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-300',
      concern: 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/30 text-rose-700 dark:text-rose-300',
   };

   const iconColors = {
      good: 'text-emerald-500',
      mild: 'text-amber-500',
      concern: 'text-rose-500',
   };

   return (
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50/50 to-blue-50 dark:from-blue-950/20 dark:via-indigo-950/10 dark:to-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-xl shadow-sm overflow-hidden">
         {/* Toggle Header */}
         <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center gap-3 px-6 py-4 hover:bg-blue-100/30 dark:hover:bg-blue-900/10 transition-colors cursor-pointer"
         >
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center border border-blue-200 dark:border-blue-800/30 shrink-0">
               <span className="material-icons text-blue-600 dark:text-blue-400">lightbulb</span>
            </div>
            <div className="text-left">
               <h3 className="font-semibold text-gray-900 dark:text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Quick Summary for Parents</h3>
               <p className="text-xs text-gray-500 dark:text-gray-400">Personalized insights based on your child's gait data</p>
            </div>
            {concernCount > 0 && (
               <span className="ml-auto mr-3 text-[10px] font-bold uppercase tracking-widest bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800/30 shrink-0">
                  {concernCount} area{concernCount > 1 ? 's' : ''} to discuss
               </span>
            )}
            <span className={`material-icons text-gray-400 dark:text-gray-500 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
               expand_more
            </span>
         </button>

         {/* Collapsible Content */}
         <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="px-6 pb-6 pt-2 space-y-3">
               {insights.map((insight, i) => (
                  <div key={i} className={`flex items-start gap-3 px-4 py-3.5 rounded-lg border ${severityColors[insight.severity]} transition-colors`}>
                     <span className={`material-icons text-lg mt-0.5 shrink-0 ${iconColors[insight.severity]}`}>{insight.icon}</span>
                     <p className="text-sm leading-relaxed">{insight.text}</p>
                  </div>
               ))}

               {(concernCount > 0 || mildCount > 0) && (
                  <div className="mt-2 flex items-start gap-2.5 bg-white/60 dark:bg-gray-900/30 px-4 py-3.5 rounded-lg border border-blue-100 dark:border-blue-900/20">
                     <span className="material-icons text-blue-500 text-lg mt-0.5 shrink-0">arrow_forward</span>
                     <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        <span className="font-semibold text-gray-800 dark:text-gray-200">Suggested Next Step: </span>
                        We recommend discussing these insights with your child's pediatrician or physical therapist. You can use the detailed clinical graphs further down this page as a reference during your visit — they provide the precise measurements that a specialist can use to track progress over time.
                     </p>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

// --- Orthopedic Components ---
const OrthopedicSummaryCard = ({ result }: { result: Result }) => {
   const valgus = result.knee_valgus_angle ?? 180;
   const isVarum = valgus < 170;
   const isValgum = valgus > 190;
   
   const lld = result.pelvic_tilt ?? 0;
   const isLLD = lld > 8; // Max tilt threshold
   
   const equinus = result.ankle_dorsiflexion ?? 90;
   const isEquinus = equinus > 100;

   const getStatusInfo = (isIssue: boolean, issueText: string, normalText: string) => {
      return {
         text: isIssue ? issueText : normalText,
         colorClass: isIssue ? 'bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:border-danger-800' : 'bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:border-success-800',
         icon: isIssue ? 'warning' : 'check_circle'
      };
   };

   const varumStatus = getStatusInfo(isVarum || isValgum, isVarum ? 'Genu Varum (Bowlegs)' : 'Genu Valgum (Knock-knees)', 'Normal Alignment');
   const lldStatus = getStatusInfo(isLLD, 'Potential LLD / Trendelenburg', 'Normal Pelvic Tilt');
   const equinusStatus = getStatusInfo(isEquinus, 'Equinus Gait (Limited Dorsiflexion)', 'Normal Foot Progression');

   return (
      <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex flex-col mt-6 mb-6">
         <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 font-['Outfit',sans-serif]">
            <span className="material-icons text-primary-500 text-sm">medical_services</span>
            Orthopedic Diagnostics
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border ${varumStatus.colorClass} flex flex-col gap-2`}>
               <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-80 font-['Inter',sans-serif]">Rickets Eval</span>
                  <span className="material-icons text-lg">{varumStatus.icon}</span>
               </div>
               <span className="font-semibold">{varumStatus.text}</span>
               <span className="text-sm opacity-80">Valgus Angle: {valgus.toFixed(1)}°</span>
            </div>
            <div className={`p-4 rounded-lg border ${lldStatus.colorClass} flex flex-col gap-2`}>
               <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-80 font-['Inter',sans-serif]">LLD Eval</span>
                  <span className="material-icons text-lg">{lldStatus.icon}</span>
               </div>
               <span className="font-semibold">{lldStatus.text}</span>
               <span className="text-sm opacity-80">Max Tilt: {lld.toFixed(1)}°</span>
            </div>
            <div className={`p-4 rounded-lg border ${equinusStatus.colorClass} flex flex-col gap-2`}>
               <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-80 font-['Inter',sans-serif]">Clubfoot Eval</span>
                  <span className="material-icons text-lg">{equinusStatus.icon}</span>
               </div>
               <span className="font-semibold">{equinusStatus.text}</span>
               <span className="text-sm opacity-80">Dorsiflexion: {equinus.toFixed(1)}°</span>
            </div>
         </div>
      </div>
   );
};

const OrthopedicGraphArea = ({ chartData, result }: { chartData: any[]; result: Result }) => {
   const valgus = result.knee_valgus_angle;
   const pelvic = result.pelvic_tilt;
   const ankle = result.ankle_dorsiflexion;
   const orthoInsight = valgus != null && valgus < 170
      ? `The blue line (Knee Valgus) stays below 170°, indicating an outward knee curvature. This means your child's knees bow outward more than typical when walking.`
      : valgus != null && valgus > 190
      ? `The blue line (Knee Valgus) exceeds 190°, showing the knees angle inward. This knock-knee pattern is common in young children but worth monitoring.`
      : `The blue line (Knee Valgus) stays near the neutral 180°, indicating healthy knee alignment.`;
   const pelvicInsight = pelvic != null && pelvic > 5
      ? ` The yellow line (Pelvic Tilt) shows noticeable asymmetry — one hip is sitting higher than the other during walking.`
      : ``;
   const ankleInsight = ankle != null && ankle > 100
      ? ` The purple line (Dorsiflexion) exceeds the 90° neutral zone, suggesting a toe-walking tendency.`
      : ``;

   return (
      <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex flex-col mt-6">
         <div className="mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white font-['Outfit',sans-serif]">Orthopedic Kinematics</h3>
            <p className="text-xs text-gray-500 mt-1 font-['Inter',sans-serif]">Valgus, Pelvic Tilt, and Dorsiflexion arrays over gait cycle.</p>
         </div>
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
               />
               <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: 12, color: '#fff' }}
                  labelFormatter={(v: number) => `Gait Cycle: ${v}%`}
                  formatter={(value: number, name: string) => [`${value.toFixed(1)}°`, name]}
               />
               <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
               <Line type="monotone" dataKey="valgus" name="Knee Valgus" stroke="#3b82f6" strokeWidth={2} dot={false} />
               <Line type="monotone" dataKey="pelvicTilt" name="Pelvic Tilt" stroke="#f59e0b" strokeWidth={2} dot={false} />
               <Line type="monotone" dataKey="dorsiflexion" name="Dorsiflexion" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </LineChart>
         </ResponsiveContainer>
         {/* Graph Insight */}
         <div className="mt-4 flex items-start gap-2.5 bg-indigo-50 dark:bg-indigo-950/20 px-4 py-3 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
            <span className="material-icons text-indigo-500 text-base mt-0.5 shrink-0">info</span>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
               <span className="font-semibold">What this graph shows: </span>
               {orthoInsight}{pelvicInsight}{ankleInsight}
            </p>
         </div>
      </div>
   );
};

// --- Neuromuscular Components ---
const NeuromuscularSummaryCard = ({ result }: { result: Result }) => {
   // Frontend Heuristic Computation
   const trunkSway = result.trunk_sway_array || [];
   const meanSway = trunkSway.length ? trunkSway.reduce((a, b) => a + b, 0) / trunkSway.length : 0;
   const swayVar = trunkSway.length ? trunkSway.reduce((a, b) => a + Math.pow(b - meanSway, 2), 0) / trunkSway.length : 0;
   const isDMDWaddling = swayVar > 15.0;
   
   const shoulderTilt = result.shoulder_tilt_array || [];
   const pelvicTilt = result.pelvic_tilt_array || [];
   let avgDivergence = 0;
   if (shoulderTilt.length && pelvicTilt.length && shoulderTilt.length === Math.min(shoulderTilt.length, pelvicTilt.length)) {
      const divergences = shoulderTilt.map((s, i) => Math.abs(s - (pelvicTilt[i] || 0)));
      avgDivergence = divergences.reduce((a, b) => a + b, 0) / (divergences.length || 1);
   }
   const isScoliosis = avgDivergence > 10.0;
   
   const mostEquinus = (result.ankle_dorsiflexion_array || []).reduce((min, val) => Math.max(min, val), 0);
   const isToeWalking = mostEquinus > 110.0;
   const isDMD = isDMDWaddling || isToeWalking;

   const getStatusInfo = (isIssue: boolean, issueText: string, normalText: string) => {
      return {
         text: isIssue ? issueText : normalText,
         colorClass: isIssue ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800',
         icon: isIssue ? 'warning' : 'check_circle'
      };
   };

   const dmdStatus = getStatusInfo(isDMD, 'DMD Risk Detected', 'DMD Profile Normal');
   const swayStatus = getStatusInfo(isDMDWaddling, 'Excessive Trunk Sway', 'Normal Trunk Sway');
   const scoliosisStatus = getStatusInfo(isScoliosis, 'Scoliosis Risk Protocol', 'Spine Alignment Normal');

   return (
      <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex flex-col mt-6 mb-6">
         <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 font-['Outfit',sans-serif]">
            <span className="material-icons text-purple-500 text-sm">neurology</span>
            Neuromuscular Diagnostics
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border flex flex-col gap-2 ${dmdStatus.colorClass}`}>
               <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-80 font-['Inter',sans-serif]">DMD Status</span>
                  <span className="material-icons text-lg">{dmdStatus.icon}</span>
               </div>
               <span className="font-semibold">{dmdStatus.text}</span>
               <span className="text-sm opacity-80">{isToeWalking ? 'Toe-Walking Present' : 'Plantarflexion Normal'}</span>
            </div>
            <div className={`p-4 rounded-lg border flex flex-col gap-2 ${swayStatus.colorClass}`}>
               <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-80 font-['Inter',sans-serif]">Trunk Sway</span>
                  <span className="material-icons text-lg">{swayStatus.icon}</span>
               </div>
               <span className="font-semibold">{swayStatus.text}</span>
               <span className="text-sm opacity-80">Variance: {swayVar.toFixed(1)}</span>
            </div>
            <div className={`p-4 rounded-lg border flex flex-col gap-2 ${scoliosisStatus.colorClass}`}>
               <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-80 font-['Inter',sans-serif]">Scoliosis Risk</span>
                  <span className="material-icons text-lg">{scoliosisStatus.icon}</span>
               </div>
               <span className="font-semibold">{scoliosisStatus.text}</span>
               <span className="text-sm opacity-80">Divergence: {avgDivergence.toFixed(1)}°</span>
            </div>
         </div>
      </div>
   );
};

const NeuromuscularGraphArea = ({ chartData, result }: { chartData: any[]; result: Result }) => {
   // Calculate trunk sway variance for insight
   const trunkArr = result.trunk_sway_array || [];
   const trunkMean = trunkArr.length ? trunkArr.reduce((a, b) => a + b, 0) / trunkArr.length : 0;
   const trunkVar = trunkArr.length > 1 ? trunkArr.reduce((s, x) => s + (x - trunkMean) ** 2, 0) / trunkArr.length : 0;

   const shoulderArr = result.shoulder_tilt_array || [];
   const shoulderMean = shoulderArr.length ? shoulderArr.reduce((a, b) => a + b, 0) / shoulderArr.length : 0;
   const shoulderVar = shoulderArr.length > 1 ? shoulderArr.reduce((s, x) => s + (x - shoulderMean) ** 2, 0) / shoulderArr.length : 0;

   const trunkInsight = trunkVar > 15
      ? `The purple line (Trunk Sway) shows lots of up-and-down movement — this means your child's upper body is swaying side to side while walking, like trying to keep balance on a moving bus.`
      : `The purple line (Trunk Sway) is relatively steady, showing your child's upper body stays stable during walking — a good sign of core strength.`;
   const shoulderInsight = shoulderVar > 10
      ? ` The pink line (Shoulder Tilt) fluctuates noticeably, meaning the shoulders aren't staying level — one side dips more than the other during each step.`
      : ` The pink line (Shoulder Tilt) stays fairly level, indicating even shoulder movement.`;

   return (
      <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-md rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex flex-col mt-6">
         <div className="mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white font-['Outfit',sans-serif]">Neuromuscular Kinematics</h3>
            <p className="text-xs text-gray-500 mt-1 font-['Inter',sans-serif]">Trunk Sway, Shoulder Tilt, and Pelvic Tilt over gait cycle.</p>
         </div>
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
               />
               <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: 12, color: '#fff' }}
                  labelFormatter={(v: number) => `Gait Cycle: ${v}%`}
                  formatter={(value: number, name: string) => [`${value?.toFixed(1)}°`, name]}
               />
               <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
               <Line type="monotone" dataKey="trunkSway" name="Trunk Sway" stroke="#8b5cf6" strokeWidth={2} dot={false} />
               <Line type="monotone" dataKey="shoulderTilt" name="Shoulder Tilt" stroke="#ec4899" strokeWidth={2} dot={false} />
               <Line type="monotone" dataKey="pelvicTilt" name="Pelvic Tilt" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
         </ResponsiveContainer>
         {/* Graph Insight */}
         <div className="mt-4 flex items-start gap-2.5 bg-purple-50 dark:bg-purple-950/20 px-4 py-3 rounded-lg border border-purple-100 dark:border-purple-900/30">
            <span className="material-icons text-purple-500 text-base mt-0.5 shrink-0">info</span>
            <p className="text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
               <span className="font-semibold">What this graph shows: </span>
               {trunkInsight}{shoulderInsight}
            </p>
         </div>
      </div>
   );
};
// ------------------------------

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

   const diagnosis = firstResult?.diagnosis || 'normal';
   const isHighRisk = firstResult?.is_high_risk || false;
   const symmetryScore = firstResult?.symmetry_index
      ? Math.max(0, 100 - (Math.abs(1 - firstResult.symmetry_index) * 100))
      : 95;
   const boundedScore = Math.min(100, Math.round(symmetryScore));

   return (
      <Layout title={`Analysis Results | ${job.patient_ref}`}>
         <div className="max-w-7xl mx-auto space-y-6">

            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
               <button
                  onClick={() => router.push('/dashboard')}
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
            <div className="flex flex-col md:flex-row gap-6 items-start">
               <div className="flex-1 w-full">
                  <DiagnosisBanner
                     diagnosis={diagnosis}
                     message={job.results.message || (isHighRisk ? 'Clinical review recommended.' : 'Gait patterns within normal limits.')}
                     confidence={job.results.confidence || 0.95}
                     symmetryIndex={firstResult.symmetry_index}
                     detectionRate={firstResult.detection_rate}
                  />
               </div>

               <div className="shrink-0 w-full md:w-48 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center">
                  <div className="text-center mb-3">
                     <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Symmetry Score</div>
                     <div className="text-3xl font-bold">{boundedScore}<span className="text-lg opacity-70">%</span></div>
                  </div>
                  <div className="w-24 h-24 relative flex items-center justify-center">
                     <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                           className="text-gray-100 dark:text-gray-800"
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
                     <div className="absolute inset-0 flex items-center justify-center font-bold text-base">
                        {boundedScore}
                     </div>
                  </div>
               </div>
            </div>

            {/* Patient Info Bar (Horizontal) */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-6 py-4 flex flex-col gap-4 shadow-sm">
               <div className="flex flex-wrap gap-x-12 gap-y-4 items-center">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Patient ID</span>
                     <span className="font-semibold text-gray-900 dark:text-white">{job.patients?.patient_id || job.patient_ref.substring(0, 8)}</span>
                  </div>
                  {job.patients?.patient_name && (
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Patient Name</span>
                     <span className="font-semibold text-gray-900 dark:text-white">{job.patients.patient_name}</span>
                  </div>
                  )}
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Analysis Date</span>
                     <span className="font-semibold text-gray-900 dark:text-white">{new Date(job.created_at).toLocaleDateString()}</span>
                  </div>
               </div>
               {job.patients?.notes && (
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800 mt-2">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><span className="material-icons text-sm">assignment</span>Clinical Notes</span>
                     <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800/80">{job.patients.notes}</p>
                  </div>
               )}
            </div>

            {/* Parent Insights Panel */}
            <ParentInsightsPanel result={firstResult} />

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
                              preload="metadata"
                           >
                              <source src={`${videoUrl}#t=0.001`} type={videoUrl.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
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
                   {/* Graph Insight */}
                   <div className="mt-4 flex items-start gap-2.5 bg-sky-50 dark:bg-sky-950/20 px-4 py-3 rounded-lg border border-sky-100 dark:border-sky-900/30">
                      <span className="material-icons text-sky-500 text-base mt-0.5 shrink-0">info</span>
                      <p className="text-xs text-sky-700 dark:text-sky-300 leading-relaxed">
                         <span className="font-semibold">What this graph shows: </span>
                         {firstResult.symmetry_index < 0.85 || firstResult.symmetry_index > 1.15
                            ? `The red and gray lines represent how each knee bends during walking. Notice how the two lines don't mirror each other well — there's a ${Math.round(firstResult.asymmetry_percentage ?? Math.abs(1 - firstResult.symmetry_index) * 100)}% difference, meaning one leg is bending differently from the other. In a balanced gait, these lines would closely overlap.`
                            : `The red and gray lines show how each knee bends during the walking cycle. Both lines follow a similar pattern and closely overlap, which means your child's legs are moving symmetrically — a sign of healthy, balanced walking.`
                         }
                      </p>
                   </div>
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
        
        {/* Orthopedic Summary */}
        <OrthopedicSummaryCard result={firstResult} />
        
        {/* Orthopedic Graphs */}
        <OrthopedicGraphArea chartData={chartData} result={firstResult} />

        {/* Neuromuscular Summary */}
        <NeuromuscularSummaryCard result={firstResult} />

        {/* Neuromuscular Graphs */}
        <NeuromuscularGraphArea chartData={chartData} result={firstResult} />

            {/* AI Clinical Summary Card */}
            <div className="bg-white dark:bg-[#18181b] rounded-xl shadow-sm border border-gray-100 dark:border-[#27272a] overflow-hidden">
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
