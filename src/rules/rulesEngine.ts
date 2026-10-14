import { Alert, ClinicalRule, Patient, Reading, Severity } from '../types';
import { DEFAULT_RULES } from './defaultRules';

export interface EvaluationResult {
  severity: Severity;
  triggeredRules: ClinicalRule[];
  topReason: string;
  triggerSummary: string;
  plainExplanation: string;
  alerts: {
    ruleId: string;
    ruleName: string;
    triggerSummary: string;
    plainExplanation: string;
    severity: Severity;
  }[];
  sbarDraft: {
    situation: string;
    background: string;
    assessment: string;
    recommendation: string;
  };
}

export function evaluateVitalsAndSymptoms(
  readingOrVitals: {
    bpSystolic?: number;
    bpDiastolic?: number;
    systolic?: number;
    diastolic?: number;
    pulse: number;
    temperature?: number;
    temp?: number;
    spo2: number;
    bloodSugar?: number;
    symptoms?: string[];
  },
  symptomsOrPatient?: string[] | Partial<Patient>,
  customRules?: ClinicalRule[]
): EvaluationResult {
  const rules = customRules || DEFAULT_RULES;
  const activeRules = rules.filter(r => r.isActive);
  const triggered: ClinicalRule[] = [];

  const bpSystolic = readingOrVitals.bpSystolic ?? readingOrVitals.systolic ?? 120;
  const bpDiastolic = readingOrVitals.bpDiastolic ?? readingOrVitals.diastolic ?? 80;
  const pulse = readingOrVitals.pulse ?? 76;
  const temperature = readingOrVitals.temperature ?? readingOrVitals.temp ?? 37.0;
  const spo2 = readingOrVitals.spo2 ?? 98;

  let symptoms: string[] = [];
  let patient: Partial<Patient> | undefined;

  if (Array.isArray(symptomsOrPatient)) {
    symptoms = symptomsOrPatient;
  } else if (symptomsOrPatient && typeof symptomsOrPatient === 'object') {
    patient = symptomsOrPatient;
    if (readingOrVitals.symptoms) {
      symptoms = readingOrVitals.symptoms;
    }
  } else if (readingOrVitals.symptoms) {
    symptoms = readingOrVitals.symptoms;
  }

  for (const rule of activeRules) {
    let fires = false;
    const p = rule.parameters;

    if (rule.id === 'rule_severe_htn') {
      if (bpSystolic >= 160 || bpDiastolic >= 110) {
        fires = true;
      }
    } else if (rule.id === 'rule_mild_htn') {
      const isSevere = bpSystolic >= 160 || bpDiastolic >= 110;
      if (!isSevere && ((bpSystolic >= 140 && bpSystolic <= 159) || (bpDiastolic >= 90 && bpDiastolic <= 109))) {
        fires = true;
      }
    } else if (rule.id === 'rule_extreme_pulse') {
      if ((p.pulseMax !== undefined && pulse > p.pulseMax) || (p.pulseMin !== undefined && pulse < p.pulseMin)) {
        fires = true;
      }
    } else if (rule.id === 'rule_tachycardia') {
      if (p.pulseMin !== undefined && p.pulseMax !== undefined) {
        if (pulse >= p.pulseMin && pulse <= p.pulseMax) {
          fires = true;
        }
      }
    } else if (rule.id === 'rule_hypoxia') {
      if (p.spo2Min !== undefined && spo2 < p.spo2Min) {
        fires = true;
      }
    } else if (rule.id === 'rule_hyperpyrexia') {
      if (p.tempMin !== undefined && temperature >= p.tempMin) {
        fires = true;
      }
    } else if (rule.id === 'rule_mild_fever') {
      if (p.tempMin !== undefined && p.tempMax !== undefined) {
        if (temperature >= p.tempMin && temperature <= p.tempMax) {
          fires = true;
        }
      }
    } else if (rule.id === 'rule_preeclampsia_combo') {
      const bpElevated = bpSystolic >= 140 || bpDiastolic >= 90;
      const hasNeuroSymptom = symptoms.some(s => 
        s.toLowerCase().includes('headache') || s.toLowerCase().includes('vision') || s.toLowerCase().includes('blurred')
      );
      if (bpElevated && hasNeuroSymptom) {
        fires = true;
      }
    } else if (rule.category === 'symptoms') {
      if (p.symptomsRequired && p.symptomsRequired.length > 0) {
        const hasSymptom = p.symptomsRequired.some(s => 
          symptoms.some(userSym => userSym.toLowerCase().includes(s.toLowerCase()))
        );
        if (hasSymptom) fires = true;
      }
    }

    if (fires) {
      triggered.push(rule);
    }
  }

  // Determine overall severity
  let severity: Severity = 'stable';
  if (triggered.some(r => r.severity === 'critical')) {
    severity = 'critical';
  } else if (triggered.some(r => r.severity === 'warning')) {
    severity = 'warning';
  }

  // Top reason
  let topReason = 'Vitals within normal physiological gestational range';
  if (triggered.length > 0) {
    const criticals = triggered.filter(r => r.severity === 'critical');
    if (criticals.length > 0) {
      topReason = criticals.map(r => r.name).join(' & ');
    } else {
      topReason = triggered.map(r => r.name).join(' & ');
    }
  }

  // Trigger summary
  const summaryParts: string[] = [];
  if (bpSystolic >= 140 || bpDiastolic >= 90) {
    summaryParts.push(`BP ${bpSystolic}/${bpDiastolic} mmHg`);
  }
  if (pulse > 110 || pulse < 50) {
    summaryParts.push(`Pulse ${pulse} bpm`);
  }
  if (spo2 < 95) {
    summaryParts.push(`SpO2 ${spo2}%`);
  }
  if (temperature >= 38.0) {
    summaryParts.push(`Temp ${temperature}°C`);
  }
  if (symptoms.length > 0) {
    summaryParts.push(`Symptoms: ${symptoms.join(', ')}`);
  }
  const triggerSummary = summaryParts.length > 0 ? summaryParts.join(' • ') : 'Routine observation values';

  // Plain explanation
  let plainExplanation = 'Patient demonstrates stable hemodynamic parameters with no acute warning flags.';
  if (triggered.length > 0) {
    plainExplanation = triggered.map(r => `[${r.name}]: ${r.plainRationale}`).join(' ');
  }

  const alerts = triggered.map(r => ({
    ruleId: r.id,
    ruleName: r.name,
    triggerSummary: `Triggered by ${triggerSummary}`,
    plainExplanation: r.plainRationale,
    severity: r.severity
  }));

  // SBAR
  const sbarDraft = generateSbar(
    {
      bpSystolic,
      bpDiastolic,
      pulse,
      temperature,
      spo2,
      symptoms
    },
    patient,
    triggered,
    severity
  );

  return {
    severity,
    triggeredRules: triggered,
    topReason,
    triggerSummary,
    plainExplanation,
    alerts,
    sbarDraft,
  };
}

