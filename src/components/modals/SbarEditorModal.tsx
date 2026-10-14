import React, { useState } from 'react';
import { X, FileEdit, CheckCircle2, Truck, AlertCircle, HelpCircle } from 'lucide-react';
import { localDb } from '../../db/localDb';
import { syncService } from '../../db/syncService';
import { useAuth } from '../../context/AuthContext';
import { useNetwork } from '../../context/NetworkContext';
import type { Escalation, Patient } from '../../types';

interface SbarEditorModalProps {
  escalation: Escalation;
  patient?: Patient;
  isOpen: boolean;
  onClose: () => void;
  onDecisionSaved: (escalation: Escalation) => void;
}

export const SbarEditorModal: React.FC<SbarEditorModalProps> = ({
  escalation,
  patient,
  isOpen,
  onClose,
  onDecisionSaved
}) => {
  const { profile } = useAuth();
  const { isOnline } = useNetwork();

  const [situation, setSituation] = useState<string>(escalation.sbar.situation);
  const [background, setBackground] = useState<string>(escalation.sbar.background);
  const [assessment, setAssessment] = useState<string>(escalation.sbar.assessment);
  const [recommendation, setRecommendation] = useState<string>(escalation.sbar.recommendation);
  const [doctorNote, setDoctorNote] = useState<string>(
    escalation.doctorNote || 'Emergency referral to District Hospital authorized. Give Labetalol 100mg PO stat if available. Transfer immediately via 108.'
  );
  const [decision, setDecision] = useState<'advise_monitor' | 'refer_hospital' | 'need_more_info'>('refer_hospital');

  if (!isOpen) return null;

  const handleSaveDecision = async (selectedDecision: 'advise_monitor' | 'refer_hospital' | 'need_more_info') => {
    setDecision(selectedDecision);

    const updatedEscalation: Escalation = {
      ...escalation,
      sbar: {
        situation,
        background,
        assessment,
        recommendation
      },
      status: 'reviewed',
      decision: selectedDecision,
      doctorNote,
      doctorName: profile.name,
      reviewedAt: new Date().toISOString()
    };

    // Update in local DB
    await localDb.escalations.put(updatedEscalation);

    // Update patient status
    let nextStage = patient?.loopStage || 'prioritize';
    let nextTask = 'Review Completed by Doctor';
    let nextOwner = 'Nurse Meena';

    if (selectedDecision === 'refer_hospital') {
      nextStage = 'coordinate';
      nextTask = 'Create Structured Referral & Arrange 108 Ambulance';
      nextOwner = 'Nurse Meena / Dr. Arun';
    } else if (selectedDecision === 'advise_monitor') {
      nextStage = 'follow_through';
      nextTask = 'Recheck Vitals in 2 Hours';
      nextOwner = 'Nurse Meena';
    } else {
      nextTask = 'Gather Additional Clinical Details';
      nextOwner = 'Nurse Meena';
    }

    if (patient) {
      await localDb.patients.update(patient.id, {
        loopStage: nextStage,
        outstandingTask: nextTask,
        outstandingOwner: nextOwner
      });
    }

    // Sync queue
    await syncService.enqueueAction({
      user: profile.name,
      device: `${profile.title} Workstation`,
      action: `Doctor Decision (${selectedDecision}) for ${patient?.name || escalation.patientId}`,
      entityType: 'escalation',
      payload: updatedEscalation
    });

    // Audit Log
    const auditEntry = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: profile.name,
      role: profile.title,
      facility: profile.facility,
      action: `Escalation Decision: ${selectedDecision.toUpperCase()}`,
      patientId: escalation.patientId,
      patientName: patient?.name,
      details: `Doctor Note: "${doctorNote}". SBAR assessment finalized.`,
      online: isOnline,
      device: `${profile.title} Workstation`
    };
    await localDb.auditLogs.add(auditEntry);

    onDecisionSaved(updatedEscalation);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
      <div className="card-base w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-main)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[var(--text-main)]">
                Senior Doctor Clinical Review (SBAR)
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Requested by: {escalation.requestedBy} • Urgency: <strong>{escalation.urgency.toUpperCase()}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Patient Vitals Card */}
          <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-bold text-sm text-[var(--text-main)]">{patient?.name || escalation.patientId}</span>
              <p className="text-[11px] text-[var(--text-muted)]">
                Nurse Note: "{escalation.nurseNote}"
              </p>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="badge-critical px-2 py-0.5 rounded font-bold">
                BP {escalation.attachedVitals.bp}
              </span>
              <span className="badge-stable px-2 py-0.5 rounded font-bold">
                Pulse {escalation.attachedVitals.pulse} bpm
              </span>
              <span className="badge-stable px-2 py-0.5 rounded font-bold">
                SpO2 {escalation.attachedVitals.spo2}%
              </span>
            </div>
          </div>

          {/* SBAR Editor Fields */}
          <div className="space-y-3">
            <div>
              <label htmlFor="sbar-situation" className="block text-xs font-bold text-[var(--primary)] mb-1">
                S - Situation (Current concern & danger signs)
              </label>
              <textarea
                id="sbar-situation"
                rows={2}
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] text-xs text-[var(--text-main)] outline-none"
              />
            </div>

            <div>
              <label htmlFor="sbar-background" className="block text-xs font-bold text-[var(--primary)] mb-1">
                B - Background (Obstetric history & baseline)
              </label>
              <textarea
                id="sbar-background"
                rows={2}
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] text-xs text-[var(--text-main)] outline-none"
              />
            </div>

            <div>
              <label htmlFor="sbar-assessment" className="block text-xs font-bold text-[var(--primary)] mb-1">
                A - Assessment (Clinical risk evaluation)
              </label>
              <textarea
                id="sbar-assessment"
                rows={2}
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] text-xs text-[var(--text-main)] outline-none"
              />
            </div>

            <div>
              <label htmlFor="sbar-recommendation" className="block text-xs font-bold text-[var(--primary)] mb-1">
                R - Recommendation (Action plan)
              </label>
              <textarea
                id="sbar-recommendation"
                rows={2}
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] text-xs text-[var(--text-main)] outline-none"
              />
            </div>

            <div>
              <label htmlFor="doctor-clinical-directive" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Doctor's Directive / Specific Orders for Nurse
              </label>
              <textarea
                id="doctor-clinical-directive"
                rows={2}
                value={doctorNote}
                onChange={(e) => setDoctorNote(e.target.value)}
                placeholder="Enter clinical instructions or transfer clearance..."
                className="w-full p-2.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] text-xs text-[var(--text-main)] outline-none"
              />
            </div>
          </div>

          {/* Doctor Decisions */}
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
              Select Clinical Decision
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSaveDecision('refer_hospital')}
                className="btn-primary text-xs font-bold !bg-red-600 hover:!bg-red-700 text-white flex flex-col items-center justify-center p-3 text-center"
              >
                <Truck className="w-5 h-5 mb-1" />
                <span>Refer to Hospital (108)</span>
                <span className="text-[10px] font-normal opacity-90 mt-0.5">Emergency obstetric transfer</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveDecision('advise_monitor')}
                className="btn-secondary text-xs font-bold border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 flex flex-col items-center justify-center p-3 text-center"
              >
                <CheckCircle2 className="w-5 h-5 mb-1" />
                <span>Advise &amp; Monitor</span>
                <span className="text-[10px] font-normal text-[var(--text-muted)] mt-0.5">Protocol at Sub-Centre</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveDecision('need_more_info')}
                className="btn-secondary text-xs font-bold border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 flex flex-col items-center justify-center p-3 text-center"
              >
                <HelpCircle className="w-5 h-5 mb-1" />
                <span>Need More Info</span>
                <span className="text-[10px] font-normal text-[var(--text-muted)] mt-0.5">Repeat BP or urine dipstick</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--border-main)] bg-black/5 dark:bg-white/5 flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>Dr. Arun (Medical Officer) • Shanti Puram PHC</span>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs !py-1 !px-3"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
