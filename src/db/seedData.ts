import type { Patient, Reading, Alert, Escalation, Referral, Task, Facility, AuditLog, ClinicalRule } from '../types';
import { defaultRules } from '../rules/defaultRules';

export const initialFacilities: Facility[] = [
  {
    id: 'FAC-01',
    name: 'Asha Nagar Village Sub-Centre',
    type: 'subcentre',
    location: 'Asha Nagar Gram Panchayat, Sector 4',
    phone: '+91 94251 10001',
    distanceKm: 0,
    services: {
      obstetricEmergency: false,
      bloodBank: false,
      icu: false,
      ambulanceAvailable: false
    },
    maternalBedsTotal: 2,
    maternalBedsAvailable: 1,
    lastUpdated: '10 mins ago',
    dataFreshness: 'Verified by ANM Meena (Today 08:30)'
  },
  {
    id: 'FAC-02',
    name: 'Shanti Puram Primary Health Centre (PHC)',
    type: 'phc',
    location: 'Block HQ, Main Road, Shanti Puram',
    phone: '+91 94251 20002',
    distanceKm: 12,
    services: {
      obstetricEmergency: true,
      bloodBank: false,
      icu: false,
      ambulanceAvailable: true
    },
    maternalBedsTotal: 6,
    maternalBedsAvailable: 3,
    lastUpdated: '25 mins ago',
    dataFreshness: 'Verified by Dr. Arun (Today 09:15)'
  },
  {
    id: 'FAC-03',
    name: 'Rampur District Hospital (FRU)',
    type: 'hospital',
    location: 'District Medical Enclave, Civil Lines, Rampur',
    phone: '+91 94251 30003',
    distanceKm: 38,
    services: {
      obstetricEmergency: true,
      bloodBank: true,
      icu: true,
      ambulanceAvailable: true
    },
    maternalBedsTotal: 28,
    maternalBedsAvailable: 8,
    lastUpdated: '5 mins ago',
    dataFreshness: 'Verified by Desk Sister Priya (Live update)'
  }
];

