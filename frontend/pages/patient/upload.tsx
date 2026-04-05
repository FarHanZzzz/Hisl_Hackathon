import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function PatientUpload() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'uploading' | 'analyzing' | 'done'>('uploading');

  // Mock upload and analysis sequence
  useEffect(() => {
    let currentProgress = 0;
    
    // Simulate upload
    const uploadInterval = setInterval(() => {
      currentProgress += Math.random() * 5 + 2;
      
      if (currentProgress >= 100) {
        clearInterval(uploadInterval);
        setProgress(100);
        setStatus('analyzing');
        
        // Simulate analysis delay then finish
        setTimeout(() => {
          setStatus('done');
        }, 3000);
      } else {
        setProgress(currentProgress);
      }
    }, 200);

    return () => clearInterval(uploadInterval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-6 font-sans relative overflow-hidden">
      <Head>
        <title>Upload | Pedi-Growth</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[150%] h-[50%] bg-cyan-500/5 rounded-[100%] blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center">
        {status === 'uploading' && (
          <div className="w-full flex flex-col items-center animate-in fade-in duration-500">
            <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mb-8 relative shadow-[0_0_40px_rgba(6,182,212,0.15)] border border-slate-800">
              <span className="material-icons text-4xl text-cyan-400 animate-bounce">cloud_upload</span>
              
              {/* Circular progress SVG */}
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                <circle 
                  cx="50" cy="50" r="48" 
                  fill="none" 
                  stroke="rgba(6, 182, 212, 0.1)" 
                  strokeWidth="4" 
                />
                <circle 
                  cx="50" cy="50" r="48" 
                  fill="none" 
                  stroke="#06b6d4" 
                  strokeWidth="4"
                  strokeDasharray="301.59"
                  strokeDashoffset={301.59 - (progress / 100) * 301.59}
                  strokeLinecap="round"
                  className="transition-all duration-300 ease-out"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Uploading Video...</h1>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-black text-cyan-400">{Math.min(100, Math.floor(progress))}</span>
              <span className="text-lg font-bold text-cyan-500/50">%</span>
            </div>

            <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-5 mb-8 text-left">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-slate-400">File Size</span>
                <span className="text-sm font-semibold text-white">24.5 MB</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-slate-400">Est. Time Remaining</span>
                <span className="text-sm font-semibold text-white">~15 sec</span>
              </div>
              <div className="h-px bg-slate-800 my-4" />
              <div className="flex items-start gap-3">
                <span className="material-icons text-amber-500 text-lg mt-0.5">warning_amber</span>
                <p className="text-xs text-amber-400/90 leading-relaxed font-medium">
                  Please keep this screen open until the upload finishes.
                </p>
              </div>
            </div>
          </div>
        )}

        {status === 'analyzing' && (
          <div className="w-full flex flex-col items-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-8 relative">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping" />
              <div className="relative z-10 w-full h-full bg-indigo-500/20 border border-indigo-500/40 rounded-full flex items-center justify-center">
                <span className="material-icons text-4xl text-indigo-400 animate-spin" style={{ animationDuration: '3s' }}>sync</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Processing...</h1>
            <p className="text-slate-400 mb-8 max-w-[250px]">
              Securely preparing your video for clinical AI analysis.
            </p>
          </div>
        )}

        {status === 'done' && (
          <div className="w-full flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700">
            <div className="w-24 h-24 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
              <span className="material-icons text-5xl text-emerald-400">check</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">Upload Complete!</h1>
            <p className="text-slate-300 text-center mb-8 max-w-[280px] leading-relaxed">
              Your video is now being analyzed by our AI. You'll be notified when your results are ready to view.
            </p>
            
            <button 
              onClick={() => router.push('/patient/home')}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg py-4 rounded-full active:scale-95 transform transition-transform"
            >
              Return Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
