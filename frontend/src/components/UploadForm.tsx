import { useState, useCallback } from 'react';
import { Upload, Loader2, PlusCircle, Activity, Save } from 'lucide-react';
import type { PatientInput } from '../types';

interface Props {
  onSubmit: (patient: PatientInput, file: File) => Promise<void>;
  disabled?: boolean;
}

export function UploadForm({ onSubmit, disabled }: Props) {
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState<string>('8');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; notes?: string }>({});

  const NOTES_MAX = 500;

  const validateName = (name: string): string | undefined => {
    const trimmed = name.trim();
    if (!trimmed) return 'Full name is required';
    if (trimmed.length < 2) return 'Name must be at least 2 characters';
    if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) return 'Name can only contain letters, spaces, hyphens, and apostrophes';
    return undefined;
  };

  const validateNotes = (text: string): string | undefined => {
    if (text.length > NOTES_MAX) return `Notes must be under ${NOTES_MAX} characters`;
    return undefined;
  };

  const handleFileSelect = useCallback((file: File) => {
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|mov|avi|webm)$/i)) {
      setError('Please select a valid video file (MP4, MOV, AVI, WebM)');
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      setError('File size must be under 500MB');
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

    const nameErr = validateName(patientName);
    const notesErr = validateNotes(notes);
    setFieldErrors({ name: nameErr, notes: notesErr });

    if (nameErr || notesErr) return;

    if (!selectedFile) {
      setError('Please select a video file');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const patient: PatientInput = {
        patient_name: patientName.trim(),
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
    <div className="bg-slate-900/40 p-6 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] border border-cyan-500/20 backdrop-blur-md">
      <h2 className="text-lg font-semibold text-slate-50 mb-6 flex items-center gap-2">
        <PlusCircle className="w-5 h-5 text-cyan-400" />
        New Analysis
        <span className="ml-auto text-[10px] font-bold bg-cyan-900/40 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-md tracking-wider">V2.4 PRO</span>
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Full Name */}
        <div className="space-y-1.5">
           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
           <input
            type="text"
            value={patientName}
            onChange={(e) => {
              setPatientName(e.target.value);
              if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: validateName(e.target.value) }));
            }}
            placeholder="Jonathan Doe"
            className={`w-full bg-slate-900/50 border rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-slate-50 text-sm transition-colors outline-none ${fieldErrors.name ? 'border-red-500/50' : 'border-slate-700/50'}`}
            required
            disabled={isLoading}
          />
          {fieldErrors.name && <p className="text-xs text-red-400 mt-1">{fieldErrors.name}</p>}
        </div>

        {/* Age */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Age (0-18 Years)</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min="0"
              max="18"
              className="flex-grow accent-cyan-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              disabled={isLoading}
            />
            <span className="bg-cyan-900/40 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-md font-bold min-w-[3rem] text-center shrink-0">
               {age}y
            </span>
          </div>
        </div>

        {/* Clinical Notes */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clinical Notes</label>
          <textarea
            value={notes}
            onChange={(e) => {
              if (e.target.value.length <= NOTES_MAX) {
                setNotes(e.target.value);
                if (fieldErrors.notes) setFieldErrors(prev => ({ ...prev, notes: undefined }));
              }
            }}
            placeholder="Observation of unilateral deviation..."
            rows={3}
            className={`w-full bg-slate-900/50 border rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 text-slate-50 text-sm transition-colors resize-none outline-none ${fieldErrors.notes ? 'border-red-500/50' : 'border-slate-700/50'}`}
            disabled={isLoading}
          />
          <div className="flex justify-between items-center">
            {fieldErrors.notes && <p className="text-xs text-red-400">{fieldErrors.notes}</p>}
            <span className={`text-[10px] ml-auto ${notes.length > NOTES_MAX * 0.9 ? 'text-amber-400' : 'text-slate-500'}`}>
              {notes.length}/{NOTES_MAX}
            </span>
          </div>
        </div>

        {/* Gait Video Upload */}
        <div className="space-y-1.5">
           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gait Video Upload</label>
           <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer group bg-slate-900/30
              ${isDragging ? 'border-cyan-400/50 bg-cyan-900/20' : 
                selectedFile ? 'border-green-500/50 bg-green-900/20' : 'border-slate-700 hover:border-cyan-500/50'
              }`}
          >
             {selectedFile ? (
               <div className="space-y-2">
                 <div className="mx-auto w-12 h-12 bg-green-900/30 border border-green-500/30 rounded-full flex items-center justify-center">
                    <Activity className="h-6 w-6 text-green-400" />
                 </div>
                 <p className="text-sm font-medium text-slate-50">{selectedFile.name}</p>
                 <p className="text-xs text-center text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                 <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-xs text-cyan-400 hover:underline relative z-10"
                  >
                    Change file
                  </button>
               </div>
             ) : (
                <div className="space-y-2">
                  <Upload className="mx-auto h-10 w-10 text-slate-500 group-hover:text-cyan-400 transition-colors mb-2" />
                  <p className="text-sm font-semibold text-slate-300">Drag & drop clinical footage</p>
                  <p className="text-xs text-slate-500 mt-1">Supports .MP4, .MOV up to 500MB</p>
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
          <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-sm text-red-400 flex items-center gap-2">
            <Activity className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:opacity-90 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] border border-cyan-400/50 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm"
        >
           {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing Video...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Start Analysis
            </>
          )}
        </button>
      </form>
    </div>
  );
}
