import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { PatientLayout } from '../../src/components/PatientLayout';

// Mock data for the UI
const RECENT_RESULTS = [
  {
    id: 'res-1',
    date: 'Oct 24, 2026',
    status: 'healthy', // healthy | attention | urgent
    title: 'Routine Check',
  },
  {
    id: 'res-2',
    date: 'Sep 10, 2026',
    status: 'attention',
    title: 'Follow-up Evaluation',
  }
];

export default function PatientHome() {
  const router = useRouter();
  const [userName, setUserName] = useState('Sarah'); // Mock user

  return (
    <PatientLayout title="Home | Pedi-Growth">
      <div className="space-y-8 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">Welcome back,</p>
            <h1 className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Hello, {userName} 👋
            </h1>
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center border-2 border-slate-900">
              <span className="text-lg font-bold text-white">S</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <section>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => router.push('/patient/capture')}
              className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-4 text-left shadow-lg shadow-cyan-500/20 transform transition-transform active:scale-95"
            >
              <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center mb-3">
                <span className="material-icons text-white">videocam</span>
              </div>
              <h3 className="text-white font-bold text-lg leading-tight mb-1">Record New<br/>Video</h3>
              <p className="text-cyan-100/80 text-xs">Analyze walking</p>
            </button>

            <button 
              onClick={() => router.push('/patient/results')}
              className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-2xl p-4 text-left shadow-lg transform transition-transform active:scale-95"
            >
              <div className="bg-slate-700 w-10 h-10 rounded-full flex items-center justify-center mb-3">
                <span className="material-icons text-cyan-400">history</span>
              </div>
              <h3 className="text-white font-bold text-lg leading-tight mb-1">View Past<br/>Results</h3>
              <p className="text-slate-400 text-xs">Track progress</p>
            </button>
          </div>
        </section>

        {/* Informational Banner */}
        <section>
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex gap-4 items-start">
            <div className="bg-indigo-500/20 p-2 rounded-full shrink-0">
              <span className="material-icons text-indigo-400 text-xl">lightbulb</span>
            </div>
            <div>
              <h4 className="text-indigo-300 font-bold mb-1">Setup Tip</h4>
              <p className="text-slate-300 text-sm leading-relaxed">
                For best results, record in a well-lit hallway. Make sure the phone is held steady at waist height.
              </p>
            </div>
          </div>
        </section>

        {/* Recent Results */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Recent Results</h2>
            <button className="text-cyan-400 text-xs font-semibold hover:text-cyan-300">See All</button>
          </div>
          
          <div className="space-y-3">
            {RECENT_RESULTS.map((result) => (
              <button 
                key={result.id}
                onClick={() => router.push(`/patient/results/${result.id}`)}
                className="w-full bg-slate-900/60 backdrop-blur-sm border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex items-center justify-between transition-colors shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    result.status === 'healthy' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                    result.status === 'attention' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 
                    'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                  }`} />
                  <div className="text-left">
                    <h4 className="text-white font-semibold text-sm">{result.title}</h4>
                    <p className="text-slate-400 text-xs mt-0.5">{result.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                    result.status === 'healthy' ? 'bg-emerald-500/10 text-emerald-400' : 
                    result.status === 'attention' ? 'bg-amber-500/10 text-amber-400' : 
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {result.status === 'healthy' ? 'Healthy' : 
                     result.status === 'attention' ? 'Needs Attention' : 'Consult Doctor'}
                  </span>
                  <span className="material-icons text-slate-500 text-sm">chevron_right</span>
                </div>
              </button>
            ))}
          </div>
        </section>

      </div>
    </PatientLayout>
  );
}
