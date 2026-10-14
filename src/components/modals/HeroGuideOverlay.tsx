import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Zap, 
  CheckCircle2, 
  HelpCircle,
  Stethoscope
} from 'lucide-react';
import { useHeroDemo, HERO_STEPS } from '../../context/HeroDemoContext';
import { useAuth } from '../../context/AuthContext';
import { useNetwork } from '../../context/NetworkContext';
import confetti from 'canvas-confetti';

interface HeroGuideOverlayProps {
  onNavigate: (view: any) => void;
  onOpenAddReading?: (patientId: string) => void;
  onSelectPatient?: (patientId: string) => void;
}

export const HeroGuideOverlay: React.FC<HeroGuideOverlayProps> = ({
  onNavigate,
  onOpenAddReading,
  onSelectPatient
}) => {
  const { isActive, currentStep, currentStepInfo, nextStep, prevStep, stopDemo } = useHeroDemo();
  const { switchRole } = useAuth();
  const { toggleSimulateOffline, isSimulatedOffline, syncNow } = useNetwork();

  if (!isActive) return null;

  // Auto-execute helper for hackathon judges to effortlessly see the end-to-end loop
  const handleAutoExecute = async () => {
    switch (currentStep) {
      case 1:
        // Step 1: Go Offline
        if (!isSimulatedOffline) {
          toggleSimulateOffline();
        }
        onNavigate('dashboard');
        nextStep();
        break;

      case 2:
        // Step 2: Open Lakshmi Devi and open Add Reading
        switchRole('nurse');
        onSelectPatient?.('PT-101');
        onNavigate('patient-detail');
        onOpenAddReading?.('PT-101');
        nextStep();
        break;

      case 3:
        // Step 3: Inspect Alert
        onSelectPatient?.('PT-101');
        onNavigate('patient-detail');
        nextStep();
        break;

      case 4:
        // Step 4: Request Senior Review
        onSelectPatient?.('PT-101');
        onNavigate('patient-detail');
        nextStep();
        break;

      case 5:
        // Step 5: Doctor Review & Decision
        switchRole('doctor');
        onNavigate('escalations');
        nextStep();
        break;

      case 6:
        // Step 6: View Offline Referral & SMS Fallback
        switchRole('nurse');
        onNavigate('referrals');
        nextStep();
        break;

      case 7:
        // Step 7: Go online & sync
        if (isSimulatedOffline) {
          toggleSimulateOffline();
        }
        await syncNow();
        nextStep();
        break;

      case 8:
        // Step 8: Switch to Hospital role & Accept
        switchRole('hospital');
        onNavigate('referrals');
        nextStep();
        break;

      case 9:
        // Step 9: Hospital Handover
        switchRole('hospital');
        onNavigate('referrals');
        nextStep();
        break;

      case 10:
        // Step 10: Record Outcome & Follow-Up Task
        switchRole('hospital');
        onNavigate('referrals');
        try {
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
        } catch (e) {}
        nextStep();
        break;

      case 11:
        // Step 11: District Manager View
        switchRole('manager');
        onNavigate('manager');
        try {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        } catch (e) {}
        break;
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-[440px] z-40 animate-slideUp">
      <div className="card-base p-4 sm:p-5 border-2 border-indigo-500/40 shadow-2xl bg-[var(--bg-surface)] backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Hero Scenario Walkthrough ({currentStep} of {HERO_STEPS.length})
            </span>
          </div>
          <button
            type="button"
            onClick={stopDemo}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            title="Exit Demo Guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Title & Instruction */}
        <div className="mb-3">
          <h3 className="text-sm font-extrabold text-[var(--text-main)] mb-1">
            {currentStepInfo.title}
          </h3>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            {currentStepInfo.instruction}
          </p>
        </div>

        {/* Role & Action Hint Box */}
        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 mb-3 text-xs flex flex-col gap-1">
          <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-300 font-semibold">
            <span>Required Role: <strong>{currentStepInfo.role}</strong></span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-indigo-200 dark:bg-indigo-900">
              Target: {currentStepInfo.targetView}
            </span>
          </div>
          <div className="text-[11px] text-indigo-900/80 dark:text-indigo-200/80 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{currentStepInfo.actionHint}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="p-2 rounded-xl border border-[var(--border-main)] text-[var(--text-muted)] disabled:opacity-30 cursor-pointer"
              title="Previous Step"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextStep}
              disabled={currentStep === HERO_STEPS.length}
              className="p-2 rounded-xl border border-[var(--border-main)] text-[var(--text-muted)] disabled:opacity-30 cursor-pointer"
              title="Next Step"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutoExecute}
              className="btn-primary !py-1.5 !px-3 text-xs font-bold !bg-indigo-600 hover:!bg-indigo-700 shadow-md flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>Auto-Advance</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
