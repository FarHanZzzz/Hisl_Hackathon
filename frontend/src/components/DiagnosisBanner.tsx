import { CheckCircle, AlertTriangle, HelpCircle, AlertOctagon } from 'lucide-react';
import type { DiagnosisType } from '../types';

interface Props {
  diagnosis: DiagnosisType;
  message: string;
  confidence: number;
  symmetryIndex: number;
  detectionRate?: number;
}

const STYLES: Record<DiagnosisType, { bg: string; border: string; text: string; badge: string }> = {
  normal: {
    bg: 'bg-success-50',
    border: 'border-success-500',
    text: 'text-success-700',
    badge: 'bg-success-500',
  },
  high_risk: {
    bg: 'bg-danger-50',
    border: 'border-danger-500',
    text: 'text-danger-700',
    badge: 'bg-danger-500',
  },
  insufficient_data: {
    bg: 'bg-warning-50',
    border: 'border-warning-500',
    text: 'text-warning-600',
    badge: 'bg-warning-500',
  },
};

const ICONS: Record<DiagnosisType, React.ReactNode> = {
  normal: <CheckCircle className="w-10 h-10 text-success-500" />,
  high_risk: <AlertTriangle className="w-10 h-10 text-danger-500" />,
  insufficient_data: <HelpCircle className="w-10 h-10 text-warning-500" />,
};

const LABELS: Record<DiagnosisType, string> = {
  normal: 'NORMAL',
  high_risk: 'HIGH RISK',
  insufficient_data: 'INSUFFICIENT DATA',
};

export function DiagnosisBanner({ diagnosis, message, confidence, symmetryIndex, detectionRate }: Props) {
  const style = STYLES[diagnosis];

  return (
    <div className="space-y-4">
      <div className={`rounded-xl p-6 border-l-4 ${style.bg} ${style.border}`}>
        <div className="flex items-start gap-4">
          <div className="mt-0.5 flex-shrink-0">{ICONS[diagnosis]}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold text-white ${style.badge}`}>
                {LABELS[diagnosis]}
              </span>
              <span className={`text-sm font-medium ${style.text}`}>
                SI = {symmetryIndex.toFixed(2)}
              </span>
            </div>
            <p className={`text-sm ${style.text} mb-3`}>{message}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Confidence: <strong>{(confidence * 100).toFixed(0)}%</strong></span>
              {detectionRate !== undefined && (
                <span>Detection Rate: <strong>{detectionRate.toFixed(1)}%</strong></span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory HIGH RISK alert */}
      {diagnosis === 'high_risk' && (
        <div className="bg-danger-50 border border-danger-500 rounded-xl p-4 flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-danger-700">Clinical Referral Recommended</p>
            <p className="text-xs text-danger-600 mt-1">
              Please refer for specialist evaluation. Significant gait asymmetry detected.
              This result should be verified through clinical observation by a qualified professional.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
