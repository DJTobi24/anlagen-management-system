import Dexie, { Table } from 'dexie';

// TypeScript interfaces
export interface CachedObjekt {
  id: string;
  name: string;
  liegenschaft_id: string;
}

export interface CachedAuftrag {
  id: string;
  titel: string;
  beschreibung?: string;
  status: 'vorbereitet' | 'in_bearbeitung' | 'abgeschlossen' | 'pausiert';
  start_datum?: string;
  end_datum?: string;
  ersteller_name: string;
  liegenschaften?: any[];
  objekte?: CachedObjekt[];
  anlagen?: CachedAnlage[];
  lastSynced?: Date;
  localChanges?: boolean;
}

export interface CachedAnlage {
  id: string;
  aufnahme_id: string;
  anlage_id: string;
  name: string;
  t_nummer?: string;
  aks_code: string;
  sichtbar: boolean;
  such_modus: boolean;
  notizen?: string;
  bearbeitet: boolean;
  bearbeitet_am?: string;
  // Anlage details
  status?: string;
  zustands_bewertung?: number;
  description?: string;
  qr_code?: string;
  dynamic_fields?: any;
  objekt_id?: string;
  // Offline changes
  localChanges?: boolean;
  pendingChanges?: any;
  isNew?: boolean; // For newly created Anlagen
}

export interface SyncQueueItem {
  id?: number;
  type: 'UPDATE_ANLAGE' | 'MARK_BEARBEITET' | 'UPDATE_AUFTRAG' | 'CREATE_ANLAGE' | 'UPDATE_AUFTRAG_STATUS';
  entityId: string;
  data: any;
  timestamp: Date;
  retries: number;
  error?: string;
  synced: number; // 0 = not synced, 1 = synced
}

export interface CachedAksCode {
  code: string;
  name: string;
  description?: string;
  level: number;
  parent_code?: string;
  is_category: boolean;
  maintenance_interval_months?: number;
}

export interface OfflineState {
  id: string;
  isOnline: boolean;
  lastOnline?: Date;
  pendingSyncs: number;
  lastSyncAttempt?: Date;
  lastSuccessfulSync?: Date;
}

// Database class
export class AnlagenDatabase extends Dexie {
  auftraege!: Table<CachedAuftrag>;
  anlagen!: Table<CachedAnlage>;
  aksCodes!: Table<CachedAksCode>;
  syncQueue!: Table<SyncQueueItem>;
  offlineState!: Table<OfflineState>;

  constructor() {
    super('AnlagenPWADatabase');
    
    this.version(1).stores({
      auftraege: 'id, status, lastSynced, localChanges',
      anlagen: 'id, aufnahme_id, anlage_id, bearbeitet, localChanges',
      aksCodes: 'code, level, parent_code',
      syncQueue: '++id, type, entityId, synced, timestamp',
      offlineState: 'id'
    });
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    await this.transaction('rw', this.auftraege, this.anlagen, this.aksCodes, this.syncQueue, async () => {
      await this.auftraege.clear();
      await this.anlagen.clear();
      await this.aksCodes.clear();
      await this.syncQueue.clear();
    });
  }

