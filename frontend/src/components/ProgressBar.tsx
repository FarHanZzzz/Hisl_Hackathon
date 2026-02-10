import { Loader2 } from 'lucide-react';

interface Props {
  progress: number;    // 0.0 to 1.0
  status: string;      // "queued" | "processing" | "completed" | "failed"
  framesProcessed?: number;
}

const STATUS_LABELS: Record<string, string> = {
  queued: 'Preparing analysis...',
  processing: 'Analyzing gait patterns...',
  completed: 'Analysis complete',
  failed: 'Analysis failed',
};

export function ProgressBar({ progress, status, framesProcessed }: Props) {
  const percentage = Math.round(progress * 100);

  const bgColor = status === 'failed' ? 'bg-danger-500' :
                  status === 'completed' ? 'bg-success-500' : 'bg-primary-500';

  const glowColor = status === 'failed' ? 'shadow-danger-500/30' :
                    status === 'completed' ? 'shadow-success-500/30' : 'shadow-primary-500/30';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center gap-3">
        {['queued', 'processing'].includes(status) && (
          <Loader2 className="h-5 w-5 text-primary-500 animate-spin" />
        )}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              {STATUS_LABELS[status] || status}
            </span>
            <span className="text-sm font-bold text-gray-900">{percentage}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${bgColor} shadow-lg ${glowColor}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
      {framesProcessed !== undefined && framesProcessed > 0 && (
        <p className="text-xs text-gray-400 text-center">
          {framesProcessed} frames processed
        </p>
      )}
    </div>
  );
}
