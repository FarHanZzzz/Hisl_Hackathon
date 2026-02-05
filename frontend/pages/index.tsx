import { useState, useCallback } from 'react';
import Head from 'next/head';
import axios from 'axios';
import { Upload, FileVideo, Loader2, CheckCircle, AlertTriangle, Activity } from 'lucide-react';

// Types
interface PatientInfo {
  patient_id: string;
  patient_name?: string;
}

interface JobResponse {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: AnalysisResult;
  error_message?: string;
}

interface AngleData {
  values: number[];
  max_flexion: number;
  min_flexion: number;
  range_of_motion: number;
}

interface AnalysisMetrics {
  left_knee: AngleData;
  right_knee: AngleData;
  symmetry_index: number;
  asymmetry_percentage: number;
  frames_processed: number;
  frames_detected: number;
  detection_rate: number;
}

interface DiagnosisInfo {
  result: 'normal' | 'high_risk' | 'insufficient_data';
  message: string;
  is_high_risk: boolean;
  confidence: number;
}

interface AnalysisResult {
  job_id: string;
  patient: PatientInfo;
  metrics: AnalysisMetrics;
  diagnosis: DiagnosisInfo;
  video_filename: string;
}

export default function Home() {
  // State
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // File selection handler
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
      setError(null);
    }
  }, []);

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patientId.trim()) {
      setError('Please enter a Patient ID');
      return;
    }
    
    if (!selectedFile) {
      setError('Please select a video file');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Step 1: Upload video
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const uploadRes = await axios.post('/api/v1/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const { filename } = uploadRes.data;
      setUploading(false);
      setProcessing(true);

      // Step 2: Create analysis job
      const jobRes = await axios.post('/api/v1/jobs', {
        patient: {
          patient_id: patientId,
          patient_name: patientName || undefined,
        },
        video_filename: filename,
        enable_sam3: false,
      });

      const { job_id } = jobRes.data;

      // Step 3: Poll for results
      let completed = false;
      while (!completed) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusRes = await axios.get<JobResponse>(`/api/v1/jobs/${job_id}`);
        const job = statusRes.data;
        
        setProgress(job.progress * 100);
        
        if (job.status === 'completed' && job.result) {
          setResult(job.result);
          completed = true;
        } else if (job.status === 'failed') {
          throw new Error(job.error_message || 'Processing failed');
        }
      }

    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'An error occurred');
    } finally {
      setUploading(false);
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <>
      <Head>
        <title>Pedi-Growth | Clinical Gait Analysis</title>
        <meta name="description" content="AI-Powered Pediatric Gait Analysis" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Pedi-Growth</h1>
                <p className="text-sm text-gray-500">Clinical Gait Analysis</p>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Panel - Form */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Patient Information</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Patient ID *
                    </label>
                    <input
                      type="text"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      placeholder="Enter Patient ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Patient Name
                    </label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="Enter Patient Name (optional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gait Video *
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-primary-400 transition-colors">
                      <div className="space-y-1 text-center">
                        {selectedFile ? (
                          <>
                            <FileVideo className="mx-auto h-12 w-12 text-primary-500" />
                            <p className="text-sm text-gray-600">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </>
                        ) : (
                          <>
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="text-sm text-gray-600">Click to upload video</p>
                            <p className="text-xs text-gray-500">MP4, MOV, AVI up to 100MB</p>
                          </>
                        )}
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleFileSelect}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={uploading || processing}
                    className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading || processing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {uploading ? 'Uploading...' : `Processing ${progress.toFixed(0)}%`}
                      </>
                    ) : (
                      'Start Analysis'
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Panel - Results */}
            <div className="lg:col-span-2">
              {result ? (
                <div className="space-y-6">
                  {/* Diagnosis Banner */}
                  <div className={`rounded-lg p-6 ${
                    result.diagnosis.is_high_risk 
                      ? 'bg-red-50 border border-red-200' 
                      : 'bg-green-50 border border-green-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      {result.diagnosis.is_high_risk ? (
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                      ) : (
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      )}
                      <div>
                        <h3 className={`text-xl font-bold ${
                          result.diagnosis.is_high_risk ? 'text-red-800' : 'text-green-800'
                        }`}>
                          {result.diagnosis.is_high_risk ? 'HIGH RISK' : 'NORMAL'}
                        </h3>
                        <p className={`text-sm ${
                          result.diagnosis.is_high_risk ? 'text-red-700' : 'text-green-700'
                        }`}>
                          {result.diagnosis.message}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <MetricCard 
                        label="Left Max Flexion" 
                        value={`${result.metrics.left_knee.max_flexion.toFixed(1)}°`} 
                      />
                      <MetricCard 
                        label="Right Max Flexion" 
                        value={`${result.metrics.right_knee.max_flexion.toFixed(1)}°`} 
                      />
                      <MetricCard 
                        label="Symmetry Index" 
                        value={result.metrics.symmetry_index.toFixed(2)} 
                      />
                      <MetricCard 
                        label="Asymmetry" 
                        value={`${result.metrics.asymmetry_percentage.toFixed(1)}%`} 
                      />
                    </div>
                  </div>

                  {/* Additional Metrics */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Detailed Analysis</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <MetricCard 
                        label="Left ROM" 
                        value={`${result.metrics.left_knee.range_of_motion.toFixed(1)}°`} 
                      />
                      <MetricCard 
                        label="Right ROM" 
                        value={`${result.metrics.right_knee.range_of_motion.toFixed(1)}°`} 
                      />
                      <MetricCard 
                        label="Detection Rate" 
                        value={`${result.metrics.detection_rate.toFixed(1)}%`} 
                      />
                      <MetricCard 
                        label="Frames Analyzed" 
                        value={result.metrics.frames_processed.toString()} 
                      />
                    </div>
                  </div>

                  {/* Patient Info */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Report Details</h3>
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <dt className="text-gray-500">Patient ID</dt>
                        <dd className="font-medium">{result.patient.patient_id}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Patient Name</dt>
                        <dd className="font-medium">{result.patient.patient_name || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Video File</dt>
                        <dd className="font-medium">{result.video_filename}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Confidence</dt>
                        <dd className="font-medium">{(result.diagnosis.confidence * 100).toFixed(0)}%</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <Activity className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Analysis Results
                  </h3>
                  <p className="text-gray-500">
                    Upload a gait video and enter patient information to begin analysis.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

// Metric Card Component
function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
