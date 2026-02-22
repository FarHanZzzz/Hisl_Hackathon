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
            <div className="bg-white dark:bg-gray-900 h-full min-h-[500px] rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-center p-12">
               <div className="relative mb-8">
                  <div className="absolute inset-0 bg-primary-500/10 blur-3xl rounded-full"></div>
                  {/* Using a placeholder div to represent the illustration from Stitch */}
                  <div className="w-64 h-64 border-4 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl opacity-50 flex items-center justify-center relative z-10 bg-gray-50 dark:bg-gray-800">
                     <span className="material-icons text-6xl text-gray-300">directions_walk</span>
                  </div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-2 bg-gray-200 dark:bg-gray-800 blur-sm rounded-full"></div>
               </div>
               
               <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">Ready for Screening</h3>
               <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                  Complete the patient profile and upload a gait video to begin high-precision kinematic analysis.
               </p>
               
               <div className="mt-8 flex gap-6">
                  <div className="flex flex-col items-center">
                     <span className="material-icons text-primary-500/40 text-3xl mb-1">speed</span>
                     <span className="text-xs font-bold text-gray-400 uppercase">AI-Powered</span>
                  </div>
                  <div className="w-px h-10 bg-gray-200 dark:bg-gray-800"></div>
                  <div className="flex flex-col items-center">
                     <span className="material-icons text-primary-500/40 text-3xl mb-1">security</span>
                     <span className="text-xs font-bold text-gray-400 uppercase">HIPAA Ready</span>
                  </div>
                  <div className="w-px h-10 bg-gray-200 dark:bg-gray-800"></div>
                  <div className="flex flex-col items-center">
                     <span className="material-icons text-primary-500/40 text-3xl mb-1">timeline</span>
                     <span className="text-xs font-bold text-gray-400 uppercase">Kinematics</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Recent Analyses Table */}
        <JobHistoryTable />

        {/* Processing State Overlay */}
        {processing && (
          <div className="fixed inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
             <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="p-8 text-center flex flex-col items-center">
                   <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-6 relative">
                      <div className="absolute inset-0 border-4 border-primary-200 dark:border-primary-800 rounded-full border-t-primary-500 animate-spin"></div>
                      <span className="material-icons text-primary-500 text-3xl">psychology</span>
                   </div>
                   
                   <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Analyzing Gait Pattern...</h2>
                   <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 font-medium">Extracting kinematics and joint angles</p>
                   
                   <div className="w-full space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                         <span className="text-gray-700 dark:text-gray-300">Processing Progress</span>
                         <span className="text-primary-600 dark:text-primary-400">{progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                         <div 
                           className="h-full bg-primary-500 transition-all duration-500 ease-out rounded-full" 
                           style={{ width: `${progress}%` }}
                         ></div>
                      </div>
                      <p className="text-[10px] text-gray-400 text-right mt-1 font-medium">Please do not close this window</p>
                   </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 space-y-4 border-t border-gray-100 dark:border-gray-800">
                   <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-success-100 text-success-600 flex items-center justify-center shrink-0">
                         <span className="material-icons text-[12px]">check</span>
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Video uploaded successfully</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${progress > 15 ? 'bg-success-100 text-success-600' : 'bg-primary-100 text-primary-600 animate-pulse'}`}>
                         {progress > 15 ? <span className="material-icons text-[12px]">check</span> : <span className="material-icons text-[12px]">sync</span>}
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pose extraction initialized</span>
                   </div>
                   <div className={`flex items-center gap-3 ${progress > 15 ? 'opacity-100' : 'opacity-40'}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${progress > 90 ? 'bg-success-100 text-success-600' : progress > 15 ? 'bg-primary-100 text-primary-600 animate-pulse' : 'border-2 border-gray-300 dark:border-gray-600'}`}>
                         {progress > 90 ? <span className="material-icons text-[12px]">check</span> : progress > 15 ? <span className="material-icons text-[12px]">sync</span> : null}
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Computing symmetry metrics</span>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
