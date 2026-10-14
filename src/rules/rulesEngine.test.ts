import { evaluateVitalsAndSymptoms } from './rulesEngine';

function runRulesEngineTests() {
  console.log('--- Running Rules Engine Unit Tests ---');
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

  // Test 1: Severe HTN trigger (Systolic >= 160)
  const test1 = evaluateVitalsAndSymptoms({
    bpSystolic: 165,
    bpDiastolic: 100,
    pulse: 84,
    temperature: 36.8,
    spo2: 98,
    symptoms: [],
  });
  assert(test1.severity === 'critical', 'Systolic 165 mmHg triggers CRITICAL severity');
  assert(test1.triggeredRules.some(r => r.id === 'rule_severe_htn'), 'rule_severe_htn fired');

  // Test 2: Severe HTN trigger (Diastolic >= 110)
  const test2 = evaluateVitalsAndSymptoms({
    bpSystolic: 150,
    bpDiastolic: 112,
    pulse: 82,
    temperature: 37.0,
    spo2: 97,
    symptoms: [],
  });
  assert(test2.severity === 'critical', 'Diastolic 112 mmHg triggers CRITICAL severity');

  // Test 3: Combination Rule: Mild HTN + Severe headache = CRITICAL (Pre-eclampsia)
  const test3 = evaluateVitalsAndSymptoms({
    bpSystolic: 145,
    bpDiastolic: 92,
    pulse: 88,
    temperature: 37.1,
    spo2: 98,
    symptoms: ['Severe headache'],
  });
  assert(test3.severity === 'critical', 'BP 145/92 + Severe headache triggers CRITICAL via Pre-eclampsia Triad');
  assert(test3.triggeredRules.some(r => r.id === 'rule_preeclampsia_combo'), 'rule_preeclampsia_combo fired');

  // Test 4: Moderate HTN alone is WARNING
  const test4 = evaluateVitalsAndSymptoms({
    bpSystolic: 144,
    bpDiastolic: 94,
    pulse: 88,
    temperature: 36.9,
    spo2: 98,
    symptoms: [],
  });
  assert(test4.severity === 'warning', 'BP 144/94 with no danger symptoms triggers WARNING severity');
  assert(test4.triggeredRules.some(r => r.id === 'rule_mild_htn'), 'rule_mild_htn fired');

  // Test 5: Normal healthy vitals are STABLE
  const test5 = evaluateVitalsAndSymptoms({
    bpSystolic: 118,
    bpDiastolic: 76,
    pulse: 78,
    temperature: 36.7,
    spo2: 99,
    symptoms: [],
  });
  assert(test5.severity === 'stable', 'Normal gestational vitals evaluated as STABLE');
  assert(test5.triggeredRules.length === 0, 'No rules fired for normal vitals');

  // Test 6: SpO2 < 92 is CRITICAL
  const test6 = evaluateVitalsAndSymptoms({
    bpSystolic: 120,
    bpDiastolic: 80,
    pulse: 90,
    temperature: 37.0,
    spo2: 90,
    symptoms: [],
  });
  assert(test6.severity === 'critical', 'SpO2 90% triggers CRITICAL hypoxia alert');

  // Test 7: Convulsions symptom alone is CRITICAL
  const test7 = evaluateVitalsAndSymptoms({
    bpSystolic: 120,
    bpDiastolic: 80,
    pulse: 88,
    temperature: 37.0,
    spo2: 98,
    symptoms: ['Convulsions / Seizure'],
  });
  assert(test7.severity === 'critical', 'Convulsions symptom triggers CRITICAL eclampsia alert');

  // Test 8: SBAR generation contains situation and recommendation
  assert(test1.sbarDraft.situation.includes('CRITICAL'), 'SBAR situation flags critical state');
  assert(test1.sbarDraft.recommendation.length > 20, 'SBAR recommendation populated');

  console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) {
    throw new Error(`${failed} tests failed`);
  }
}

// Execute if run directly via tsx
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('rulesEngine.test')) {
  runRulesEngineTests();
}

export { runRulesEngineTests };
