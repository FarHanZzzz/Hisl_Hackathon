import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Activity as ActivityIcon, Sun, Moon, Bell, ShieldCheck } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function Layout({ children, title = 'Pedi-Growth | Clinical Gait Analysis Tool' }: LayoutProps) {
  // We force dark theme based on the home page's cohesive design
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="AI-Powered Pediatric Gait Movement Tracking" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen font-sans bg-[#020617] text-slate-50 transition-colors duration-200 flex flex-col">
        {/* Header */}
        <header className="border-b border-cyan-500/20 bg-[#020617]/80 backdrop-blur-md sticky top-0 z-50">
           <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                 <div className="bg-gradient-to-br from-cyan-600 to-cyan-500 p-2 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                    <ActivityIcon color="white" size={20} />
                 </div>
                 <div>
                    <h1 className="text-2xl font-bold text-slate-50 leading-none tracking-tight">Pedi-Growth</h1>
                    <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider">Clinical Gait Analysis Tool</p>
                 </div>
              </Link>
              <div className="flex items-center gap-4">
                 <button className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-900 rounded-full transition-colors">
                    <Bell size={20} />
                 </button>
                 <div className="h-8 w-8 bg-cyan-500/10 rounded-full flex items-center justify-center text-cyan-400 font-bold text-sm border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                    DR
                 </div>
              </div>
           </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8 w-full flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="mt-auto py-8 px-6 border-t border-cyan-500/20 bg-[#020617]">
           <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2 text-slate-400">
                 <ShieldCheck size={16} className="text-cyan-500" />
                 <p className="text-[10px] md:text-xs uppercase tracking-widest font-semibold flex items-center gap-2 text-slate-300">
                    Medical Device Grade Software <span className="px-1.5 py-0.5 bg-slate-900 border border-cyan-500/30 text-cyan-400 rounded text-[9px]">v2.4.1</span>
                 </p>
              </div>
              <p className="text-center text-[10px] md:text-[11px] text-slate-400 max-w-2xl leading-relaxed">
                 <strong className="text-slate-300 block sm:inline">Medical Disclaimer:</strong> Pedi-Growth is a clinical support tool intended for use by qualified healthcare professionals. Analysis results are indicative and should be verified through clinical observation and professional medical judgment before diagnosis or treatment decisions.
              </p>
              <div className="text-slate-500 text-[10px] uppercase font-bold tracking-tighter shrink-0 flex items-center gap-1">
                 &copy; {new Date().getFullYear()} Pedi-Growth Systems
              </div>
           </div>
        </footer>
      </div>
    </>
  );
}
