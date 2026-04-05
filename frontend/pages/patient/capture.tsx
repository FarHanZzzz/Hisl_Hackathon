import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function RecordVideo() {
  const router = useRouter();
  
  const [recordingState, setRecordingState] = useState<'instructions' | 'preview' | 'recording' | 'review'>('instructions');
  const [timeCounter, setTimeCounter] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const reviewVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Stop stream when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      setStream(mediaStream);
      setRecordingState('preview');
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      // Fallback for desktop/dev without camera
      setRecordingState('preview');
    }
  };

  const startRecording = () => {
    setRecordingState('recording');
    setTimeCounter(0);
    timerRef.current = setInterval(() => {
      setTimeCounter(prev => prev + 1);
    }, 1000);
    // In a real app, instantiate MediaRecorder here.
  };

  const stopRecording = () => {
    setRecordingState('review');
    if (timerRef.current) clearInterval(timerRef.current);
    stopCamera();
    // In a real app, stop MediaRecorder and set the generated blob to reviewVideoRef
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleUseVideo = () => {
    // In a real app, save the video file or start upload here
    router.push('/patient/upload');
  };

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans">
      <Head>
        <title>Record Video | Pedi-Growth</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 z-50 flex justify-between items-start p-4 bg-gradient-to-b from-black/80 to-transparent">
        <button 
          onClick={() => { stopCamera(); router.back(); }}
          className="w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white"
        >
          <span className="material-icons">close</span>
        </button>
        
        {recordingState === 'recording' && (
          <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-white font-mono font-bold tracking-wider">{formatTime(timeCounter)}</span>
          </div>
        )}
      </div>

      {recordingState === 'instructions' && (
        <div className="flex-1 flex flex-col pt-16 pb-8 px-6 bg-slate-950">
          <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
            <div className="w-full aspect-[4/5] bg-slate-900 rounded-2xl mb-8 flex items-center justify-center border border-slate-800 shadow-2xl relative overflow-hidden">
              {/* Mock instructional animation */}
              <div className="absolute inset-0 bg-cyan-900/20" />
              <div className="text-center p-6 relative z-10">
                <span className="material-icons text-6xl text-cyan-400 mb-4 animate-bounce">directions_walk</span>
                <h3 className="text-lg font-bold text-white mb-2">How to Record</h3>
                <ol className="text-sm text-slate-300 text-left space-y-3 mt-4">
                  <li className="flex items-start gap-2">
                    <span className="bg-cyan-500 text-slate-900 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                    User a well-lit room or hallway.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-cyan-500 text-slate-900 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                    Stand back about 2 meters (6 feet).
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-cyan-500 text-slate-900 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                    Film your child walking sideways across the screen.
                  </li>
                </ol>
              </div>
            </div>

            <div className="space-y-4 text-center">
              <h2 className="text-2xl font-bold text-white">Ready to start?</h2>
              <p className="text-slate-400 text-sm">We'll guide you through the process.</p>
              
              <button 
                onClick={startCamera}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-lg py-4 rounded-full mt-4 transition-colors shadow-lg shadow-cyan-500/25 active:scale-95 transform"
              >
                Open Camera
              </button>
            </div>
          </div>
        </div>
      )}

      {(recordingState === 'preview' || recordingState === 'recording') && (
        <div className="flex-1 relative bg-black flex flex-col justify-end">
          {/* Viewfinder Video */}
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted 
            className="absolute inset-0 w-full h-full object-cover"
          />

          {!stream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
              <span className="material-icons text-5xl text-slate-600 mb-4">no_photography</span>
              <p className="text-slate-400">Camera preview not available</p>
            </div>
          )}

          {/* Silhouette Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
            <svg viewBox="0 0 100 200" className="h-2/3 stroke-cyan-400 stroke-[2] fill-none">
              {/* Simple simple walking person wireframe for guidance */}
              <circle cx="50" cy="30" r="15" />
              <line x1="50" y1="45" x2="50" y2="100" />
              <line x1="50" y1="60" x2="20" y2="90" />
              <line x1="50" y1="60" x2="80" y2="90" />
              <line x1="50" y1="100" x2="30" y2="170" />
              <line x1="50" y1="100" x2="70" y2="170" />
            </svg>
          </div>

          {/* Guidance text */}
          {recordingState === 'preview' && (
            <div className="absolute top-20 left-0 right-0 text-center pointer-events-none">
              <p className="bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full inline-block text-sm">
                Align subject within the guidelines
              </p>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="relative z-10 w-full p-8 flex justify-center items-center bg-gradient-to-t from-black/90 via-black/50 to-transparent pb-12">
            {recordingState === 'preview' ? (
              <button 
                onClick={startRecording}
                className="w-20 h-20 bg-white rounded-full p-1 shadow-xl active:scale-90 transform transition-transform"
              >
                <div className="w-full h-full bg-red-500 rounded-full border-4 border-white" />
              </button>
            ) : (
              <button 
                onClick={stopRecording}
                className="w-20 h-20 bg-white rounded-full p-1 shadow-xl active:scale-90 transform transition-transform flex items-center justify-center"
              >
                <div className="w-8 h-8 bg-black rounded-sm" />
              </button>
            )}
          </div>
        </div>
      )}

      {recordingState === 'review' && (
        <div className="flex-1 bg-black flex flex-col">
          {/* Review Video player */}
          <div className="flex-1 relative bg-slate-900 border-b border-slate-800">
            {/* Mock video placeholder */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="material-icons text-6xl text-cyan-400 opacity-50 mb-4">play_circle_outline</span>
              <p className="text-white text-lg font-medium">Video Preview</p>
              <p className="text-slate-400 text-sm mt-1">{formatTime(timeCounter)} recorded</p>
            </div>
          </div>

          <div className="bg-slate-950 p-6 space-y-4 pb-[env(safe-area-inset-bottom)]">
            <h3 className="text-white text-center font-bold text-xl mb-6">How does it look?</h3>
            
            <button 
              onClick={handleUseVideo}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-lg py-4 rounded-2xl shadow-lg shadow-cyan-500/25 active:scale-95 transform transition-transform"
            >
              Use This Video
            </button>
            
            <button 
              onClick={() => { setRecordingState('preview'); startCamera(); }}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg py-4 rounded-2xl active:scale-95 transform transition-transform"
            >
              Retake
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
