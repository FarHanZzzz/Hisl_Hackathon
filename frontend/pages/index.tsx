import { useState } from 'react';
import { useRouter } from 'next/router';
import { Activity } from 'lucide-react';
import { Layout } from '../src/components/Layout';
import { UploadForm } from '../src/components/UploadForm';
import { ProgressBar } from '../src/components/ProgressBar';
import { JobHistoryTable } from '../src/components/JobHistoryTable';
import { uploadVideo, createJob, getJob } from '../src/services/api';
import type { PatientInput } from '../src/types';

export default function Home() {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState<'queued' | 'processing'>('queued');

  const handleSubmit = async (patient: PatientInput, file: File) => {
    setProcessing(true);
    setProgress(0);
    setStatusText('queued');

    try {
      // Step 1: Upload video
      const { filename } = await uploadVideo(file);

      // Step 2: Create analysis job
      setStatusText('processing');
      const { job_id } = await createJob(patient, filename);

      // Step 3: Poll for results
      let completed = false;
      while (!completed) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const job = await getJob(job_id);
        setProgress(job.progress);

        if (job.status === 'completed') {
          completed = true;
          router.push(`/results/${job.id}`);
        } else if (job.status === 'failed') {
          throw new Error(job.error_message || 'Processing failed');
        }
      }
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center mb-2">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Pediatric Gait Movement Tracking
          </h2>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">
            Upload a gait video and enter patient information to perform AI-powered
            movement analysis with clinical-grade precision.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Form */}
          <div className="lg:col-span-1">
            <UploadForm onSubmit={handleSubmit} disabled={processing} />
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Processing State */}
            {processing && (
              <ProgressBar
                progress={progress}
                status={statusText}
              />
            )}

            {/* Empty State (when not processing) */}
            {!processing && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
                <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Activity className="h-10 w-10 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Ready for Analysis
                </h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">
                  Complete the patient profile and upload a gait video to begin
                  high-precision kinematic analysis.
                </p>
              </div>
            )}

            {/* Job History */}
            <JobHistoryTable />
          </div>
        </div>
      </div>
    </Layout>
  );
}
