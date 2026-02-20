import { useState, useCallback } from 'react';
import { Upload, Loader2, PlusCircle, Activity } from 'lucide-react';
import type { PatientInput } from '../types';

interface Props {
  onSubmit: (patient: PatientInput, file: File) => Promise<void>;
  disabled?: boolean;
}

export function UploadForm({ onSubmit, disabled }: Props) {
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState<string>('8');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|mov|avi|webm)$/i)) {
      setError('Please select a valid video file (MP4, MOV, AVI, WebM)');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be under 50MB');
      return;
    }
    setSelectedFile(file);
    setError(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

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
    setSubmitting(true);

    try {
      const patient: PatientInput = {
        patient_id: patientId.trim(),
        patient_name: patientName.trim() || undefined,
        age: age ? parseInt(age) : undefined,
        notes: notes.trim() || undefined,
      };
      await onSubmit(patient, selectedFile);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = submitting || disabled;

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <PlusCircle className="w-5 h-5 text-primary-500" />
        New Analysis
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Patient ID */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Patient ID</label>
          <input
            type="text"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            placeholder="PG-2024-000"
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white text-sm transition-colors"
            required
            disabled={isLoading}
          />
        </div>

        {/* Full Name */}
        <div className="space-y-1.5">
           <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
           <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="John Doe"
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white text-sm transition-colors"
            disabled={isLoading}
          />
        </div>

        {/* Age */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Age (0-18 Years)</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min="0"
              max="18"
              className="flex-grow accent-primary-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              disabled={isLoading}
            />
            <span className="bg-primary-50 text-primary-600 px-3 py-1 rounded-md font-bold min-w-[3rem] text-center shrink-0">
               {age}
            </span>
          </div>
        </div>

        {/* Clinical Notes */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Clinical Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe symptoms or medical history..."
            rows={3}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 dark:text-white text-sm transition-colors resize-none"
            disabled={isLoading}
          />
        </div>

        {/* Gait Video Upload */}
        <div className="space-y-1.5">
           <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Gait Video Upload <span className="text-danger-500">*</span></label>
           <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer group bg-gray-50/50 dark:bg-gray-800/30
              ${isDragging ? 'border-primary-400 bg-primary-50' : 
                selectedFile ? 'border-success-400 bg-success-50' : 'border-gray-300 dark:border-gray-700 hover:border-primary-500/50'
              }`}
          >
             {selectedFile ? (
               <div className="space-y-2">
                 <div className="mx-auto w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
                    <Activity className="h-6 w-6 text-success-600" />
                 </div>
                 <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                 <p className="text-xs text-center text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                 <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-xs text-primary-600 hover:underline relative z-10"
                  >
                    Change file
                  </button>
               </div>
             ) : (
                <div className="space-y-2">
                  <Upload className="mx-auto h-10 w-10 text-gray-400 group-hover:text-primary-500 transition-colors mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Drag & drop MP4 or MOV</p>
                  <p className="text-xs text-gray-500 mt-1">Maximum file size: 50MB</p>
                </div>
             )}
             <input
                type="file"
                accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isLoading}
              />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-3 bg-danger-50 border border-danger-100 rounded-lg text-sm text-danger-700 flex items-center gap-2">
            <Activity className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
           {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing Video...
            </>
          ) : (
            <>
              <Activity className="w-5 h-5" />
              Start Analysis
            </>
          )}
        </button>
      </form>
    </div>
  );
}
