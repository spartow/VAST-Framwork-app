# VAST Framework Customization Guide

This guide provides detailed instructions for customizing the VAST framework demo for your specific needs.

---

## Table of Contents

1. [Creating Custom Scenarios](#creating-custom-scenarios)
2. [Modifying Visual Design](#modifying-visual-design)
3. [Adjusting Algorithm Parameters](#adjusting-algorithm-parameters)
4. [Adding New Gauge Types](#adding-new-gauge-types)
5. [Extending the Framework](#extending-the-framework)

---

## Creating Custom Scenarios

### Basic Scenario Template

```javascript
{
  id: 'unique_scenario_id',
  title: 'Human-Readable Title',
  description: 'Brief description of the ethical dilemma',
  
  // Decision context - affects utility calculations
  context: {
    scenario: 'scenario_type',
    resource_scarcity: true,      // Boolean
    moral_stakes: 0.9,             // 0-1 scale
    time_pressure: 'high',         // 'low', 'medium', 'high', 'critical'
    stakes: 'high'                 // 'low', 'medium', 'high'
  },
  
  // Optional: Additional contextual information
  situation: {
    key: 'value',
    // Add any relevant scenario details
  },
  
  // Actions available in this scenario
  actions: [
    {
      id: 'action_identifier',
      label: 'User-Friendly Action Name',
      
      // Credence: probability distribution over outcomes
      credence: { 
        outcome1: 0.7,
        outcome2: 0.3
        // Must sum to 1.0
      },
      
      // Confidence: evidence strength (0-1)
      confidence: 0.85,
      
      // Justification: structured reasoning
      justification: {
        facts: [
          'observable_fact_1',
          'measurable_data_2'
        ],
        rules: [
          'applicable_protocol_1',
          'ethical_guideline_2'
        ],
        moral_principles: [
          'utilitarian_principle',
          'preserve_life',
          'fairness'
        ],
        context: 'contextual_information'
      }
    }
  ],
  
  // Optional: Evidence for JWMC revision demo
  newEvidence: {
    title: 'Evidence Title',
    description: 'What changed',
    credence: { outcome1: 0.8, outcome2: 0.2 },
    confidence: 0.9,
    justification: {
      facts: ['new_fact'],
      rules: ['new_rule'],
      moral_principles: ['principle']
    }
  },
  
  // Optional: Expected results for validation
  expectedResult: {
    selectedAction: 'action_identifier',
    expectedVASTScore: 0.76,
    reasoning: 'Why this action should be selected'
  }
}
```

### Example: Custom Environmental Scenario

```javascript
environmental_crisis: {
  id: 'environmental_crisis',
  title: 'Environmental Protection vs Economic Growth',
  description: 'Industrial facility causing pollution - balance environment and jobs',
  
  context: {
    scenario: 'environmental_crisis',
    moral_stakes: 0.75,
    time_pressure: 'medium',
    stakes: 'high'
  },
  
  situation: {
    facility: 'Chemical plant',
    pollution_level: 'moderate',
    jobs_affected: 500,
    health_risk: 'long_term'
  },
  
  actions: [
    {
      id: 'immediate_shutdown',
      label: 'Immediate Facility Shutdown',
      credence: { 
        environmental_improvement: 0.85,
        economic_harm: 0.15
      },
      confidence: 0.78,
      justification: {
        facts: ['pollution_exceeds_limits', 'health_complaints_increasing'],
        rules: ['environmental_protection_act', 'precautionary_principle'],
        moral_principles: ['preserve_life', 'sustainability', 'intergenerational_justice'],
        context: 'environmental_crisis'
      }
    },
    {
      id: 'gradual_transition',
      label: 'Gradual Transition with Retraining',
      credence: { 
        environmental_improvement: 0.70,
        economic_harm: 0.30
      },
      confidence: 0.82,
      justification: {
        facts: ['retraining_programs_available', 'alternative_industries_nearby'],
        rules: ['just_transition_principles', 'stakeholder_consultation'],
        moral_principles: ['fairness', 'utilitarian_principle', 'sustainability'],
        context: 'environmental_crisis'
      }
    },
    {
      id: 'technology_upgrade',
      label: 'Mandate Technology Upgrade',
      credence: { 
        environmental_improvement: 0.60,
        economic_harm: 0.40
      },
      confidence: 0.70,
      justification: {
        facts: ['clean_technology_exists', 'investment_required_substantial'],
        rules: ['industry_regulations', 'emission_standards'],
        moral_principles: ['efficiency', 'fairness', 'preserve_life'],
        context: 'environmental_crisis'
      }
    }
  ],
  
  expectedResult: {
    selectedAction: 'gradual_transition',
    expectedVASTScore: 0.74,
    reasoning: 'Balances environmental protection with economic fairness'
  }
}
```

---

## Modifying Visual Design

### Color Scheme

Edit `src/App.css`:

```css
/* Primary Colors */
--primary-blue: #1e3a8a;      /* Headers, titles */
--primary-cyan: #1fb8cd;      /* Interactive elements, selected items */
--accent-green: #059669;      /* Success states */
--accent-red: #dc2626;        /* Error states */
--accent-orange: #f59e0b;     /* Warnings, JWMC button */

/* Update throughout your CSS */
.your-element {
  background: var(--primary-cyan);
}
```

### Chart Colors

Edit gauge colors in `src/components/VastGauges.js`:

```javascript
function getColorForScore(score) {
  if (score >= 0.75) return '#059669';  // Excellent - Green
  if (score >= 0.6) return '#f59e0b';   // Good - Orange
  return '#dc2626';                      // Needs work - Red
}
```

### Typography

```css
/* Add to App.css */
body {
  font-family: 'Your Preferred Font', -apple-system, sans-serif;
}

h1, h2, h3 {
  font-family: 'Your Header Font', serif;
}
```

### Layout Adjustments

Change grid layouts in components:

```css
/* BeliefCreator.css - adjust form layout */
.beliefs-container {
  grid-template-columns: 1fr 1fr;  /* Two columns */
  /* OR */
  grid-template-columns: 1fr;      /* Single column */
}
```

---

## Adjusting Algorithm Parameters

### Moral Hierarchy Weights

**Location**: `src/core/VASTFramework.js` - constructor

```javascript
this.moralHierarchy = {
  1: { 
    name: "preserve_life",    // Top priority
    weight: 0.9,              // Impact on penalty (0-1)
    propagation: 0.8          // How much affects lower levels
  },
  2: { 
    name: "fairness", 
    weight: 0.6, 
    propagation: 0.7 
  },
  3: { 
    name: "efficiency", 
    weight: 0.3, 
    propagation: 0.5 
  }
};
```

**Guidelines**:
- Higher levels should have higher weights
- Weight: How severely violations are penalized
- Propagation: How violations cascade to lower levels
- Add more levels for complex hierarchies

### JWMC Moral Weight Calculation

**Location**: `_calculateMoralWeight` method

```javascript
// Adjust similarity calculation
const baseSimilarity = len(intersection) / len(union);

// Adjust core principle boost
const corePrinciples = new Set([
  'preserve_life',      // Add your core principles
  'fairness',
  'utilitarian_principle'
]);
const coreBoost = sharedCore * 0.15;  // Adjust boost factor (0-0.3)

return Math.min(1.0, baseSimilarity + coreBoost);
```

### Gauge Calculation Weights

**Location**: `calculateVastGauges` method

```javascript
// Adjust individual gauge calculations
const gaugeWeights = {
  calibration: 0.25,         // How much each gauge
  normative_alignment: 0.3,  // contributes to overall
  coherence: 0.2,            // VAST score
  reasoning: 0.25            // Must sum to 1.0
};
```

**Principle Weights** (Normative Alignment):

```javascript
const principleWeights = {
  'utilitarian_principle': 0.3,
  'preserve_life': 0.25,
  'fairness': 0.2,
  'medical_effectiveness': 0.15,
  'respect_dignity': 0.1
  // Add more principles as needed
};
```

### Base Utility Patterns

**Location**: `_calculateBaseUtility` method

```javascript
const utilityPatterns = {
  'allocate': 0.7,
  'engage': 0.6,
  'brake': 0.8,
  // Add your action patterns
  'protect_environment': 0.75,
  'economic_growth': 0.65
};
```

### Constraint Violation Assessment

**Location**: `_assessConstraintViolations` method

```javascript
// Customize violation scoring for your scenarios
if (actionLower.includes('shutdown')) {
  violations[1] = 0.2;  // Low life-preservation violation
}
if (actionLower.includes('pollution')) {
  violations[2] = 0.6;  // Moderate fairness violation
}
```

---

## Adding New Gauge Types

### Step 1: Add Calculation Logic

Edit `src/core/VASTFramework.js` - `calculateVastGauges`:

```javascript
// Add new gauge calculation
const transparency = this._calculateTransparency(belief);
gauges.transparency = transparency;

// Update overall score calculation
const gaugeWeights = {
  calibration: 0.2,
  normative_alignment: 0.25,
  coherence: 0.2,
  reasoning: 0.2,
  transparency: 0.15  // New gauge
};
```

### Step 2: Create Calculation Method

```javascript
_calculateTransparency(belief) {
  // Your calculation logic
  const factsProvided = belief.justification.facts?.length || 0;
  const rulesProvided = belief.justification.rules?.length || 0;
  const totalElements = factsProvided + rulesProvided;
  
  const transparency = Math.min(totalElements / 8.0, 1.0);
  return transparency;
}
```

### Step 3: Add Visualization

Edit `src/components/VastGauges.js`:

```javascript
// Add new ref
const transparencyRef = useRef(null);

// Add chart creation in useEffect
if (transparencyRef.current) {
  chartsRef.current.transparency = new Chart(transparencyRef.current, {
    type: 'bar',  // Choose chart type
    data: {
      labels: ['Transparency'],
      datasets: [{
        data: [gauges.transparency],
        backgroundColor: getColorForScore(gauges.transparency)
      }]
    },
    options: {
      // Chart options
    }
  });
}

// Add to JSX
<div className="gauge-card">
  <h3>Transparency</h3>
  <p className="gauge-description">Reasoning Explicitness</p>
  <div className="gauge-chart">
    <canvas ref={transparencyRef}></canvas>
  </div>
  <div className="gauge-value">
    {(gauges.transparency * 100).toFixed(1)}%
  </div>
</div>
```

---

## Extending the Framework

### Adding New Decision Methods

Create alternative decision-making algorithms:

```javascript
// In VASTFramework class
maxminDecision(actions, context) {
  // Maximin decision (choose action with best worst-case)
  const actionWorstCases = {};
  
  for (const action of actions) {
    const belief = this.beliefs.get(action);
    const worstCase = Math.min(...Object.values(belief.credence));
    actionWorstCases[action] = worstCase * this._calculateBaseUtility(action, context);
  }
  
  return Object.keys(actionWorstCases).reduce((a, b) => 
    actionWorstCases[a] > actionWorstCases[b] ? a : b
  );
}
```

### Adding Comparative Analysis

```javascript
// In VASTFramework class
compareWithBaseline(proposition, baselineFramework) {
  const vastGauges = this.calculateVastGauges(proposition);
  const comparison = {
    vast_score: vastGauges.overall_vast_score,
    baseline_score: baselineFramework.score,
    improvement: vastGauges.overall_vast_score - baselineFramework.score,
    percentage_gain: ((vastGauges.overall_vast_score - baselineFramework.score) / 
                     baselineFramework.score) * 100
  };
  return comparison;
}
```

### Adding Real-time Updates

```javascript
// In App.js, add useState for live updates
const [liveGauges, setLiveGauges] = useState(null);

// Update gauges whenever beliefs change
useEffect(() => {
  if (currentScenario && decisionResult) {
    const interval = setInterval(() => {
      const gauges = vast.calculateVastGauges(decisionResult.selectedAction);
      setLiveGauges(gauges);
    }, 1000);  // Update every second
    
    return () => clearInterval(interval);
  }
}, [currentScenario, decisionResult]);
```

### Adding Export Formats

```javascript
// In AuditTrail.js
const handleExportCSV = () => {
  const csv = convertToCSV(auditData.decision_log);
  downloadFile(csv, 'vast_audit.csv', 'text/csv');
};

const handleExportPDF = () => {
  // Use library like jsPDF
  const doc = new jsPDF();
  doc.text('VAST Audit Trail', 10, 10);
  // Add content
  doc.save('vast_audit.pdf');
};
```

---

## Best Practices

### Performance Optimization

1. **Limit belief states**: Keep < 50 active beliefs
2. **Debounce calculations**: Don't recalculate on every slider change
3. **Memoize results**: Cache gauge calculations
4. **Lazy load scenarios**: Load only active scenario data

### Data Validation

```javascript
// Add validation helper
function validateBelief(belief) {
  const credenceSum = Object.values(belief.credence).reduce((a, b) => a + b, 0);
  
  if (Math.abs(credenceSum - 1.0) > 0.01) {
    throw new Error('Credence must sum to 1.0');
  }
  
  if (belief.confidence < 0 || belief.confidence > 1) {
    throw new Error('Confidence must be between 0 and 1');
  }
  
  if (!belief.justification.moral_principles || 
      belief.justification.moral_principles.length === 0) {
    console.warn('No moral principles provided');
  }
}
```

### Testing Scenarios

```javascript
// Create test suite
function testScenario(scenario) {
  const vast = new VASTFramework();
  
  // Load beliefs
  scenario.actions.forEach(action => {
    vast.createBelief(action.id, action.credence, 
                     action.confidence, action.justification);
  });
  
  // Make decision
  const result = vast.eeuCcDecision(
    scenario.actions.map(a => a.id),
    scenario.context
  );
  
  // Validate expected result
  if (scenario.expectedResult) {
    const gauges = vast.calculateVastGauges(result.selectedAction);
    const scoreDiff = Math.abs(gauges.overall_vast_score - 
                               scenario.expectedResult.expectedVASTScore);
    
    if (scoreDiff > 0.05) {
      console.warn(`Score deviation: ${scoreDiff.toFixed(3)}`);
    }
  }
  
  return result;
}
```

---

## Troubleshooting Common Issues

### Credence Not Summing to 1.0

**Problem**: Validation error when creating beliefs  
**Solution**: Use normalize function or ensure precise decimals

```javascript
function normalizeCredence(credence) {
  const sum = Object.values(credence).reduce((a, b) => a + b, 0);
  const normalized = {};
  for (const [key, val] of Object.entries(credence)) {
    normalized[key] = val / sum;
  }
  return normalized;
}
```

### Gauges Not Updating

**Problem**: Gauge displays show stale data  
**Solution**: Ensure state updates trigger re-renders

```javascript
// Force re-render after calculation
const newGauges = vast.calculateVastGauges(proposition);
setCurrentGauges({...newGauges});  // Spread to create new object
```

### Performance Lag

**Problem**: Application slows with many decisions  
**Solution**: Clear audit trail or limit log size

```javascript
// In VASTFramework
const MAX_LOG_SIZE = 100;

if (this.decisionLog.length > MAX_LOG_SIZE) {
  this.decisionLog = this.decisionLog.slice(-MAX_LOG_SIZE);
}
```

---

## Additional Resources

- **React Documentation**: https://react.dev
- **Chart.js Guide**: https://www.chartjs.org/docs
- **AI Alignment Research**: See thesis references

For framework-specific questions, refer to inline code comments in `VASTFramework.js`.
