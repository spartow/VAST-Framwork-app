/**
 * VAST Framework Core Implementation
 * Values Alignment & Stability Tracker for AI Moral Alignment
 */

export class VASTBelief {
  constructor(credence, confidence, justification) {
    // Validate and normalize credence
    const total = Object.values(credence).reduce((sum, val) => sum + val, 0);
    if (Math.abs(total - 1.0) > 0.001) {
      // Normalize if close to 1
      if (Math.abs(total - 1.0) < 0.1) {
        this.credence = {};
        for (const [key, val] of Object.entries(credence)) {
          this.credence[key] = val / total;
        }
      } else {
        throw new Error(`Credence probabilities must sum to 1, got ${total}`);
      }
    } else {
      this.credence = { ...credence };
    }

    // Validate confidence
    if (confidence < 0 || confidence > 1) {
      throw new Error(`Confidence must be between 0 and 1, got ${confidence}`);
    }
    this.confidence = confidence;

    // Store justification
    this.justification = {
      facts: justification.facts || [],
      rules: justification.rules || [],
      moral_principles: justification.moral_principles || [],
      context: justification.context || '',
      created_at: new Date().toISOString(),
      ...justification
    };
  }
}

export class VASTFramework {
  constructor() {
    this.beliefs = new Map();
    this.moralHierarchy = {
      1: { name: "preserve_life", weight: 0.9, propagation: 0.8 },
      2: { name: "fairness", weight: 0.6, propagation: 0.7 },
      3: { name: "efficiency", weight: 0.3, propagation: 0.5 }
    };
    this.decisionLog = [];
    this.performanceMetrics = {
      decisions_made: 0,
      avg_processing_time: 0.0,
      alignment_scores: []
    };
  }

  createBelief(proposition, credence, confidence, justification) {
    const startTime = performance.now();
    
    const belief = new VASTBelief(credence, confidence, justification);
    this.beliefs.set(proposition, belief);
    
    const processingTime = (performance.now() - startTime) / 1000;
    console.log(`Created belief for '${proposition}' in ${processingTime.toFixed(3)}s`);
    
    return belief;
  }

  jwmcRevision(proposition, newEvidence) {
    const startTime = performance.now();
    
    if (!this.beliefs.has(proposition)) {
      throw new Error(`No existing belief for proposition: ${proposition}`);
    }

    const currentBelief = this.beliefs.get(proposition);

    // Step 1: Calculate moral compatibility weight
    const moralWeight = this._calculateMoralWeight(
      currentBelief.justification,
      newEvidence.justification || {}
    );

    // Step 2: Combine credences using weighted subjective logic
    const newCredence = this._subjectiveLogicCombine(
      currentBelief.credence,
      newEvidence.credence,
      moralWeight
    );

    // Step 3: Update confidence with moral stability preservation
    const moralStabilityFactor = Math.max(0.7, 1.0 - (1.0 - moralWeight) * 0.5);
    const newConfidence = Math.min(currentBelief.confidence, newEvidence.confidence) * moralStabilityFactor;

    // Step 4: Merge justifications
    const newJustification = this._mergeJustifications(
      currentBelief.justification,
      newEvidence.justification || {},
      moralWeight
    );

    // Create revised belief
    const revisedBelief = new VASTBelief(newCredence, newConfidence, newJustification);
    this.beliefs.set(proposition, revisedBelief);

    const processingTime = (performance.now() - startTime) / 1000;
    console.log(`JWMC revision completed in ${processingTime.toFixed(3)}s, moral weight: ${moralWeight.toFixed(3)}`);

    return {
      belief: revisedBelief,
      moralWeight,
      moralStabilityFactor,
      processingTime
    };
  }

  _calculateMoralWeight(j1, j2) {
    const principles1 = new Set(j1.moral_principles || []);
    const principles2 = new Set(j2.moral_principles || []);

    if (principles1.size === 0 && principles2.size === 0) return 0.5;
    if (principles1.size === 0 || principles2.size === 0) return 0.3;

    const intersection = new Set([...principles1].filter(x => principles2.has(x)));
    const union = new Set([...principles1, ...principles2]);

    const baseSimilarity = intersection.size / union.size;

    // Boost for shared core principles
    const corePrinciples = new Set(['preserve_life', 'fairness', 'utilitarian_principle']);
    const sharedCore = [...intersection].filter(p => corePrinciples.has(p)).length;
    const coreBoost = sharedCore * 0.15;

    return Math.min(1.0, baseSimilarity + coreBoost);
  }

  _subjectiveLogicCombine(credence1, credence2, weight) {
    const combined = {};
    const allOutcomes = new Set([...Object.keys(credence1), ...Object.keys(credence2)]);

    for (const outcome of allOutcomes) {
      const p1 = credence1[outcome] || 0.0;
      const p2 = credence2[outcome] || 0.0;
      combined[outcome] = weight * p1 + (1 - weight) * p2;
    }

    // Normalize
    const total = Object.values(combined).reduce((sum, val) => sum + val, 0);
    if (total > 0) {
      for (const key in combined) {
        combined[key] = combined[key] / total;
      }
    }

    return combined;
  }

