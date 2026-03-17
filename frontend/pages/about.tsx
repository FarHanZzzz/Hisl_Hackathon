import Head from 'next/head';
import { Layout } from '../src/components/Layout';
import { Shield, Activity, Cpu, Users, Heart, CheckCircle } from 'lucide-react';

export default function AboutPage() {
  return (
    <Layout title="About | Pedi-Growth Clinical Gait Analysis">
      <div className="max-w-5xl mx-auto py-12 px-6">
        {/* Hero Section */}
        <section className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest mb-6 border border-primary/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Our Mission
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight leading-tight">
            Advancing Pediatric Care through <span className="text-primary">AI Kinematics</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Pedi-Growth bridge the gap between complex laboratory gait analysis and everyday clinical assessment, 
            providing pediatricians and orthopedists with high-precision movement data.
          </p>
        </section>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
              <Cpu className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Edge AI Analysis</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              Utilizing MediaPipe and computer vision to extract joint angles and gait cycles directly from standard video files, no markers required.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Privacy First</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              Local processing ensures that patient videos are analyzed and blurred before storage, maintaining strict HIPAA and GDPR compliance.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-6">
              <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Clinical Metrics</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              Provides actionable data including knee valgus angles, pelvic tilt, and symmetry indices to support diagnostic decision-making.
            </p>
          </div>
        </div>

        {/* Story Section */}
        <section className="bg-gray-50 dark:bg-gray-800/50 rounded-3xl p-8 md:p-12 mb-24 border border-gray-100 dark:border-gray-800">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center italic font-serif">
              "Transforming a 3-hour specialist lab visit into a 5-minute screening."
            </h2>
            <div className="space-y-6 text-gray-600 dark:text-gray-400 leading-relaxed font-['Inter',sans-serif]">
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
        <div className="text-center max-w-2xl mx-auto py-12">
            <div className="flex justify-center gap-12 mb-8">
                <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">98%+</span>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Accuracy</span>
                </div>
                <div className="w-px h-12 bg-gray-200 dark:bg-gray-800"></div>
                <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">100%</span>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Medical Grade</span>
                </div>
                <div className="w-px h-12 bg-gray-200 dark:bg-gray-800"></div>
                <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">HIPAA</span>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Compliant</span>
                </div>
            </div>
            <button className="px-8 py-3 bg-primary hover:opacity-90 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20">
                Contact Technical Support
            </button>
        </div>
      </div>
    </Layout>
  );
}
