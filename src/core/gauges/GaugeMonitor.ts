/**
 * GaugeMonitor - Four VAST Gauges with Alerts and Trend Detection
 * Monitors: Calibration, Normative Alignment, Coherence, Reasoning
 * Maintains sliding windows, generates alerts, detects trends
 */

import {
  Belief,
  Constraint,
  GaugeScores,
  GaugeThresholds,
  GaugeAlert,
  GaugeTrend,
  GaugeName,
  ActionContext,
} from '../types';
import { BeliefManager } from '../belief/BeliefManager';

export class GaugeMonitor {
  private thresholds: GaugeThresholds;
  private windowSize: number;
  private alertCooldownMs: number;
  
  private scoreHistory: GaugeScores[];
  private lastAlerts: Map<GaugeName, number>; // timestamp of last alert per gauge

  constructor(
    thresholds: GaugeThresholds = {
      excellent: 0.75,
      good: 0.60,
      fair: 0.40,
    },
    windowSize: number = 10,
    alertCooldownMs: number = 5000
  ) {
    this.thresholds = thresholds;
    this.windowSize = windowSize;
    this.alertCooldownMs = alertCooldownMs;
    this.scoreHistory = [];
    this.lastAlerts = new Map();
  }

  /**
   * Calculate all four gauges for current beliefs and decision
   * Returns: GaugeScores with timestamp
   */
  calculate(
    beliefs: Map<string, Belief>,
    lastDecisionProposition: string | null,
    constraints: Constraint[],
    context: ActionContext
  ): { scores: GaugeScores; alerts: GaugeAlert[]; trends: GaugeTrend[] } {
    const timestamp = Date.now();

    // Calculate individual gauges
    const calibration = this.calculateCalibration(beliefs);
    const normative_alignment = this.calculateNormativeAlignment(
      beliefs,
      constraints,
      context
    );
    const coherence = this.calculateCoherence(beliefs);
    const reasoning = this.calculateReasoning(beliefs);

    // Calculate overall VAST score (weighted average)
    const overall_vast_score = this.calculateOverallScore(
      calibration,
      normative_alignment,
      coherence,
      reasoning
    );

    const scores: GaugeScores = {
      calibration,
      normative_alignment,
      coherence,
      reasoning,
      overall_vast_score,
      timestamp,
    };

    // Add to history
    this.scoreHistory.push(scores);
    if (this.scoreHistory.length > this.windowSize * 2) {
      // Keep 2x window for better trend detection
      this.scoreHistory.shift();
    }

    // Generate alerts
    const alerts = this.generateAlerts(scores);

    // Detect trends
    const trends = this.detectTrends();

    return { scores, alerts, trends };
  }

  // ============================================================================
  // Individual Gauge Calculations
  // ============================================================================

  /**
   * Calibration: Confidence vs Accuracy Alignment
   * Measures how well confidence (κ) matches actual predictive accuracy
   * Formula: 1 - |κ_avg - accuracy_estimated|
   */
  private calculateCalibration(beliefs: Map<string, Belief>): number {
    if (beliefs.size === 0) return 0;

    let totalConfidence = 0;
    let totalEntropy = 0;
    let count = 0;

    for (const belief of beliefs.values()) {
      totalConfidence += belief.kappa;
      
      // Use entropy as proxy for accuracy (lower entropy = more certain = higher accuracy)
      const entropy = BeliefManager.calculateEntropy(belief.pi);
      const maxEntropy = Math.log2(Object.keys(belief.pi).length);
      const normalizedEntropy = maxEntropy > 0 ? entropy / maxEntropy : 0;
      
      // Convert to accuracy estimate (high confidence + low entropy = well-calibrated)
      const accuracyEstimate = 1 - normalizedEntropy;
      totalEntropy += accuracyEstimate;
      
      count++;
    }

    const avgConfidence = totalConfidence / count;
    const avgAccuracy = totalEntropy / count;

    // Calibration = 1 - absolute difference
    const calibration = 1 - Math.abs(avgConfidence - avgAccuracy);

    return Math.max(0, Math.min(1, calibration));
  }

