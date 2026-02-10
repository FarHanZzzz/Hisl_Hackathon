/**
 * Custom hook for video file upload with loading/error state.
 */
import { useState } from 'react';
import { uploadVideo } from '../services/api';
import type { UploadResponse } from '../types';

interface UseUploadReturn {
  upload: (file: File) => Promise<UploadResponse>;
  uploading: boolean;
  error: string | null;
}

export function useUpload(): UseUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File): Promise<UploadResponse> => {
    setUploading(true);
    setError(null);
    try {
      const result = await uploadVideo(file);
      return result;
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message;
      setError(msg);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, error };
}