export function generateSbar(
  reading: {
    bpSystolic?: number;
    bpDiastolic?: number;
    systolic?: number;
    diastolic?: number;
    pulse: number;
    temperature?: number;
    temp?: number;
    spo2: number;
    symptoms?: string[];
  },
  patient?: Partial<Patient>,
  triggeredRules: ClinicalRule[] = [],
  severity: Severity = 'warning'
) {
  const patientName = patient?.name || 'Maternal Patient';
  const age = patient?.age || 24;
  const gestation = patient?.gestationWeeks || 34;
  const parity = patient?.parity || 'G1P0';
  const village = patient?.village || 'Sub-Centre Catchment';

  const bpSys = reading.bpSystolic ?? reading.systolic ?? 120;
  const bpDia = reading.bpDiastolic ?? reading.diastolic ?? 80;
  const pulse = reading.pulse ?? 76;
  const temp = reading.temperature ?? reading.temp ?? 37.0;
  const spo2 = reading.spo2 ?? 98;
  const symptoms = reading.symptoms || [];

  const isSevere = severity === 'critical';

  return {
    situation: `(Draft - clinician must review) Patient ${patientName}, ${age}y, ${gestation} weeks pregnant (${parity}), from ${village}, flagged with ${isSevere ? 'CRITICAL obstetric danger signs' : 'clinical warning indicators'} during sub-centre visit.`,
    background: `Gestation: ${gestation} weeks (${parity}). Antenatal history: ${patient?.riskFactors?.join(', ') || 'No documented prior chronic conditions'}. Last recorded contact at rural health sub-centre.`,
    assessment: `Current Vitals: BP ${bpSys}/${bpDia} mmHg, Pulse ${pulse} bpm, SpO2 ${spo2}%, Temp ${temp}°C. Symptoms: ${symptoms.length > 0 ? symptoms.join(', ') : 'None'}. Clinical rules fired: ${triggeredRules.map(r => r.name).join(', ') || 'None'}. Imminent concern: ${isSevere ? 'Severe Pre-eclampsia / Acute decompensation' : 'Gestational risk progression'}.`,
    recommendation: isSevere
      ? `Immediate medical review by PHC Medical Officer. Initiate left lateral positioning, prepare 20% Magnesium Sulfate loading dose per national guidelines if indicated, and coordinate emergency 108 ambulance transfer to District Hospital with blood bank/ICU capacity.`
      : `Physician consultation advised within 4 hours. Repeat BP and urine albumin dipstick in 30 minutes, restrict strenuous activity, and arrange structured follow-up within 24 hours.`,
  };
}

export const generateSbarSummary = (
  patient: Patient,
  reading: Reading | any,
  alert: Alert | any
) => {
  return generateSbar(
    {
      bpSystolic: reading.bpSystolic || reading.systolic || 120,
      bpDiastolic: reading.bpDiastolic || reading.diastolic || 80,
      pulse: reading.pulse || 76,
      temperature: reading.temperature || reading.temp || 37.0,
      spo2: reading.spo2 || 98,
      symptoms: reading.symptoms || []
    },
    patient,
    [],
    alert?.severity || 'warning'
  );
};