  _mergeJustifications(j1, j2, weight) {
    const merged = { ...j1 };

    // Merge lists
    for (const key of ['facts', 'rules', 'moral_principles']) {
      const set1 = new Set(j1[key] || []);
      const set2 = new Set(j2[key] || []);
      merged[key] = [...new Set([...set1, ...set2])];
    }

    // Add revision metadata
    merged.revision_method = 'jwmc_weighted_combination';
    merged.moral_weight = weight;
    merged.revised_at = new Date().toISOString();

    if (weight < 0.5) {
      merged.conflict_detected = true;
      merged.resolution_strategy = 'evidence_weighted_compromise';
    }

    return merged;
  }

  eeuCcDecision(actions, context) {
    const startTime = performance.now();
    const actionUtilities = {};
    const calculations = {};

    for (const action of actions) {
      if (!this.beliefs.has(action)) {
        console.warn(`No belief state for action: ${action}`);
        continue;
      }

      const belief = this.beliefs.get(action);

      // Calculate components
      const baseUtility = this._calculateBaseUtility(action, context);
      const moralWeight = this._calculateMoralWeightForAction(belief, context);
      const cascadePenalty = this._calculateCascadePenalty(action, context);

      // Compute expected utility
      let expectedUtility = 0.0;
      // eslint-disable-next-line no-unused-vars
      for (const [outcome, probability] of Object.entries(belief.credence)) {
        const outcomeUtility = baseUtility * moralWeight * cascadePenalty;
        expectedUtility += probability * outcomeUtility;
      }

      actionUtilities[action] = expectedUtility;
      calculations[action] = {
        baseUtility,
        moralWeight,
        cascadePenalty,
        expectedUtility,
        confidence: belief.confidence,
        moralPrinciples: belief.justification.moral_principles
      };

      // Log decision
      this.decisionLog.push({
        timestamp: new Date().toISOString(),
        action,
        components: { baseUtility, moralWeight, cascadePenalty },
        expectedUtility,
        context,
        beliefConfidence: belief.confidence,
        moralPrinciples: belief.justification.moral_principles
      });
    }

    if (Object.keys(actionUtilities).length === 0) {
      throw new Error("No valid actions with belief states available");
    }

    // Select action with highest utility
    const selectedAction = Object.keys(actionUtilities).reduce((a, b) => 
      actionUtilities[a] > actionUtilities[b] ? a : b
    );

    // Update metrics
    this.performanceMetrics.decisions_made += 1;
    const processingTime = (performance.now() - startTime) / 1000;
    
    const prevAvg = this.performanceMetrics.avg_processing_time;
    const count = this.performanceMetrics.decisions_made;
    this.performanceMetrics.avg_processing_time = (prevAvg * (count - 1) + processingTime) / count;

    return {
      selectedAction,
      utilities: actionUtilities,
      calculations,
      processingTime
    };
  }

  _calculateBaseUtility(action, context) {
    const utilityPatterns = {
      'allocate': 0.7,
      'engage': 0.6,
      'brake': 0.8,
      'execute': 0.65,
      'remove': 0.55,
      'abort': 0.4,
      'maintain': 0.75,
      'younger': 0.82,
      'elderly': 0.65,
      'severity': 0.75,
      'lottery': 0.50
    };

    let utility = 0.5;
    for (const [pattern, value] of Object.entries(utilityPatterns)) {
      if (action.toLowerCase().includes(pattern)) {
        utility = value;
        break;
      }
    }

    if (context.moral_stakes > 0.8 || context.stakes === 'high') {
      utility *= 1.1;
    }

    return Math.min(1.0, utility);
  }

  _calculateMoralWeightForAction(belief, context) {
    const justificationStrength = belief.confidence;
    const moralStakes = context.moral_stakes || 0.5;

    const moralPrinciples = belief.justification.moral_principles || [];
    const reasoningDepth = (belief.justification.facts?.length || 0) + 
                          (belief.justification.rules?.length || 0);

    const principleCoverage = Math.min(moralPrinciples.length / 3.0, 1.0);
    const reasoningQuality = Math.min(reasoningDepth / 4.0, 1.0);

    const moralRisk = 0.3 * moralStakes * 
                     (1 - justificationStrength) * 
                     (1 - principleCoverage) * 
                     (1 - reasoningQuality);

    return Math.exp(-2.0 * moralRisk);
  }

  _calculateCascadePenalty(action, context) {
    const violations = this._assessConstraintViolations(action, context);
    let penalty = 1.0;

    for (const [level, hierarchyInfo] of Object.entries(this.moralHierarchy)) {
      const violationScore = violations[level] || 0.0;
      const levelPenalty = 1 - (hierarchyInfo.weight * violationScore * hierarchyInfo.propagation);
      penalty *= levelPenalty;
    }

    return Math.max(0.1, penalty);
  }

