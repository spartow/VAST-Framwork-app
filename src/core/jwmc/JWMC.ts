/**
 * JWMC - Justified Weighted Moral Compatibility
 * Belief revision algorithm with moral stability preservation
 * Implements: π_new = α*π₁ + (1-α)*π₂, κ_new = min(κ₁,κ₂)*stability, J_new = J₁ ∪ J₂
 */

import {
  Belief,
  Credence,
  Justification,
  BeliefDelta,
  JWMCParams,
} from '../types';
import { BeliefManager } from '../belief/BeliefManager';

export class JWMC {
  private params: JWMCParams;
  private coreMoralPrinciples: Set<string>;

  constructor(params: JWMCParams, coreMoralPrinciples: string[] = []) {
    this.validateParams(params);
    this.params = params;
    this.coreMoralPrinciples = new Set(coreMoralPrinciples);
  }

  /**
   * Revise a belief with new evidence
   * Returns updated belief and delta metrics
   */
  revise(
    existingBelief: Belief,
    newEvidence: Partial<Belief>
  ): { belief: Belief; delta: BeliefDelta } {
    const { alpha, beta, gamma, moral_core_bonus = 0.1 } = this.params;

    // Calculate moral weight (similarity + core bonus)
    const moralWeight = this.calculateMoralWeight(
      existingBelief.J,
      newEvidence.J || existingBelief.J,
      gamma,
      moral_core_bonus
    );

    // Blend credences using moral weight
    const pi_new = this.blendCredences(
      existingBelief.pi,
      newEvidence.pi || existingBelief.pi,
      alpha,
      moralWeight
    );

    // Update confidence with decay
    const kappa_new = this.updateConfidence(
      existingBelief.kappa,
      newEvidence.kappa !== undefined ? newEvidence.kappa : existingBelief.kappa,
      beta,
      moralWeight
    );

    // Merge justifications
    const J_new = this.mergeJustifications(
      existingBelief.J,
      newEvidence.J || existingBelief.J
    );

    // Calculate stability factor
    const stabilityFactor = this.calculateStabilityFactor(
      existingBelief.pi,
      pi_new,
      existingBelief.kappa,
      kappa_new
    );

    // Create updated belief
    const updatedBelief: Belief = {
      proposition: existingBelief.proposition,
      pi: pi_new,
      kappa: kappa_new,
      J: J_new,
      timestamp: Date.now(),
      source: 'revised',
    };

    // Create delta for logging
    const delta: BeliefDelta = {
      proposition: existingBelief.proposition,
      pi_before: { ...existingBelief.pi },
      pi_after: { ...pi_new },
      kappa_before: existingBelief.kappa,
      kappa_after: kappa_new,
      moral_weight: moralWeight,
      stability_factor: stabilityFactor,
    };

    return { belief: updatedBelief, delta };
  }

  /**
   * Batch revise multiple beliefs with evidence stream
   */
  batchRevise(
    beliefs: Map<string, Belief>,
    evidenceMap: Map<string, Partial<Belief>>
  ): { beliefs: Map<string, Belief>; deltas: BeliefDelta[] } {
    const updatedBeliefs = new Map<string, Belief>();
    const deltas: BeliefDelta[] = [];

    for (const [prop, existingBelief] of beliefs.entries()) {
      const evidence = evidenceMap.get(prop);
      if (evidence) {
        const { belief, delta } = this.revise(existingBelief, evidence);
        updatedBeliefs.set(prop, belief);
        deltas.push(delta);
      } else {
        // No new evidence, keep existing
        updatedBeliefs.set(prop, existingBelief);
      }
    }

    return { beliefs: updatedBeliefs, deltas };
  }

  // ============================================================================
  // Core JWMC Algorithms
  // ============================================================================

  /**
   * Calculate moral weight based on justification similarity
   * Higher weight = more similar justifications = more stable update
   * Formula: w = γ * jaccard(J₁, J₂) + core_bonus
   */
  private calculateMoralWeight(
    J1: Justification,
    J2: Justification,
    gamma: number,
    coreBonus: number
  ): number {
    // Base similarity using Jaccard index
    const similarity = BeliefManager.jaccardSimilarity(J1, J2);
    
    let weight = gamma * similarity;

    // Add bonus if both justifications invoke core moral principles
    const hasCore1 = BeliefManager.hasCoreMoralPrinciple(J1, this.coreMoralPrinciples);
    const hasCore2 = BeliefManager.hasCoreMoralPrinciple(J2, this.coreMoralPrinciples);
    
    if (hasCore1 && hasCore2) {
      weight += coreBonus;
    }

    // Clamp to [0,1]
    return Math.max(0, Math.min(1, weight));
  }

