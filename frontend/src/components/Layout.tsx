import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function Layout({ children, title = 'Pedi-Growth | Clinical Gait Analysis Tool' }: LayoutProps) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check localStorage or system preference on mount
    const stored = localStorage.getItem('pedigrowth-theme');
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.replace('light', 'dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.replace('light', 'dark');
      localStorage.setItem('pedigrowth-theme', 'dark');
    } else {
      document.documentElement.classList.replace('dark', 'light');
      localStorage.setItem('pedigrowth-theme', 'light');
    }
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="AI-Powered Pediatric Gait Movement Tracking" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen font-display bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-200 transition-colors duration-200 flex flex-col">
        {/* Header */}
        <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-50">
           <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                 <div className="bg-primary-500 p-2 rounded-lg flex items-center justify-center">
                    <span className="material-icons text-white">straighten</span>
                 </div>
                 <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-none tracking-tight">Pedi-Growth</h1>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider">Clinical Gait Analysis Tool</p>
                 </div>
              </Link>
              <div className="flex items-center gap-3">
                 {/* Dark Mode Toggle */}
                 <button
                   onClick={toggleDarkMode}
                   className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                   aria-label="Toggle dark mode"
                 >
                    <span className="material-icons">
                      {darkMode ? 'light_mode' : 'dark_mode'}
                    </span>
                 </button>
                 <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <span className="material-icons">notifications</span>
                 </button>
                 <div className="h-8 w-8 bg-primary-500/10 rounded-full flex items-center justify-center text-primary-600 font-bold text-sm border border-primary-500/20">
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
        <footer className="mt-auto py-8 px-6 border-t border-gray-200 dark:border-gray-800 bg-background-light dark:bg-background-dark">
           <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                 <span className="material-icons text-sm">verified_user</span>
                 <p className="text-[10px] md:text-xs uppercase tracking-widest font-semibold flex items-center gap-1">
                    Medical Device Grade Software <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-[9px]">v2.4.1</span>
                 </p>
              </div>
              <p className="text-center text-[10px] md:text-[11px] text-gray-400 dark:text-gray-500 max-w-2xl leading-relaxed">
                 <strong className="text-gray-500 dark:text-gray-400 block sm:inline">Medical Disclaimer:</strong> Pedi-Growth is a clinical support tool intended for use by qualified healthcare professionals. Analysis results are indicative and should be verified through clinical observation and professional medical judgment before diagnosis or treatment decisions.
              </p>
              <div className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-tighter shrink-0 flex items-center gap-1">
                 &copy; {new Date().getFullYear()} Pedi-Growth Systems
              </div>
           </div>
        </footer>
      </div>
    </>
  );
}
