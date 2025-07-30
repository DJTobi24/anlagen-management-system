import React from 'react';
import { WifiOff } from 'lucide-react';
import { useSync } from '../contexts/SyncContext';

export default function OfflineIndicator() {
  const { isOnline } = useSync();

  if (isOnline) return null;

  return (
    <div className="offline-indicator">
      <div className="flex items-center justify-center space-x-2">
        <WifiOff className="h-4 w-4" />
        <span>Offline - Änderungen werden lokal gespeichert</span>
      </div>
    </div>
  );
}