  /**
   * Blend credences using weighted average
   * Formula: π_new(outcome) = w*π₁(outcome) + (1-w)*π₂(outcome)
   * where w is influenced by moral weight and α
   */
  private blendCredences(
    pi1: Credence,
    pi2: Credence,
    alpha: number,
    moralWeight: number
  ): Credence {
    // Adjust alpha by moral weight (high moral weight favors existing belief)
    const effectiveAlpha = alpha * moralWeight + (1 - moralWeight) * 0.5;

    // Get all outcomes from both credences
    const allOutcomes = new Set([
      ...Object.keys(pi1),
      ...Object.keys(pi2),
    ]);

    const blended: Credence = {};
    for (const outcome of allOutcomes) {
      const p1 = pi1[outcome] || 0;
      const p2 = pi2[outcome] || 0;
      blended[outcome] = effectiveAlpha * p1 + (1 - effectiveAlpha) * p2;
    }

    // Normalize to ensure sum = 1.0
    return BeliefManager.normalizeCredence(blended);
  }

  /**
   * Update confidence with decay factor
   * Formula: κ_new = min(κ₁, κ₂) * stability(w)
   * where stability(w) = β + (1-β)*w
   */
  private updateConfidence(
    kappa1: number,
    kappa2: number,
    beta: number,
    moralWeight: number
  ): number {
    // Take minimum (conservative approach)
    const minKappa = Math.min(kappa1, kappa2);
    
    // Calculate stability factor based on moral weight
    const stabilityFactor = beta + (1 - beta) * moralWeight;
    
    // Apply decay
    const newKappa = minKappa * stabilityFactor;
    
    // Clamp to [0,1]
    return Math.max(0, Math.min(1, newKappa));
  }

  /**
   * Merge justifications from both beliefs
   * Union of components with deduplication
   */
  private mergeJustifications(J1: Justification, J2: Justification): Justification {
    // Merge facts (deduplicated)
    const facts = Array.from(new Set([...J1.facts, ...J2.facts]));
    
    // Merge rules (deduplicated)
    const rules = Array.from(new Set([...J1.rules, ...J2.rules]));
    
    // Merge moral principles (deduplicated)
    const moral_principles = Array.from(
      new Set([...J1.moral_principles, ...J2.moral_principles])
    );

    // Combine contexts
    const context = J1.context === J2.context
      ? J1.context
      : `${J1.context}; ${J2.context}`;

    return {
      facts,
      rules,
      moral_principles,
      context,
    };
  }

  /**
   * Calculate how stable the belief update was
   * Lower value = more change = less stable
   */
  private calculateStabilityFactor(
    pi1: Credence,
    pi2: Credence,
    kappa1: number,
    kappa2: number
  ): number {
    // Calculate KL divergence for credence change
    let klDiv = 0;
    for (const outcome of Object.keys(pi1)) {
      const p1 = pi1[outcome] || 0.001; // Small epsilon to avoid log(0)
      const p2 = pi2[outcome] || 0.001;
      if (p1 > 0) {
        klDiv += p1 * Math.log(p1 / p2);
      }
    }

    // Calculate confidence change
    const kappaChange = Math.abs(kappa1 - kappa2);

    // Combine into stability score (lower KL and change = higher stability)
    const credenceStability = Math.exp(-klDiv); // Maps [0,∞) to (0,1]
    const confidenceStability = 1 - kappaChange;

    // Weighted average
    const stability = 0.6 * credenceStability + 0.4 * confidenceStability;

    return Math.max(0, Math.min(1, stability));
  }

  // ============================================================================
  // Validation
  // ============================================================================

  private validateParams(params: JWMCParams): void {
    const { alpha, beta, gamma } = params;

    if (alpha < 0 || alpha > 1) {
      throw new Error(`JWMC parameter α must be in [0,1], got ${alpha}`);
    }
    if (beta < 0 || beta > 1) {
      throw new Error(`JWMC parameter β must be in [0,1], got ${beta}`);
    }
    if (gamma < 0 || gamma > 1) {
      throw new Error(`JWMC parameter γ must be in [0,1], got ${gamma}`);
    }
  }

  // ============================================================================
  // Getters/Setters
  // ============================================================================

  getParams(): JWMCParams {
    return { ...this.params };
  }

  updateParams(newParams: Partial<JWMCParams>): void {
    this.params = { ...this.params, ...newParams };
    this.validateParams(this.params);
  }

  getCoreMoralPrinciples(): string[] {
    return Array.from(this.coreMoralPrinciples);
  }

  addCoreMoralPrinciple(principle: string): void {
    this.coreMoralPrinciples.add(principle);
  }

  removeCoreMoralPrinciple(principle: string): void {
    this.coreMoralPrinciples.delete(principle);
  }
}
