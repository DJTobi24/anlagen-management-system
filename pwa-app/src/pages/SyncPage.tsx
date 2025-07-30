import React, { useState } from 'react';
import { RefreshCw, Cloud, CloudOff, CheckCircle, AlertCircle, Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useSync } from '../contexts/SyncContext';
import { syncManager } from '../utils/syncManager';
import { db } from '../db/database';

export default function SyncPage() {
  const { isOnline, isSyncing, lastSync, pendingSyncCount, syncNow, downloadForOffline } = useSync();
  const [syncResult, setSyncResult] = useState<any>(null);
  const [clearingData, setClearingData] = useState(false);

  const handleSync = async () => {
    setSyncResult(null);
    const result = await syncNow();
    setSyncResult(result);
  };

  const handleDownloadForOffline = async () => {
    try {
      await downloadForOffline();
      setSyncResult({
        success: true,
        message: 'Daten erfolgreich für Offline-Nutzung heruntergeladen',
      });
    } catch (error: any) {
      setSyncResult({
        success: false,
        errors: [error.message],
      });
    }
  };

  const handleClearData = async () => {
    if (!window.confirm('Möchten Sie wirklich alle lokalen Daten löschen? Dies kann nicht rückgängig gemacht werden.')) {
      return;
    }

    setClearingData(true);
    try {
      await db.clearAllData();
      setSyncResult({
        success: true,
        message: 'Alle lokalen Daten wurden gelöscht',
      });
    } catch (error: any) {
      setSyncResult({
        success: false,
        errors: ['Fehler beim Löschen der Daten'],
      });
    } finally {
      setClearingData(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Synchronisation</h2>

      {/* Connection Status */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Verbindungsstatus</h3>
          <div className={`flex items-center space-x-2 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
            {isOnline ? (
              <>
                <Cloud className="h-5 w-5" />
                <span className="text-sm font-medium">Online</span>
              </>
            ) : (
              <>
                <CloudOff className="h-5 w-5" />
                <span className="text-sm font-medium">Offline</span>
              </>
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Letzte Synchronisation:</span>
            <span className="text-gray-900">
              {lastSync
                ? format(lastSync, 'dd.MM.yyyy HH:mm', { locale: de })
                : 'Noch nie synchronisiert'
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Ausstehende Änderungen:</span>
            <span className={`font-medium ${pendingSyncCount > 0 ? 'text-orange-600' : 'text-gray-900'}`}>
              {pendingSyncCount}
            </span>
          </div>
        </div>
      </div>

      {/* Sync Result */}
      {syncResult && (
        <div className={`card ${syncResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-start space-x-3">
            {syncResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              {syncResult.message && (
                <p className={`text-sm font-medium ${syncResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {syncResult.message}
                </p>
              )}
              {syncResult.synced !== undefined && (
                <p className="text-sm text-green-700 mt-1">
                  {syncResult.synced} Änderungen synchronisiert
                </p>
              )}
              {syncResult.failed > 0 && (
                <p className="text-sm text-red-700 mt-1">
                  {syncResult.failed} Fehler aufgetreten
                </p>
              )}
              {syncResult.errors && syncResult.errors.length > 0 && (
                <ul className="text-xs text-red-600 mt-2 space-y-1">
                  {syncResult.errors.map((error: string, index: number) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={handleSync}
          disabled={!isOnline || isSyncing}
          className="w-full btn-primary py-3 flex items-center justify-center space-x-2"
        >
          <RefreshCw className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Synchronisiere...' : 'Jetzt synchronisieren'}</span>
        </button>

        <button
          onClick={handleDownloadForOffline}
          disabled={!isOnline || isSyncing}
          className="w-full btn-secondary py-3 flex items-center justify-center space-x-2"
        >
          <Download className="h-5 w-5" />
          <span>Daten für Offline herunterladen</span>
        </button>

        <hr className="my-6" />

        <div className="card bg-orange-50 border-orange-200">
          <h4 className="font-medium text-orange-900 mb-2">Daten verwalten</h4>
          <p className="text-sm text-orange-700 mb-4">
            Löschen Sie alle lokalen Daten, wenn Sie Speicherplatz freigeben möchten
            oder Probleme auftreten.
          </p>
          <button
            onClick={handleClearData}
            disabled={clearingData}
            className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg font-medium
                     hover:bg-orange-700 active:bg-orange-800 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>{clearingData ? 'Lösche...' : 'Lokale Daten löschen'}</span>
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="card bg-blue-50 border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5" />
          <span>Hinweise zur Offline-Nutzung</span>
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Änderungen werden automatisch lokal gespeichert</li>
          <li>• Synchronisation erfolgt automatisch bei Internetverbindung</li>
          <li>• Laden Sie Daten herunter, bevor Sie offline gehen</li>
          <li>• Bei Konflikten werden lokale Änderungen bevorzugt</li>
        </ul>
      </div>
    </div>
  );
}