export const initialPatients: Patient[] = [
  {
    id: 'PT-101',
    name: 'Lakshmi Devi',
    age: 24,
    gestationWeeks: 34,
    parity: 'G1P0',
    riskFactors: ['Nulliparous', 'First pregnancy', 'Borderline baseline BP'],
    village: 'Chandanpur',
    contactNumber: '+91 98765 43210',
    ashaWorker: 'Sunita Devi (ASHA-12)',
    facilityId: 'FAC-01',
    assignedStaff: 'Meena (ANM)',
    currentSeverity: 'stable',
    loopStage: 'detect',
    lastReadingAt: '2026-10-14T08:15:00.000Z',
    isClosed: false,
    outstandingTask: 'Routine Antenatal Vitals Check',
    outstandingOwner: 'Meena (ANM)'
  },
  {
    id: 'PT-102',
    name: 'Sunita Bai',
    age: 28,
    gestationWeeks: 36,
    parity: 'G3P2',
    riskFactors: ['Previous C-section', 'Severe Gestational Hypertension'],
    village: 'Rampur South',
    contactNumber: '+91 98765 43211',
    ashaWorker: 'Kamla Bai (ASHA-04)',
    facilityId: 'FAC-01',
    assignedStaff: 'Meena (ANM)',
    currentSeverity: 'critical',
    loopStage: 'coordinate',
    topAlertReason: 'Severe Hypertension (168/112) + Impending Eclampsia signs',
    flaggedAt: '2026-10-14T06:30:00.000Z',
    lastReadingAt: '2026-10-14T06:30:00.000Z',
    isClosed: false,
    outstandingTask: 'Hospital Bed Handover & IV MgSO4 Confirmation',
    outstandingOwner: 'Sister Priya (District Hospital)'
  },
  {
    id: 'PT-103',
    name: 'Pooja Sharma',
    age: 21,
    gestationWeeks: 30,
    parity: 'G1P0',
    riskFactors: ['Severe swelling in hands & feet', 'Moderate anemia (Hb 9.1)'],
    village: 'Devgarh',
    contactNumber: '+91 98765 43212',
    ashaWorker: 'Rekha Devi (ASHA-07)',
    facilityId: 'FAC-02',
    assignedStaff: 'Dr. Arun (PHC)',
    currentSeverity: 'warning',
    loopStage: 'prioritize',
    topAlertReason: 'Stage 1 Hypertension (142/92) with pedal edema',
    flaggedAt: '2026-10-14T07:45:00.000Z',
    lastReadingAt: '2026-10-14T07:45:00.000Z',
    isClosed: false,
    outstandingTask: 'Doctor SBAR review & lab work decision',
    outstandingOwner: 'Dr. Arun (PHC)'
  },
  {
    id: 'PT-104',
    name: 'Kavita Patel',
    age: 26,
    gestationWeeks: 38,
    parity: 'G2P1',
    riskFactors: ['Prior pre-eclampsia', 'GDM diet-controlled'],
    village: 'Sundar Nagar',
    contactNumber: '+91 98765 43213',
    ashaWorker: 'Manju Devi (ASHA-09)',
    facilityId: 'FAC-01',
    assignedStaff: 'Meena (ANM)',
    currentSeverity: 'warning',
    loopStage: 'follow_through',
    topAlertReason: 'Missed home BP check - Task Overdue',
    flaggedAt: '2026-10-12T10:00:00.000Z',
    lastReadingAt: '2026-10-11T11:00:00.000Z',
    isClosed: false,
    outstandingTask: 'OVERDUE: 48h Home Visit & Blood Pressure Check',
    outstandingOwner: 'Meena (ANM)'
  },
  {
    id: 'PT-105',
    name: 'Ananya Sen',
    age: 22,
    gestationWeeks: 28,
    parity: 'G1P0',
    riskFactors: ['Twin gestation', 'Isolated systolic elevation'],
    village: 'Kalyanpur',
    contactNumber: '+91 98765 43214',
    ashaWorker: 'Geeta Kumari (ASHA-15)',
    facilityId: 'FAC-01',
    assignedStaff: 'Meena (ANM)',
    currentSeverity: 'warning',
    loopStage: 'follow_through',
    topAlertReason: 'SILENT PATIENT: No contact since scheduled review 4 days ago',
    flaggedAt: '2026-10-10T09:00:00.000Z',
    lastReadingAt: '2026-10-08T10:30:00.000Z',
    isClosed: false,
    outstandingTask: 'URGENT: Physical home verification - Silent Patient',
    outstandingOwner: 'Sunita Devi (ASHA) / Meena'
  },
  {
    id: 'PT-106',
    name: 'Geeta Yadav',
    age: 31,
    gestationWeeks: 40,
    parity: 'G4P3',
    riskFactors: ['Grand multipara', 'History of PPH'],
    village: 'Bishanpur',
    contactNumber: '+91 98765 43215',
    ashaWorker: 'Anita Bai (ASHA-02)',
    facilityId: 'FAC-03',
    assignedStaff: 'Sister Priya (District Hospital)',
    currentSeverity: 'stable',
    loopStage: 'follow_through',
    lastReadingAt: '2026-10-13T16:00:00.000Z',
    isClosed: true,
    closedAt: '2026-10-14T09:00:00.000Z',
    closedOutcome: 'Healthy vaginal delivery at District Hospital. Postpartum vitals stable. 48h home visit completed.'
  },
  {
    id: 'PT-107',
    name: 'Radha Kumari',
    age: 19,
    gestationWeeks: 32,
    parity: 'G1P0',
    riskFactors: ['Young primigravida', 'Mild pallor'],
    village: 'Shivpur',
    contactNumber: '+91 98765 43216',
    ashaWorker: 'Sunita Devi (ASHA-12)',
    facilityId: 'FAC-01',
    assignedStaff: 'Meena (ANM)',
    currentSeverity: 'stable',
    loopStage: 'detect',
    lastReadingAt: '2026-10-14T08:00:00.000Z',
    isClosed: false,
    outstandingTask: 'Routine iron-folic acid compliance check',
    outstandingOwner: 'Meena (ANM)'
  },
  {
    id: 'PT-108',
    name: 'Meera Bai',
    age: 29,
    gestationWeeks: 35,
    parity: 'G2P1',
    riskFactors: ['Gestational diabetes mellitus', 'Mild tachycardia'],
    village: 'Panchvati',
    contactNumber: '+91 98765 43217',
    ashaWorker: 'Kanti Bai (ASHA-05)',
    facilityId: 'FAC-02',
    assignedStaff: 'Dr. Arun (PHC)',
    currentSeverity: 'warning',
    loopStage: 'coordinate',
    topAlertReason: 'Mild Hypertension (144/94) + fasting sugar 132 mg/dL',
    flaggedAt: '2026-10-13T11:00:00.000Z',
    lastReadingAt: '2026-10-13T11:00:00.000Z',
    isClosed: false,
    outstandingTask: 'Diet counseling & PHC follow-up scheduled for tomorrow',
    outstandingOwner: 'Dr. Arun (PHC)'
  }
];

