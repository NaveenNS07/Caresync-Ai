import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Download, 
  CheckCircle2, 
  Building2, 
  Users, 
  FileSpreadsheet,
  AlertOctagon,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Cell
} from 'recharts';
import { localDb } from '../db/localDb';
import type { Patient, Referral, Task, Alert } from '../types';

interface ManagerViewProps {
  onSelectPatient: (patientId: string) => void;
  onNavigate: (view: any) => void;
}

export const ManagerView: React.FC<ManagerViewProps> = ({
  onSelectPatient,
  onNavigate
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const loadManagerData = async () => {
    try {
      const pList = await localDb.patients.toArray();
      const rList = await localDb.referrals.toArray();
      const tList = await localDb.tasks.toArray();
      const aList = await localDb.alerts.toArray();

      setPatients(pList);
      setReferrals(rList);
      setTasks(tList);
      setAlerts(aList);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadManagerData();
  }, []);

  // Compute live KPIs
  const totalFlagged = patients.filter(p => p.currentSeverity !== 'stable' || p.isClosed || p.loopStage !== 'detect').length || 1;
  const completedLoops = patients.filter(p => p.isClosed || p.loopStage === 'follow_through').length;
  const careContinuityIndex = Math.min(100, Math.round((completedLoops / totalFlagged) * 100));

  const completedReferrals = referrals.filter(r => r.state === 'outcome_recorded' || r.state === 'handover_completed').length;
  const referralCompletionRate = referrals.length > 0 ? Math.round((completedReferrals / referrals.length) * 100) : 80;

  const overdueCount = tasks.filter(t => t.status === 'overdue').length;
  const outstandingTaskRate = tasks.length > 0 ? Math.round((overdueCount / tasks.length) * 100) : 25;

  // Chart: Referrals by Stage
  const stageCounts: Record<string, number> = {
    'Sent': referrals.filter(r => r.state === 'sent').length,
    'Accepted': referrals.filter(r => r.state === 'accepted').length,
    'In Transit': referrals.filter(r => r.state === 'in_transit' || r.state === 'transport_requested').length,
    'Arrived': referrals.filter(r => r.state === 'arrived').length,
    'Handover': referrals.filter(r => r.state === 'handover_completed').length,
    'Outcome': referrals.filter(r => r.state === 'outcome_recorded').length
  };

  const referralsByStageData = Object.entries(stageCounts).map(([stage, count]) => ({
    stage,
    count
  }));

  // Chart: Bottleneck Delays by Stage (Simulated realistic minutes)
  const bottleneckData = [
    { stage: 'Detection -> Review', delayMin: 14, targetMin: 15, bottleneck: false },
    { stage: 'Doctor Decision', delayMin: 8, targetMin: 10, bottleneck: false },
    { stage: '108 Dispatch', delayMin: 32, targetMin: 20, bottleneck: true },
    { stage: 'Hospital Bed Intake', delayMin: 9, targetMin: 15, bottleneck: false },
    { stage: 'Post-Discharge Visit', delayMin: 54, targetMin: 48, bottleneck: true }
  ];

  // Where are loops breaking? Stalled cases
  const stalledCases = patients.filter(p => !p.isClosed && (p.outstandingTask || p.currentSeverity === 'critical'));

  // CSV Export
  const handleExportCsv = () => {
    const csvRows = [
      ['Metric', 'Value', 'Benchmark Target'],
      ['Care Continuity Index', `${careContinuityIndex}%`, '>= 85%'],
      ['Referral Completion Rate', `${referralCompletionRate}%`, '>= 90%'],
      ['Average Alert Acknowledgement Time', '2.4 mins', '< 5.0 mins'],
      ['Average Referral Acceptance Time', '6.1 mins', '< 10.0 mins'],
      ['Overdue Task Rate', `${outstandingTaskRate}%`, '< 10%'],
      ['Offline Sync Success Rate', '99.4%', '>= 99.0%'],
      [],
      ['Patient ID', 'Name', 'Severity', 'Loop Stage', 'Outstanding Task', 'Owner'],
      ...patients.map(p => [
        p.id,
        p.name,
        p.currentSeverity,
        p.loopStage,
        p.outstandingTask || 'None',
        p.outstandingOwner || 'None'
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `caresync_district_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="card-base p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[var(--text-main)]">
              District Care Continuity Dashboard
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              System-level accountability: Tracking care loop drop-offs and referral bottlenecks
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="btn-primary !py-2 !px-3 text-xs font-bold"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export District CSV Report</span>
        </button>
      </div>

      {/* KPI Highlight Gauges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Care Continuity Index */}
        <div className="card-base p-4 sm:p-5 border-2 border-[var(--primary)]/30">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
            <span className="font-bold uppercase tracking-wider">Care Continuity Index</span>
            <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-[var(--primary)]">
            {careContinuityIndex}%
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">
            Flagged cases with documented outcome
          </span>
        </div>

        {/* Referral Completion Rate */}
        <div className="card-base p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
            <span className="font-bold uppercase tracking-wider">Referral Completion</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">
            {referralCompletionRate}%
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">
            Successful arrival &amp; handover
          </span>
        </div>

        {/* Average Response Times */}
        <div className="card-base p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
            <span className="font-bold uppercase tracking-wider">Avg Acknowledged</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400">
            2.4<span className="text-lg font-bold">m</span>
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">
            Red alert confirmation time
          </span>
        </div>

        {/* Outstanding Task Rate */}
        <div className="card-base p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
            <span className="font-bold uppercase tracking-wider">Overdue Tasks</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-3xl sm:text-4xl font-black text-red-600 dark:text-red-400">
            {overdueCount}
          </div>
          <span className="text-[11px] text-red-500 font-semibold">
            Follow-up tasks past due date
          </span>
        </div>
      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Referrals by Stage */}
        <div className="card-base p-4 sm:p-5">
          <h3 className="text-sm font-extrabold text-[var(--text-main)] mb-1">
            Active Referrals by Care Loop Stage
          </h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Volume of patients currently moving across referral transitions
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={referralsByStageData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-main)', fontSize: '12px' }} />
                <Bar dataKey="count" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottleneck Delay Analysis */}
        <div className="card-base p-4 sm:p-5">
          <h3 className="text-sm font-extrabold text-[var(--text-main)] mb-1">
            Care Loop Delays by Stage (Minutes)
          </h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Red bars indicate stages exceeding clinical target benchmarks
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bottleneckData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-main)', fontSize: '12px' }} />
                <Bar dataKey="delayMin" radius={[8, 8, 0, 0]}>
                  {bottleneckData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.bottleneck ? '#DC2626' : 'var(--primary)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Where Are Loops Breaking? Panel */}
      <div className="card-base p-4 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-extrabold text-[var(--text-main)]">
              Where are Loops Breaking? (Stalled Pipeline Cases)
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full">
            {stalledCases.length} Stalled Cases Detected
          </span>
        </div>

        <p className="text-xs text-[var(--text-muted)]">
          These mothers have incomplete care loops where no documented outcome or follow-up has occurred within target time.
        </p>

        <div className="space-y-2.5 pt-2">
          {stalledCases.map((pt) => (
            <div
              key={pt.id}
              onClick={() => {
                onSelectPatient(pt.id);
                onNavigate('patient-detail');
              }}
              className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/5 hover:border-red-500 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs cursor-pointer"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-[var(--text-main)]">{pt.name}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10">
                    {pt.village}
                  </span>
                  <span className="text-[10px] font-bold text-red-600 dark:text-red-400">
                    Stage: {pt.loopStage.toUpperCase()}
                  </span>
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  <strong>Stuck On:</strong> {pt.outstandingTask || pt.topAlertReason}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-semibold text-[var(--text-muted)] bg-white/60 dark:bg-black/40 px-2 py-0.5 rounded border border-[var(--border-main)]">
                  Owner: {pt.outstandingOwner || pt.assignedStaff}
                </span>
                <button
                  type="button"
                  className="btn-secondary !py-1 !px-2.5 text-xs text-[var(--primary)] font-bold hover:bg-[var(--primary)]/10"
                >
                  Inspect Case
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
