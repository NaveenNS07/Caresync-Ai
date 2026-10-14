import React, { useState, useId } from 'react';
import { 
  X, 
  Heart, 
  Activity, 
  Thermometer, 
  Wind, 
  Droplet, 
  Mic, 
  MicOff, 
  AlertTriangle, 
  AlertOctagon, 
  CheckCircle2, 
  Info,
  Volume2
} from 'lucide-react';
import { evaluateVitalsAndSymptoms } from '../../rules/rulesEngine';
import { defaultRules } from '../../rules/defaultRules';
import { localDb } from '../../db/localDb';
import { syncService } from '../../db/syncService';
import { useAuth } from '../../context/AuthContext';
import { useNetwork } from '../../context/NetworkContext';
import { SeverityBadge } from '../common/SeverityBadge';
import type { Reading, Patient, Alert } from '../../types';

interface AddReadingModalProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
  onReadingAdded: (reading: Reading, alert?: Alert) => void;
}

export const AddReadingModal: React.FC<AddReadingModalProps> = ({
  patient,
  isOpen,
  onClose,
  onReadingAdded
}) => {
  const { profile } = useAuth();
  const { isOnline } = useNetwork();

  const [systolic, setSystolic] = useState<number>(120);
  const [diastolic, setDiastolic] = useState<number>(80);
  const [pulse, setPulse] = useState<number>(76);
  const [temperature, setTemperature] = useState<number>(36.8);
  const [spo2, setSpo2] = useState<number>(98);
  const [bloodSugar, setBloodSugar] = useState<string>('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [note, setNote] = useState<string>('');
  
  // Voice note simulation
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [hasVoiceNote, setHasVoiceNote] = useState<boolean>(false);
  const [voiceDuration, setVoiceDuration] = useState<number>(0);

  const availableSymptoms = [
    { id: 'severe_headache', label: 'Severe Headache' },
    { id: 'blurred_vision', label: 'Blurred Vision / Spots' },
    { id: 'bleeding', label: 'Vaginal Bleeding' },
    { id: 'reduced_fetal_movement', label: 'Reduced Fetal Movement' },
    { id: 'convulsions', label: 'Convulsions / Fits' },
    { id: 'abdominal_pain', label: 'Epigastric / Abdominal Pain' },
    { id: 'fever', label: 'High Fever / Chills' },
    { id: 'swelling', label: 'Severe Swelling (Face/Hands)' }
  ];

  if (!isOpen) return null;

  // Real-time evaluation using client-side offline rules engine
  const evalResult = evaluateVitalsAndSymptoms(
    {
      systolic,
      diastolic,
      pulse,
      temp: temperature,
      spo2
    },
    selectedSymptoms,
    defaultRules
  );

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleToggleVoiceRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      setHasVoiceNote(true);
      setVoiceDuration(6);
    } else {
      setIsRecording(true);
      setHasVoiceNote(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const readingId = `RD-${Date.now()}`;
    let alertObj: Alert | undefined;

    if (evalResult.severity === 'critical' || evalResult.severity === 'warning') {
      const topAlert = evalResult.alerts[0];
      alertObj = {
        id: `ALT-${Date.now()}`,
        patientId: patient.id,
        readingId,
        timestamp: new Date().toISOString(),
        severity: evalResult.severity,
        ruleName: topAlert?.ruleName || 'Clinical Warning',
        triggerSummary: topAlert?.triggerSummary || 'Abnormal observations detected',
        plainExplanation: topAlert?.plainExplanation || 'Review required.',
        acknowledged: false,
        isUseful: null
      };
    }

    const newReading: Reading = {
      id: readingId,
      patientId: patient.id,
      timestamp: new Date().toISOString(),
      actor: profile.name,
      actorRole: profile.title,
      facility: profile.facility,
      bpSystolic: Number(systolic),
      bpDiastolic: Number(diastolic),
      pulse: Number(pulse),
      temperature: Number(temperature),
      spo2: Number(spo2),
      bloodSugar: bloodSugar ? Number(bloodSugar) : undefined,
      symptoms: selectedSymptoms,
      note: note.trim() || undefined,
      voiceNoteAudio: hasVoiceNote ? 'local_audio_simulated_6sec.webm' : undefined,
      severity: evalResult.severity,
      triggeredRules: evalResult.alerts.map(a => a.ruleId),
      alertId: alertObj?.id,
      deviceOnline: isOnline
    };

    // Save to local IndexedDB
    await localDb.readings.add(newReading);

    if (alertObj) {
      await localDb.alerts.add(alertObj);
    }

    // Update patient status in local DB
    const updatedPatient: Partial<Patient> = {
      currentSeverity: evalResult.severity,
      lastReadingAt: newReading.timestamp,
      topAlertReason: alertObj?.triggerSummary || patient.topAlertReason,
      flaggedAt: alertObj ? newReading.timestamp : patient.flaggedAt,
      loopStage: evalResult.severity === 'critical' ? 'prioritize' : evalResult.severity === 'warning' ? 'explain' : patient.loopStage
    };
    await localDb.patients.update(patient.id, updatedPatient);

    // Enqueue in sync queue
    await syncService.enqueueAction({
      user: profile.name,
      device: `${profile.title} Device`,
      action: `Recorded Vitals (${evalResult.severity.toUpperCase()}) for ${patient.name}`,
      entityType: 'reading',
      payload: newReading
    });

    if (alertObj) {
      await syncService.enqueueAction({
        user: profile.name,
        device: `${profile.title} Device`,
        action: `Generated Alert for ${patient.name}`,
        entityType: 'alert',
        payload: alertObj
      });
    }

    // Audit Log
    const auditEntry = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: profile.name,
      role: profile.title,
      facility: profile.facility,
      action: 'Vitals & Danger Signs Recorded',
      patientId: patient.id,
      patientName: patient.name,
      details: `BP ${systolic}/${diastolic}, Pulse ${pulse}, SpO2 ${spo2}%. Severity: ${evalResult.severity.toUpperCase()}. Symptoms: ${selectedSymptoms.join(', ') || 'None'}.`,
      online: isOnline,
      device: `${profile.title} Device`
    };
    await localDb.auditLogs.add(auditEntry);

    onReadingAdded(newReading, alertObj);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
      <div className="card-base w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-main)] flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[var(--text-main)]">
              Record Clinical Reading
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Patient: <strong>{patient.name}</strong> ({patient.gestationWeeks} weeks gestation, {patient.parity})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5">
          {/* Real-time rules engine evaluation preview banner */}
          <div className="p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[var(--bg-main)]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Instant MEOWS Assessment:
              </span>
              <SeverityBadge severity={evalResult.severity} size="md" />
            </div>
            {evalResult.alerts.length > 0 && (
              <span className="text-xs font-semibold text-[var(--text-main)]">
                {evalResult.alerts[0].triggerSummary}
              </span>
            )}
          </div>

          {/* Quick preset for hero scenario */}
          <div className="flex items-center justify-between bg-teal-500/10 p-2.5 rounded-xl border border-teal-500/20 text-xs">
            <span className="text-[var(--primary)] font-medium">
              Demo Preset: Fill Lakshmi danger signs (160/110 + Headache)
            </span>
            <button
              type="button"
              onClick={() => {
                setSystolic(160);
                setDiastolic(110);
                setPulse(88);
                setSpo2(98);
                setSelectedSymptoms(['severe_headache']);
              }}
              className="px-2.5 py-1 rounded-lg bg-[var(--primary)] text-white font-bold text-xs hover:opacity-90"
            >
              Apply Hero Preset
            </button>
          </div>

          {/* Vital Signs Grid (Big touch-friendly inputs) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Blood Pressure Systolic */}
            <div className="p-3 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)]">
              <label htmlFor="bp-sys-input" className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                BP Systolic (mmHg)
              </label>
              <input
                id="bp-sys-input"
                type="number"
                min="60"
                max="260"
                value={systolic}
                onChange={(e) => setSystolic(Number(e.target.value))}
                className="w-full text-xl sm:text-2xl font-black text-[var(--text-main)] bg-transparent outline-none"
                required
              />
              <span className="text-[10px] text-[var(--text-muted)]">Target: &lt; 140</span>
            </div>

            {/* Blood Pressure Diastolic */}
            <div className="p-3 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)]">
              <label htmlFor="bp-dia-input" className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                BP Diastolic (mmHg)
              </label>
              <input
                id="bp-dia-input"
                type="number"
                min="40"
                max="160"
                value={diastolic}
                onChange={(e) => setDiastolic(Number(e.target.value))}
                className="w-full text-xl sm:text-2xl font-black text-[var(--text-main)] bg-transparent outline-none"
                required
              />
              <span className="text-[10px] text-[var(--text-muted)]">Target: &lt; 90</span>
            </div>

            {/* Pulse */}
            <div className="p-3 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)]">
              <label htmlFor="pulse-input" className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                Pulse (bpm)
              </label>
              <input
                id="pulse-input"
                type="number"
                min="40"
                max="200"
                value={pulse}
                onChange={(e) => setPulse(Number(e.target.value))}
                className="w-full text-xl sm:text-2xl font-black text-[var(--text-main)] bg-transparent outline-none"
                required
              />
              <span className="text-[10px] text-[var(--text-muted)]">Target: 60 - 100</span>
            </div>

            {/* Temperature */}
            <div className="p-3 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)]">
              <label htmlFor="temp-input" className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                Temperature (°C)
              </label>
              <input
                id="temp-input"
                type="number"
                step="0.1"
                min="34"
                max="43"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full text-xl sm:text-2xl font-black text-[var(--text-main)] bg-transparent outline-none"
                required
              />
              <span className="text-[10px] text-[var(--text-muted)]">Target: 36.5 - 37.5</span>
            </div>

            {/* SpO2 */}
            <div className="p-3 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)]">
              <label htmlFor="spo2-input" className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                Oxygen SpO2 (%)
              </label>
              <input
                id="spo2-input"
                type="number"
                min="70"
                max="100"
                value={spo2}
                onChange={(e) => setSpo2(Number(e.target.value))}
                className="w-full text-xl sm:text-2xl font-black text-[var(--text-main)] bg-transparent outline-none"
                required
              />
              <span className="text-[10px] text-[var(--text-muted)]">Target: &gt;= 95%</span>
            </div>

            {/* Blood Sugar (Optional) */}
            <div className="p-3 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)]">
              <label htmlFor="sugar-input" className="block text-xs font-bold text-[var(--text-muted)] mb-1">
                Random Sugar (mg/dL)
              </label>
              <input
                id="sugar-input"
                type="number"
                min="40"
                max="400"
                placeholder="Optional"
                value={bloodSugar}
                onChange={(e) => setBloodSugar(e.target.value)}
                className="w-full text-xl sm:text-2xl font-black text-[var(--text-main)] bg-transparent outline-none placeholder:text-xs placeholder:font-normal"
              />
              <span className="text-[10px] text-[var(--text-muted)]">Target: &lt; 140</span>
            </div>
          </div>

          {/* Maternal Danger Signs Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Maternal Danger Signs Checklist
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                {selectedSymptoms.length} selected
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableSymptoms.map((sym) => {
                const isChecked = selectedSymptoms.includes(sym.id);
                return (
                  <button
                    key={sym.id}
                    type="button"
                    onClick={() => toggleSymptom(sym.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-semibold transition-all touch-target ${
                      isChecked
                        ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 font-bold'
                        : 'border-[var(--border-main)] bg-[var(--bg-main)] text-[var(--text-main)] hover:border-[var(--primary)]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                        isChecked
                          ? 'bg-red-500 border-red-500 text-white'
                          : 'border-[var(--border-main)]'
                      }`}
                    >
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <span>{sym.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clinical Note & Voice Note Simulation */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="clinical-obs-note" className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Clinical Observation Notes
              </label>
              {/* Voice Note Button */}
              <button
                type="button"
                onClick={handleToggleVoiceRecord}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  isRecording
                    ? 'bg-red-500 text-white border-red-500 animate-pulse'
                    : hasVoiceNote
                    ? 'badge-stable'
                    : 'border-[var(--border-main)] hover:border-[var(--primary)] text-[var(--text-muted)]'
                }`}
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>
                  {isRecording ? 'Recording (tap to stop)' : hasVoiceNote ? 'Voice note attached (6s)' : 'Record Voice Note'}
                </span>
              </button>
            </div>
            <textarea
              id="clinical-obs-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Patient reports throbbing forehead pain and blurred vision since morning. Reflexes brisk."
              className="w-full p-3 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] text-xs text-[var(--text-main)] outline-none focus:border-[var(--primary)]"
            />
          </div>

          {/* Footer disclaimer */}
          <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5 border border-[var(--border-main)] text-[11px] text-[var(--text-muted)] flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0 text-[var(--primary)]" />
            <span>Simulated decision-support data. A clinician must confirm all observations.</span>
          </div>

          {/* Action Buttons */}
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
              Save Reading & Evaluate Loop
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
