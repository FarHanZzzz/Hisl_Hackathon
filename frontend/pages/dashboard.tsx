import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Activity } from 'lucide-react';
import { Layout } from '../src/components/Layout';
import { UploadForm } from '../src/components/UploadForm';
import { ProgressBar } from '../src/components/ProgressBar';
import { JobHistoryTable } from '../src/components/JobHistoryTable';
import { uploadVideo, createJob, getJob } from '../src/services/api';
import type { PatientInput } from '../src/types';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState<'queued' | 'processing'>('queued');
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);

  const handleSubmit = async (patient: PatientInput, file: File) => {
    setProcessing(true);
    setProgress(0);
    setStatusText('queued');

    try {
      // Step 1: Upload video
      const { filename } = await uploadVideo(file);

      // Step 2: Create analysis job
      setStatusText('processing');
      setProgress(15);
      const { job_id } = await createJob(patient, filename);
      setProcessingJobId(job_id);

      // Step 3: Poll for results
      let completed = false;
      while (!completed) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const job = await getJob(job_id);
        
        // Map backend progress (0-1) to percentage string (0-100)
        // If progress is not returned well, fake it smoothly
        const serverProgress = Math.round((job.progress || 0) * 100);
        setProgress(prev => Math.max(prev, serverProgress, 25)); // At least 25% once processing

        if (job.status === 'completed') {
          setProgress(100);
          completed = true;
          setTimeout(() => {
            router.push(`/results/${job.id}`);
          }, 800);
        } else if (job.status === 'failed') {
          throw new Error(job.error_message || 'Processing failed');
        }
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Processing failed');
      setProcessing(false);
      setProgress(0);
      setProcessingJobId(null);
    }
  };

  return (
    <Layout>
      <div className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Left Column (35%): New Analysis Form */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <UploadForm onSubmit={handleSubmit} disabled={processing} />
          </div>

          {/* Right Column (65%): Empty State */}
          <div className="lg:col-span-8">
            <div className="bg-slate-900/40 h-full min-h-[500px] rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] border border-cyan-500/20 backdrop-blur-md flex flex-col items-center justify-center text-center p-12">
               <div className="relative mb-8">
                  <div className="absolute inset-0 bg-cyan-500/10 blur-[60px] rounded-full"></div>
                   <div className="w-64 h-64 border-4 border-dashed border-cyan-500/30 rounded-3xl opacity-80 flex items-center justify-center relative z-10 bg-slate-900/60 shadow-inner">
                     <span className="material-icons text-6xl text-cyan-500/50">directions_walk</span>
                  </div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-2 bg-cyan-900 blur-sm rounded-full"></div>
               </div>
               
               <h3 className="text-2xl font-bold text-slate-50 mb-3">Ready for Screening</h3>
               <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
                  Complete the patient profile and upload a gait video to begin high-precision kinematic analysis.
               </p>
               
               <div className="mt-8 flex gap-6">
                  <div className="flex flex-col items-center">
                      <span className="material-icons text-cyan-400 text-3xl mb-1 shadow-cyan-500/50 drop-shadow-md">speed</span>
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">AI-Powered</span>
                  </div>
                  <div className="w-px h-10 bg-cyan-900"></div>
                  <div className="flex flex-col items-center">
                      <span className="material-icons text-cyan-400 text-3xl mb-1 shadow-cyan-500/50 drop-shadow-md">security</span>
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">HIPAA Ready</span>
                  </div>
                  <div className="w-px h-10 bg-cyan-900"></div>
                  <div className="flex flex-col items-center">
                      <span className="material-icons text-cyan-400 text-3xl mb-1 shadow-cyan-500/50 drop-shadow-md">timeline</span>
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Kinematics</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Recent Analyses Table */}
        <JobHistoryTable />

        {/* Processing State Overlay */}
        {processing && (
          <div className="fixed inset-0 bg-[#020617]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
             <div className="bg-slate-900/80 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] border border-cyan-500/30 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="p-8 text-center flex flex-col items-center relative overflow-hidden">
                   <div className="absolute top-0 right-1/2 translate-x-1/2 w-64 h-32 bg-cyan-500/20 blur-[80px] rounded-full pointer-events-none -z-10"></div>
                   <div className="w-16 h-16 bg-cyan-900/40 rounded-full flex items-center justify-center mb-6 relative border border-cyan-500/20">
                      <div className="absolute inset-0 border-4 border-slate-700 rounded-full border-t-cyan-400 animate-spin shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
                      <span className="material-icons text-cyan-400 text-3xl drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">psychology</span>
                   </div>
                   
                   <h2 className="text-xl font-bold text-slate-50 mb-2">Analyzing Gait Pattern...</h2>
                   <p className="text-sm text-slate-400 mb-8 font-medium">Extracting kinematics and joint angles</p>
                   
                   <div className="w-full space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                         <span className="text-slate-300">Processing Progress</span>
                         <span className="text-cyan-400">{progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                         <div 
                           className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-500 ease-out rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]" 
                           style={{ width: `${progress}%` }}
                         ></div>
                      </div>
                      <p className="text-[10px] text-slate-500 text-right mt-1 font-medium tracking-wide">Please do not close this window</p>
                   </div>
                </div>
                
                <div className="bg-slate-950/50 p-6 space-y-4 border-t border-cyan-500/20">
                   <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-cyan-900/50 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                         <span className="material-icons text-[12px] drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">check</span>
                      </div>
                      <span className="text-sm font-medium text-slate-200">Video uploaded successfully</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${progress > 15 ? 'bg-cyan-900/50 text-cyan-400 border border-cyan-500/30' : 'bg-cyan-500/20 text-cyan-300 animate-pulse border border-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.3)]'}`}>
                         {progress > 15 ? <span className="material-icons text-[12px] drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">check</span> : <span className="material-icons text-[12px]">sync</span>}
                      </div>
                      <span className="text-sm font-medium text-slate-200">Pose extraction initialized</span>
                   </div>
                   <div className={`flex items-center gap-3 ${progress > 15 ? 'opacity-100' : 'opacity-40'}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${progress > 90 ? 'bg-cyan-900/50 text-cyan-400 border border-cyan-500/30' : progress > 15 ? 'bg-cyan-500/20 text-cyan-300 animate-pulse border border-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.3)]' : 'border border-slate-700 bg-slate-800'}`}>
                         {progress > 90 ? <span className="material-icons text-[12px] drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">check</span> : progress > 15 ? <span className="material-icons text-[12px]">sync</span> : null}
                      </div>
                      <span className="text-sm font-medium text-slate-200">Computing symmetry metrics</span>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
