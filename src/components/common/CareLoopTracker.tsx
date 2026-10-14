import React from 'react';
import type { CareLoopStage } from '../../types';
import { Stethoscope, FileText, ArrowUpRight, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface CareLoopTrackerProps {
  currentStage: CareLoopStage;
  isClosed?: boolean;
  outstandingTask?: string;
  outstandingOwner?: string;
  onStepClick?: (stage: CareLoopStage) => void;
}

export const CareLoopTracker: React.FC<CareLoopTrackerProps> = ({
  currentStage,
  isClosed = false,
  outstandingTask,
  outstandingOwner,
  onStepClick
}) => {
  const { t } = useLanguage();

  const stages: { stage: CareLoopStage; label: string; icon: React.ElementType }[] = [
    { stage: 'detect', label: t.loopStageDetect, icon: Stethoscope },
    { stage: 'explain', label: t.loopStageExplain, icon: FileText },
    { stage: 'prioritize', label: t.loopStagePrioritize, icon: ArrowUpRight },
    { stage: 'coordinate', label: t.loopStageCoordinate, icon: Truck },
    { stage: 'follow_through', label: t.loopStageFollowThrough, icon: CheckCircle2 }
  ];

  const stageOrder: Record<CareLoopStage, number> = {
    detect: 1,
    explain: 2,
    prioritize: 3,
    coordinate: 4,
    follow_through: 5
  };

  const currentLevel = isClosed ? 6 : stageOrder[currentStage];

  return (
    <div className="w-full card-base p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] animate-pulse" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Continuous Care Loop
          </h3>
        </div>
        {isClosed ? (
          <span className="badge-stable text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Loop Closed & Documented
          </span>
        ) : (
          <span className="badge-warning text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> Active Loop in Progress
          </span>
        )}
      </div>

      {/* 5-step visual pipeline */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-3">
        {stages.map((item, idx) => {
          const stepNumber = idx + 1;
          const isCompleted = stepNumber < currentLevel || isClosed;
          const isCurrent = stepNumber === currentLevel && !isClosed;
          const isUpcoming = stepNumber > currentLevel;

          const IconComponent = item.icon;

          return (
            <button
              key={item.stage}
              type="button"
              onClick={() => onStepClick?.(item.stage)}
              className={`flex flex-col items-center p-2 rounded-xl border transition-all text-center relative ${
                isCurrent
                  ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-bold shadow-xs'
                  : isCompleted
                  ? 'border-[var(--border-main)] bg-[var(--sev-stable-bg)] text-[var(--sev-stable)]'
                  : 'border-[var(--border-main)] opacity-50 text-[var(--text-muted)]'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 text-xs font-bold ${
                  isCurrent
                    ? 'bg-[var(--primary)] text-white'
                    : isCompleted
                    ? 'bg-[var(--sev-stable)] text-white'
                    : 'bg-black/10 dark:bg-white/10'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <IconComponent className="w-3.5 h-3.5" />}
              </div>
              <span className="text-[11px] sm:text-xs leading-tight line-clamp-1">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Outstanding blocker banner */}
      {!isClosed && outstandingTask && (
        <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-[var(--sev-warning)] font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              <strong>Outstanding:</strong> {outstandingTask}
            </span>
          </div>
          {outstandingOwner && (
            <span className="text-[var(--text-muted)] font-semibold shrink-0 bg-white/50 dark:bg-black/30 px-2 py-0.5 rounded-md border border-[var(--border-main)]">
              Owner: {outstandingOwner}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
