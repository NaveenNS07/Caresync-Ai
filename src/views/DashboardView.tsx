import React, { useState, useEffect } from 'react';
import { 
  Users, 
  AlertTriangle, 
  Clock, 
  Truck, 
  CheckSquare, 
  Search, 
  Plus, 
  Activity, 
  Filter, 
  ChevronRight,
  UserCheck,
  Building,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { localDb } from '../db/localDb';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import type { Patient, Severity, CareLoopStage } from '../types';

interface DashboardViewProps {
  onNavigate: (view: any) => void;
  onSelectPatient: (patientId: string) => void;
  onOpenAddReading: (patientId?: string) => void;
  onOpenAddPatient: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onSelectPatient,
  onOpenAddReading,
  onOpenAddPatient
}) => {
  const { profile, currentRole } = useAuth();
  const { t } = useLanguage();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [filter, setFilter] = useState<'all' | 'needs_review' | 'referred' | 'followup_due' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [counts, setCounts] = useState({
    activeAlerts: 0,
    awaitingReview: 0,
    openReferrals: 0,
    overdueTasks: 0
  });

  const loadDashboardData = async () => {
    try {
      const allPatients = await localDb.patients.toArray();
      const allTasks = await localDb.tasks.toArray();
      const allReferrals = await localDb.referrals.toArray();
      const allEscalations = await localDb.escalations.toArray();

      setPatients(allPatients);

      // Calculate summary metrics
      const activeAlerts = allPatients.filter(p => p.currentSeverity === 'critical' || p.currentSeverity === 'warning').length;
      const awaitingReview = allEscalations.filter(e => e.status === 'pending').length;
      const openReferrals = allReferrals.filter(r => r.state !== 'outcome_recorded').length;
      const overdueTasks = allTasks.filter(t => t.status === 'overdue').length;

      setCounts({
        activeAlerts,
        awaitingReview,
        openReferrals,
        overdueTasks
      });
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Filter patients
  const filteredPatients = patients.filter(patient => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches = 
        patient.name.toLowerCase().includes(q) ||
        patient.id.toLowerCase().includes(q) ||
        patient.village.toLowerCase().includes(q);
      if (!matches) return false;
    }

    // Role-awareness: if hospital role, prioritize patients with referrals
    // Filter tabs
    if (filter === 'needs_review') {
      return patient.loopStage === 'prioritize' || patient.loopStage === 'explain';
    }
    if (filter === 'referred') {
      return patient.loopStage === 'coordinate';
    }
    if (filter === 'followup_due') {
      return patient.loopStage === 'follow_through' && !patient.isClosed;
    }
    if (filter === 'overdue') {
      return patient.outstandingTask?.includes('OVERDUE') || patient.topAlertReason?.includes('SILENT PATIENT');
    }

    return true;
  });

  // Sort: Critical (Red) first -> Warning (Amber) -> Stable (Green) -> Wait time
  const severityRank: Record<Severity, number> = {
    critical: 1,
    warning: 2,
    info: 3,
    stable: 4
  };

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    const rankDiff = severityRank[a.currentSeverity] - severityRank[b.currentSeverity];
    if (rankDiff !== 0) return rankDiff;
    return new Date(b.lastReadingAt).getTime() - new Date(a.lastReadingAt).getTime();
  });

  const getStageChip = (stage: CareLoopStage, isClosed?: boolean) => {
    if (isClosed) {
      return (
        <span className="badge-stable text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Closed
        </span>
      );
    }
    const chips: Record<CareLoopStage, { label: string; class: string }> = {
      detect: { label: '1. Detect', class: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' },
      explain: { label: '2. Explain', class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' },
      prioritize: { label: '3. Prioritize', class: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' },
      coordinate: { label: '4. Coordinate', class: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' },
      follow_through: { label: '5. Follow Through', class: 'bg-teal-500/10 text-[var(--primary)] border border-teal-500/20' }
    };
    const c = chips[stage] || chips.detect;
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.class}`}>
        {c.label}
      </span>
    );
  };

  const getTimeWaiting = (dateStr?: string) => {
    if (!dateStr) return 'Just now';
    const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60));
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-5 animate-fadeIn">
      {/* Role Context Welcome Banner */}
      <div className="card-base p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-teal-500/5 to-indigo-500/5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black text-[var(--text-main)]">
              {profile.name} • {profile.title}
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-[var(--primary)] border border-teal-500/20">
              {profile.facility}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {profile.description}
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onOpenAddPatient}
            className="btn-secondary !py-2 !px-3 text-xs font-bold"
          >
            <Plus className="w-4 h-4 text-[var(--primary)]" />
            <span>{t.btnAddPatient}</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenAddReading('PT-101')}
            className="btn-primary !py-2 !px-3 text-xs font-bold"
          >
            <Activity className="w-4 h-4" />
            <span>{t.btnAddReading}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Active Alerts */}
        <button
          type="button"
          onClick={() => setFilter('all')}
          className="card-base p-3.5 sm:p-4 text-left transition-all hover:scale-[1.01] hover:border-red-500/40 cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
            <span className="font-bold uppercase tracking-wider">Active Alerts</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400">
            {counts.activeAlerts}
          </div>
          <span className="text-[10px] text-[var(--text-muted)]">Danger signs flagged</span>
        </button>

        {/* Awaiting Review */}
        <button
          type="button"
          onClick={() => onNavigate('escalations')}
          className="card-base p-3.5 sm:p-4 text-left transition-all hover:scale-[1.01] hover:border-amber-500/40 cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
            <span className="font-bold uppercase tracking-wider">Awaiting Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            {counts.awaitingReview}
          </div>
          <span className="text-[10px] text-[var(--text-muted)]">Senior SBAR escalations</span>
        </button>

        {/* Open Referrals */}
        <button
          type="button"
          onClick={() => onNavigate('referrals')}
          className="card-base p-3.5 sm:p-4 text-left transition-all hover:scale-[1.01] hover:border-indigo-500/40 cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
            <span className="font-bold uppercase tracking-wider">Open Referrals</span>
            <Truck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
            {counts.openReferrals}
          </div>
          <span className="text-[10px] text-[var(--text-muted)]">Cross-facility transfers</span>
        </button>

        {/* Overdue Tasks */}
        <button
          type="button"
          onClick={() => {
            setFilter('overdue');
            onNavigate('tasks');
          }}
          className="card-base p-3.5 sm:p-4 text-left transition-all hover:scale-[1.01] hover:border-red-500/40 cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
            <span className="font-bold uppercase tracking-wider">Overdue Tasks</span>
            <CheckSquare className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400">
            {counts.overdueTasks}
          </div>
          <span className="text-[10px] text-red-500 font-semibold">Immediate attention</span>
        </button>
      </div>

      {/* Priority Queue Section */}
      <div className="card-base p-4 sm:p-5 space-y-4">
        {/* Controls: Filter Pills & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
            {[
              { id: 'all', label: 'All Patients' },
              { id: 'needs_review', label: 'Needs Review' },
              { id: 'referred', label: 'Referred' },
              { id: 'followup_due', label: 'Follow-up Due' },
              { id: 'overdue', label: 'Overdue / Silent' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  filter === tab.id
                    ? 'bg-[var(--primary)] text-white shadow-xs'
                    : 'text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, ID, village..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] text-xs text-[var(--text-main)] outline-none focus:border-[var(--primary)]"
            />
          </div>
        </div>

        {/* Priority Patient List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold px-1 uppercase tracking-wider">
            <span>Priority Queue ({sortedPatients.length} mothers)</span>
            <span>Sorted by Severity &amp; Time Waiting</span>
          </div>

          {sortedPatients.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)] text-xs">
              No patients match current filters.
            </div>
          ) : (
            sortedPatients.map((patient) => {
              const isHero = patient.id === 'PT-101';
              return (
                <div
                  key={patient.id}
                  onClick={() => {
                    onSelectPatient(patient.id);
                    onNavigate('patient-detail');
                  }}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    patient.currentSeverity === 'critical'
                      ? 'border-red-500/50 bg-red-500/5 hover:border-red-500 hover:shadow-md'
                      : patient.currentSeverity === 'warning'
                      ? 'border-amber-500/50 bg-amber-500/5 hover:border-amber-500 hover:shadow-md'
                      : 'border-[var(--border-main)] bg-[var(--bg-surface)] hover:border-[var(--primary)] hover:shadow-sm'
                  }`}
                >
                  {/* Left: Demographics & Severity Badge */}
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        patient.currentSeverity === 'critical'
                          ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                          : patient.currentSeverity === 'warning'
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                          : 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      }`}
                    >
                      {patient.name.substring(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm sm:text-base text-[var(--text-main)]">
                          {patient.name}
                        </span>
                        {isHero && (
                          <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                            Hero Case
                          </span>
                        )}
                        <SeverityBadge severity={patient.currentSeverity} size="sm" />
                        {getStageChip(patient.loopStage, patient.isClosed)}
                      </div>

                      <div className="text-xs text-[var(--text-muted)] mt-1 flex flex-wrap items-center gap-2">
                        <span>{patient.age}y</span>
                        <span>•</span>
                        <span>{patient.gestationWeeks} weeks ({patient.parity})</span>
                        <span>•</span>
                        <span>Village: {patient.village}</span>
                        <span>•</span>
                        <span>ASHA: {patient.ashaWorker}</span>
                      </div>

                      {/* Top Alert Reason or Outstanding Task */}
                      {patient.topAlertReason && (
                        <div className="text-xs font-semibold text-red-600 dark:text-red-400 mt-1 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{patient.topAlertReason}</span>
                        </div>
                      )}

                      {!patient.isClosed && patient.outstandingTask && (
                        <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                          <strong>Outstanding:</strong> {patient.outstandingTask}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Staff Assignment, Waiting Time, and Action Button */}
                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--border-main)]">
                    <div className="text-left md:text-right text-xs">
                      <div className="text-[var(--text-muted)] flex items-center md:justify-end gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Flagged {getTimeWaiting(patient.flaggedAt || patient.lastReadingAt)}</span>
                      </div>
                      <div className="font-semibold text-[var(--text-main)] text-[11px] mt-0.5">
                        Assigned: {patient.assignedStaff}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAddReading(patient.id);
                        }}
                        className="btn-secondary !py-1.5 !px-2.5 text-xs font-bold"
                        title="Add Reading"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Reading</span>
                      </button>

                      <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