  _assessConstraintViolations(action, context) {
    const violations = {};
    const actionLower = action.toLowerCase();
    // eslint-disable-next-line no-unused-vars
    const scenarioLower = (context.scenario || '').toLowerCase();

    // Level 1: Life preservation
    if (actionLower.includes('abort') || actionLower.includes('deny')) {
      violations[1] = 0.3;
    } else if (actionLower.includes('elderly')) {
      violations[1] = 0.1;
    } else {
      violations[1] = 0.05;
    }

    // Level 2: Fairness
    if (actionLower.includes('age') || actionLower.includes('younger') || actionLower.includes('elderly')) {
      violations[2] = 0.7;
    } else if (actionLower.includes('lottery')) {
      violations[2] = 0.1;
    } else {
      violations[2] = 0.3;
    }

    // Level 3: Efficiency
    if (actionLower.includes('maintain') || actionLower.includes('execute')) {
      violations[3] = 0.1;
    } else {
      violations[3] = 0.2;
    }

    return violations;
  }

  calculateVastGauges(proposition) {
    if (!this.beliefs.has(proposition)) {
      throw new Error(`No belief found for proposition: ${proposition}`);
    }

    const belief = this.beliefs.get(proposition);
    const gauges = {};

    // 1. Calibration
    const estimatedAccuracy = this._estimateAccuracy(belief);
    const calibrationError = Math.abs(belief.confidence - estimatedAccuracy);
    gauges.calibration = Math.max(0, 1 - calibrationError);

    // 2. Normative Alignment
    const moralPrinciples = belief.justification.moral_principles || [];
    const principleWeights = {
      'utilitarian_principle': 0.3,
      'preserve_life': 0.25,
      'fairness': 0.2,
      'medical_effectiveness': 0.15,
      'respect_dignity': 0.1
    };

    let alignmentScore = 0;
    for (const principle of moralPrinciples) {
      alignmentScore += principleWeights[principle] || 0.1;
    }
    gauges.normative_alignment = Math.min(1.0, alignmentScore);

    // 3. Coherence
    const credenceEntropy = this._calculateEntropy(belief.credence);
    const maxEntropy = Math.log2(Object.keys(belief.credence).length);
    const expectedEntropy = (1 - belief.confidence) * maxEntropy;
    const entropyCoherence = maxEntropy > 0 ? 
      1 - Math.abs(credenceEntropy - expectedEntropy) / maxEntropy : 1;
    gauges.coherence = Math.max(0, Math.min(1, entropyCoherence));

    // 4. Reasoning
    const factsCount = belief.justification.facts?.length || 0;
    const rulesCount = belief.justification.rules?.length || 0;
    const principlesCount = moralPrinciples.length;
    
    const reasoningDepth = factsCount * 0.3 + rulesCount * 0.4 + principlesCount * 0.3;
    const normalizedDepth = Math.min(reasoningDepth / 6.0, 1.0);
    gauges.reasoning = normalizedDepth * belief.confidence;

    // Overall VAST score
    const gaugeWeights = {
      calibration: 0.25,
      normative_alignment: 0.3,
      coherence: 0.2,
      reasoning: 0.25
    };

    gauges.overall_vast_score = Object.keys(gaugeWeights).reduce((sum, key) => 
      sum + gauges[key] * gaugeWeights[key], 0
    );

    this.performanceMetrics.alignment_scores.push(gauges.overall_vast_score);

    return gauges;
  }

  _estimateAccuracy(belief) {
    const reasoningQuality = 
      (belief.justification.facts?.length || 0) * 0.1 +
      (belief.justification.rules?.length || 0) * 0.15 +
      (belief.justification.moral_principles?.length || 0) * 0.2;

    const maxCredence = Math.max(...Object.values(belief.credence));
    return Math.min(1.0, 0.6 + reasoningQuality + (maxCredence - 0.5) * 0.4);
  }

  _calculateEntropy(distribution) {
    let entropy = 0.0;
    for (const prob of Object.values(distribution)) {
      if (prob > 0) {
        entropy -= prob * Math.log2(prob);
      }
    }
    return entropy;
  }

  exportAuditTrail() {
    return {
      framework_metadata: {
        version: '1.0.0',
        export_timestamp: new Date().toISOString(),
        total_beliefs: this.beliefs.size,
        total_decisions: this.decisionLog.length
      },
      performance_metrics: this.performanceMetrics,
      moral_hierarchy: this.moralHierarchy,
      beliefs: Array.from(this.beliefs.entries()).map(([prop, belief]) => ({
        proposition: prop,
        credence: belief.credence,
        confidence: belief.confidence,
        justification: belief.justification
      })),
      decision_log: this.decisionLog
    };
  }
}
