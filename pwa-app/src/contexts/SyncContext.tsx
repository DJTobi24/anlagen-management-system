import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { syncManager, SyncResult } from '../utils/syncManager';

interface SyncContextType {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync?: Date;
  pendingSyncCount: number;
  syncNow: () => Promise<SyncResult>;
  downloadForOffline: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date>();
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  useEffect(() => {
    // Update sync status
    const updateSyncStatus = async () => {
      const status = await syncManager.getSyncStatus();
      setPendingSyncCount(status.pendingCount);
      setLastSync(status.lastSync);
    };

    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 5000); // Check every 5 seconds

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming online
      syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for service worker messages
    navigator.serviceWorker?.addEventListener('message', (event) => {
      if (event.data?.type === 'BACKGROUND_SYNC') {
        syncNow();
      }
    });

    // Register for sync updates
    const unsubscribe = syncManager.onSync((result) => {
      updateSyncStatus();
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  const syncNow = async (): Promise<SyncResult> => {
    if (isSyncing) {
      return { success: false, synced: 0, failed: 0, errors: ['Sync already in progress'] };
    }

    setIsSyncing(true);
    try {
      const result = await syncManager.syncAll();
      const status = await syncManager.getSyncStatus();
      setPendingSyncCount(status.pendingCount);
      setLastSync(status.lastSync);
      return result;
    } finally {
      setIsSyncing(false);
    }
  };

  const downloadForOffline = async () => {
    setIsSyncing(true);
    try {
      await syncManager.downloadForOffline();
      const status = await syncManager.getSyncStatus();
      setLastSync(status.lastSync);
    } finally {
      setIsSyncing(false);
    }
  };

  const value = {
    isOnline,
    isSyncing,
    lastSync,
    pendingSyncCount,
    syncNow,
    downloadForOffline,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}