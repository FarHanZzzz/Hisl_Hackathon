import React from 'react';

interface VisualLocalizationProps {
    leftMaxFlexion: number;
    rightMaxFlexion: number;
    isHighRisk: boolean;
    observation?: string;
}

export function VisualLocalization({ leftMaxFlexion, rightMaxFlexion, isHighRisk, observation }: VisualLocalizationProps) {
    const diff = Math.abs(leftMaxFlexion - rightMaxFlexion);
    const dominantSide = leftMaxFlexion > rightMaxFlexion ? 'left' : 'right';

    // Auto-generate observation if not provided
    const defaultObservation = diff > 10
        ? `Reduced flexion observed in the ${dominantSide === 'left' ? 'right' : 'left'} leg (${Math.round(Math.min(leftMaxFlexion, rightMaxFlexion))}°), with ${Math.round(diff)}° difference from the ${dominantSide} leg. This asymmetry may indicate muscular guarding, joint restriction, or compensatory gait patterns.`
        : `Both knees demonstrate relatively balanced flexion patterns (L: ${Math.round(leftMaxFlexion)}° / R: ${Math.round(rightMaxFlexion)}°). Symmetry appears within acceptable clinical range.`;

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                    Visual Localization
                </h3>
            </div>

            <div className="p-6 flex-1 flex flex-col">
                {/* Anatomical SVG Diagram */}
                <div className="relative bg-gray-50 dark:bg-gray-800/50 rounded-xl flex justify-center items-center overflow-hidden flex-1 min-h-[320px]">
                    {/* SVG Skeleton Legs */}
                    <svg viewBox="0 0 300 400" className="h-full max-h-[320px] w-auto" xmlns="http://www.w3.org/2000/svg">
                        {/* Body/Pelvis */}
                        <ellipse cx="150" cy="60" rx="55" ry="20" fill="none" stroke="#cbd5e1" strokeWidth="2" opacity="0.5" />

                        {/* LEFT LEG */}
                        {/* Hip to Knee */}
                        <line x1="125" y1="70" x2="110" y2="190" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" />
                        {/* Knee to Ankle */}
                        <line x1="110" y1="190" x2="95" y2="340" stroke="#94a3b8" strokeWidth="7" strokeLinecap="round" />
                        {/* Foot */}
                        <line x1="95" y1="340" x2="75" y2="370" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
                        <line x1="75" y1="370" x2="60" y2="375" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />

                        {/* Hip joint */}
                        <circle cx="125" cy="70" r="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />

                        {/* LEFT KNEE JOINT — pulsing indicator */}
                        <circle cx="110" cy="190" r="14" fill="#ef4444" opacity="0.15">
                            <animate attributeName="r" values="14;22;14" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.15;0.05;0.15" dur="2s" repeatCount="indefinite" />
                        </circle>
                        <circle cx="110" cy="190" r="8" fill="#ef4444" stroke="white" strokeWidth="2" />

                        {/* Ankle joint */}
                        <circle cx="95" cy="340" r="6" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />

                        {/* Muscle hint - thigh */}
                        <ellipse cx="118" cy="130" rx="12" ry="45" fill="none" stroke="#fca5a5" strokeWidth="1" opacity="0.4" />
                        {/* Muscle hint - calf */}
                        <ellipse cx="103" cy="265" rx="9" ry="35" fill="none" stroke="#fca5a5" strokeWidth="1" opacity="0.4" />

                        {/* RIGHT LEG */}
                        {/* Hip to Knee */}
                        <line x1="175" y1="70" x2="190" y2="195" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" />
                        {/* Knee to Ankle */}
                        <line x1="190" y1="195" x2="205" y2="340" stroke="#94a3b8" strokeWidth="7" strokeLinecap="round" />
                        {/* Foot */}
                        <line x1="205" y1="340" x2="225" y2="370" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
                        <line x1="225" y1="370" x2="240" y2="375" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />

                        {/* Hip joint */}
                        <circle cx="175" cy="70" r="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />

                        {/* RIGHT KNEE JOINT — static indicator */}
                        <circle cx="190" cy="195" r="8" fill="#94a3b8" stroke="white" strokeWidth="2" />

                        {/* Ankle joint */}
                        <circle cx="205" cy="340" r="6" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />

                        {/* Muscle hint - thigh */}
                        <ellipse cx="182" cy="133" rx="12" ry="45" fill="none" stroke="#cbd5e1" strokeWidth="1" opacity="0.4" />
                        {/* Muscle hint - calf */}
                        <ellipse cx="197" cy="268" rx="9" ry="35" fill="none" stroke="#cbd5e1" strokeWidth="1" opacity="0.4" />

                        {/* Angle arc indicators */}
                        {/* Left knee angle arc */}
                        <path d="M 110 170 A 20 20 0 0 1 98 200" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 2" />
                        {/* Right knee angle arc */}
                        <path d="M 190 175 A 20 20 0 0 0 202 205" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 2" />
                    </svg>

                    {/* L-LIMIT Label */}
                    <div className="absolute top-[46%] left-2 sm:left-4">
                        <div className="bg-white dark:bg-gray-900 border-2 border-red-500 px-2 py-1 rounded shadow-sm">
                            <span className="text-[10px] font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                                L-LIMIT: {leftMaxFlexion.toFixed(1)}°
                            </span>
                        </div>
                    </div>

                    {/* R-LIMIT Label */}
                    <div className="absolute top-[48%] right-2 sm:right-4">
                        <div className="bg-white dark:bg-gray-900 border-2 border-gray-400 px-2 py-1 rounded shadow-sm">
                            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                R-LIMIT: {rightMaxFlexion.toFixed(1)}°
                            </span>
                        </div>
                    </div>
                </div>

                {/* Observation Box */}
                <div className="mt-4">
                    <div className={`p-3 rounded border-l-4 ${isHighRisk
                            ? 'bg-red-50 dark:bg-red-950/30 border-red-500'
                            : 'bg-green-50 dark:bg-green-950/30 border-green-500'
                        }`}>
                        <p className={`text-xs font-bold uppercase ${isHighRisk ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                            }`}>
                            Observation
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                            {observation || defaultObservation}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
