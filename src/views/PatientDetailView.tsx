import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Activity, 
  Plus, 
  ArrowUpRight, 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Calendar, 
  Phone, 
  MapPin, 
  ShieldAlert,
  ThumbsDown,
  Volume2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine, 
  CartesianGrid 
} from 'recharts';
import { localDb } from '../db/localDb';
import { syncService } from '../db/syncService';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { CareLoopTracker } from '../components/common/CareLoopTracker';
import { useAuth } from '../context/AuthContext';
import { useNetwork } from '../context/NetworkContext';
import type { Patient, Reading, Alert, Escalation, Referral, Task, CareLoopStage } from '../types';

interface PatientDetailViewProps {
  patientId: string;
  onBack: () => void;
  onOpenAddReading: (patientId: string) => void;
  onOpenEscalate: (patient: Patient, reading?: Reading, alert?: Alert) => void;
  onOpenReferral: (patient: Patient, reading?: Reading) => void;
  onNavigate: (view: any) => void;
}

export const PatientDetailView: React.FC<PatientDetailViewProps> = ({
  patientId,
  onBack,
  onOpenAddReading,
  onOpenEscalate,
  onOpenReferral,
  onNavigate
}) => {
  const { profile } = useAuth();
  const { isOnline } = useNetwork();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'trends' | 'timeline' | 'alerts' | 'tasks'>('timeline');

  const loadPatientData = async () => {
    try {
      const p = await localDb.patients.get(patientId);
      if (p) setPatient(p);

      const rList = await localDb.readings.where('patientId').equals(patientId).reverse().sortBy('timestamp');
      setReadings(rList);

      const aList = await localDb.alerts.where('patientId').equals(patientId).reverse().sortBy('timestamp');
      setAlerts(aList);

      const eList = await localDb.escalations.where('patientId').equals(patientId).reverse().sortBy('requestedAt');
      setEscalations(eList);

      const refList = await localDb.referrals.where('patientId').equals(patientId).reverse().sortBy('createdAt');
      setReferrals(refList);

      const tList = await localDb.tasks.where('patientId').equals(patientId).reverse().sortBy('dueDate');
      setTasks(tList);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  if (!patient) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-xs text-[var(--text-muted)]">
        Loading patient details...
      </div>
    );
  }

  const latestReading = readings[0];
  const activeUnackAlert = alerts.find(a => !a.acknowledged && (a.severity === 'critical' || a.severity === 'warning'));

  const handleAcknowledgeAlert = async (alertId: string) => {
    const timestamp = new Date().toISOString();
    await localDb.alerts.update(alertId, {
      acknowledged: true,
      acknowledgedBy: profile.name,
      acknowledgedAt: timestamp
    });

    await syncService.enqueueAction({
      user: profile.name,
      device: `${profile.title} Device`,
      action: `Acknowledged Alert ${alertId}`,
      entityType: 'alert',
      payload: { alertId, acknowledgedBy: profile.name, acknowledgedAt: timestamp }
    });

    await loadPatientData();
  };

  const handleMarkAlertNotUseful = async (alertId: string) => {
    await localDb.alerts.update(alertId, {
      isUseful: false,
      feedbackNote: 'Clinician marked as non-useful false positive.'
    });

    await localDb.auditLogs.add({
      id: `AUD-FB-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: profile.name,
      role: profile.title,
      facility: profile.facility,
      action: 'Alert Quality Feedback',
      patientId: patient.id,
      patientName: patient.name,
      details: `Alert ${alertId} marked NOT useful by clinician. Logged for threshold calibration.`,
      online: isOnline,
      device: `${profile.title} Device`
    });

    await loadPatientData();
  };

  // Recharts trend data
  const chartData = [...readings].reverse().map((r, idx) => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    systolic: r.bpSystolic,
    diastolic: r.bpDiastolic,
    pulse: r.pulse
  }));

  // Build unified chronological timeline
  type TimelineItem = {
    id: string;
    type: 'reading' | 'alert' | 'escalation' | 'referral' | 'task';
    timestamp: string;
    title: string;
    actor: string;
    actorRole?: string;
    details: string;
    severity?: string;
  };

  const timelineItems: TimelineItem[] = [];

  readings.forEach(r => {
    timelineItems.push({
      id: r.id,
      type: 'reading',
      timestamp: r.timestamp,
      title: `Vitals Recorded: BP ${r.bpSystolic}/${r.bpDiastolic} mmHg`,
      actor: r.actor,
      actorRole: r.actorRole,
      details: `Pulse: ${r.pulse} bpm, SpO2: ${r.spo2}%, Temp: ${r.temperature}°C. Symptoms: ${r.symptoms.join(', ') || 'None'}. ${r.note ? `Note: "${r.note}"` : ''}`,
      severity: r.severity
    });
  });

  alerts.forEach(a => {
    timelineItems.push({
      id: a.id,
      type: 'alert',
      timestamp: a.timestamp,
      title: `Rule Alert Fired: ${a.ruleName}`,
      actor: 'Rules Engine (Offline)',
      details: `${a.triggerSummary}. Reason: ${a.plainExplanation}`,
      severity: a.severity
    });
  });

  escalations.forEach(e => {
    timelineItems.push({
      id: e.id,
      type: 'escalation',
      timestamp: e.requestedAt,
      title: `Senior Clinical Escalation (${e.urgency.toUpperCase()})`,
      actor: e.requestedBy,
      details: `Nurse Note: "${e.nurseNote}". SBAR assessment prepared. Decision: ${e.decision || 'Pending Doctor Decision'}. ${e.doctorNote ? `Dr. Note: "${e.doctorNote}"` : ''}`
    });
  });

  referrals.forEach(ref => {
    ref.stateHistory.forEach(sh => {
      timelineItems.push({
        id: `${ref.id}-${sh.state}`,
        type: 'referral',
        timestamp: sh.timestamp,
        title: `Referral Transition: ${sh.state.replace('_', ' ').toUpperCase()}`,
        actor: sh.actor,
        actorRole: sh.actorRole,
        details: `Facility: ${ref.destinationFacility}. Urgency: ${ref.urgency}. ${sh.note || ''}`
      });
    });
  });

  tasks.forEach(t => {
    timelineItems.push({
      id: t.id,
      type: 'task',
      timestamp: t.completedAt || t.dueDate,
      title: `Follow-up Task: ${t.title}`,
      actor: t.assignedTo,
      details: `Status: ${t.status.toUpperCase()}. Due: ${new Date(t.dueDate).toLocaleDateString()}. ${t.completionNote ? `Outcome: ${t.completionNote}` : ''}`
    });
  });

  // Sort timeline newest first
  timelineItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-4 animate-fadeIn">
      {/* Top back navigation & quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Priority Queue</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onOpenAddReading(patient.id)}
            className="btn-primary !py-2 !px-3 text-xs font-bold"
          >
            <Activity className="w-4 h-4" />
            <span>+ Add Reading</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenEscalate(patient, latestReading, activeUnackAlert)}
            className="btn-secondary !py-2 !px-3 text-xs font-bold border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Request Senior Review</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenReferral(patient, latestReading)}
            className="btn-secondary !py-2 !px-3 text-xs font-bold border-indigo-500/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10"
          >
            <Truck className="w-4 h-4" />
            <span>Create Referral</span>
          </button>
        </div>
      </div>

      {/* Demographics Card */}
      <div className="card-base p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg ${
              patient.currentSeverity === 'critical'
                ? 'bg-red-500 shadow-red-500/30'
                : patient.currentSeverity === 'warning'
                ? 'bg-amber-500 shadow-amber-500/30'
                : 'bg-emerald-500 shadow-emerald-500/30'
            }`}
          >
            {patient.name.substring(0, 2).toUpperCase()}
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-[var(--text-main)]">
                {patient.name}
              </h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 border border-[var(--border-main)] text-[var(--text-muted)]">
                {patient.id}
              </span>
              <SeverityBadge severity={patient.currentSeverity} size="md" />
            </div>

            <div className="text-xs text-[var(--text-muted)] mt-1.5 flex flex-wrap items-center gap-2 sm:gap-3">
              <span>{patient.age} years old</span>
              <span>•</span>
              <span className="font-semibold text-[var(--text-main)]">{patient.gestationWeeks} weeks gestation</span>
              <span>•</span>
              <span>Parity: {patient.parity}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Village: {patient.village}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {patient.contactNumber}</span>
            </div>

            <div className="text-xs text-[var(--text-muted)] mt-1 flex flex-wrap items-center gap-2">
              <span>ASHA: <strong>{patient.ashaWorker}</strong></span>
              <span>•</span>
              <span>Assigned Clinician: <strong>{patient.assignedStaff}</strong></span>
            </div>

            {/* Risk factors pills */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <span className="text-[11px] font-bold text-[var(--text-muted)]">Risk Factors:</span>
              {patient.riskFactors.map((rf, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 border border-[var(--border-main)] text-[var(--text-main)]"
                >
                  {rf}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Unacknowledged Alert Warning Banner */}
      {activeUnackAlert && (
        <div className="card-base p-4 border-2 border-red-500 bg-red-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm text-red-600 dark:text-red-400 uppercase tracking-wide">
                  Unacknowledged Alert: {activeUnackAlert.ruleName}
                </span>
                <span className="text-[10px] font-mono bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                  Flagged {new Date(activeUnackAlert.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-xs font-semibold text-[var(--text-main)] mt-0.5">
                {activeUnackAlert.triggerSummary}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {activeUnackAlert.plainExplanation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleMarkAlertNotUseful(activeUnackAlert.id)}
              className="btn-secondary !py-1.5 !px-2.5 text-xs text-[var(--text-muted)] flex items-center gap-1 hover:text-red-500"
              title="Give feedback: Mark alert not useful"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Not Useful</span>
            </button>
            <button
              type="button"
              onClick={() => handleAcknowledgeAlert(activeUnackAlert.id)}
              className="btn-primary !py-2 !px-3 text-xs font-bold !bg-red-600 hover:!bg-red-700 text-white shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Acknowledge Alert</span>
            </button>
          </div>
        </div>
      )}

      {/* CARE LOOP 5-Step Visual Tracker */}
      <CareLoopTracker
        currentStage={patient.loopStage}
        isClosed={patient.isClosed}
        outstandingTask={patient.outstandingTask}
        outstandingOwner={patient.outstandingOwner}
        onStepClick={(stage) => {
          if (stage === 'prioritize') onOpenEscalate(patient, latestReading, activeUnackAlert);
          if (stage === 'coordinate') onOpenReferral(patient, latestReading);
        }}
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[var(--border-main)] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'timeline'
              ? 'bg-[var(--primary)] text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          Care Timeline ({timelineItems.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('trends')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'trends'
              ? 'bg-[var(--primary)] text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          Vitals Trend Charts ({readings.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('alerts')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'alerts'
              ? 'bg-[var(--primary)] text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          Rule Alerts ({alerts.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tasks')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'tasks'
              ? 'bg-[var(--primary)] text-white shadow-xs'
              : 'text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5'
          }`}
        >
          Follow-up Tasks ({tasks.length})
        </button>
      </div>

      {/* Tab: Vitals Trend Charts */}
      {activeTab === 'trends' && (
        <div className="space-y-4">
          <div className="card-base p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-extrabold text-[var(--text-main)]">
                  Blood Pressure Longitudinal Trajectory (Systolic / Diastolic)
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Reference: Severe Hypertension threshold at 160/110 mmHg, Mild at 140/90 mmHg
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1 text-red-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Systolic
                </span>
                <span className="flex items-center gap-1 text-teal-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> Diastolic
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              {chartData.length < 2 ? (
                <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
                  At least 2 readings required to display continuous trends. Current readings: {readings.length}.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                    <YAxis domain={[50, 190]} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-main)', fontSize: '12px' }} />
                    <ReferenceLine y={160} stroke="#DC2626" strokeDasharray="4 4" label={{ value: 'Critical Sys (160)', fill: '#DC2626', fontSize: 10 }} />
                    <ReferenceLine y={110} stroke="#DC2626" strokeDasharray="4 4" label={{ value: 'Critical Dia (110)', fill: '#DC2626', fontSize: 10 }} />
                    <ReferenceLine y={140} stroke="#D97706" strokeDasharray="3 3" label={{ value: 'Warning Sys (140)', fill: '#D97706', fontSize: 10 }} />
                    <Line type="monotone" dataKey="systolic" stroke="#DC2626" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="diastolic" stroke="#0D9488" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="card-base p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-extrabold text-[var(--text-main)]">
                  Maternal Heart Rate (Pulse bpm)
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Normal Range: 60 - 100 bpm. MEOWS Warning: &gt; 110 bpm.
                </p>
              </div>
            </div>

            <div className="h-52 w-full">
              {chartData.length < 2 ? (
                <div className="h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
                  Record additional vitals to plot heart rate progression.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                    <YAxis domain={[40, 150]} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-main)', fontSize: '12px' }} />
                    <ReferenceLine y={110} stroke="#D97706" strokeDasharray="3 3" label={{ value: 'Tachycardia (110)', fill: '#D97706', fontSize: 10 }} />
                    <Line type="monotone" dataKey="pulse" stroke="#6366F1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Unified Chronological Timeline */}
      {activeTab === 'timeline' && (
        <div className="card-base p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
            <span>Chronological Care Audit Trail</span>
            <span>{timelineItems.length} documented events</span>
          </div>

          <div className="relative border-l-2 border-[var(--border-main)] ml-3 sm:ml-4 pl-4 sm:pl-6 space-y-6">
            {timelineItems.map((item) => (
              <div key={item.id} className="relative group">
                {/* Node icon */}
                <div
                  className={`w-6 h-6 rounded-full border-2 border-[var(--bg-surface)] absolute -left-[27px] sm:-left-[35px] top-0 flex items-center justify-center text-[10px] font-bold ${
                    item.severity === 'critical'
                      ? 'bg-red-500 text-white shadow-xs'
                      : item.severity === 'warning'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : item.type === 'referral'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : item.type === 'task'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-[var(--primary)] text-white shadow-xs'
                  }`}
                >
                  {item.type === 'reading' ? <Activity className="w-3 h-3" /> : item.type === 'alert' ? <AlertTriangle className="w-3 h-3" /> : item.type === 'escalation' ? <ArrowUpRight className="w-3 h-3" /> : item.type === 'referral' ? <Truck className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                </div>

                {/* Event Card */}
                <div className="p-3.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] text-xs space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-extrabold text-[var(--text-main)] text-sm">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] font-mono">
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-[var(--text-muted)] leading-relaxed">
                    {item.details}
                  </p>

                  <div className="pt-1 flex items-center gap-2 text-[11px] text-[var(--text-muted)] font-medium">
                    <span>Actor: <strong>{item.actor}</strong> {item.actorRole && `(${item.actorRole})`}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Rule Alerts */}
      {activeTab === 'alerts' && (
        <div className="space-y-3">
          {alerts.map((alt) => (
            <div key={alt.id} className="card-base p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <SeverityBadge severity={alt.severity} size="sm" />
                  <span className="font-bold text-sm text-[var(--text-main)]">{alt.ruleName}</span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {new Date(alt.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs font-semibold text-[var(--text-main)] mt-1">
                  {alt.triggerSummary}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {alt.plainExplanation}
                </p>
                {alt.acknowledged && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                    <CheckCircle2 className="w-3 h-3" /> Acknowledged by {alt.acknowledgedBy} at {new Date(alt.acknowledgedAt || '').toLocaleTimeString()}
                  </span>
                )}
              </div>

              {!alt.acknowledged && (
                <button
                  type="button"
                  onClick={() => handleAcknowledgeAlert(alt.id)}
                  className="btn-primary !py-1.5 !px-3 text-xs shrink-0"
                >
                  Acknowledge
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Tasks */}
      {activeTab === 'tasks' && (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`card-base p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                task.status === 'overdue' ? 'border-red-500 bg-red-500/5' : ''
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[var(--text-main)]">{task.title}</span>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      task.status === 'overdue'
                        ? 'bg-red-500 text-white'
                        : task.status === 'completed'
                        ? 'badge-stable'
                        : 'badge-warning'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {task.description}
                </p>
                <div className="text-[11px] text-[var(--text-muted)] mt-1">
                  Assigned to: <strong>{task.assignedTo}</strong> • Due: {new Date(task.dueDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
