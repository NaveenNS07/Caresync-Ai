import { localDb } from './localDb';
import { cloudDb } from './cloudDb';
import { seedAllData } from './seedData';
import type { SyncQueueItem, AuditLog } from '../types';

export class SyncService {
  private static instance: SyncService;
  private isSyncing = false;
  private listeners: (() => void)[] = [];

  private constructor() {}

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  public async initialize(): Promise<void> {
    const patientCount = await localDb.patients.count();
    if (patientCount === 0) {
      console.log('Seeding initial data for CareSync Local DB and Cloud DB...');
      await seedAllData(localDb);
      await seedAllData(cloudDb);
      console.log('Seed completed successfully.');
    }
  }

  public async resetToSeed(): Promise<void> {
    await localDb.syncQueue.clear();
    await seedAllData(localDb);
    await seedAllData(cloudDb);
    this.notify();
  }

  public async enqueueAction(params: {
    user: string;
    device: string;
    action: string;
    entityType: SyncQueueItem['entityType'];
    payload: any;
  }): Promise<string> {
    const id = `SYNC-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const item: SyncQueueItem = {
      id,
      timestamp: new Date().toISOString(),
      user: params.user,
      device: params.device,
      action: params.action,
      entityType: params.entityType,
      payload: params.payload,
      synced: false
    };

    await localDb.syncQueue.add(item);
    this.notify();
    return id;
  }

  public async getPendingQueueCount(): Promise<number> {
    return await localDb.syncQueue.where('synced').equals(0).count();
  }

  public async getPendingQueue(): Promise<SyncQueueItem[]> {
    const items = await localDb.syncQueue.toArray();
    return items.filter(item => !item.synced);
  }

  public async getAllQueueItems(): Promise<SyncQueueItem[]> {
    return await localDb.syncQueue.reverse().sortBy('timestamp');
  }

  public async performSync(user: string, device: string, isOnline: boolean): Promise<{
    success: boolean;
    pushedCount: number;
    pulledCount: number;
    message?: string;
  }> {
    if (!isOnline) {
      return { success: false, pushedCount: 0, pulledCount: 0, message: 'Cannot sync while offline' };
    }

    if (this.isSyncing) {
      return { success: false, pushedCount: 0, pulledCount: 0, message: 'Sync already in progress' };
    }

    this.isSyncing = true;
    this.notify();

    try {
      // 1. Push local unsynced queue to cloud DB
      const unsyncedItems = await this.getPendingQueue();
      let pushedCount = 0;

      for (const item of unsyncedItems) {
        const { entityType, payload } = item;
        try {
          switch (entityType) {
            case 'patient':
              await cloudDb.patients.put(payload);
              break;
            case 'reading':
              await cloudDb.readings.put(payload);
              break;
            case 'alert':
              await cloudDb.alerts.put(payload);
              break;
            case 'escalation':
              await cloudDb.escalations.put(payload);
              break;
            case 'referral':
              // Offline referrals are marked synchronized
              const updatedRef = { ...payload, isOfflineSaved: false };
              await cloudDb.referrals.put(updatedRef);
              await localDb.referrals.update(payload.id, { isOfflineSaved: false });
              break;
            case 'task':
              await cloudDb.tasks.put(payload);
              break;
            case 'audit':
              await cloudDb.auditLogs.put(payload);
              break;
            case 'rule':
              await cloudDb.rules.put(payload);
              break;
          }

          // Mark queue item as synced
          await localDb.syncQueue.update(item.id, {
            synced: true,
            syncedAt: new Date().toISOString()
          });
          pushedCount++;
        } catch (itemErr) {
          console.error(`Failed to push sync item ${item.id}`, itemErr);
        }
      }

      // 2. Pull changes from cloud DB into local DB
      // We pull referrals, escalations, tasks, and patients updated remotely
      const cloudReferrals = await cloudDb.referrals.toArray();
      for (const ref of cloudReferrals) {
        await localDb.referrals.put(ref);
      }

      const cloudEscalations = await cloudDb.escalations.toArray();
      for (const esc of cloudEscalations) {
        await localDb.escalations.put(esc);
      }

      const cloudTasks = await cloudDb.tasks.toArray();
      for (const tsk of cloudTasks) {
        await localDb.tasks.put(tsk);
      }

      const cloudPatients = await cloudDb.patients.toArray();
      for (const pt of cloudPatients) {
        await localDb.patients.put(pt);
      }

      const pulledCount = cloudReferrals.length + cloudEscalations.length + cloudTasks.length;

      // 3. Log audit event
      const auditLog: AuditLog = {
        id: `AUD-SYNC-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor: user,
        role: 'System/Sync',
        facility: 'Local Device',
        action: 'Two-Way Sync Completed',
        details: `Pushed ${pushedCount} pending items to Cloud DB; Pulled latest updates from Cloud DB.`,
        online: true,
        device
      };
      await localDb.auditLogs.add(auditLog);
      await cloudDb.auditLogs.add(auditLog);

      return { success: true, pushedCount, pulledCount };
    } catch (err: any) {
      console.error('Sync failed', err);
      return { success: false, pushedCount: 0, pulledCount: 0, message: err?.message || 'Sync error' };
    } finally {
      this.isSyncing = false;
      this.notify();
    }
  }

  public getSyncState() {
    return { isSyncing: this.isSyncing };
  }
}

export const syncService = SyncService.getInstance();
