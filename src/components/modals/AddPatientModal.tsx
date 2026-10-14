import React, { useState } from 'react';
import { X, UserPlus, Heart, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { localDb } from '../../db/localDb';
import { syncService } from '../../db/syncService';
import { useAuth } from '../../context/AuthContext';
import { useNetwork } from '../../context/NetworkContext';
import type { Patient } from '../../types';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientAdded: (patient: Patient) => void;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({
  isOpen,
  onClose,
  onPatientAdded
}) => {
  const { profile } = useAuth();
  const { isOnline } = useNetwork();

  const [name, setName] = useState<string>('');
  const [age, setAge] = useState<number>(22);
  const [gestationWeeks, setGestationWeeks] = useState<number>(28);
  const [parity, setParity] = useState<string>('G1P0');
  const [village, setVillage] = useState<string>('Chandanpur');
  const [contactNumber, setContactNumber] = useState<string>('+91 98765 00000');
  const [ashaWorker, setAshaWorker] = useState<string>('Sunita Devi (ASHA-12)');
  const [riskFactors, setRiskFactors] = useState<string>('Nulliparous, Routine antenatal registration');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const patientId = `PT-${Math.floor(100 + Math.random() * 900)}`;
    const newPatient: Patient = {
      id: patientId,
      name: name.trim(),
      age: Number(age),
      gestationWeeks: Number(gestationWeeks),
      parity: parity.trim(),
      riskFactors: riskFactors.split(',').map(r => r.trim()).filter(Boolean),
      village: village.trim(),
      contactNumber: contactNumber.trim(),
      ashaWorker: ashaWorker.trim(),
      facilityId: 'FAC-01',
      assignedStaff: profile.name,
      currentSeverity: 'stable',
      loopStage: 'detect',
      lastReadingAt: new Date().toISOString(),
      isClosed: false,
      outstandingTask: 'Initial Antenatal Assessment',
      outstandingOwner: profile.name
    };

    // Save to local IndexedDB
    await localDb.patients.add(newPatient);

    // Enqueue in sync queue
    await syncService.enqueueAction({
      user: profile.name,
      device: `${profile.title} Device`,
      action: `Registered New Antenatal Patient: ${newPatient.name}`,
      entityType: 'patient',
      payload: newPatient
    });

    // Audit log
    const auditEntry = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: profile.name,
      role: profile.title,
      facility: profile.facility,
      action: 'Registered New Patient',
      patientId: newPatient.id,
      patientName: newPatient.name,
      details: `Registered ${newPatient.name}, ${newPatient.age}y, ${newPatient.gestationWeeks}w gestation. Village: ${newPatient.village}`,
      online: isOnline,
      device: `${profile.title} Device`
    };
    await localDb.auditLogs.add(auditEntry);

    onPatientAdded(newPatient);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
      <div className="card-base w-full max-w-lg flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-5 border-b border-[var(--border-main)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[var(--text-main)]">
                Register Antenatal Mother
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Creates a new longitudinal Care Loop record
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

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs">
          <div>
            <label htmlFor="patient-full-name" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Mother's Full Name
            </label>
            <input
              id="patient-full-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Meera Devi"
              className="w-full p-2.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] text-xs text-[var(--text-main)] outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label htmlFor="patient-age-input" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Age
              </label>
              <input
                id="patient-age-input"
                type="number"
                min="14"
                max="50"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] text-xs text-[var(--text-main)] outline-none"
                required
              />
            </div>
            <div>
              <label htmlFor="patient-gest-weeks" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Gestation (wks)
              </label>
              <input
                id="patient-gest-weeks"
                type="number"
                min="4"
                max="44"
                value={gestationWeeks}
                onChange={(e) => setGestationWeeks(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] text-xs text-[var(--text-main)] outline-none"
                required
              />
            </div>
            <div>
              <label htmlFor="patient-parity-input" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Parity
              </label>
              <input
                id="patient-parity-input"
                type="text"
                value={parity}
                onChange={(e) => setParity(e.target.value)}
                placeholder="G1P0"
                className="w-full p-2.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] text-xs text-[var(--text-main)] outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="patient-village-input" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Village / Hamlet
              </label>
              <input
                id="patient-village-input"
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] text-xs text-[var(--text-main)] outline-none"
                required
              />
            </div>
            <div>
              <label htmlFor="patient-contact-input" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Mobile Number
              </label>
              <input
                id="patient-contact-input"
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] text-xs text-[var(--text-main)] outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="patient-asha-input" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Assigned ASHA Worker
            </label>
            <input
              id="patient-asha-input"
              type="text"
              value={ashaWorker}
              onChange={(e) => setAshaWorker(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] text-xs text-[var(--text-main)] outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="patient-risk-factors" className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Risk Factors (comma-separated)
            </label>
            <input
              id="patient-risk-factors"
              type="text"
              value={riskFactors}
              onChange={(e) => setRiskFactors(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] text-xs text-[var(--text-main)] outline-none"
            />
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
              Register &amp; Start Care Loop
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
