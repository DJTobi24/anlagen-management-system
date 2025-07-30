import { db } from '../db/database';
import { apiClient } from '../services/api';

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

class SyncManager {
  private syncInProgress = false;
  private syncCallbacks: ((result: SyncResult) => void)[] = [];

  // Register sync callback
  onSync(callback: (result: SyncResult) => void): () => void {
    this.syncCallbacks.push(callback);
    return () => {
      this.syncCallbacks = this.syncCallbacks.filter(cb => cb !== callback);
    };
  }

  // Notify sync callbacks
  private notifySyncCallbacks(result: SyncResult) {
    this.syncCallbacks.forEach(cb => cb(result));
  }

  // Check online status
  isOnline(): boolean {
    return navigator.onLine;
  }

  // Sync all pending changes
  async syncAll(): Promise<SyncResult> {
    if (this.syncInProgress) {
      return { success: false, synced: 0, failed: 0, errors: ['Sync already in progress'] };
    }

    this.syncInProgress = true;
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: []
    };

    try {
      // Update offline state
      await db.updateOfflineState(this.isOnline());

      if (!this.isOnline()) {
        result.success = false;
        result.errors.push('No internet connection');
        return result;
      }

      // Get pending sync items
      const pendingItems = await db.getPendingSyncItems();

      for (const item of pendingItems) {
        try {
          switch (item.type) {
            case 'CREATE_ANLAGE':
              await this.syncCreateAnlage(item);
              break;
            case 'UPDATE_ANLAGE':
              await this.syncUpdateAnlage(item);
              break;
            case 'MARK_BEARBEITET':
              await this.syncMarkBearbeitet(item);
              break;
            case 'UPDATE_AUFTRAG_STATUS':
              await this.syncUpdateAuftragStatus(item);
              break;
            default:
              throw new Error(`Unknown sync type: ${item.type}`);
          }

          await db.markSyncCompleted(item.id!);
          result.synced++;
        } catch (error: any) {
          result.failed++;
          result.errors.push(`${item.type} ${item.entityId}: ${error.message}`);
          await db.incrementSyncRetry(item.id!, error.message);
        }
      }

      // Update successful sync timestamp
      if (result.synced > 0) {
        const state = await db.getOfflineState();
        if (state) {
          await db.offlineState.update('main', {
            ...state,
            lastSuccessfulSync: new Date()
          });
        }
      }

      // Refresh data from server if online
      if (this.isOnline() && result.failed === 0) {
        await this.refreshDataFromServer();
      }

    } catch (error: any) {
      result.success = false;
      result.errors.push(error.message);
    } finally {
      this.syncInProgress = false;
      this.notifySyncCallbacks(result);
    }

