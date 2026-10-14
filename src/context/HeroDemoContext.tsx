import React, { createContext, useContext, useState } from 'react';

export interface HeroStepInfo {
  step: number;
  title: string;
  role: string;
  instruction: string;
  targetView: string;
  actionHint: string;
}

export const HERO_STEPS: HeroStepInfo[] = [
  {
    step: 1,
    title: '1. Simulate Rural Offline Mode',
    role: 'Nurse Meena',
    instruction: 'Rural sub-centres regularly lose cellular connectivity. Toggle "Simulate Offline" to demonstrate offline-first operation.',
    targetView: 'dashboard',
    actionHint: 'Click "Simulate Offline" in the top status bar'
  },
  {
    step: 2,
    title: '2. Record Danger Signs for Lakshmi Devi',
    role: 'Nurse Meena',
    instruction: 'Lakshmi Devi (34w, G1P0) arrives complaining of a severe headache. Enter Blood Pressure 160/110 mmHg and check "Severe Headache".',
    targetView: 'patient',
    actionHint: 'Open Lakshmi Devi and tap "+ Add Reading"'
  },
  {
    step: 3,
    title: '3. Explain Clinical Trigger (MEOWS)',
    role: 'Nurse Meena',
    instruction: 'The offline rules engine detects severe pre-eclampsia warning (BP >=160/110 + headache). Review the plain-language clinical explanation.',
    targetView: 'patient',
    actionHint: 'Acknowledge the Critical Red alert banner'
  },
  {
    step: 4,
    title: '4. Escalate for Senior Clinical Review',
    role: 'Nurse Meena',
    instruction: 'Nurse Meena cannot authorize transfer alone. Tap "Request Senior Review" with Urgent priority to generate an SBAR draft.',
    targetView: 'patient',
    actionHint: 'Tap "Request Senior Review" and submit'
  },
  {
    step: 5,
    title: '5. Doctor Review & Referral Authorization',
    role: 'Dr. Arun (PHC)',
    instruction: 'Switch to Dr. Arun. Review Lakshmi\'s SBAR escalation draft in the Senior Review inbox and select "Refer to Hospital".',
    targetView: 'escalations',
    actionHint: 'Switch role to PHC Doctor and approve referral'
  },
  {
    step: 6,
    title: '6. Offline Referral & SMS Fallback',
    role: 'Nurse Meena',
    instruction: 'Because the sub-centre is offline, the referral is saved locally with "Saved on device - NOT yet sent". Click "Send via SMS Fallback" to preview the dispatch text.',
    targetView: 'referrals',
    actionHint: 'View the offline referral badge and click "Send via SMS Fallback"'
  },
  {
    step: 7,
    title: '7. Reconnect & Two-Way Sync',
    role: 'System',
    instruction: 'Connectivity returns. Turn offline simulation OFF and click "Sync Now". Watch queued records push to the cloud database.',
    targetView: 'referrals',
    actionHint: 'Uncheck "Simulate Offline" and tap "Sync Now"'
  },
  {
    step: 8,
    title: '8. District Hospital Intake',
    role: 'Sister Priya (Hospital)',
    instruction: 'Switch to Sister Priya at Rampur District Hospital. View the incoming referral in the hospital desk and tap "Accept Referral".',
    targetView: 'referrals',
    actionHint: 'Switch to Hospital Staff and click "Accept Referral"'
  },
  {
    step: 9,
    title: '9. Ambulance Arrival & Handover',
    role: 'Sister Priya (Hospital)',
    instruction: '108 ambulance arrives with Lakshmi. Mark "Patient Arrived" and verify the bedside clinical handover checklist.',
    targetView: 'referrals',
    actionHint: 'Click "Mark Arrived" and "Handover Completed"'
  },
  {
    step: 10,
    title: '10. Document Outcome & Auto-Task',
    role: 'Sister Priya (Hospital)',
    instruction: 'Document final clinical outcome: "Treated & Stabilized (Labetalol + IV MgSO4)". An automated 48-hour ANM home follow-up task is instantly created.',
    targetView: 'referrals',
    actionHint: 'Record outcome "Treated & Stabilized"'
  },
  {
    step: 11,
    title: '11. District Manager Loop Closure',
    role: 'District Manager',
    instruction: 'Switch to District Manager. Observe how Lakshmi\'s completed care loop updates the Care Continuity Index and eliminates pipeline bottlenecks.',
    targetView: 'manager',
    actionHint: 'Switch to District Manager to inspect the KPI metrics'
  }
];

interface HeroDemoContextType {
  isActive: boolean;
  currentStep: number;
  currentStepInfo: HeroStepInfo;
  startDemo: () => void;
  stopDemo: () => void;
  nextStep: () => void;
  prevStep: () => void;
  jumpToStep: (step: number) => void;
}

const HeroDemoContext = createContext<HeroDemoContextType | undefined>(undefined);

export const HeroDemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);

  const startDemo = () => {
    setIsActive(true);
    setCurrentStep(1);
  };

  const stopDemo = () => {
    setIsActive(false);
    setCurrentStep(1);
  };

  const nextStep = () => {
    if (currentStep < HERO_STEPS.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsActive(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const jumpToStep = (step: number) => {
    if (step >= 1 && step <= HERO_STEPS.length) {
      setCurrentStep(step);
      setIsActive(true);
    }
  };

  const currentStepInfo = HERO_STEPS[currentStep - 1] || HERO_STEPS[0];

  return (
    <HeroDemoContext.Provider
      value={{
        isActive,
        currentStep,
        currentStepInfo,
        startDemo,
        stopDemo,
        nextStep,
        prevStep,
        jumpToStep
      }}
    >
      {children}
    </HeroDemoContext.Provider>
  );
};

export const useHeroDemo = (): HeroDemoContextType => {
  const context = useContext(HeroDemoContext);
  if (!context) {
    throw new Error('useHeroDemo must be used within a HeroDemoProvider');
  }
  return context;
};
