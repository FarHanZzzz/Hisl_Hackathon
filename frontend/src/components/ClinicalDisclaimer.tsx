/**
 * Clinical Accuracy Disclaimer Component
 * 
 * Displays important information about the screening nature of the analysis,
 * accuracy limitations, and recommended next steps.
 * 
 * Based on research validation studies:
 * - MediaPipe Pose: ±18.83° absolute error vs. VICON (PMC11399566)
 * - IC-normalized: <5° error
 * - Symmetry Index: ICC >0.80 (MDPI 2023)
 */

import React, { useState } from 'react';

interface ClinicalDisclaimerProps {
  diagnosisResult: string;
  isHighRisk: boolean;
  detectionRate: number;
  symmetryIndex: number;
}

export const ClinicalDisclaimer: React.FC<ClinicalDisclaimerProps> = ({
  diagnosisResult,
  isHighRisk,
  detectionRate,
  symmetryIndex,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getRecommendationText = () => {
    if (detectionRate < 50) {
      return {
        title: 'Insufficient Data Quality',
        message: 'The video analysis did not capture enough clear frames for reliable assessment. Please record a new video ensuring the child\'s full body is visible throughout the walking sequence.',
        action: 'Record New Video',
        urgency: 'info'
      };
    }
    
    if (isHighRisk) {
      return {
        title: 'Specialist Referral Recommended',
        message: 'This screening has identified gait patterns that may indicate an underlying condition. A comprehensive evaluation by a pediatric orthopedic specialist or pediatric neurologist is recommended for proper diagnosis and treatment planning.',
        action: 'Download Referral Report',
        urgency: 'high'
      };
    }
    
    return {
      title: 'Continue Routine Monitoring',
      message: 'This screening did not detect significant gait abnormalities. Continue routine pediatric check-ups and monitor for any changes in walking pattern.',
      action: 'Schedule Follow-up',
      urgency: 'low'
    };
  };

  const recommendation = getRecommendationText();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 my-4">
      {/* Header - Always Visible */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${
            recommendation.urgency === 'high' ? 'bg-red-500' :
            recommendation.urgency === 'info' ? 'bg-yellow-500' :
            'bg-green-500'
          }`} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            ⚠️ Clinical Accuracy Information
          </h3>
        </div>
        <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Screening Disclaimer */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              📋 Screening Tool - Not for Diagnosis
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              This system uses AI-powered video analysis for <strong>screening purposes only</strong>. 
              It is <strong>NOT</strong> a diagnostic tool and should not replace professional medical 
              evaluation. Positive screenings require confirmation with instrumented 3D gait analysis.
            </p>
          </div>

          {/* Accuracy Metrics */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                📊 Measurement Accuracy
              </h4>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>
                  <span className="font-medium">Symmetry Index:</span> ICC &gt;0.80 (Highly Reliable)
                </li>
                <li>
                  <span className="font-medium">Knee Valgus (IC-normalized):</span> &lt;5° error
                </li>
                <li>
                  <span className="font-medium">Knee Flexion/Extension:</span> ±5.88° MAE
                </li>
                <li>
                  <span className="font-medium">Detection Rate:</span> {detectionRate.toFixed(1)}% 
                  {detectionRate >= 50 ? ' ✅' : ' ⚠️'}
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                🔬 Research Validation
              </h4>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                <li>• PMC11399566 (2024) - MediaPipe validation</li>
                <li>• MDPI Sensors 2023 - Symmetry Index analysis</li>
                <li>• MDPI JCM 2025 - Scoliosis screening thresholds</li>
                <li>• POSNA Guidelines - Pediatric normative data</li>
              </ul>
            </div>
          </div>

          {/* Your Results */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              📈 Your Analysis Results
            </h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Symmetry Index</span>
                <p className={`text-lg font-bold ${
                  symmetryIndex >= 0.85 && symmetryIndex <= 1.15 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {symmetryIndex.toFixed(2)}
                </p>
                <span className="text-xs text-gray-500">Normal: 0.85-1.15</span>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Detection Rate</span>
                <p className={`text-lg font-bold ${
                  detectionRate >= 50 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {detectionRate.toFixed(1)}%
                </p>
                <span className="text-xs text-gray-500">Minimum: 50%</span>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Classification</span>
                <p className={`text-lg font-bold ${
                  isHighRisk ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                }`}>
                  {diagnosisResult.replace(/_/g, ' ').toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className={`rounded-lg p-4 ${
            recommendation.urgency === 'high' ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500' :
            recommendation.urgency === 'info' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500' :
            'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500'
          }`}>
            <h4 className={`font-semibold mb-2 ${
              recommendation.urgency === 'high' ? 'text-red-900 dark:text-red-100' :
              recommendation.urgency === 'info' ? 'text-yellow-900 dark:text-yellow-100' :
              'text-green-900 dark:text-green-100'
            }`}>
              {recommendation.title}
            </h4>
            <p className={`text-sm mb-3 ${
              recommendation.urgency === 'high' ? 'text-red-800 dark:text-red-200' :
              recommendation.urgency === 'info' ? 'text-yellow-800 dark:text-yellow-200' :
              'text-green-800 dark:text-green-200'
            }`}>
              {recommendation.message}
            </p>
            <button className={`px-4 py-2 rounded-md font-medium text-white ${
              recommendation.urgency === 'high' ? 'bg-red-600 hover:bg-red-700' :
              recommendation.urgency === 'info' ? 'bg-yellow-600 hover:bg-yellow-700' :
              'bg-green-600 hover:bg-green-700'
            }`}>
              {recommendation.action}
            </button>
          </div>

          {/* Important Limitations */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4">
            <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
              ⚠️ Important Limitations
            </h4>
            <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
              <li>
                • MediaPipe Pose shows ±6-19° absolute error compared to gold-standard 3D motion capture (VICON)
              </li>
              <li>
                • Relative measurements (ROM, symmetry index) are more reliable than absolute angles
              </li>
              <li>
                • Results may vary based on video quality, lighting, and clothing
              </li>
              <li>
                • Not validated for surgical planning or medicolegal purposes
              </li>
            </ul>
          </div>

          {/* References */}
          <div className="text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="font-semibold mb-1">Research References:</p>
            <ul className="space-y-1">
              <li>1. PMC11399566 (2024). Reliability and validity of knee valgus angle calculation using MediaPipe Pose.</li>
              <li>2. MDPI Sensors 2023. A Comparative Analysis of Symmetry Indices for Spatiotemporal Gait Parameters.</li>
              <li>3. MDPI Journal of Clinical Medicine 2025. Clinical and Topographic Screening for Scoliosis in Children.</li>
              <li>4. POSNA Study Guide. Genu Valgum (Knock Knee) - Pediatric Orthopaedic Society of North America.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicalDisclaimer;