export const initialReadings: Reading[] = [
  // Lakshmi Devi (stable baseline)
  {
    id: 'RD-101-1',
    patientId: 'PT-101',
    timestamp: '2026-10-14T08:15:00.000Z',
    actor: 'Meena',
    actorRole: 'Nurse/ANM',
    facility: 'Asha Nagar Village Sub-Centre',
    bpSystolic: 118,
    bpDiastolic: 76,
    pulse: 74,
    temperature: 36.7,
    spo2: 99,
    bloodSugar: 94,
    symptoms: [],
    note: 'Routine 34-week checkup. Fetal heart sounds audible, no edema.',
    severity: 'stable',
    triggeredRules: [],
    deviceOnline: true
  },
  // Sunita Bai (critical trigger)
  {
    id: 'RD-102-1',
    patientId: 'PT-102',
    timestamp: '2026-10-14T06:30:00.000Z',
    actor: 'Meena',
    actorRole: 'Nurse/ANM',
    facility: 'Asha Nagar Village Sub-Centre',
    bpSystolic: 168,
    bpDiastolic: 112,
    pulse: 104,
    temperature: 37.1,
    spo2: 96,
    symptoms: ['severe_headache', 'blurred_vision', 'swelling'],
    note: 'Patient complains of pounding occipital headache and seeing spots since morning. Deep tendon reflexes brisk.',
    severity: 'critical',
    triggeredRules: ['RULE-CRIT-01', 'RULE-COMB-01'],
    alertId: 'ALT-102-1',
    deviceOnline: true
  },
  // Pooja Sharma (warning trigger)
  {
    id: 'RD-103-1',
    patientId: 'PT-103',
    timestamp: '2026-10-14T07:45:00.000Z',
    actor: 'Dr. Arun',
    actorRole: 'PHC Doctor',
    facility: 'Shanti Puram Primary Health Centre (PHC)',
    bpSystolic: 142,
    bpDiastolic: 92,
    pulse: 88,
    temperature: 36.9,
    spo2: 98,
    symptoms: ['swelling'],
    note: 'Bilateral ankle edema +1. Advised salt restriction and urine dipstick for protein.',
    severity: 'warning',
    triggeredRules: ['RULE-WARN-01'],
    alertId: 'ALT-103-1',
    deviceOnline: true
  }
];

export const initialAlerts: Alert[] = [
  {
    id: 'ALT-102-1',
    patientId: 'PT-102',
    readingId: 'RD-102-1',
    timestamp: '2026-10-14T06:30:00.000Z',
    severity: 'critical',
    ruleName: 'Severe Preeclampsia Warning',
    triggerSummary: 'BP 168/112 + Severe Headache & Blurred Vision',
    plainExplanation: 'Blood pressure is critically high (>= 160/110) combined with neurological symptoms (headache, vision changes), indicating high risk of eclamptic seizure.',
    acknowledged: true,
    acknowledgedBy: 'Meena (ANM)',
    acknowledgedAt: '2026-10-14T06:32:00.000Z',
    isUseful: true
  },
  {
    id: 'ALT-103-1',
    patientId: 'PT-103',
    readingId: 'RD-103-1',
    timestamp: '2026-10-14T07:45:00.000Z',
    severity: 'warning',
    ruleName: 'Mild Gestational Hypertension',
    triggerSummary: 'BP 142/92 (Systolic 140-159 or Diastolic 90-109)',
    plainExplanation: 'Elevated blood pressure in third trimester requires close monitoring to ensure it does not progress to pre-eclampsia.',
    acknowledged: true,
    acknowledgedBy: 'Dr. Arun (PHC)',
    acknowledgedAt: '2026-10-14T07:48:00.000Z',
    isUseful: true
  }
];

export const initialEscalations: Escalation[] = [
  {
    id: 'ESC-102-1',
    patientId: 'PT-102',
    alertId: 'ALT-102-1',
    requestedBy: 'Meena (ANM)',
    requestedAt: '2026-10-14T06:35:00.000Z',
    urgency: 'emergency',
    nurseNote: 'Severe headache and blurred vision with BP 168/112. Patient is distressed. Need immediate transfer guidance.',
    attachedVitals: {
      bp: '168/112',
      pulse: 104,
      spo2: 96,
      temp: 37.1,
      symptoms: ['severe_headache', 'blurred_vision', 'swelling']
    },
    sbar: {
      situation: 'Sunita Bai, 28y, 36w gestation, presenting with severe blood pressure elevation (168/112 mmHg) and acute neurological symptoms.',
      background: 'G3P2, past history of C-section. Has had borderline elevated BP in prior visits, now spiking.',
      assessment: 'Suspected severe pre-eclampsia with impending eclamptic convulsion risk.',
      recommendation: 'Immediate referral to Rampur District Hospital. Administer loading dose MgSO4 if authorized, arrange 108 ambulance.'
    },
    status: 'reviewed',
    decision: 'refer_hospital',
    doctorNote: 'Authorized emergency referral to District Hospital. Administer oral Labetalol 100mg stat if available. Transfer immediately via 108.',
    doctorName: 'Dr. Arun (PHC)',
    reviewedAt: '2026-10-14T06:40:00.000Z'
  }
];