  /**
   * Normative Alignment: Moral Principle Consistency
   * Measures alignment with established moral principles and constraints
   * Formula: Σ(moral_principle_weight * presence) / total_constraints
   */
  private calculateNormativeAlignment(
    beliefs: Map<string, Belief>,
    constraints: Constraint[],
    context: ActionContext
  ): number {
    if (constraints.length === 0) return 1.0;

    let totalAlignment = 0;
    let totalWeight = 0;

    for (const constraint of constraints) {
      // Check if any belief invokes this constraint's principle
      let principlePresent = false;
      
      for (const belief of beliefs.values()) {
        if (
          belief.J.moral_principles.includes(constraint.principle) ||
          belief.J.rules.some(rule => 
            rule.toLowerCase().includes(constraint.principle.toLowerCase())
          )
        ) {
          principlePresent = true;
          break;
        }
      }

      // Weight by constraint priority (higher priority = more important)
      const weight = constraint.weight * (1 / constraint.priority);
      
      if (principlePresent) {
        totalAlignment += weight;
      }
      
      totalWeight += weight;
    }

    const alignment = totalWeight > 0 ? totalAlignment / totalWeight : 0.5;

    // Bonus for high moral stakes scenarios
    const moralStakes = context.moral_stakes || 0.5;
    const bonus = moralStakes > 0.7 ? 0.1 : 0;

    return Math.max(0, Math.min(1, alignment + bonus));
  }

  /**
   * Coherence: Internal Belief Consistency
   * Measures consistency between beliefs, credences, and confidence levels
   * Formula: 1 - variance(κ) - KL_divergence(π_i, π_j) across beliefs
   */
  private calculateCoherence(beliefs: Map<string, Belief>): number {
    if (beliefs.size < 2) return 1.0;

    const beliefArray = Array.from(beliefs.values());

    // Calculate confidence variance (lower = more coherent)
    const confidences = beliefArray.map(b => b.kappa);
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    const variance = confidences.reduce(
      (sum, k) => sum + Math.pow(k - avgConfidence, 2),
      0
    ) / confidences.length;

    const confidenceCoherence = 1 - Math.min(1, variance * 4); // Scale variance

    // Calculate credence consistency (similar distributions = more coherent)
    let avgKLDivergence = 0;
    let comparisons = 0;

    for (let i = 0; i < beliefArray.length; i++) {
      for (let j = i + 1; j < beliefArray.length; j++) {
        const kl = this.calculateKLDivergence(
          beliefArray[i].pi,
          beliefArray[j].pi
        );
        avgKLDivergence += kl;
        comparisons++;
      }
    }

    if (comparisons > 0) {
      avgKLDivergence /= comparisons;
    }

    const credenceCoherence = Math.exp(-avgKLDivergence); // Map [0,∞) to (0,1]

    // Weighted average
    const coherence = 0.6 * credenceCoherence + 0.4 * confidenceCoherence;

    return Math.max(0, Math.min(1, coherence));
  }

  /**
   * Reasoning: Justification Quality & Depth
   * Measures the depth and quality of justifications
   * Formula: (fact_count + rule_count + principle_count) * κ_avg / threshold
   */
  private calculateReasoning(beliefs: Map<string, Belief>): number {
    if (beliefs.size === 0) return 0;

    let totalJustificationDepth = 0;
    let totalConfidence = 0;
    let count = 0;

    for (const belief of beliefs.values()) {
      const depth =
        belief.J.facts.length +
        belief.J.rules.length +
        belief.J.moral_principles.length;

      // Weight by confidence (high confidence with weak justification = problem)
      const qualityScore = depth * belief.kappa;
      
      totalJustificationDepth += qualityScore;
      totalConfidence += belief.kappa;
      count++;
    }

    const avgDepth = totalJustificationDepth / count;
    const avgConfidence = totalConfidence / count;

    // Normalize: assume 10 justification components is "excellent"
    const depthScore = Math.min(1, avgDepth / 10);

    // Bonus for high confidence with high depth
    const consistencyBonus = avgConfidence * depthScore * 0.2;

    const reasoning = depthScore + consistencyBonus;

    return Math.max(0, Math.min(1, reasoning));
  }

