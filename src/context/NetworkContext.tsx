import React, { createContext, useContext, useState, useEffect } from 'react';
import { syncService } from '../db/syncService';
import { useAuth } from './AuthContext';

interface NetworkContextType {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  toggleSimulateOffline: () => void;
  pendingCount: number;
  lastSyncedText: string;
  isSyncing: boolean;
  syncNow: () => Promise<{ success: boolean; pushedCount: number; pulledCount: number; message?: string }>;
  isSyncModalOpen: boolean;
  openSyncModal: () => void;
  closeSyncModal: () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [realOnline, setRealOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<Date>(new Date());
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);

  const isOnline = realOnline && !isSimulatedOffline;

  const refreshPendingCount = async () => {
    try {
      const count = await syncService.getPendingQueueCount();
      setPendingCount(count);
    } catch (e) {
      console.error('Error fetching pending queue count', e);
    }
  };

  useEffect(() => {
    const handleOnline = () => setRealOnline(true);
    const handleOffline = () => setRealOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Subscribe to sync queue changes
    const unsubscribe = syncService.subscribe(() => {
      refreshPendingCount();
    });

    refreshPendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  // Auto-sync when reconnecting online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      console.log('Online connection active and pending items detected, triggering auto-sync...');
      syncNow();
    }
  }, [isOnline]);

  const toggleSimulateOffline = () => {
    setIsSimulatedOffline(prev => !prev);
  };

  const syncNow = async () => {
    setIsSyncing(true);
    const deviceName = `${profile.title} Device (${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'})`;
    const result = await syncService.performSync(profile.name, deviceName, isOnline);
    setIsSyncing(false);
    if (result.success) {
      setLastSyncedTime(new Date());
      await refreshPendingCount();
    }
    return result;
  };

  const getLastSyncedText = (): string => {
    const diffSec = Math.floor((Date.now() - lastSyncedTime.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours} hr ago`;
  };

  return (
    <NetworkContext.Provider
      value={{
        isOnline,
        isSimulatedOffline,
        toggleSimulateOffline,
        pendingCount,
        lastSyncedText: getLastSyncedText(),
        isSyncing,
        syncNow,
        isSyncModalOpen,
        openSyncModal: () => setIsSyncModalOpen(true),
        closeSyncModal: () => setIsSyncModalOpen(false)
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};
