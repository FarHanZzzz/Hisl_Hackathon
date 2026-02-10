import { useState, useCallback } from 'react';
import { Upload, FileVideo, Loader2 } from 'lucide-react';
import type { PatientInput } from '../types';

interface Props {
  onSubmit: (patient: PatientInput, file: File) => Promise<void>;
  disabled?: boolean;
}

export function UploadForm({ onSubmit, disabled }: Props) {
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
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
    if (file.size > 100 * 1024 * 1024) {
      setError('File size must be under 100MB');
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-1">New Analysis</h2>
      <p className="text-sm text-gray-500 mb-6">Enter patient details and upload a gait video</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Patient ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Patient ID <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            placeholder="e.g. PED-001"
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-colors"
            required
            disabled={isLoading}
          />
        </div>

        {/* Patient Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Patient Name
          </label>
          <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Full name (optional)"
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-colors"
            disabled={isLoading}
          />
        </div>

        {/* Age + Notes row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Age</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Years"
              min="0"
              max="18"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-colors"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm transition-colors"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Upload Zone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Gait Video <span className="text-danger-500">*</span>
          </label>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative mt-1 flex justify-center px-6 pt-6 pb-7 border-2 border-dashed rounded-xl transition-all cursor-pointer ${
              isDragging
                ? 'border-primary-400 bg-primary-50'
                : selectedFile
                  ? 'border-success-300 bg-success-50'
                  : 'border-gray-300 hover:border-primary-300 hover:bg-gray-50'
            }`}
          >
            <div className="space-y-2 text-center">
              {selectedFile ? (
                <>
                  <FileVideo className="mx-auto h-12 w-12 text-success-500" />
                  <p className="text-sm font-medium text-gray-700">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    Change file
                  </button>
                </>
              ) : (
                <>
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-primary-600">Click to upload</span> or drag & drop
                  </p>
                  <p className="text-xs text-gray-400">MP4, MOV, AVI up to 100MB</p>
                </>
              )}
              <input
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-danger-50 text-danger-700 px-4 py-3 rounded-lg text-sm border border-danger-100">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg hover:bg-primary-600 active:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium text-sm transition-colors shadow-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" />
              Start Analysis
            </>
          )}
        </button>
      </form>
    </div>
  );
}