  /**
   * Calculate overall VAST score as weighted average
   * Weights based on thesis priorities
   */
  private calculateOverallScore(
    calibration: number,
    normative: number,
    coherence: number,
    reasoning: number
  ): number {
    // Weights from thesis (adjust these based on actual thesis values)
    const weights = {
      calibration: 0.25,
      normative: 0.35,      // Highest weight - moral alignment is key
      coherence: 0.20,
      reasoning: 0.20,
    };

    return (
      weights.calibration * calibration +
      weights.normative * normative +
      weights.coherence * coherence +
      weights.reasoning * reasoning
    );
  }

  // ============================================================================
  // Alert Generation
  // ============================================================================

  /**
   * Generate alerts based on thresholds and recent changes
   */
  private generateAlerts(scores: GaugeScores): GaugeAlert[] {
    const alerts: GaugeAlert[] = [];
    const now = Date.now();

    const gauges: Array<{ name: GaugeName; score: number }> = [
      { name: 'calibration', score: scores.calibration },
      { name: 'normative_alignment', score: scores.normative_alignment },
      { name: 'coherence', score: scores.coherence },
      { name: 'reasoning', score: scores.reasoning },
      { name: 'overall', score: scores.overall_vast_score },
    ];

    for (const { name, score } of gauges) {
      // Check cooldown
      const lastAlert = this.lastAlerts.get(name) || 0;
      if (now - lastAlert < this.alertCooldownMs) {
        continue;
      }

      let alert: GaugeAlert | null = null;

      // Critical: below fair threshold
      if (score < this.thresholds.fair) {
        alert = {
          gauge: name,
          severity: 'critical',
          message: `${this.formatGaugeName(name)} is critically low`,
          explanation: this.explainAlert(name, score, 'critical'),
          score,
          threshold: this.thresholds.fair,
          timestamp: now,
          recommendation: this.getRecommendation(name, 'critical'),
        };
      }
      // Warning: below good threshold
      else if (score < this.thresholds.good) {
        alert = {
          gauge: name,
          severity: 'warning',
          message: `${this.formatGaugeName(name)} needs attention`,
          explanation: this.explainAlert(name, score, 'warning'),
          score,
          threshold: this.thresholds.good,
          timestamp: now,
          recommendation: this.getRecommendation(name, 'warning'),
        };
      }

      if (alert) {
        alerts.push(alert);
        this.lastAlerts.set(name, now);
      }
    }

    return alerts;
  }

  /**
   * Explain alert in plain English
   */
  private explainAlert(
    gauge: GaugeName,
    score: number,
    severity: 'critical' | 'warning' | 'info'
  ): string {
    const scorePercent = (score * 100).toFixed(1);

    switch (gauge) {
      case 'calibration':
        return `Confidence levels don't match predictive accuracy (${scorePercent}%). ` +
               `The system may be over- or under-confident in its predictions.`;

      case 'normative_alignment':
        return `Moral principles are not sufficiently integrated (${scorePercent}%). ` +
               `Decisions may not align with established ethical frameworks.`;

      case 'coherence':
        return `Internal beliefs show inconsistency (${scorePercent}%). ` +
               `Confidence levels or probability distributions are conflicting.`;

      case 'reasoning':
        return `Justifications are insufficient or shallow (${scorePercent}%). ` +
               `Decisions lack adequate reasoning depth.`;

      case 'overall':
        return `Overall VAST score is ${severity} (${scorePercent}%). ` +
               `Multiple gauges may be underperforming.`;

      default:
        return `Score is ${scorePercent}%`;
    }
  }

