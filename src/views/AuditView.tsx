import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Download, 
  ShieldCheck, 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import { localDb } from '../db/localDb';
import type { AuditLog } from '../types';

export const AuditView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const loadAuditLogs = async () => {
    try {
      const list = await localDb.auditLogs.reverse().sortBy('timestamp');
      setLogs(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (roleFilter !== 'all' && !log.role.toLowerCase().includes(roleFilter.toLowerCase())) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches = 
        log.actor.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        (log.patientName && log.patientName.toLowerCase().includes(q));
      if (!matches) return false;
    }
    return true;
  });

  const handleExportCsv = () => {
    const csvRows = [
      ['Timestamp', 'Actor', 'Role', 'Facility', 'Action', 'Patient', 'Details', 'Online Status', 'Device'],
      ...logs.map(l => [
        l.timestamp,
        l.actor,
        l.role,
        l.facility,
        `"${l.action.replace(/"/g, '""')}"`,
        l.patientName || 'N/A',
        `"${l.details.replace(/"/g, '""')}"`,
        l.online ? 'Online' : 'Offline',
        `"${l.device.replace(/"/g, '""')}"`
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `caresync_audit_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="card-base p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[var(--text-main)]">
              Immutable Clinical Audit Trail
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Every vital recorded, rule alert triggered, escalation, and referral transition is permanently stamped
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="btn-primary !py-2 !px-3 text-xs font-bold"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Audit Log (CSV)</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="card-base p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase tracking-wider text-[var(--text-muted)]">Filter Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="p-2 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] text-xs text-[var(--text-main)] outline-none"
          >
            <option value="all">All Roles</option>
            <option value="nurse">Nurse / ANM</option>
            <option value="doctor">PHC Doctor</option>
            <option value="hospital">Hospital Staff</option>
            <option value="system">System / Sync</option>
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search action, actor, patient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] text-xs text-[var(--text-main)] outline-none focus:border-[var(--primary)]"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card-base overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-main)] bg-black/5 dark:bg-white/5 text-[var(--text-muted)] font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Time</th>
                <th className="p-3.5">Actor &amp; Facility</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Patient</th>
                <th className="p-3.5">Details</th>
                <th className="p-3.5 text-right">Device &amp; Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-main)]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[var(--text-muted)]">
                    No audit records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="p-3.5 font-mono whitespace-nowrap text-[var(--text-muted)]">
                      <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                      <div className="text-[10px] text-[var(--text-main)] font-semibold">{new Date(log.timestamp).toLocaleTimeString()}</div>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-bold text-[var(--text-main)]">{log.actor}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{log.role} • {log.facility}</div>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      <span className="font-extrabold text-[var(--text-main)] px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 border border-[var(--border-main)]">
                        {log.action}
                      </span>
                    </td>

                    <td className="p-3.5 whitespace-nowrap">
                      {log.patientName ? (
                        <span className="font-semibold text-[var(--primary)]">{log.patientName}</span>
                      ) : (
                        <span className="text-[var(--text-muted)]">N/A</span>
                      )}
                    </td>

                    <td className="p-3.5 text-[var(--text-muted)] max-w-xs sm:max-w-md truncate">
                      {log.details}
                    </td>

                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 font-semibold text-[11px]">
                        {log.online ? (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Wifi className="w-3 h-3" /> Online
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <WifiOff className="w-3 h-3" /> Offline
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)]">{log.device}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
