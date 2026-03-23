import Head from 'next/head';
import { Layout } from '../src/components/Layout';
import { Shield, Activity, Cpu, Users, Heart, CheckCircle } from 'lucide-react';

export default function AboutPage() {
  return (
    <Layout title="About | Pedi-Growth Clinical Gait Analysis">
      <div className="max-w-5xl mx-auto py-12 px-6">
        {/* Hero Section */}
        <section className="text-center mb-20 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[600px] max-h-[400px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none -z-10"></div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase tracking-widest mb-6 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            Our Mission
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-50 mb-6 tracking-tight leading-tight">
            Advancing Pediatric Care through <span className="bg-gradient-to-r from-cyan-400 to-cyan-600 bg-clip-text text-transparent">AI Kinematics</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Pedi-Growth bridges the gap between complex laboratory gait analysis and everyday clinical assessment, 
            providing pediatricians and orthopedists with high-precision movement data.
          </p>
        </section>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24 relative z-10">
          <div className="bg-slate-900/40 p-8 rounded-2xl border border-cyan-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-md hover:-translate-y-2 transition-transform duration-300">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Cpu className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-50 mb-3">Edge AI Analysis</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Utilizing MediaPipe and computer vision to extract joint angles and gait cycles directly from standard video files, no markers required.
            </p>
          </div>

          <div className="bg-slate-900/40 p-8 rounded-2xl border border-cyan-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-md hover:-translate-y-2 transition-transform duration-300">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-50 mb-3">Privacy First</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Local processing ensures that patient videos are analyzed and blurred before storage, maintaining strict HIPAA and GDPR compliance.
            </p>
          </div>

          <div className="bg-slate-900/40 p-8 rounded-2xl border border-cyan-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-md hover:-translate-y-2 transition-transform duration-300">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-6 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Activity className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-50 mb-3">Clinical Metrics</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Provides actionable data including knee valgus angles, pelvic tilt, and symmetry indices to support diagnostic decision-making.
            </p>
          </div>
        </div>

        {/* Story Section */}
        <section className="bg-slate-900/50 rounded-3xl p-8 md:p-12 mb-24 border border-cyan-500/20 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none"></div>
          <div className="max-w-3xl mx-auto relative z-10">
            <h2 className="text-3xl font-bold text-slate-50 mb-8 text-center italic font-serif">
              "Transforming a 3-hour specialist lab visit into a 5-minute screening."
            </h2>
            <div className="space-y-6 text-slate-400 leading-relaxed font-sans">
              <p>
                Gait analysis is historically expensive, requiring multi-camera labs and specialized software. For a child with cerebral palsy, scoliosis, or other neuromuscular conditions, the frequency of these visits determines the success of their treatment.
              </p>
              <p>
                Pedi-Growth was founded to democratize this technology. By combining modern AI with the convenience of smartphones, we empower clinicians to track progress monthly instead of annually, leading to faster corrections and better outcomes for growing children.
              </p>
            </div>
          </div>
        </section>

        {/* Commitment */}
        <div className="text-center max-w-2xl mx-auto py-12 relative">
            <div className="flex justify-center gap-12 mb-12">
                <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">98%+</span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Accuracy</span>
                </div>
                <div className="w-px h-12 bg-cyan-900"></div>
                <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">100%</span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Medical Grade</span>
                </div>
                <div className="w-px h-12 bg-cyan-900"></div>
                <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">HIPAA</span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Compliant</span>
                </div>
            </div>
            <button className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:opacity-90 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] border border-cyan-400/50">
                Contact Technical Support
            </button>
        </div>
      </div>
    </Layout>
  );
}
