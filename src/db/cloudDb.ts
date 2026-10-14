import Dexie, { type Table } from 'dexie';
import type { 
  Patient, 
  Reading, 
  Alert, 
  Escalation, 
  Referral, 
  Task, 
  Facility, 
  AuditLog, 
  ClinicalRule 
} from '../types';

export class CareSyncCloudDatabase extends Dexie {
  patients!: Table<Patient, string>;
  readings!: Table<Reading, string>;
  alerts!: Table<Alert, string>;
  escalations!: Table<Escalation, string>;
  referrals!: Table<Referral, string>;
  tasks!: Table<Task, string>;
  facilities!: Table<Facility, string>;
  auditLogs!: Table<AuditLog, string>;
  rules!: Table<ClinicalRule, string>;

  constructor() {
    super('CareSyncCloudDB');
    this.version(1).stores({
      patients: 'id, name, currentSeverity, loopStage, isClosed, flaggedAt, lastReadingAt, assignedStaff, village',
      readings: 'id, patientId, timestamp, severity, actorRole',
      alerts: 'id, patientId, readingId, severity, acknowledged, timestamp',
      escalations: 'id, patientId, alertId, urgency, status, requestedAt',
      referrals: 'id, patientId, state, urgency, createdAt, destinationFacility',
      tasks: 'id, patientId, status, dueDate, assignedRole, isSilentPatientFlag',
      facilities: 'id, name, type',
      auditLogs: 'id, timestamp, actor, role, action, patientId',
      rules: 'id, severity, category, isActive'
    });
  }
}

export const cloudDb = new CareSyncCloudDatabase();