export const initialReferrals: Referral[] = [
  {
    id: 'REF-102-1',
    patientId: 'PT-102',
    patientName: 'Sunita Bai',
    referralNumber: 'REF-2026-1002',
    createdAt: '2026-10-14T06:45:00.000Z',
    originFacility: 'Asha Nagar Village Sub-Centre',
    destinationFacility: 'Rampur District Hospital (FRU)',
    reason: 'Severe Pre-eclampsia with danger signs (BP 168/112, visual disturbances)',
    urgency: 'critical',
    clinicalSummary: '28-year-old G3P2 at 36 weeks gestation with BP 168/112 mmHg, visual blurring, headache. Dr. Arun authorized emergency transfer.',
    keyVitals: {
      bp: '168/112',
      pulse: 104,
      spo2: 96,
      temp: 37.1,
      symptoms: ['severe_headache', 'blurred_vision', 'swelling']
    },
    actionsTaken: 'Labetalol 100mg given PO at 06:42. 108 ambulance called at 06:45. Patient placed in left lateral tilt.',
    state: 'in_transit',
    stateHistory: [
      {
        state: 'draft',
        timestamp: '2026-10-14T06:42:00.000Z',
        actor: 'Meena',
        actorRole: 'Nurse/ANM',
        facility: 'Asha Nagar Village Sub-Centre'
      },
      {
        state: 'sent',
        timestamp: '2026-10-14T06:45:00.000Z',
        actor: 'Dr. Arun',
        actorRole: 'PHC Doctor',
        facility: 'Shanti Puram PHC'
      },
      {
        state: 'accepted',
        timestamp: '2026-10-14T06:50:00.000Z',
        actor: 'Sister Priya',
        actorRole: 'Hospital Staff',
        facility: 'Rampur District Hospital (FRU)',
        note: 'Obstetric ICU bed 3 reserved. Emergency team notified.'
      },
      {
        state: 'transport_requested',
        timestamp: '2026-10-14T06:52:00.000Z',
        actor: 'Meena',
        actorRole: 'Nurse/ANM',
        facility: 'Asha Nagar Village Sub-Centre',
        note: '108 Ambulance Unit #09 dispatched from block HQ.'
      },
      {
        state: 'in_transit',
        timestamp: '2026-10-14T07:10:00.000Z',
        actor: 'Meena',
        actorRole: 'Nurse/ANM',
        facility: 'Asha Nagar Village Sub-Centre',
        note: 'Ambulance departed with patient and ASHA Kamla Bai.'
      }
    ],
    transportType: '108_ambulance',
    isOfflineSaved: false
  }
];

