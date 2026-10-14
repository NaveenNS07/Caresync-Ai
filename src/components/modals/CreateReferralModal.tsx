import React, { useState, useEffect } from 'react';
import { X, Truck, Building2, Phone, AlertTriangle, ShieldCheck, MapPin, CheckCircle2 } from 'lucide-react';
import { initialFacilities } from '../../db/seedData';
import { localDb } from '../../db/localDb';
import { syncService } from '../../db/syncService';
import { useAuth } from '../../context/AuthContext';
import { useNetwork } from '../../context/NetworkContext';
import type { Patient, Reading, Referral, Facility } from '../../types';

interface CreateReferralModalProps {
  patient: Patient;
  latestReading?: Reading;
  isOpen: boolean;
  onClose: () => void;
  onReferralCreated: (referral: Referral) => void;
  onOpenSmsFallback?: (referral: Referral) => void;
}

export const CreateReferralModal: React.FC<CreateReferralModalProps> = ({
  patient,
  latestReading,
  isOpen,
  onClose,
  onReferralCreated,
  onOpenSmsFallback
}) => {
  const { profile } = useAuth();
  const { isOnline } = useNetwork();

  const [facilities, setFacilities] = useState<Facility[]>(initialFacilities);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('FAC-03'); // Default to Rampur District Hospital
  const [urgency, setUrgency] = useState<'critical' | 'high' | 'medium'>('critical');
  const [reason, setReason] = useState<string>('Severe Pre-eclampsia with Danger Signs (BP >=160/110 + neurological symptoms)');
  const [actionsTaken, setActionsTaken] = useState<string>('Patient placed in left lateral tilt. Vitals recorded. 108 Ambulance requested.');
  const [transportType, setTransportType] = useState<'108_ambulance' | 'private_vehicle' | 'hospital_van'>('108_ambulance');

  useEffect(() => {
    localDb.facilities.toArray().then(facs => {
      if (facs && facs.length > 0) setFacilities(facs);
    });
  }, []);

  if (!isOpen) return null;

  const targetFacility = facilities.find(f => f.id === selectedFacilityId) || facilities[2];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const referralId = `REF-${Date.now()}`;
    const referralNumber = `REF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReferral: Referral = {
      id: referralId,
      patientId: patient.id,
      patientName: patient.name,
      referralNumber,
      createdAt: new Date().toISOString(),
      originFacility: profile.facility,
      destinationFacility: targetFacility.name,
      reason,
      urgency,
      clinicalSummary: `${patient.name}, ${patient.age}y, ${patient.gestationWeeks}w gestation (${patient.parity}). Severe danger signs flagged under MEOWS protocol. Requires immediate obstetric evaluation.`,
      keyVitals: {
        bp: latestReading ? `${latestReading.bpSystolic}/${latestReading.bpDiastolic}` : '160/110',
        pulse: latestReading ? latestReading.pulse : 88,
        spo2: latestReading ? latestReading.spo2 : 98,
        temp: latestReading ? latestReading.temperature : 37.0,
        symptoms: latestReading ? latestReading.symptoms : ['severe_headache']
      },
      actionsTaken,
      state: 'sent',
      stateHistory: [
        {
          state: 'draft',
          timestamp: new Date().toISOString(),
          actor: profile.name,
          actorRole: profile.title,
          facility: profile.facility
        },
        {
          state: 'sent',
          timestamp: new Date().toISOString(),
          actor: profile.name,
          actorRole: profile.title,
          facility: profile.facility,
          note: isOnline ? 'Dispatched electronically via cloud sync.' : 'Saved offline on local sub-centre tablet.'
        }
      ],
      transportType,
      isOfflineSaved: !isOnline
    };

    // Save to local IndexedDB
    await localDb.referrals.add(newReferral);

    // Update patient stage to coordinate
    await localDb.patients.update(patient.id, {
      loopStage: 'coordinate',
      outstandingTask: `Awaiting Bed Acceptance at ${targetFacility.name}`,
      outstandingOwner: 'Hospital Receiving Desk'
    });

    // Enqueue sync
    await syncService.enqueueAction({
      user: profile.name,
      device: `${profile.title} Device`,
      action: `Created Structured Referral for ${patient.name} (${targetFacility.name})`,
      entityType: 'referral',
      payload: newReferral
    });

    // Audit log
    const auditEntry = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: profile.name,
      role: profile.title,
      facility: profile.facility,
      action: `Structured Referral Created (${urgency.toUpperCase()})`,
      patientId: patient.id,
      patientName: patient.name,
      details: `Referral #${referralNumber} created for ${targetFacility.name}. Online: ${isOnline}. Transport: ${transportType}`,
      online: isOnline,
      device: `${profile.title} Device`
    };
    await localDb.auditLogs.add(auditEntry);

    onReferralCreated(newReferral);
    onClose();

    // If offline, prompt with SMS fallback immediately
    if (!isOnline && onOpenSmsFallback) {
      setTimeout(() => {
        onOpenSmsFallback(newReferral);
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
      <div className="card-base w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-main)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[var(--text-main)]">
                Create Structured Referral
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Care Loop Stage 4: Coordinate Transfer & Facility Handover
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

        {/* Offline Warning Banner */}
        {!isOnline && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-700 dark:text-amber-400 font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Saved on device - NOT yet sent (Offline mode). SMS fallback will be generated.
            </span>
            <span className="text-[10px] uppercase font-bold bg-amber-500/20 px-2 py-0.5 rounded">
              Offline Buffered
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Patient Overview */}
          <div className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-main)] flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-bold text-sm text-[var(--text-main)]">{patient.name}</span>
              <p className="text-[11px] text-[var(--text-muted)]">
                {patient.age}y • {patient.gestationWeeks} weeks • {patient.parity} • ASHA: {patient.ashaWorker}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold">
              <span className="badge-critical px-2 py-0.5 rounded">
                BP {latestReading ? `${latestReading.bpSystolic}/${latestReading.bpDiastolic}` : '160/110'}
              </span>
              <span className="badge-stable px-2 py-0.5 rounded">
                SpO2 {latestReading ? latestReading.spo2 : 98}%
              </span>
            </div>
          </div>

          {/* Receiving Facility Directory */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Select Receiving Facility (Live Directory)
            </label>
            <div className="space-y-2">
              {facilities.map((fac) => {
                const isSelected = selectedFacilityId === fac.id;
                return (
                  <button
                    key={fac.id}
                    type="button"
                    onClick={() => setSelectedFacilityId(fac.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-[var(--primary)] bg-[var(--primary)]/10 shadow-xs'
                        : 'border-[var(--border-main)] bg-[var(--bg-main)] hover:border-[var(--primary)]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Building2 className={`w-4 h-4 ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                        <span className="font-bold text-[var(--text-main)]">{fac.name}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10">
                          {fac.distanceKm} km away
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-1 flex flex-wrap items-center gap-2">
                        <span>Beds: {fac.maternalBedsAvailable} / {fac.maternalBedsTotal} available</span>
                        <span>•</span>
                        <span>{fac.dataFreshness}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-semibold flex-wrap">
                      {fac.services.obstetricEmergency && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Obstetric ER
                        </span>
                      )}
                      {fac.services.bloodBank && (
                        <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                          Blood Bank
                        </span>
                      )}
                      {fac.services.icu && (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          ICU
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Urgency & Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="ref-urgency-select" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Referral Urgency
              </label>
              <select
                id="ref-urgency-select"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] text-xs text-[var(--text-main)] outline-none"
              >
                <option value="critical">Critical - Emergency Transfer</option>
                <option value="high">High - Priority Admission</option>
                <option value="medium">Medium - Specialized Consultation</option>
              </select>
            </div>

            <div>
              <label htmlFor="ref-transport-select" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Transport Mode
              </label>
              <select
                id="ref-transport-select"
                value={transportType}
                onChange={(e) => setTransportType(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] text-xs text-[var(--text-main)] outline-none"
              >
                <option value="108_ambulance">108 Government Ambulance</option>
                <option value="hospital_van">Hospital Patient Van</option>
                <option value="private_vehicle">Family / Private Vehicle</option>
              </select>
            </div>
          </div>

          {/* Reason for Referral */}
          <div>
            <label htmlFor="ref-reason-input" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Referral Reason & Clinical Diagnosis
            </label>
            <input
              id="ref-reason-input"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] text-xs text-[var(--text-main)] outline-none"
              required
            />
          </div>

          {/* Actions Taken Prior to Transfer */}
          <div>
            <label htmlFor="ref-actions-textarea" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Stabilizing Actions Taken Prior to Transfer
            </label>
            <textarea
              id="ref-actions-textarea"
              rows={2}
              value={actionsTaken}
              onChange={(e) => setActionsTaken(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] text-xs text-[var(--text-main)] outline-none"
              placeholder="e.g. Oral Labetalol 100mg given, IV line secured, 108 ambulance called..."
              required
            />
          </div>

          {/* Actions */}
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
              Confirm & Dispatch Referral
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
