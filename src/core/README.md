# VAST Core Modules - Quick Start Guide

## Overview

This directory contains the core TypeScript modules for the VAST Framework, refactored to match your thesis exactly.

## Module Structure

```
src/core/
├── types.ts              # All type definitions
├── config.ts             # Configuration & thesis parameters
├── belief/
│   └── BeliefManager.ts  # (π, κ, J) belief management
├── jwmc/
│   └── JWMC.ts           # Justified Weighted Moral Compatibility
├── eeucc/
│   └── EEUCC.ts          # Expected Utility + Cascading Constraints
├── gauges/
│   └── GaugeMonitor.ts   # Four gauges + alerts + trends
└── log/
    └── LogManager.ts     # Append-only audit trail
```

## Quick Start Examples

### 1. Create and Manage Beliefs

```typescript
import { BeliefManager } from './belief/BeliefManager';

const beliefMgr = new BeliefManager();

// Create a belief with validation
const belief = beliefMgr.createBelief(
  'allocate_to_younger',
  { saves_life: 0.82, unsuccessful: 0.18 },  // π (credence)
  0.88,                                       // κ (confidence)
  {                                           // J (justification)
    facts: ['patient_age_35', 'severity_8_out_10'],
    rules: ['maximize_life_years', 'evidence_based_triage'],
    moral_principles: ['utilitarian_principle', 'preserve_life'],
    context: 'icu_crisis_allocation'
  }
);

// Get justification chain
const chain = beliefMgr.getJustificationChain('allocate_to_younger');
console.log(chain);
// Output:
// [
//   "Context: icu_crisis_allocation",
//   "Facts:",
//   "  • patient_age_35",
//   "  • severity_8_out_10",
//   ...
// ]
```

### 2. Revise Beliefs with JWMC

```typescript
import { JWMC } from './jwmc/JWMC';
import { DEFAULT_CONFIG } from './config';

// Initialize JWMC with parameters from thesis
const jwmc = new JWMC(
  DEFAULT_CONFIG.jwmc,
  ['preserve_life', 'fairness'] // Core moral principles
);

// Apply new evidence
const newEvidence = {
  pi: { saves_life: 0.85, unsuccessful: 0.15 },
  kappa: 0.90,
  J: {
    facts: ['new_research_findings'],
    rules: ['updated_guidelines'],
    moral_principles: ['preserve_life'],
    context: 'evidence_update'
  }
};

const { belief: revised, delta } = jwmc.revise(existingBelief, newEvidence);

console.log(`Moral weight: ${delta.moral_weight.toFixed(3)}`);
console.log(`Stability factor: ${delta.stability_factor.toFixed(3)}`);
// Output:
// Moral weight: 0.621
// Stability factor: 0.873
```

### 3. Make Decisions with EEUCC

```typescript
import { EEUCC } from './eeucc/EEUCC';
import { Constraint } from './types';

// Define constraints with priorities
const constraints: Constraint[] = [
  {
    id: 'c1',
    title: 'Preserve Life',
    principle: 'preserve_life',
    priority: 1,              // Highest priority
    threshold: 0.1,
    weight: 0.9,
    propagation: 0.8
  },
  {
    id: 'c2',
    title: 'Fairness',
    principle: 'fairness',
    priority: 2,              // Lower priority
    threshold: 0.3,
    weight: 0.6,
    propagation: 0.7
  }
];

const eeucc = new EEUCC(DEFAULT_CONFIG.eeucc, constraints);

// Decide among actions
const breakdowns = eeucc.decide(
  ['action_a', 'action_b', 'action_c'],
  beliefs,  // Map<string, Belief>
  context   // ActionContext
);

// Best action is first (sorted by eeu_total)
const best = breakdowns[0];
console.log(`Best action: ${best.action_id}`);
console.log(`Base EU: ${best.eu_base.toFixed(4)}`);
console.log(`EEU total: ${best.eeu_total.toFixed(4)}`);

// Show constraint violations
for (const violation of best.constraints) {
  console.log(`Violated ${violation.constraint_id}: ${violation.explanation}`);
}

// Show full justification chain
console.log(best.justification_chain.join('\n'));
```

### 4. Monitor Gauges

```typescript
import { GaugeMonitor } from './gauges/GaugeMonitor';

const monitor = new GaugeMonitor();

// Calculate all 4 gauges
const { scores, alerts, trends } = monitor.calculate(
  beliefs,
  'chosen_action',
  constraints,
  context
);

console.log('Gauge Scores:');
console.log(`  Calibration: ${(scores.calibration * 100).toFixed(1)}%`);
console.log(`  Normative: ${(scores.normative_alignment * 100).toFixed(1)}%`);
console.log(`  Coherence: ${(scores.coherence * 100).toFixed(1)}%`);
console.log(`  Reasoning: ${(scores.reasoning * 100).toFixed(1)}%`);
console.log(`  Overall VAST: ${(scores.overall_vast_score * 100).toFixed(1)}%`);

// Check alerts
for (const alert of alerts) {
  console.log(`[${alert.severity.toUpperCase()}] ${alert.message}`);
  console.log(`  ${alert.explanation}`);
  console.log(`  Recommendation: ${alert.recommendation}`);
}

// Check trends
for (const trend of trends) {
  console.log(`${trend.gauge}: ${trend.direction} (magnitude: ${trend.magnitude.toFixed(3)})`);
}
```

### 5. Maintain Audit Trail

