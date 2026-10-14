import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  FileText, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { localDb } from '../db/localDb';
import { SbarEditorModal } from '../components/modals/SbarEditorModal';
import { useAuth } from '../context/AuthContext';
import type { Escalation, Patient } from '../types';

interface EscalationsViewProps {
  onSelectPatient: (patientId: string) => void;
  onNavigate: (view: any) => void;
}

export const EscalationsView: React.FC<EscalationsViewProps> = ({
  onSelectPatient,
  onNavigate
}) => {
  const { profile, currentRole } = useAuth();
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [selectedEscalation, setSelectedEscalation] = useState<Escalation | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('pending');

  const loadData = async () => {
    try {
      const escList = await localDb.escalations.reverse().sortBy('requestedAt');
      setEscalations(escList);

      const ptList = await localDb.patients.toArray();
      const ptMap: Record<string, Patient> = {};
      ptList.forEach(p => { ptMap[p.id] = p; });
      setPatients(ptMap);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = escalations.filter(e => {
    if (filter === 'pending') return e.status === 'pending';
    if (filter === 'reviewed') return e.status === 'reviewed';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="card-base p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[var(--text-main)]">
              Senior Clinical Review Inbox (SBAR)
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Frontline nurse-to-doctor escalations for rapid clinical decision-support
            </p>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-main)] text-xs">
          {(['pending', 'reviewed', 'all'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                filter === tab
                  ? 'bg-[var(--primary)] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Escalation Cards List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card-base p-12 text-center text-xs text-[var(--text-muted)]">
            No escalations in current "{filter}" view.
          </div>
        ) : (
          filtered.map((esc) => {
            const patient = patients[esc.patientId];
            const isPending = esc.status === 'pending';

            return (
              <div
                key={esc.id}
                onClick={() => setSelectedEscalation(esc)}
                className={`card-base p-4 sm:p-5 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 hover:shadow-md ${
                  isPending ? 'border-amber-500/50 hover:border-amber-500' : 'opacity-85'
                }`}
              >
                {/* Left */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-extrabold text-base text-[var(--text-main)]">
                      {patient ? patient.name : esc.patientId}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        esc.urgency === 'emergency'
                          ? 'bg-red-500 text-white'
                          : esc.urgency === 'urgent'
                          ? 'bg-amber-500 text-white'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      {esc.urgency}
                    </span>

                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        isPending ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' : 'badge-stable'
                      }`}
                    >
                      {esc.status}
                    </span>

                    <span className="text-[11px] text-[var(--text-muted)] font-mono">
                      Requested: {new Date(esc.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-main)] font-semibold">
                    Nurse Note: "{esc.nurseNote}"
                  </p>

                  <div className="flex items-center gap-2 text-xs font-mono font-bold pt-0.5">
                    <span className="badge-critical px-2 py-0.5 rounded">
                      BP {esc.attachedVitals.bp}
                    </span>
                    <span className="badge-stable px-2 py-0.5 rounded">
                      Pulse {esc.attachedVitals.pulse} bpm
                    </span>
                    <span className="badge-stable px-2 py-0.5 rounded">
                      SpO2 {esc.attachedVitals.spo2}%
                    </span>
                  </div>

                  {esc.decision && (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 pt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Doctor Decision: {esc.decision.replace('_', ' ').toUpperCase()} ({esc.doctorName})</span>
                    </div>
                  )}
                </div>

                {/* Right button */}
                <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--border-main)]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEscalation(esc);
                    }}
                    className="btn-primary !py-2 !px-3 text-xs font-bold"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{isPending ? 'Review SBAR Draft' : 'View Decision'}</span>
                  </button>
                  <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* SBAR Editor Modal */}
      {selectedEscalation && (
        <SbarEditorModal
          escalation={selectedEscalation}
          patient={patients[selectedEscalation.patientId]}
          isOpen={true}
          onClose={() => setSelectedEscalation(null)}
          onDecisionSaved={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
};
