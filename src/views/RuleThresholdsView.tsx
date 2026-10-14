import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Lock, 
  Save, 
  RefreshCw,
  ThumbsDown
} from 'lucide-react';
import { localDb } from '../db/localDb';
import { syncService } from '../db/syncService';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { defaultRules } from '../rules/defaultRules';
import { useAuth } from '../context/AuthContext';
import { useNetwork } from '../context/NetworkContext';
import type { ClinicalRule, Alert } from '../types';

export const RuleThresholdsView: React.FC = () => {
  const { profile, currentRole } = useAuth();
  const { isOnline } = useNetwork();

  const [rules, setRules] = useState<ClinicalRule[]>([]);
  const [feedbackAlerts, setFeedbackAlerts] = useState<Alert[]>([]);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const isDoctor = currentRole === 'doctor';

  const loadRules = async () => {
    try {
      const dbRules = await localDb.rules.toArray();
      if (dbRules.length > 0) {
        setRules(dbRules);
      } else {
        setRules(defaultRules);
      }

      const allAlerts = await localDb.alerts.toArray();
      const nonUseful = allAlerts.filter(a => a.isUseful === false);
      setFeedbackAlerts(nonUseful);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleUpdateParameter = (ruleId: string, paramKey: string, value: number) => {
    if (!isDoctor) return;
    setRules(prev =>
      prev.map(r => {
        if (r.id === ruleId) {
          return {
            ...r,
            parameters: {
              ...r.parameters,
              [paramKey]: value
            }
          };
        }
        return r;
      })
    );
  };

  const handleSaveRules = async () => {
    if (!isDoctor) return;

    for (const rule of rules) {
      const updated = {
        ...rule,
        lastModifiedBy: profile.name,
        lastModifiedAt: new Date().toISOString()
      };
      await localDb.rules.put(updated);
    }

    await syncService.enqueueAction({
      user: profile.name,
      device: `${profile.title} Device`,
      action: 'Updated MEOWS Clinical Rule Thresholds',
      entityType: 'rule',
      payload: rules
    });

    await localDb.auditLogs.add({
      id: `AUD-RULE-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: profile.name,
      role: profile.title,
      facility: profile.facility,
      action: 'MEOWS Clinical Thresholds Modified',
      details: `Dr. Arun updated active threshold parameters in local rules engine.`,
      online: isOnline,
      device: `${profile.title} Workstation`
    });

    setSaveSuccessMsg('Clinical thresholds updated and activated across all local rules.');
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const handleResetDefaults = async () => {
    if (!isDoctor) return;
    setRules(defaultRules);
    for (const r of defaultRules) {
      await localDb.rules.put(r);
    }
    setSaveSuccessMsg('Reset all rules to default MEOWS recommendations.');
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="card-base p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[var(--text-main)]">
              MEOWS Rules Engine &amp; Threshold Configuration
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Modified Early Obstetric Warning System: 100% Offline Deterministic Rules Engine
            </p>
          </div>
        </div>

        {isDoctor ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="btn-secondary !py-2 !px-3 text-xs"
            >
              Reset Defaults
            </button>
            <button
              type="button"
              onClick={handleSaveRules}
              className="btn-primary !py-2 !px-3 text-xs font-bold"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-[var(--border-main)]">
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>Threshold editing restricted to PHC Doctor role</span>
          </div>
        )}
      </div>

      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-xs text-[var(--primary)] font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-3.5">
        {rules.map((rule) => {
          return (
            <div
              key={rule.id}
              className="card-base p-4 sm:p-5 space-y-2.5 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-main)] pb-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/5 dark:bg-white/5">
                    {rule.id}
                  </span>
                  <SeverityBadge severity={rule.severity} size="sm" />
                  <span className="font-extrabold text-sm sm:text-base text-[var(--text-main)]">
                    {rule.name}
                  </span>
                </div>

                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-[var(--text-muted)]">
                  Category: {rule.category}
                </span>
              </div>

              <p className="text-xs text-[var(--text-main)] font-semibold">
                {rule.description}
              </p>

              <div className="p-2.5 rounded-xl bg-teal-500/5 border border-teal-500/15 text-xs text-[var(--text-muted)]">
                <strong>Plain Clinical Rationale:</strong> {rule.plainRationale}
              </div>

              {/* Editable parameters (if doctor) */}
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
                {rule.parameters.systolicMin !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <label htmlFor={`sys-min-${rule.id}`} className="font-bold text-[var(--text-muted)]">Systolic &gt;=</label>
                    <input
                      id={`sys-min-${rule.id}`}
                      type="number"
                      disabled={!isDoctor}
                      value={rule.parameters.systolicMin}
                      onChange={(e) => handleUpdateParameter(rule.id, 'systolicMin', Number(e.target.value))}
                      className="w-16 p-1 rounded-lg border border-[var(--border-main)] bg-[var(--bg-main)] font-bold text-center text-xs"
                    />
                    <span className="text-[var(--text-muted)]">mmHg</span>
                  </div>
                )}

                {rule.parameters.diastolicMin !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <label htmlFor={`dia-min-${rule.id}`} className="font-bold text-[var(--text-muted)]">Diastolic &gt;=</label>
                    <input
                      id={`dia-min-${rule.id}`}
                      type="number"
                      disabled={!isDoctor}
                      value={rule.parameters.diastolicMin}
                      onChange={(e) => handleUpdateParameter(rule.id, 'diastolicMin', Number(e.target.value))}
                      className="w-16 p-1 rounded-lg border border-[var(--border-main)] bg-[var(--bg-main)] font-bold text-center text-xs"
                    />
                    <span className="text-[var(--text-muted)]">mmHg</span>
                  </div>
                )}

                {rule.parameters.pulseMax !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <label htmlFor={`pulse-max-${rule.id}`} className="font-bold text-[var(--text-muted)]">Pulse &gt;</label>
                    <input
                      id={`pulse-max-${rule.id}`}
                      type="number"
                      disabled={!isDoctor}
                      value={rule.parameters.pulseMax}
                      onChange={(e) => handleUpdateParameter(rule.id, 'pulseMax', Number(e.target.value))}
                      className="w-16 p-1 rounded-lg border border-[var(--border-main)] bg-[var(--bg-main)] font-bold text-center text-xs"
                    />
                    <span className="text-[var(--text-muted)]">bpm</span>
                  </div>
                )}

                {rule.parameters.spo2Min !== undefined && (
                  <div className="flex items-center gap-1.5">
                    <label htmlFor={`spo2-min-${rule.id}`} className="font-bold text-[var(--text-muted)]">SpO2 &lt;</label>
                    <input
                      id={`spo2-min-${rule.id}`}
                      type="number"
                      disabled={!isDoctor}
                      value={rule.parameters.spo2Min}
                      onChange={(e) => handleUpdateParameter(rule.id, 'spo2Min', Number(e.target.value))}
                      className="w-16 p-1 rounded-lg border border-[var(--border-main)] bg-[var(--bg-main)] font-bold text-center text-xs"
                    />
                    <span className="text-[var(--text-muted)]">%</span>
                  </div>
                )}

                {rule.parameters.symptomsRequired && (
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Symptoms Required: <strong>{rule.parameters.symptomsRequired.join(', ')}</strong>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Logged Non-Useful Alert Feedback */}
      <div className="card-base p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ThumbsDown className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-extrabold text-[var(--text-main)]">
              Frontline Clinician Alert Feedback Log ({feedbackAlerts.length})
            </h3>
          </div>
          <span className="text-xs text-[var(--text-muted)]">
            Used by District Health Officer to tune false-positive alarm fatigue
          </span>
        </div>

        {feedbackAlerts.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">
            No alerts marked non-useful. Health workers can click "Not Useful" on any patient alert banner to log false positives.
          </p>
        ) : (
          <div className="space-y-2">
            {feedbackAlerts.map(alt => (
              <div key={alt.id} className="p-3 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-[var(--text-main)]">{alt.ruleName}</span>
                  <p className="text-[11px] text-[var(--text-muted)]">{alt.triggerSummary}</p>
                </div>
                <span className="badge-warning text-[10px] px-2 py-0.5 rounded font-mono">
                  Flagged False Positive
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
