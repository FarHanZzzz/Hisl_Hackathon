import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { STATUS, Step } from 'react-joyride';

// @ts-ignore
const Joyride = dynamic(() => import('react-joyride').then((mod: any) => mod.default || mod), { ssr: false }) as any;

export function PatientOnboarding() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Check if onboarding was already completed
    const hasCompleted = localStorage.getItem('onboarding_completed');
    if (!hasCompleted) {
      // Add a slight delay so elements map and mount correctly
      const timer = setTimeout(() => {
        setRun(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const steps: Step[] = [
    {
      target: '#tour-welcome',
      content: "Welcome to Pedi-Growth! This is your dashboard where you can track your child's progress.",
    },
    {
      target: '#tour-record',
      content: "To begin, tap here. You'll need your smartphone camera.",
    },
    {
      target: '#tour-setup',
      content: "Make sure the room is well-lit. Record your child walking towards the camera for at least 5 seconds.",
    }
  ];

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('onboarding_completed', 'true');
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous={true}
      run={run}
      scrollToFirstStep={true}
      showProgress={false}
      showSkipButton={true}
      steps={steps}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#0ea5e9', // cyan-500
          backgroundColor: '#1e293b', // slate-800
          textColor: '#f8fafc', // slate-50
          arrowColor: '#1e293b',
          overlayColor: 'rgba(2, 6, 23, 0.75)'
        },
        tooltipContainer: {
          textAlign: 'left' as const,
        },
        buttonNext: {
          backgroundColor: '#0ea5e9',
          color: '#020617', // slate-950
          fontWeight: 600,
          borderRadius: '9999px',
          padding: '8px 16px',
        },
        buttonSkip: {
          color: '#94a3b8', // slate-400
        },
        buttonBack: {
          color: '#cbd5e1', // slate-300
        }
      }}
    />
  );
}