  // Add item to sync queue
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries' | 'synced'>): Promise<void> {
    await this.syncQueue.add({
      ...item,
      timestamp: new Date(),
      retries: 0,
      synced: 0
    });
  }

  // Get pending sync items
  async getPendingSyncItems(): Promise<SyncQueueItem[]> {
    return await this.syncQueue
      .where('synced')
      .equals(0)
      .and(item => item.retries < 3)
      .toArray();
  }

  // Mark sync item as completed
  async markSyncCompleted(id: number): Promise<void> {
    await this.syncQueue.update(id, { synced: 1 });
  }

  // Increment sync retry count
  async incrementSyncRetry(id: number, error?: string): Promise<void> {
    const item = await this.syncQueue.get(id);
    if (item) {
      await this.syncQueue.update(id, {
        retries: item.retries + 1,
        error
      });
    }
  }

  // Update offline state
  async updateOfflineState(isOnline: boolean): Promise<void> {
    const state = await this.offlineState.get('main');
    const pendingSyncs = await this.syncQueue.where('synced').equals(0).count();
    
    if (state) {
      await this.offlineState.update('main', {
        isOnline,
        lastOnline: isOnline ? new Date() : state.lastOnline,
        pendingSyncs,
        lastSyncAttempt: new Date()
      });
    } else {
      await this.offlineState.add({
        id: 'main',
        isOnline,
        lastOnline: isOnline ? new Date() : undefined,
        pendingSyncs,
        lastSyncAttempt: new Date()
      });
    }
  }

  // Get offline state
  async getOfflineState(): Promise<OfflineState | undefined> {
    return await this.offlineState.get('main');
  }

  // Cache Auftrag with Anlagen
  async cacheAuftrag(auftrag: CachedAuftrag): Promise<void> {
    await this.transaction('rw', this.auftraege, this.anlagen, async () => {
      // Save Auftrag
      await this.auftraege.put({
        ...auftrag,
        lastSynced: new Date(),
        localChanges: false
      });

      // Save associated Anlagen
      if (auftrag.anlagen) {
        for (const anlage of auftrag.anlagen) {
          await this.anlagen.put({
            ...anlage,
            localChanges: false
          });
        }
      }
    });
  }

  // Update Anlage locally
  async updateAnlageLocally(anlageId: string, changes: any): Promise<void> {
    // Find anlage by anlage_id, not the datenaufnahme_anlagen id
    const anlage = await this.anlagen.where('anlage_id').equals(anlageId).first();
    if (anlage) {
      await this.anlagen.update(anlage.id!, {
        ...changes,
        localChanges: true,
        pendingChanges: { ...anlage.pendingChanges, ...changes }
      });

      // Add to sync queue
      await this.addToSyncQueue({
        type: 'UPDATE_ANLAGE',
        entityId: anlageId,
        data: changes
      });

      // Mark Auftrag as having local changes
      if (anlage.aufnahme_id) {
        await this.auftraege.update(anlage.aufnahme_id, { localChanges: true });
      }
    }
  }

  // Mark Anlage as bearbeitet locally
  async markAnlageBearbeitetLocally(aufnahmeId: string, anlageId: string, data: any): Promise<void> {
    // Find anlage by anlage_id, not the datenaufnahme_anlagen id
    const anlage = await this.anlagen.where('anlage_id').equals(anlageId).first();
    if (!anlage) return;
    
    await this.anlagen.update(anlage.id!, {
      bearbeitet: true,
      bearbeitet_am: new Date().toISOString(),
      notizen: data.notizen,
      localChanges: true
    });

    await this.addToSyncQueue({
      type: 'MARK_BEARBEITET',
      entityId: `${aufnahmeId}:${anlageId}`,
      data
    });

    await this.auftraege.update(aufnahmeId, { localChanges: true });
  }

  // Get cached Aufträge with local changes indicator
  async getCachedAuftraege(): Promise<CachedAuftrag[]> {
    const auftraege = await this.auftraege.toArray();
    
    // Load associated Anlagen for each Auftrag
    for (const auftrag of auftraege) {
      auftrag.anlagen = await this.anlagen
        .where('aufnahme_id')
        .equals(auftrag.id)
        .toArray();
    }
    
    return auftraege;
  }

  // Check if data needs sync
  async hasUnsyncedChanges(): Promise<boolean> {
    const pendingCount = await this.syncQueue.where('synced').equals(0).count();
    return pendingCount > 0;
  }

  // Remove successfully synced items from queue
  async removeSyncedItems(entityId: string, type: string): Promise<void> {
    await this.syncQueue
      .where('entityId').equals(entityId)
      .and((item) => item.type === type && item.synced === 0)
      .delete();
  }
}

// Create database instance
export const db = new AnlagenDatabase();