    return result;
  }

  // Sync create Anlage
  private async syncCreateAnlage(item: any): Promise<void> {
    // Create the Anlage on the server
    const response = await apiClient.post('/anlagen', item.data);
    
    // Update local record with server-generated ID
    const tempId = item.entityId;
    const realId = response.data.id;
    
    // Get the temporary Anlage
    const tempAnlage = await db.anlagen.get(tempId);
    if (tempAnlage) {
      // Create new record with real ID
      await db.anlagen.add({
        ...tempAnlage,
        id: realId,
        anlage_id: realId,
        localChanges: false,
        isNew: false
      });
      
      // Delete temporary record
      await db.anlagen.delete(tempId);
      
      // If this Anlage was also part of a Datenaufnahme, add it
      if (item.data.aufnahmeId) {
        await apiClient.post(`/datenaufnahme/${item.data.aufnahmeId}/anlagen/${realId}/hinzufuegen`, {});
      }
    }
  }

  // Sync update Anlage
  private async syncUpdateAnlage(item: any): Promise<void> {
    // Transform field names to match backend expectations
    const transformedData = {
      ...item.data,
      zustandsBewertung: item.data.zustands_bewertung || item.data.zustandsBewertung
    };
    delete transformedData.zustands_bewertung;
    delete transformedData.notizen; // Remove notizen - it's not part of Anlage update
    
    await apiClient.put(`/anlagen/${item.entityId}`, transformedData);
    
    // Remove local changes flag
    await db.anlagen.update(item.entityId, {
      localChanges: false,
      pendingChanges: undefined
    });
  }

  // Sync mark bearbeitet
  private async syncMarkBearbeitet(item: any): Promise<void> {
    const [aufnahmeId, anlageId] = item.entityId.split(':');
    await apiClient.post(`/datenaufnahme/${aufnahmeId}/anlagen/${anlageId}/bearbeitet`, item.data);
    
    // Remove local changes flag
    await db.anlagen.update(anlageId, {
      localChanges: false
    });
  }

  // Sync update Auftrag status
  private async syncUpdateAuftragStatus(item: any): Promise<void> {
    await apiClient.put(
      `/datenaufnahme/${item.entityId}`,
      { status: item.data.status }
    );
    
    // Update local record
    await db.auftraege
      .where('id')
      .equals(item.entityId)
      .modify({ localChanges: false });
  }

  // Refresh data from server
  async refreshDataFromServer(): Promise<void> {
    try {
      // Get user's Aufträge
      console.log('Fetching Aufträge from server...');
      const response = await apiClient.get('/datenaufnahme/meine-auftraege');
      console.log('API Response:', response);
      
      // Response is already the data (api.ts returns response.data)
      const auftraege = response;
      console.log('Auftraege data:', auftraege);

      // Ensure auftraege is an array
      if (!Array.isArray(auftraege)) {
        console.error('Invalid response from server:', auftraege);
        // If no Aufträge (empty array from API), just clear the local data
        console.log('No Aufträge found or invalid format, clearing local data');
        await db.transaction('rw', db.auftraege, db.anlagen, async () => {
          await db.auftraege.clear();
          await db.anlagen.clear();
        });
        return;
      }

      // Clear old data and cache new
      await db.transaction('rw', db.auftraege, db.anlagen, async () => {
        // Clear existing data
        await db.auftraege.clear();
        await db.anlagen.clear();

        // Cache new data
        for (const auftrag of auftraege) {
          await db.cacheAuftrag(auftrag);
        }
      });

      // Also refresh AKS codes if needed
      try {
        const aksResponse = await apiClient.get('/aks');
        console.log('AKS Response:', aksResponse);
        
        // Check if response has data property or is already the data
        const aksCodes = aksResponse.data || aksResponse;
        console.log('AKS Codes:', Array.isArray(aksCodes) ? aksCodes.length : 'not array');
        
        if (Array.isArray(aksCodes)) {
          await db.aksCodes.clear();
          await db.aksCodes.bulkAdd(aksCodes);
          console.log('Cached AKS codes:', aksCodes.length);
        }
      } catch (aksError) {
        console.warn('Failed to refresh AKS codes:', aksError);
        // Continue without AKS codes - not critical for operation
      }

    } catch (error) {
      console.error('Failed to refresh data from server:', error);
      throw error;
    }
  }

  // Download data for offline use
  async downloadForOffline(): Promise<void> {
    if (!this.isOnline()) {
      throw new Error('Internet connection required to download data');
    }

    await this.refreshDataFromServer();
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    hasUnsyncedChanges: boolean;
    pendingCount: number;
    lastSync?: Date;
    isOnline: boolean;
  }> {
    const hasUnsyncedChanges = await db.hasUnsyncedChanges();
    const pendingCount = await db.syncQueue.where('synced').equals(0).count();
    const state = await db.getOfflineState();

    return {
      hasUnsyncedChanges,
      pendingCount,
      lastSync: state?.lastSuccessfulSync,
      isOnline: this.isOnline()
    };
  }

  // Clear all local data
  async clearLocalData(): Promise<void> {
    await db.clearAllData();
  }
}

export const syncManager = new SyncManager();