```typescript
import { LogManager } from './log/LogManager';

const logs = new LogManager('icu_triage_scenario');

// Append log entry
logs.append({
  beliefs_before: [...],
  beliefs_after: [...],
  jwmc_metrics: { alpha: 0.7, beta: 0.8, gamma: 0.5, deltas: [...] },
  candidate_actions: ['action_a', 'action_b'],
  eeucc_breakdown: breakdowns,
  chosen_action: 'action_a',
  justification_chain: [...],
  gauge_scores: scores,
  alerts: alerts,
});

// Export as JSON
const jsonExport = logs.export({ format: 'json' });
console.log(jsonExport);

// Export as CSV
const csvExport = logs.export({ format: 'csv' });
console.log(csvExport);

// Filter logs
const filtered = logs.filterLogs({
  filters: {
    actions: ['action_a'],
    gauge_drops: true,  // Only ticks where gauges dropped
  }
});

// Export golden log for CI
const goldenLog = logs.exportGoldenLog();
// Save to __golden__/logs/icu_triage_scenario.json
```

## Complete Example: Full Decision Cycle

```typescript
import { BeliefManager } from './belief/BeliefManager';
import { JWMC } from './jwmc/JWMC';
import { EEUCC } from './eeucc/EEUCC';
import { GaugeMonitor } from './gauges/GaugeMonitor';
import { LogManager } from './log/LogManager';
import { DEFAULT_CONFIG, CORE_MORAL_PRINCIPLES } from './config';

// Initialize all modules
const beliefMgr = new BeliefManager();
const jwmc = new JWMC(DEFAULT_CONFIG.jwmc, CORE_MORAL_PRINCIPLES);
const eeucc = new EEUCC(DEFAULT_CONFIG.eeucc, constraints);
const gauges = new GaugeMonitor();
const logs = new LogManager('my_scenario');

// 1. Create initial beliefs
const actions = ['action_a', 'action_b', 'action_c'];
for (const action of actions) {
  beliefMgr.createBelief(action, pi, kappa, J);
}

// 2. Revise beliefs with new evidence (JWMC)
const beliefs_before = beliefMgr.exportBeliefs();
const revised = jwmc.revise(belief_a, newEvidence);
beliefMgr.updateBelief('action_a', revised.belief);
const beliefs_after = beliefMgr.exportBeliefs();

// 3. Make decision (EEUCC)
const breakdowns = eeucc.decide(
  actions,
  new Map(actions.map(a => [a, beliefMgr.getBelief(a)!])),
  context
);
const chosen = breakdowns[0];

// 4. Calculate gauges
const { scores, alerts, trends } = gauges.calculate(
  new Map(actions.map(a => [a, beliefMgr.getBelief(a)!])),
  chosen.action_id,
  constraints,
  context
);

// 5. Log everything
logs.append({
  beliefs_before,
  beliefs_after,
  jwmc_metrics: {
    alpha: DEFAULT_CONFIG.jwmc.alpha,
    beta: DEFAULT_CONFIG.jwmc.beta,
    gamma: DEFAULT_CONFIG.jwmc.gamma,
    deltas: [revised.delta],
  },
  candidate_actions: actions,
  eeucc_breakdown: breakdowns,
  chosen_action: chosen.action_id,
  justification_chain: chosen.justification_chain,
  gauge_scores: scores,
  alerts,
});

// 6. Export results
const auditTrail = logs.export({ format: 'json' });
console.log('Decision cycle complete!');
console.log(`Chosen: ${chosen.action_id} (EEU: ${chosen.eeu_total.toFixed(4)})`);
console.log(`Overall VAST: ${(scores.overall_vast_score * 100).toFixed(1)}%`);
```

## Parameter Configuration

### Using Default Config (from thesis)

```typescript
import { DEFAULT_CONFIG } from './config';

// Use as-is
const jwmc = new JWMC(DEFAULT_CONFIG.jwmc, CORE_MORAL_PRINCIPLES);
```

### Custom Config

```typescript
import { createConfig } from './config';

const customConfig = createConfig({
  jwmc: {
    alpha: 0.8,  // Override default 0.7
    // beta and gamma use defaults
  },
  eeucc: {
    lambda: 0.5,  // Override default 0.6
  }
});
```

### Validate Config

```typescript
import { validateConfig } from './config';

const { valid, errors } = validateConfig(customConfig);
if (!valid) {
  console.error('Invalid config:', errors);
}
```

## Testing Against Golden Logs

```typescript
import { LogManager } from './log/LogManager';

// Run your scenario
const logs = new LogManager('test_scenario');
// ... run N ticks ...

// Export golden log
const goldenJSON = logs.exportGoldenLog();
// Save to __golden__/logs/test_scenario.json

// Later, validate against golden
const { valid, differences } = LogManager.validateAgainstGolden(
  actualLogs,
  goldenJSON
);

if (!valid) {
  console.error('Differences from golden log:');
  differences.forEach(diff => console.error(`  - ${diff}`));
}
```

## Type Safety

All modules are fully typed. TypeScript will catch:

- Invalid parameter ranges (α, β, γ ∈ [0,1], λ ∈ (0,1))
- Credence that doesn't sum to 1.0
- Missing justification components
- Constraint priority mismatches
- etc.

## Thesis Mapping

| Module | Thesis Section | Key Equations |
|--------|----------------|---------------|
| BeliefManager | Section X.X | B(x) = (π(x), κ(x), J(x)) |
| JWMC | Section Y.Y | π_new = α×π₁ + (1-α)×π₂ |
| EEUCC | Section Z.Z | EU - Σ_p [λ^(p-1) × penalties] |
| GaugeMonitor | Section W.W | 4 metrics + weighted overall |

**TODO:** Update section numbers when you provide thesis details.

## Next Steps

1. **Add Scenarios:** Create `src/data/scenarios/*.ts` files
2. **Build Main Loop:** Implement `src/core/loop/MainLoop.ts`
3. **Update UI:** Use new modules in React components
4. **Add Tests:** Write unit + integration tests
5. **CI:** Set up golden log validation

See `REFACTORING_STATUS.md` for complete roadmap!