export const initialTasks: Task[] = [
  {
    id: 'TSK-104-1',
    patientId: 'PT-104',
    patientName: 'Kavita Patel',
    title: '48-hour Home Blood Pressure Recheck',
    description: 'Visit patient at Sundar Nagar village to record repeat BP and check for protein in urine.',
    assignedTo: 'Meena',
    assignedRole: 'Nurse/ANM',
    facility: 'Asha Nagar Village Sub-Centre',
    dueDate: '2026-10-12T17:00:00.000Z', // Overdue!
    status: 'overdue',
    isAutoGenerated: true,
    isSilentPatientFlag: false
  },
  {
    id: 'TSK-105-1',
    patientId: 'PT-105',
    patientName: 'Ananya Sen',
    title: 'Silent Patient Tracing: Urgent Physical Verification',
    description: 'Patient missed scheduled ANC follow-up by 4 days. Contact ASHA Geeta Kumari for home verification.',
    assignedTo: 'Meena',
    assignedRole: 'Nurse/ANM',
    facility: 'Asha Nagar Village Sub-Centre',
    dueDate: '2026-10-11T12:00:00.000Z', // Overdue!
    status: 'overdue',
    isAutoGenerated: true,
    isSilentPatientFlag: true
  },
  {
    id: 'TSK-102-1',
    patientId: 'PT-102',
    patientName: 'Sunita Bai',
    referralId: 'REF-102-1',
    title: 'Confirm Hospital Arrival and Clinical Handover',
    description: 'Verify patient reaches Rampur District Hospital and obstetric admission handover is signed.',
    assignedTo: 'Sister Priya',
    assignedRole: 'Hospital Staff',
    facility: 'Rampur District Hospital (FRU)',
    dueDate: '2026-10-14T08:30:00.000Z',
    status: 'open',
    isAutoGenerated: true,
    isSilentPatientFlag: false
  },
  {
    id: 'TSK-106-1',
    patientId: 'PT-106',
    patientName: 'Geeta Yadav',
    title: 'Postnatal Day 3 Home Wellness Check',
    description: 'Examine newborn latching, cord hygiene, maternal lochia and blood pressure.',
    assignedTo: 'Meena',
    assignedRole: 'Nurse/ANM',
    facility: 'Asha Nagar Village Sub-Centre',
    dueDate: '2026-10-14T09:00:00.000Z',
    status: 'completed',
    completedAt: '2026-10-14T08:50:00.000Z',
    completedBy: 'Meena (ANM)',
    completionNote: 'Mother and baby healthy. BP 120/78, infant feeding well. Vitamin K and Hepatitis B confirmed.',
    isAutoGenerated: true,
    isSilentPatientFlag: false
  }
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'AUD-001',
    timestamp: '2026-10-14T06:30:15.000Z',
    actor: 'Meena (ANM)',
    role: 'Nurse/ANM',
    facility: 'Asha Nagar Village Sub-Centre',
    action: 'Vitals Recorded & Alert Triggered',
    patientId: 'PT-102',
    patientName: 'Sunita Bai',
    details: 'Recorded BP 168/112, pulse 104, headache. Rule RULE-COMB-01 fired CRITICAL.',
    online: true,
    device: 'ANM Tablet #04 (Android 13)'
  },
  {
    id: 'AUD-002',
    timestamp: '2026-10-14T06:35:20.000Z',
    actor: 'Meena (ANM)',
    role: 'Nurse/ANM',
    facility: 'Asha Nagar Village Sub-Centre',
    action: 'Senior Review Requested',
    patientId: 'PT-102',
    patientName: 'Sunita Bai',
    details: 'Urgent SBAR escalation submitted to Dr. Arun at Shanti Puram PHC.',
    online: true,
    device: 'ANM Tablet #04 (Android 13)'
  },
  {
    id: 'AUD-003',
    timestamp: '2026-10-14T06:40:45.000Z',
    actor: 'Dr. Arun (PHC)',
    role: 'PHC Doctor',
    facility: 'Shanti Puram Primary Health Centre (PHC)',
    action: 'Escalation Reviewed & Decision Recorded',
    patientId: 'PT-102',
    patientName: 'Sunita Bai',
    details: 'Decision: Refer to Rampur District Hospital. Oral Labetalol 100mg approved.',
    online: true,
    device: 'PHC Workstation #01 (Chrome)'
  },
  {
    id: 'AUD-004',
    timestamp: '2026-10-14T06:50:10.000Z',
    actor: 'Sister Priya',
    role: 'Hospital Staff',
    facility: 'Rampur District Hospital (FRU)',
    action: 'Referral Accepted',
    patientId: 'PT-102',
    patientName: 'Sunita Bai',
    details: 'Referral REF-2026-1002 accepted. Reserved Obstetric Bed 3.',
    online: true,
    device: 'Emergency Desk Terminal #02 (Windows 11)'
  }
];

export async function seedAllData(db: any) {
  await db.transaction('rw', [
    db.patients,
    db.readings,
    db.alerts,
    db.escalations,
    db.referrals,
    db.tasks,
    db.facilities,
    db.auditLogs,
    db.rules
  ], async () => {
    await db.patients.clear();
    await db.readings.clear();
    await db.alerts.clear();
    await db.escalations.clear();
    await db.referrals.clear();
    await db.tasks.clear();
    await db.facilities.clear();
    await db.auditLogs.clear();
    await db.rules.clear();

    await db.patients.bulkAdd(initialPatients);
    await db.readings.bulkAdd(initialReadings);
    await db.alerts.bulkAdd(initialAlerts);
    await db.escalations.bulkAdd(initialEscalations);
    await db.referrals.bulkAdd(initialReferrals);
    await db.tasks.bulkAdd(initialTasks);
    await db.facilities.bulkAdd(initialFacilities);
    await db.auditLogs.bulkAdd(initialAuditLogs);
    await db.rules.bulkAdd(defaultRules);
  });
}
