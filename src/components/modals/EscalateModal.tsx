import React, { useState } from 'react';
import { X, ArrowUpRight, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { generateSbarSummary } from '../../rules/rulesEngine';
import { localDb } from '../../db/localDb';
import { syncService } from '../../db/syncService';
import { useAuth } from '../../context/AuthContext';
import { useNetwork } from '../../context/NetworkContext';
import type { Patient, Reading, Alert, Escalation } from '../../types';

interface EscalateModalProps {
  patient: Patient;
  latestReading?: Reading;
  activeAlert?: Alert;
  isOpen: boolean;
  onClose: () => void;
  onEscalated: (escalation: Escalation) => void;
}

export const EscalateModal: React.FC<EscalateModalProps> = ({
  patient,
  latestReading,
  activeAlert,
  isOpen,
  onClose,
  onEscalated
}) => {
  const { profile } = useAuth();
  const { isOnline } = useNetwork();

  const [urgency, setUrgency] = useState<'routine' | 'urgent' | 'emergency'>('urgent');
  const [nurseNote, setNurseNote] = useState<string>('Severe headache and high blood pressure. Need clinical evaluation for transfer.');

  if (!isOpen) return null;

  // Auto-generate SBAR draft using deterministic template generator
  const generatedSbar = generateSbarSummary(
    patient,
    latestReading || {
      id: 'mock',
      patientId: patient.id,
      timestamp: new Date().toISOString(),
      actor: profile.name,
      actorRole: profile.title,
      facility: profile.facility,
      bpSystolic: 160,
      bpDiastolic: 110,
      pulse: 88,
      temperature: 37.0,
      spo2: 98,
      symptoms: ['severe_headache'],
      severity: 'critical',
      triggeredRules: ['RULE-CRIT-01'],
      deviceOnline: true
    },
    activeAlert || {
      id: 'mock-alt',
      patientId: patient.id,
      readingId: 'mock',
      timestamp: new Date().toISOString(),
      severity: 'critical',
      ruleName: 'Severe Preeclampsia Warning',
      triggerSummary: 'BP 160/110 with Severe Headache',
      plainExplanation: 'High risk of eclamptic convulsion.',
      acknowledged: false
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const escalation: Escalation = {
      id: `ESC-${Date.now()}`,
      patientId: patient.id,
      alertId: activeAlert?.id || `ALT-MANUAL-${Date.now()}`,
      requestedBy: profile.name,
      requestedAt: new Date().toISOString(),
      urgency,
      nurseNote,
      attachedVitals: {
        bp: latestReading ? `${latestReading.bpSystolic}/${latestReading.bpDiastolic}` : '160/110',
        pulse: latestReading ? latestReading.pulse : 88,
        spo2: latestReading ? latestReading.spo2 : 98,
        temp: latestReading ? latestReading.temperature : 37.0,
        symptoms: latestReading ? latestReading.symptoms : ['severe_headache']
      },
      sbar: generatedSbar,
      status: 'pending'
    };

    // Save escalation
    await localDb.escalations.add(escalation);

    // Update patient stage to prioritize
    await localDb.patients.update(patient.id, {
      loopStage: 'prioritize',
      outstandingTask: `Senior Doctor Review (${urgency.toUpperCase()})`,
      outstandingOwner: 'Dr. Arun (PHC)'
    });

    // Enqueue sync item
    await syncService.enqueueAction({
      user: profile.name,
      device: `${profile.title} Device`,
      action: `Escalated Senior Review for ${patient.name}`,
      entityType: 'escalation',
      payload: escalation
    });

    // Audit Log
    const auditEntry = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: profile.name,
      role: profile.title,
      facility: profile.facility,
      action: `Requested Senior Review (${urgency.toUpperCase()})`,
      patientId: patient.id,
      patientName: patient.name,
      details: `Generated SBAR draft and dispatched to Dr. Arun at PHC. Nurse note: "${nurseNote}"`,
      online: isOnline,
      device: `${profile.title} Device`
    };
    await localDb.auditLogs.add(auditEntry);

    onEscalated(escalation);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
      <div className="card-base w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-5 border-b border-[var(--border-main)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center font-bold">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[var(--text-main)]">
                Request Senior Doctor Review
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Escalates case to Dr. Arun at Shanti Puram PHC
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

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Patient Header */}
          <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] flex items-center justify-between">
            <div>
              <span className="font-bold text-[var(--text-main)] text-sm">{patient.name}</span>
              <p className="text-[11px] text-[var(--text-muted)]">
                Gestation: {patient.gestationWeeks} weeks • Parity: {patient.parity} • Village: {patient.village}
              </p>
            </div>
            <span className="badge-critical text-xs px-2.5 py-1 rounded-lg font-bold">
              BP {latestReading ? `${latestReading.bpSystolic}/${latestReading.bpDiastolic}` : '160/110'}
            </span>
          </div>

          {/* Urgency selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Select Escalation Urgency
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['routine', 'urgent', 'emergency'] as const).map((level) => {
                const isSelected = urgency === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setUrgency(level)}
                    className={`py-2 px-3 rounded-xl border font-bold capitalize transition-all ${
                      isSelected
                        ? level === 'emergency'
                          ? 'bg-red-500 text-white border-red-500 shadow-md'
                          : level === 'urgent'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                          : 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-md'
                        : 'border-[var(--border-main)] bg-[var(--bg-main)] text-[var(--text-main)] hover:border-[var(--primary)]'
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nurse's Clinical Note */}
          <div>
            <label htmlFor="nurse-escalate-note" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Nurse's Note to Doctor
            </label>
            <textarea
              id="nurse-escalate-note"
              rows={3}
              value={nurseNote}
              onChange={(e) => setNurseNote(e.target.value)}
              placeholder="Add key context, e.g. headache severity, fetal heart audible, patient anxiety..."
              className="w-full p-3 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] text-xs text-[var(--text-main)] outline-none focus:border-[var(--primary)]"
              required
            />
          </div>

          {/* SBAR Preview accordion */}
          <div className="p-3.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--text-main)] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[var(--primary)]" /> Auto-Generated SBAR Draft (Deterministic)
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">Draft - clinician must review</span>
            </div>
            <div className="space-y-1 text-[11px] text-[var(--text-muted)] border-t border-[var(--border-main)] pt-2">
              <p><strong>S (Situation):</strong> {generatedSbar.situation}</p>
              <p><strong>B (Background):</strong> {generatedSbar.background}</p>
              <p><strong>A (Assessment):</strong> {generatedSbar.assessment}</p>
              <p><strong>R (Recommendation):</strong> {generatedSbar.recommendation}</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs font-bold"
            >
              Dispatch SBAR to Doctor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
