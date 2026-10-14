import React from 'react';
import { Wifi, WifiOff, RefreshCw, Database, Clock } from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';
import { useLanguage } from '../../context/LanguageContext';

export const GlobalStatusBar: React.FC = () => {
  const {
    isOnline,
    isSimulatedOffline,
    toggleSimulateOffline,
    pendingCount,
    lastSyncedText,
    isSyncing,
    syncNow,
    openSyncModal
  } = useNetwork();
  const { t } = useLanguage();

  return (
    <div className="bg-[var(--bg-surface)] border-b border-[var(--border-main)] px-3 sm:px-6 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-xs z-30 transition-colors">
      {/* Left: Connection status & Queue counter */}
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
        {/* Connection status badge */}
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold border ${
            isOnline
              ? 'badge-stable'
              : 'badge-warning'
          }`}
          role="status"
          aria-label={isOnline ? t.statusOnline : t.statusOffline}
        >
          {isOnline ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[var(--sev-stable)] animate-ping" />
              <Wifi className="w-3.5 h-3.5" />
              <span>{t.statusOnline}</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>{t.statusOffline} {isSimulatedOffline && '(Simulated)'}</span>
            </>
          )}
        </div>

        {/* Sync queue count badge (Clickable to open sync panel) */}
        <button
          type="button"
          onClick={openSyncModal}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all text-xs font-medium cursor-pointer ${
            pendingCount > 0
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-500/20'
              : 'bg-black/5 dark:bg-white/5 border-[var(--border-main)] text-[var(--text-muted)] hover:border-[var(--primary)]'
          }`}
          title="Open Offline Sync Queue"
        >
          <Database className="w-3.5 h-3.5" />
          <span>{pendingCount} {t.itemsWaiting}</span>
        </button>

        {/* Last synced label */}
        <div className="hidden md:flex items-center gap-1 text-[var(--text-muted)]">
          <Clock className="w-3 h-3" />
          <span>{t.lastSynced}: {lastSyncedText}</span>
        </div>
      </div>

      {/* Right: Quick Sync + Demo Offline Toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Sync Now button */}
        <button
          type="button"
          onClick={() => syncNow()}
          disabled={!isOnline || isSyncing}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
            !isOnline
              ? 'opacity-40 border-[var(--border-main)] cursor-not-allowed text-[var(--text-muted)]'
              : 'border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/10'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{t.btnSyncNow}</span>
        </button>

        {/* Demo Simulate Offline Switch */}
        <label className="flex items-center gap-2 cursor-pointer select-none bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-[var(--border-main)] hover:border-[var(--primary)] transition-all">
          <input
            type="checkbox"
            checked={isSimulatedOffline}
            onChange={toggleSimulateOffline}
            className="w-3.5 h-3.5 rounded text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
          />
          <span className="text-[11px] sm:text-xs font-semibold text-[var(--text-muted)]">
            {t.simulateOffline}
          </span>
        </label>
      </div>
    </div>
  );
};
