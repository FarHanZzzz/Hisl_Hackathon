import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { PatientLayout } from '../../../src/components/PatientLayout';

export default function PatientResultDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  // Mock fetch based on ID for demo purposes
  const [loading, setLoading] = useState(true);
  
  // Decide state based on dummy IDs for UI mock
  const isHealthy = id === 'res-1'; 
  
  useEffect(() => {
    if (id) {
      setTimeout(() => setLoading(false), 800); // simulate load
    }
  }, [id]);

  if (loading) {
    return (
      <PatientLayout title="Loading Results...">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500/30 border-t-cyan-500" />
            <p className="text-slate-400">Loading your results...</p>
          </div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout title="Result Summary | Pedi-Growth" hideNav={true}>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
        
        {/* Header with Back Button */}
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white border border-slate-800"
          >
            <span className="material-icons">arrow_back</span>
          </button>
          <span className="text-slate-400 font-medium">Result Summary</span>
        </div>

        {/* Top Big Badge */}
        <div className={`p-6 rounded-2xl border mb-8 flex flex-col items-center text-center ${
          isHealthy 
            ? 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.1)]' 
            : 'bg-amber-500/10 border-amber-500/20 shadow-[0_0_40px_rgba(245,158,11,0.1)]'
        }`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            isHealthy ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40' : 'bg-amber-500 text-white shadow-lg shadow-amber-500/40'
          }`}>
            <span className="material-icons text-3xl">{isHealthy ? 'check' : 'priority_high'}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {isHealthy ? "Your Child's Walking Looks Healthy" : "Some Areas Need Attention"}
          </h1>
          <p className="text-slate-300 text-sm max-w-sm">
            {isHealthy 
              ? "We analyzed the video and found no significant issues with stability or alignment. Great job!" 
              : "We noticed a few out-of-the-ordinary movements. A clinical professional should review this to be sure everything is okay."}
          </p>
        </div>

        {/* Doctor CTA (if not healthy) */}
        {!isHealthy && (
          <div className="mb-8">
            <button 
              onClick={() => router.push(`/patient/book-consultation/${id}`)}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 p-1 rounded-2xl shadow-xl shadow-cyan-500/20 transform transition-transform active:scale-95 group"
            >
              <div className="bg-slate-950 rounded-xl p-4 flex items-center gap-4 group-hover:bg-opacity-80 transition-all">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-2xl">👨‍⚕️</span>
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-white font-bold text-lg">Consult a Doctor</h3>
                  <p className="text-cyan-400 text-xs font-medium">Schedule a free online appointment now</p>
                </div>
                <span className="material-icons text-cyan-500">arrow_forward</span>
              </div>
            </button>
          </div>
        )}

        {/* Key Insights */}
        <h2 className="text-lg font-bold text-white mb-4 px-1" style={{ fontFamily: "'Outfit', sans-serif" }}>Key Insights</h2>
        <div className="space-y-4">
          
          {/* Insight 1 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex gap-4 items-start">
            <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isHealthy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-ambient-500/20 text-emerald-400'}`}>
              <span className="material-icons text-sm">{isHealthy ? 'thumb_up' : 'thumb_up'}</span>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Balance & Symmetry</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {isHealthy 
                  ? "Both legs are moving identically, which is a great sign of strength and coordination."
                  : "Both legs are moving similarly overall, meaning no major limping is detected."}
              </p>
            </div>
          </div>

          {/* Insight 2 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex gap-4 items-start">
            <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isHealthy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-500'}`}>
              <span className="material-icons text-sm">{isHealthy ? 'straighten' : 'warning'}</span>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Knee Alignment</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {isHealthy 
                  ? "The knees are pointing straight ahead during typical motion."
                  : "The knees are pointing slightly inward more than usual (often called 'knock-knees'). This is common in young children but worth checking."}
              </p>
            </div>
          </div>

          {/* Insight 3 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex gap-4 items-start">
            <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isHealthy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              <span className="material-icons text-sm">directions_walk</span>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Foot Position</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                The heels are striking the ground normally, showing a good walking pattern without tip-toeing.
              </p>
            </div>
          </div>

        </div>

      </div>
    </PatientLayout>
  );
}
