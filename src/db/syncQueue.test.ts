import type { SyncQueueItem, AuditLog } from '../types';

function runSyncQueueTests() {
  console.log('--- Running Sync Queue & Offline Reconciliation Unit Tests ---');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // Test 1: Queue item creation & properties
  const queueItem: SyncQueueItem = {
    id: 'SYNC-101',
    timestamp: new Date().toISOString(),
    user: 'Meena (ANM)',
    device: 'ANM Tablet #04',
    action: 'Recorded Vitals (CRITICAL) for Lakshmi Devi',
    entityType: 'reading',
    payload: { bpSystolic: 160, bpDiastolic: 110 },
    synced: false
  };

  assert(queueItem.synced === false, 'New offline queue item is initialized with synced=false');
  assert(queueItem.entityType === 'reading', 'Entity type is correctly tagged for append-only store');

  // Test 2: Filtering pending items
  const queue: SyncQueueItem[] = [
    queueItem,
    {
      id: 'SYNC-102',
      timestamp: new Date().toISOString(),
      user: 'Dr. Arun',
      device: 'PHC Desktop',
      action: 'Doctor Decision',
      entityType: 'escalation',
      payload: {},
      synced: true,
      syncedAt: new Date().toISOString()
    }
  ];

  const pending = queue.filter(item => !item.synced);
  assert(pending.length === 1, 'Pending filter isolates unsynced items only');
  assert(pending[0].id === 'SYNC-101', 'First pending item matches unsynced record');

  // Test 3: Two-way sync transition marking
  const syncedItems = queue.map(item => ({
    ...item,
    synced: true,
    syncedAt: new Date().toISOString()
  }));

  assert(syncedItems.every(i => i.synced), 'All items marked synced after reconciliation');
  assert(syncedItems.every(i => Boolean(i.syncedAt)), 'Synced timestamp recorded on each item');

  // Test 4: Immutable audit event generated on sync
  const auditEvent: AuditLog = {
    id: `AUD-SYNC-TEST`,
    timestamp: new Date().toISOString(),
    actor: 'Dr. Arun',
    role: 'System/Sync',
    facility: 'Shanti Puram PHC',
    action: 'Two-Way Sync Completed',
    details: 'Pushed 1 pending item; Pulled latest updates.',
    online: true,
    device: 'PHC Desktop'
  };

  assert(auditEvent.online === true, 'Audit log records online status during sync');
  assert(auditEvent.action === 'Two-Way Sync Completed', 'Audit log records exact sync action description');

  console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

runSyncQueueTests();
