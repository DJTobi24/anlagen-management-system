import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useSync } from '../contexts/SyncContext';

export default function SyncIndicator() {
  const { isSyncing } = useSync();

  if (!isSyncing) return null;

  return (
    <div className="sync-indicator">
      <RefreshCw className="h-4 w-4 animate-spin" />
      <span>Synchronisiere...</span>
    </div>
  );
}