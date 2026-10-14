import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Database, CheckCircle2, Clock, Smartphone, AlertTriangle } from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';
import { syncService } from '../../db/syncService';
import type { SyncQueueItem } from '../../types';

export const SyncPanelModal: React.FC = () => {
  const { isSyncModalOpen, closeSyncModal, isOnline, syncNow, isSyncing } = useNetwork();
  const [queueItems, setQueueItems] = useState<SyncQueueItem[]>([]);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const loadItems = async () => {
    try {
      const items = await syncService.getAllQueueItems();
      setQueueItems(items);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isSyncModalOpen) {
      loadItems();
    }
  }, [isSyncModalOpen]);

  if (!isSyncModalOpen) return null;

  const handleSyncClick = async () => {
    setSyncStatusMsg(null);
    const result = await syncNow();
    if (result.success) {
      setSyncStatusMsg(`Successfully synced: Pushed ${result.pushedCount} items, Pulled ${result.pulledCount} updates.`);
      await loadItems();
    } else {
      setSyncStatusMsg(result.message || 'Sync failed. Please check network.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="card-base w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-main)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-main)]">
                Offline Sync & Queue Manager
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Local IndexedDB &lt;-&gt; Simulated Cloud Server
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeSyncModal}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* Status summary */}
          <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border-main)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-xs font-semibold">
                Network: <strong>{isOnline ? 'Connected (Simulated Cloud Reachable)' : 'Offline (Local Writes Buffered)'}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleSyncClick}
              disabled={!isOnline || isSyncing}
              className="btn-primary !py-1.5 !px-3 text-xs font-bold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>

          {syncStatusMsg && (
            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-[var(--primary)] font-medium">
              {syncStatusMsg}
            </div>
          )}

          {/* Queue Items List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
              Sync Queue History ({queueItems.length} records)
            </h3>
            {queueItems.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-muted)] text-xs">
                No sync events yet. When offline, all clinical observations are buffered here before two-way cloud reconciliation.
              </div>
            ) : (
              <div className="space-y-2">
                {queueItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] flex items-start justify-between gap-2 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--text-main)]">{item.action}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10 text-[var(--text-muted)]">
                          {item.entityType}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2">
                        <span>User: {item.user}</span>
                        <span>•</span>
                        <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {item.synced ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Synced
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full animate-pulse">
                          <Clock className="w-3 h-3" /> Pending Sync
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-main)] bg-black/5 dark:bg-white/5 flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" /> Append-only storage: Clinical data is never overwritten.
          </span>
          <button
            type="button"
            onClick={closeSyncModal}
            className="btn-secondary !py-1 !px-3 text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
