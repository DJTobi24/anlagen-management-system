import { db } from '../db/database';

export class DataRecovery {
  // Check for orphaned sync queue items (Anlagen that were queued but lost)
  static async findOrphanedAnlagen(): Promise<any[]> {
    const orphaned: any[] = [];
    
    try {
      // Get all sync queue items for CREATE_ANLAGE
      const syncItems = await db.syncQueue
        .where('type')
        .equals('CREATE_ANLAGE')
        .toArray();
      
      console.log('Found sync queue items:', syncItems.length);
      
      for (const item of syncItems) {
        // Check if the Anlage still exists
        const anlage = await db.anlagen.get(item.entityId);
        if (!anlage) {
          console.warn('Orphaned sync item found:', item);
          orphaned.push(item);
        }
      }
      
      return orphaned;
    } catch (error) {
      console.error('Error finding orphaned Anlagen:', error);
      return [];
    }
  }
  
  // Recover lost Anlage from sync queue
  static async recoverAnlageFromSyncQueue(syncItem: any): Promise<boolean> {
    try {
      if (!syncItem.data) {
        console.error('No data in sync item');
        return false;
      }
      
      // Create a temporary ID for the recovered Anlage
      const tempId = `TEMP-RECOVERED-${Date.now()}`;
      
      // Recreate the Anlage in local DB
      await db.anlagen.add({
        id: tempId,
        anlage_id: tempId,
        aufnahme_id: syncItem.data.aufnahmeId,
        name: syncItem.data.name,
        t_nummer: syncItem.data.tNummer,
        aks_code: syncItem.data.aksCode,
        sichtbar: true,
        such_modus: false,
        notizen: '',
        status: syncItem.data.status,
        zustands_bewertung: syncItem.data.zustandsBewertung,
        description: syncItem.data.description,
        objekt_id: syncItem.data.objektId,
        bearbeitet: false,
        isNew: true,
        localChanges: true,
        pendingChanges: syncItem.data
      });
      
      // Update sync queue item with new temp ID
      await db.syncQueue.update(syncItem.id, {
        entityId: tempId
      });
      
      console.log('Recovered Anlage with temp ID:', tempId);
      return true;
    } catch (error) {
      console.error('Error recovering Anlage:', error);
      return false;
    }
  }
  
  // Auto-recover all orphaned Anlagen
  static async autoRecoverAll(): Promise<number> {
    const orphaned = await this.findOrphanedAnlagen();
    let recovered = 0;
    
    for (const item of orphaned) {
      if (await this.recoverAnlageFromSyncQueue(item)) {
        recovered++;
      }
    }
    
    console.log(`Auto-recovered ${recovered} Anlagen`);
    return recovered;
  }
  
  // Get sync history for debugging
  static async getSyncHistory(): Promise<any[]> {
    try {
      const history = await db.syncQueue
        .orderBy('createdAt')
        .reverse()
        .limit(50)
        .toArray();
      
      return history;
    } catch (error) {
      console.error('Error getting sync history:', error);
      return [];
    }
  }
}

// Auto-recovery on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', async () => {
    console.log('Checking for orphaned Anlagen...');
    const recovered = await DataRecovery.autoRecoverAll();
    if (recovered > 0) {
      console.log(`Recovered ${recovered} lost Anlagen!`);
    }
  });
}