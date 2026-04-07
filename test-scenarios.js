/**
 * Test Script to Verify All 5 Scenarios Work with EEU-CC
 * Run this to verify credence values and structure
 */

const { scenarios } = require('./src/data/scenarios');

console.log('🧪 Testing All 5 Scenarios for EEU-CC Compatibility\n');
console.log('='.repeat(70));

let allPassed = true;

Object.entries(scenarios).forEach(([scenarioId, scenario], index) => {
  console.log(`\n📋 Scenario ${index + 1}: ${scenario.title}`);
  console.log('-'.repeat(70));
  
  let scenarioPassed = true;
  
  // Test 1: Check scenario has required fields
  const requiredFields = ['id', 'title', 'actions', 'constraints', 'context'];
  const missingFields = requiredFields.filter(field => !scenario[field]);
  
  if (missingFields.length > 0) {
    console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
    scenarioPassed = false;
    allPassed = false;
  } else {
    console.log(`✅ All required fields present`);
  }
  
  // Test 2: Check actions have beliefs with valid credence
  console.log(`\n   Actions (${scenario.actions.length}):`);
  scenario.actions.forEach((action, i) => {
    // Check credence sums to 1.0
    const credenceSum = Object.values(action.credence).reduce((sum, val) => sum + val, 0);
    const isValid = Math.abs(credenceSum - 1.0) < 0.001;
    
    if (isValid) {
      console.log(`   ${i + 1}. ✅ ${action.label}`);
      console.log(`      Credence: ${JSON.stringify(action.credence)} (Sum: ${credenceSum.toFixed(3)})`);
      console.log(`      Confidence: ${action.confidence}`);
    } else {
      console.log(`   ${i + 1}. ❌ ${action.label}`);
      console.log(`      ERROR: Credence sum is ${credenceSum.toFixed(3)}, should be 1.0`);
      scenarioPassed = false;
      allPassed = false;
    }
    
    // Check confidence is between 0 and 1
    if (action.confidence < 0 || action.confidence > 1) {
      console.log(`      ❌ ERROR: Confidence ${action.confidence} out of range [0, 1]`);
      scenarioPassed = false;
      allPassed = false;
    }
    
    // Check justification exists
    if (!action.justification || !action.justification.moral_principles) {
      console.log(`      ❌ ERROR: Missing justification`);
      scenarioPassed = false;
      allPassed = false;
    }
  });
  
  // Test 3: Check constraints
  console.log(`\n   Constraints (${scenario.constraints.length}):`);
  scenario.constraints.forEach((constraint, i) => {
    const hasRequired = constraint.id && constraint.principle && constraint.weight;
    if (hasRequired) {
      console.log(`   ${i + 1}. ✅ ${constraint.title} (weight: ${constraint.weight})`);
    } else {
      console.log(`   ${i + 1}. ❌ ${constraint.title} - Missing required fields`);
      scenarioPassed = false;
      allPassed = false;
    }
  });
  
  // Test 4: Check context
  if (scenario.context && scenario.context.scenario) {
    console.log(`\n   ✅ Context: ${scenario.context.scenario}`);
  } else {
    console.log(`\n   ❌ Context missing or invalid`);
    scenarioPassed = false;
    allPassed = false;
  }
  
  // Summary for this scenario
  if (scenarioPassed) {
    console.log(`\n   ✅ Scenario ${index + 1} PASSED - Ready for EEU-CC`);
  } else {
    console.log(`\n   ❌ Scenario ${index + 1} FAILED - Needs fixes`);
  }
});

console.log('\n' + '='.repeat(70));
if (allPassed) {
  console.log('✅ ALL 5 SCENARIOS PASSED - EEU-CC Ready!\n');
  process.exit(0);
} else {
  console.log('❌ SOME SCENARIOS FAILED - Review errors above\n');
  process.exit(1);
}