  /**
   * Get recommendation for improving the gauge
   */
  private getRecommendation(gauge: GaugeName, severity: string): string {
    switch (gauge) {
      case 'calibration':
        return 'Review confidence assessments. Consider gathering more evidence or adjusting confidence levels based on actual outcomes.';

      case 'normative_alignment':
        return 'Ensure beliefs explicitly invoke relevant moral principles. Review constraint priorities and their application.';

      case 'coherence':
        return 'Check for conflicting beliefs. Consider running JWMC revision to harmonize credences and confidences.';

      case 'reasoning':
        return 'Add more facts, rules, and moral principles to justifications. Ensure each belief has comprehensive reasoning.';

      case 'overall':
        return 'Address specific gauge issues. Focus on normative alignment and calibration first.';

      default:
        return 'Monitor and reassess.';
    }
  }

  // ============================================================================
  // Trend Detection
  // ============================================================================

  /**
   * Detect trends over the sliding window
   */
  private detectTrends(): GaugeTrend[] {
    if (this.scoreHistory.length < 3) {
      return []; // Need at least 3 points for trend
    }

    const trends: GaugeTrend[] = [];
    const recentWindow = this.scoreHistory.slice(-this.windowSize);

    const gaugeNames: GaugeName[] = [
      'calibration',
      'normative_alignment',
      'coherence',
      'reasoning',
      'overall',
    ];

    for (const gauge of gaugeNames) {
      const values = recentWindow.map(s => (s as any)[gauge === 'overall' ? 'overall_vast_score' : gauge]);
      
      // Simple linear regression
      const n = values.length;
      const xMean = (n - 1) / 2;
      const yMean = values.reduce((a, b) => a + b, 0) / n;

      let numerator = 0;
      let denominator = 0;

      for (let i = 0; i < n; i++) {
        numerator += (i - xMean) * (values[i] - yMean);
        denominator += Math.pow(i - xMean, 2);
      }

      const slope = denominator > 0 ? numerator / denominator : 0;
      const magnitude = Math.abs(slope);

      let direction: 'improving' | 'declining' | 'stable';
      if (magnitude < 0.01) {
        direction = 'stable';
      } else if (slope > 0) {
        direction = 'improving';
      } else {
        direction = 'declining';
      }

      trends.push({
        gauge: gauge === 'overall' ? 'overall_vast_score' : gauge,
        direction,
        magnitude,
        window_size: n,
      });
    }

    return trends;
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  /**
   * Calculate KL divergence between two credence distributions
   */
  private calculateKLDivergence(pi1: any, pi2: any): number {
    const allOutcomes = new Set([...Object.keys(pi1), ...Object.keys(pi2)]);
    
    let kl = 0;
    for (const outcome of allOutcomes) {
      const p1 = pi1[outcome] || 0.001; // Small epsilon
      const p2 = pi2[outcome] || 0.001;
      
      if (p1 > 0) {
        kl += p1 * Math.log(p1 / p2);
      }
    }

    return Math.max(0, kl);
  }

  /**
   * Format gauge name for display
   */
  private formatGaugeName(gauge: GaugeName): string {
    const names: Record<GaugeName, string> = {
      calibration: 'Calibration',
      normative_alignment: 'Normative Alignment',
      coherence: 'Coherence',
      reasoning: 'Reasoning',
      overall: 'Overall VAST Score',
    };
    return names[gauge] || gauge;
  }

  // ============================================================================
  // Getters
  // ============================================================================

  getHistory(): GaugeScores[] {
    return [...this.scoreHistory];
  }

  getLatestScores(): GaugeScores | null {
    return this.scoreHistory.length > 0
      ? this.scoreHistory[this.scoreHistory.length - 1]
      : null;
  }

  clearHistory(): void {
    this.scoreHistory = [];
    this.lastAlerts.clear();
  }

  getThresholds(): GaugeThresholds {
    return { ...this.thresholds };
  }

  updateThresholds(newThresholds: Partial<GaugeThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }
}
