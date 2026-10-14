import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Phone, 
  AlertTriangle, 
  ArrowRight, 
  MessageSquare,
  ShieldCheck,
  FileCheck,
  Award
} from 'lucide-react';
import { localDb } from '../db/localDb';
import { syncService } from '../db/syncService';
import { SmsFallbackModal } from '../components/modals/SmsFallbackModal';
import { RecordOutcomeModal } from '../components/modals/RecordOutcomeModal';
import { useAuth } from '../context/AuthContext';
import { useNetwork } from '../context/NetworkContext';
import type { Referral, ReferralState, Task } from '../types';

interface ReferralsViewProps {
  onSelectPatient: (patientId: string) => void;
  onNavigate: (view: any) => void;
}

export const ReferralsView: React.FC<ReferralsViewProps> = ({
  onSelectPatient,
  onNavigate
}) => {
  const { profile, currentRole } = useAuth();
  const { isOnline } = useNetwork();

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [selectedForSms, setSelectedForSms] = useState<Referral | null>(null);
  const [selectedForOutcome, setSelectedForOutcome] = useState<Referral | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'incoming' | 'in_transit' | 'completed'>('all');

  const loadReferrals = async () => {
    try {
      const list = await localDb.referrals.reverse().sortBy('createdAt');
      setReferrals(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadReferrals();
  }, []);

  const advanceReferralState = async (referral: Referral, nextState: ReferralState, note?: string) => {
    const timestamp = new Date().toISOString();
    const transition = {
      state: nextState,
      timestamp,
      actor: profile.name,
      actorRole: profile.title,
      facility: profile.facility,
      note
    };

    const updatedReferral: Referral = {
      ...referral,
      state: nextState,
      stateHistory: [...referral.stateHistory, transition]
    };

    await localDb.referrals.put(updatedReferral);

    // Update patient stage and task
    let outstandingTask = '';
    let outstandingOwner = '';

    if (nextState === 'accepted') {
      outstandingTask = 'Arrange 108 Ambulance Dispatch';
      outstandingOwner = 'Meena (ANM)';
    } else if (nextState === 'transport_requested' || nextState === 'in_transit') {
      outstandingTask = 'Monitor en-route vitals to District Hospital';
      outstandingOwner = '108 Ambulance EMT / Sister Priya';
    } else if (nextState === 'arrived') {
      outstandingTask = 'Complete Obstetric Bedside Handover Checklist';
      outstandingOwner = 'Sister Priya (Hospital)';
    } else if (nextState === 'handover_completed') {
      outstandingTask = 'Administer Hospital Treatment & Record Clinical Outcome';
      outstandingOwner = 'Dr. S. Rao / Sister Priya (Hospital)';
    }

    if (outstandingTask) {
      await localDb.patients.update(referral.patientId, {
        outstandingTask,
        outstandingOwner
      });
    }

    // Sync queue
    await syncService.enqueueAction({
      user: profile.name,
      device: `${profile.title} Terminal`,
      action: `Referral #${referral.referralNumber} -> ${nextState.toUpperCase()}`,
      entityType: 'referral',
      payload: updatedReferral
    });

    // Audit Log
    await localDb.auditLogs.add({
      id: `AUD-${Date.now()}`,
      timestamp,
      actor: profile.name,
      role: profile.title,
      facility: profile.facility,
      action: `Referral Transition: ${nextState.toUpperCase()}`,
      patientId: referral.patientId,
      patientName: referral.patientName,
      details: `Referral #${referral.referralNumber} progressed to ${nextState}. Note: ${note || 'None'}`,
      online: isOnline,
      device: `${profile.title} Terminal`
    });

    await loadReferrals();
  };

  const filteredReferrals = referrals.filter(r => {
    if (activeTab === 'incoming') {
      return r.state === 'sent' || r.state === 'transport_requested';
    }
    if (activeTab === 'in_transit') {
      return r.state === 'in_transit' || r.state === 'arrived';
    }
    if (activeTab === 'completed') {
      return r.state === 'handover_completed' || r.state === 'outcome_recorded';
    }
    return true;
  });

  const getStateBadge = (state: ReferralState, isOffline?: boolean) => {
    if (isOffline) {
      return (
        <span className="badge-warning text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> Saved on device - NOT yet sent
        </span>
      );
    }
    const badges: Record<ReferralState, { label: string; class: string }> = {
      draft: { label: 'Draft', class: 'bg-black/10 dark:bg-white/10 text-[var(--text-muted)]' },
      sent: { label: 'Sent (Awaiting Acceptance)', class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' },
      accepted: { label: 'Accepted by Hospital', class: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' },
      declined: { label: 'Declined', class: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' },
      transport_requested: { label: '108 Transport Dispatched', class: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' },
      in_transit: { label: 'In Transit (En Route)', class: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' },
      arrived: { label: 'Arrived at Facility', class: 'bg-teal-500/10 text-[var(--primary)] border border-teal-500/20' },
      handover_completed: { label: 'Bedside Handover Complete', class: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' },
      outcome_recorded: { label: 'Outcome Documented', class: 'badge-stable' }
    };
    const b = badges[state] || badges.sent;
    return (
      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${b.class}`}>
        {b.label}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="card-base p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[var(--text-main)]">
              Smart Referral Coordinator &amp; Receiving Desk
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Stage 4 &amp; 5: End-to-end transport coordination, bedside handover, and clinical loop closure
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 bg-[var(--bg-main)] p-1 rounded-xl border border-[var(--border-main)] text-xs">
          {(['all', 'incoming', 'in_transit', 'completed'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-[var(--primary)] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Referrals List */}
      <div className="space-y-4">
        {filteredReferrals.length === 0 ? (
          <div className="card-base p-12 text-center text-xs text-[var(--text-muted)]">
            No referrals found in "{activeTab}" view.
          </div>
        ) : (
          filteredReferrals.map((ref) => {
            return (
              <div
                key={ref.id}
                className="card-base p-4 sm:p-6 space-y-3.5 transition-all hover:border-[var(--primary)]"
              >
                {/* Top Info */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[var(--border-main)] pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 border border-[var(--border-main)]">
                      {ref.referralNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectPatient(ref.patientId);
                        onNavigate('patient-detail');
                      }}
                      className="font-black text-base text-[var(--text-main)] hover:text-[var(--primary)] cursor-pointer"
                    >
                      {ref.patientName}
                    </button>
                    {getStateBadge(ref.state, ref.isOfflineSaved)}
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        ref.urgency === 'critical' ? 'badge-critical' : 'badge-warning'
                      }`}
                    >
                      {ref.urgency}
                    </span>
                  </div>

                  <span className="text-xs text-[var(--text-muted)] font-mono">
                    Created: {new Date(ref.createdAt).toLocaleTimeString()}
                  </span>
                </div>

                {/* Routing & Vitals Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] space-y-1">
                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Origin: <strong>{ref.originFacility}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--primary)]" />
                      <span>Destination: <strong>{ref.destinationFacility}</strong></span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] pt-1">
                      Transport: <strong>{ref.transportType?.replace('_', ' ').toUpperCase() || '108 AMBULANCE'}</strong>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] space-y-1">
                    <div className="font-bold text-[var(--text-main)]">
                      Key Vitals Dispatched:
                    </div>
                    <div className="flex items-center gap-2 font-mono font-bold pt-0.5">
                      <span className="badge-critical px-2 py-0.5 rounded">
                        BP {ref.keyVitals.bp}
                      </span>
                      <span className="badge-stable px-2 py-0.5 rounded">
                        Pulse {ref.keyVitals.pulse} bpm
                      </span>
                      <span className="badge-stable px-2 py-0.5 rounded">
                        SpO2 {ref.keyVitals.spo2}%
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] mt-1">
                      Reason: {ref.reason}
                    </div>
                  </div>
                </div>

                {/* Actions Taken Prior to Transfer */}
                <div className="p-2.5 rounded-xl bg-teal-500/5 border border-teal-500/20 text-xs">
                  <strong>Actions Taken:</strong> {ref.actionsTaken}
                </div>

                {/* State Machine Action Transitions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[var(--border-main)]">
                  {/* SMS Fallback Button (Always available, highlighted if offline) */}
                  <button
                    type="button"
                    onClick={() => setSelectedForSms(ref)}
                    className="btn-secondary !py-1.5 !px-3 text-xs font-bold border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Send via SMS Fallback</span>
                  </button>

                  {/* Contextual Transition Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Step 1: Hospital Accept / Decline */}
                    {ref.state === 'sent' && (
                      <>
                        <button
                          type="button"
                          onClick={() => advanceReferralState(ref, 'declined', 'Beds at full capacity')}
                          className="btn-secondary !py-1.5 !px-2.5 text-xs text-red-500 hover:bg-red-500/10"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => advanceReferralState(ref, 'accepted', 'Reserved Obstetric Bed 3')}
                          className="btn-primary !py-1.5 !px-3 text-xs font-bold"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept Referral &amp; Reserve Bed</span>
                        </button>
                      </>
                    )}

                    {/* Step 2: Transport Dispatch */}
                    {ref.state === 'accepted' && (
                      <button
                        type="button"
                        onClick={() => advanceReferralState(ref, 'in_transit', 'Ambulance departed with patient and ASHA')}
                        className="btn-primary !py-1.5 !px-3 text-xs font-bold !bg-indigo-600 hover:!bg-indigo-700"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Dispatch &amp; Mark In Transit</span>
                      </button>
                    )}

                    {/* Step 3: Hospital Mark Arrival */}
                    {ref.state === 'in_transit' && (
                      <button
                        type="button"
                        onClick={() => advanceReferralState(ref, 'arrived', 'Patient arrived at Emergency triage')}
                        className="btn-primary !py-1.5 !px-3 text-xs font-bold"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Patient Arrived</span>
                      </button>
                    )}

                    {/* Step 4: Hospital Bedside Handover Complete */}
                    {ref.state === 'arrived' && (
                      <button
                        type="button"
                        onClick={() => advanceReferralState(ref, 'handover_completed', 'Clinical transfer notes and vitals confirmed bedside')}
                        className="btn-primary !py-1.5 !px-3 text-xs font-bold !bg-teal-600 hover:!bg-teal-700"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Complete Clinical Handover</span>
                      </button>
                    )}

                    {/* Step 5: Document Outcome */}
                    {ref.state === 'handover_completed' && (
                      <button
                        type="button"
                        onClick={() => setSelectedForOutcome(ref)}
                        className="btn-primary !py-1.5 !px-3 text-xs font-bold !bg-emerald-600 hover:!bg-emerald-700 shadow-md"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Document Outcome &amp; Auto-Task</span>
                      </button>
                    )}

                    {/* Step 6: Outcome Already Documented */}
                    {ref.state === 'outcome_recorded' && (
                      <span className="badge-stable text-xs font-bold px-3 py-1 rounded-lg flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Outcome: {ref.outcome?.replace('_', ' ').toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* SMS Fallback Modal */}
      {selectedForSms && (
        <SmsFallbackModal
          referral={selectedForSms}
          isOpen={true}
          onClose={() => setSelectedForSms(null)}
        />
      )}

      {/* Record Outcome Modal */}
      {selectedForOutcome && (
        <RecordOutcomeModal
          referral={selectedForOutcome}
          isOpen={true}
          onClose={() => setSelectedForOutcome(null)}
          onOutcomeSaved={() => {
            loadReferrals();
          }}
        />
      )}
    </div>
  );
};
