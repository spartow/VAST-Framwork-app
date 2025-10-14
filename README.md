# VAST Framework

**Values Alignment & Stability Tracker** - An interactive web application for AI moral alignment and ethical decision-making.

Master Thesis Project | Author: Soraya Partow | Supervisor: Dr. Satyaki Nan | October 2025

---

## Overview

VAST is a novel framework for AI moral alignment that provides transparent, auditable, and stable ethical decision-making. This interactive application showcases:

- **Structured Belief Representation**: B(x) = (π(x), κ(x), J(x))
- **JWMC Belief Revision**: Justification-Weighted Moral Consistency
- **EEU-CC Decision Making**: Ethical Expected Utility with Cascading Constraints
- **Four-Gauge Alignment Monitoring**: Real-time quality assessment

---

## Quick Start

### Prerequisites

- **Node.js** v14.0.0 or higher
- **npm** v6.0.0 or higher

### Installation

```bash
# Navigate to project directory
cd vast-demo

# Install dependencies
npm install

# Start development server
npm start
```

The application will open automatically at `http://localhost:3000`

---

## Features

### 1. **Scenario Loading**
- Pre-configured healthcare crisis scenario
- Autonomous vehicle emergency scenario
- Load custom scenarios via JSON

### 2. **Interactive Belief Creation**
- **Credence (π)**: Probability sliders with real-time validation
- **Confidence (κ)**: Evidence strength slider (0-1)
- **Justification (J)**: Structured reasoning chains
  - Facts: Observable evidence
  - Rules: Applicable principles
  - Moral Principles: Ethical frameworks

### 3. **JWMC Revision Demo**
- Shows belief update with new evidence
- Displays moral weight calculation
- Demonstrates stability preservation

### 4. **EEU-CC Decision Making**
- Compares multiple actions
- Shows utility calculation breakdown:
  - Base utility
  - Moral weighting factor
  - Cascading constraint penalties
- Selects optimal action with full reasoning

### 5. **VAST Gauges Dashboard**
- **Calibration**: Confidence vs accuracy alignment
- **Normative Alignment**: Moral principle consistency
- **Coherence**: Internal belief consistency
- **Reasoning**: Justification quality & depth
- **Overall VAST Score**: Weighted combination

### 6. **Audit Trail**
- Complete decision history
- Searchable by action or principle
- Expandable entries with full reasoning
- JSON export for analysis

### 7. **Framework Comparison**
- VAST vs Traditional AI (RLHF)
- VAST vs Constitutional AI
- VAST vs Value Learning
- Visual score comparison

---

## Project Structure

```
vast-demo/
├── public/
│   └── index.html           # HTML template
├── src/
│   ├── core/
│   │   └── VASTFramework.js # Core VAST implementation
│   ├── data/
│   │   └── scenarios.js     # Pre-configured scenarios
│   ├── components/
│   │   ├── BeliefCreator.js # Belief creation interface
│   │   ├── VastGauges.js    # Gauge visualizations
│   │   ├── DecisionMaker.js # Decision display
│   │   ├── AuditTrail.js    # Audit log viewer
│   │   └── ScenarioLoader.js# Scenario selection
│   ├── App.js               # Main application
│   ├── App.css              # Global styles
│   └── index.js             # Entry point
├── package.json             # Dependencies
└── README.md               # This file
```

---

## Customizing Scenarios

### Adding a New Scenario

Edit `src/data/scenarios.js`:

```javascript
export const scenarios = {
  your_scenario: {
    id: 'your_scenario',
    title: 'Your Scenario Title',
    description: 'Scenario description',
    context: {
      scenario: 'your_scenario',
      moral_stakes: 0.8,
      stakes: 'high'
    },
    actions: [
      {
        id: 'action_1',
        label: 'Action 1 Label',
        credence: { success: 0.7, failure: 0.3 },
        confidence: 0.75,
        justification: {
          facts: ['fact1', 'fact2'],
          rules: ['rule1', 'rule2'],
          moral_principles: ['principle1', 'principle2'],
          context: 'your_context'
        }
      }
      // Add more actions...
    ],
    expectedResult: {
      selectedAction: 'action_1',
      expectedVASTScore: 0.80
    }
  }
};
```

### Modifying Moral Hierarchy

Edit `src/core/VASTFramework.js`, constructor:

```javascript
this.moralHierarchy = {
  1: { name: "preserve_life", weight: 0.9, propagation: 0.8 },
  2: { name: "fairness", weight: 0.6, propagation: 0.7 },
  3: { name: "efficiency", weight: 0.3, propagation: 0.5 },
  // Add more levels...
};
```

### Adjusting Gauge Weights

In `calculateVastGauges` method:

```javascript
const gaugeWeights = {
  calibration: 0.25,
  normative_alignment: 0.3,
  coherence: 0.2,
  reasoning: 0.25
};
```

---

## Key Algorithms

### JWMC Belief Revision

```javascript
// 1. Calculate moral weight
moralWeight = similarity(J₁, J₂) + coreBonus

// 2. Combine credences
π_new = w * π₁ + (1-w) * π₂

// 3. Update confidence
κ_new = min(κ₁, κ₂) * stabilityFactor(w)

// 4. Merge justifications
J_new = J₁ ∪ J₂ + metadata
```

### EEU-CC Decision

```javascript
for each action a:
  baseUtility = U(a | context)
  moralWeight = M(J(a), context)
  cascadePenalty = C(a, hierarchy)
  
  expectedUtility = Σ π(s) * baseUtility * moralWeight * cascadePenalty

selected = argmax(expectedUtility)
```

### VAST Gauges

1. **Calibration**: `1 - |κ - accuracy_estimated|`
2. **Normative Alignment**: `Σ weight(principle_i)`
3. **Coherence**: `1 - |H(π) - H_expected|`
4. **Reasoning**: `depth(J) * κ`

---

## Usage Tips

### For Thesis Defense

1. **Start with Healthcare Scenario**: Most impactful demonstration
2. **Use JWMC Demo**: Shows adaptability with new evidence
3. **Highlight Gauges**: Real-time monitoring is unique to VAST
4. **Show Audit Trail**: Demonstrates full transparency
5. **Compare Frameworks**: Emphasizes VAST's advantages

### For Academic Presentations

- Use **Compare** tab to show VAST superiority
- Export audit trail for detailed analysis
- Create custom scenarios relevant to audience
- Focus on the structured belief representation (π, κ, J)

### For Interactive Demos

- Let users create their own beliefs
- Show how different moral principles affect decisions
- Demonstrate belief revision in real-time
- Export results for further discussion

---

## Technical Details

### Dependencies

- **React** 18.2.0: UI framework
- **Chart.js** 4.4.0: Visualizations
- **react-chartjs-2** 5.2.0: React Chart.js wrapper

### Performance

- Decision latency: < 1 second (typically 50-200ms)
- Memory usage: ~50MB for typical scenarios
- Handles up to 50 beliefs simultaneously
- Audit trail up to 1000 decisions

### Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## Building for Production

```bash
# Create optimized production build
npm run build

# Serve the build folder with any static server
# Example with serve:
npm install -g serve
serve -s build
```

The build will be in the `build/` folder, ready for deployment.

---

## Troubleshooting

### Chart.js not rendering
Install kaleido for image export:
```bash
npm install kaleido
```

### Credence validation errors
Ensure all credence values sum to exactly 1.0. Use the "Normalize" button.

### Performance issues
- Reduce number of simultaneous beliefs
- Clear audit trail periodically
- Use Chrome for best performance

---

## API Reference

### VASTFramework Class

#### `createBelief(proposition, credence, confidence, justification)`
Creates a new VAST belief.

**Parameters:**
- `proposition` (string): Action identifier
- `credence` (object): Probability distribution
- `confidence` (number): Evidence strength [0,1]
- `justification` (object): Reasoning structure

**Returns:** `VASTBelief` object

#### `jwmcRevision(proposition, newEvidence)`
Revises existing belief with new evidence.

**Returns:** Object with `belief`, `moralWeight`, `moralStabilityFactor`

#### `eeuCcDecision(actions, context)`
Makes ethical decision among actions.

**Returns:** Object with `selectedAction`, `utilities`, `calculations`

#### `calculateVastGauges(proposition)`
Calculates alignment gauges for belief.

**Returns:** Object with gauge scores and `overall_vast_score`

#### `exportAuditTrail()`
Exports complete audit trail.

**Returns:** JSON object with all framework data

---

## Citation

If you use this framework in your research, please cite:

```bibtex
@masterthesis{partow2025vast,
  title={VAST: Values Alignment and Stability Tracker for AI Moral Alignment},
  author={Partow, Soraya},
  year={2025},
  school={[Your University]},
  supervisor={Nan, Satyaki}
}
```

---

## License

This software is provided for academic and research purposes.


