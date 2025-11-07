/**
 * BeliefManager - Manages beliefs with (π, κ, J) structure
 * Handles creation, storage, retrieval, and justification chain tracking
 */

import {
  Belief,
  Credence,
  Justification,
  BeliefSource,
} from '../types';

export class BeliefManager {
  private beliefs: Map<string, Belief>;
  private justification_chains: Map<string, string[]>; // proposition -> chain

  constructor() {
    this.beliefs = new Map();
    this.justification_chains = new Map();
  }

  /**
   * Create a new belief with validation
   */
  createBelief(
    proposition: string,
    pi: Credence,
    kappa: number,
    J: Justification,
    source: BeliefSource = 'initial'
  ): Belief {
    // Validate credence
    this.validateCredence(pi);
    
    // Validate confidence
    if (kappa < 0 || kappa > 1) {
      throw new Error(`Confidence κ must be in [0,1], got ${kappa}`);
    }

    // Validate justification
    this.validateJustification(J);

    const belief: Belief = {
      proposition,
      pi: { ...pi }, // Deep copy
      kappa,
      J: this.deepCopyJustification(J),
      timestamp: Date.now(),
      source,
    };

    // Build justification chain
    const chain = this.buildJustificationChain(J);
    this.justification_chains.set(proposition, chain);
    belief.J.chain = chain;

    this.beliefs.set(proposition, belief);
    return belief;
  }

  /**
   * Get belief by proposition
   */
  getBelief(proposition: string): Belief | undefined {
    return this.beliefs.get(proposition);
  }

  /**
   * Get all beliefs
   */
  getAllBeliefs(): Belief[] {
    return Array.from(this.beliefs.values());
  }

  /**
   * Update existing belief
   */
  updateBelief(proposition: string, updates: Partial<Belief>): Belief {
    const existing = this.beliefs.get(proposition);
    if (!existing) {
      throw new Error(`Belief ${proposition} does not exist`);
    }

    const updated: Belief = {
      ...existing,
      ...updates,
      timestamp: Date.now(),
      source: 'revised',
    };

    // Revalidate if credence or confidence changed
    if (updates.pi) {
      this.validateCredence(updated.pi);
    }
    if (updates.kappa !== undefined) {
      if (updated.kappa < 0 || updated.kappa > 1) {
        throw new Error(`Confidence κ must be in [0,1], got ${updated.kappa}`);
      }
    }
    if (updates.J) {
      this.validateJustification(updated.J);
      const chain = this.buildJustificationChain(updated.J);
      this.justification_chains.set(proposition, chain);
      updated.J.chain = chain;
    }

    this.beliefs.set(proposition, updated);
    return updated;
  }

  /**
   * Remove belief
   */
  removeBelief(proposition: string): boolean {
    this.justification_chains.delete(proposition);
    return this.beliefs.delete(proposition);
  }

  /**
   * Get justification chain for a belief
   */
  getJustificationChain(proposition: string): string[] {
    return this.justification_chains.get(proposition) || [];
  }

  /**
   * Clear all beliefs
   */
  clear(): void {
    this.beliefs.clear();
    this.justification_chains.clear();
  }

  /**
   * Get belief count
   */
  size(): number {
    return this.beliefs.size;
  }

  /**
   * Check if belief exists
   */
  has(proposition: string): boolean {
    return this.beliefs.has(proposition);
  }

  /**
   * Export beliefs for logging
   */
  exportBeliefs(): Belief[] {
    return this.getAllBeliefs().map(b => ({
      ...b,
      pi: { ...b.pi },
      J: this.deepCopyJustification(b.J),
    }));
  }

  /**
   * Import beliefs (for replay/testing)
   */
  importBeliefs(beliefs: Belief[]): void {
    this.clear();
    beliefs.forEach(b => {
      this.beliefs.set(b.proposition, {
        ...b,
        pi: { ...b.pi },
        J: this.deepCopyJustification(b.J),
      });
      if (b.J.chain) {
        this.justification_chains.set(b.proposition, [...b.J.chain]);
      }
    });
  }

  // ============================================================================
  // Validation Helpers
  // ============================================================================

  private validateCredence(pi: Credence): void {
    const outcomes = Object.keys(pi);
    if (outcomes.length < 2) {
      throw new Error('Credence π must have at least 2 outcomes');
    }

    const sum = Object.values(pi).reduce((acc, val) => acc + val, 0);
    if (Math.abs(sum - 1.0) > 0.01) {
      throw new Error(
        `Credence π must sum to 1.0 (got ${sum.toFixed(3)}). ` +
        `Use normalizeCredence() to fix.`
      );
    }

    // Check all probabilities are in [0,1]
    for (const [outcome, prob] of Object.entries(pi)) {
      if (prob < 0 || prob > 1) {
        throw new Error(`Probability for "${outcome}" must be in [0,1], got ${prob}`);
      }
    }
  }

  private validateJustification(J: Justification): void {
    const total =
      J.facts.length +
      J.rules.length +
      J.moral_principles.length;

    if (total === 0) {
      throw new Error(
        'Justification J must have at least one component (facts, rules, or moral principles)'
      );
    }
  }

  // ============================================================================
  // Justification Chain Building
  // ============================================================================

  /**
   * Build a human-readable justification chain
   * Maps directly to thesis terminology
   */
  private buildJustificationChain(J: Justification): string[] {
    const chain: string[] = [];

    // Add context
    if (J.context) {
      chain.push(`Context: ${J.context}`);
    }

    // Add facts (observations)
    if (J.facts.length > 0) {
      chain.push('Facts:');
      J.facts.forEach(f => chain.push(`  • ${f}`));
    }

    // Add rules (principles/guidelines)
    if (J.rules.length > 0) {
      chain.push('Rules:');
      J.rules.forEach(r => chain.push(`  • ${r}`));
    }

    // Add moral principles (ethical frameworks)
    if (J.moral_principles.length > 0) {
      chain.push('Moral Principles:');
      J.moral_principles.forEach(mp => chain.push(`  • ${mp}`));
    }

    return chain;
  }

  // ============================================================================
  // Utility Helpers
  // ============================================================================

  /**
   * Normalize credence to sum to 1.0
   */
  static normalizeCredence(pi: Credence): Credence {
    const sum = Object.values(pi).reduce((acc, val) => acc + val, 0);
    if (sum === 0) {
      throw new Error('Cannot normalize credence with sum=0');
    }

    const normalized: Credence = {};
    for (const [outcome, prob] of Object.entries(pi)) {
      normalized[outcome] = prob / sum;
    }
    return normalized;
  }

  /**
   * Calculate credence entropy (for coherence gauge)
   */
  static calculateEntropy(pi: Credence): number {
    let entropy = 0;
    for (const prob of Object.values(pi)) {
      if (prob > 0) {
        entropy -= prob * Math.log2(prob);
      }
    }
    return entropy;
  }

  /**
   * Deep copy justification to avoid mutation
   */
  private deepCopyJustification(J: Justification): Justification {
    return {
      facts: [...J.facts],
      rules: [...J.rules],
      moral_principles: [...J.moral_principles],
      context: J.context,
      chain: J.chain ? [...J.chain] : undefined,
    };
  }

  /**
   * Calculate Jaccard similarity between two justifications
   * Used in JWMC for moral weight calculation
   */
  static jaccardSimilarity(J1: Justification, J2: Justification): number {
    const set1 = new Set([
      ...J1.facts,
      ...J1.rules,
      ...J1.moral_principles,
    ]);

    const set2 = new Set([
      ...J2.facts,
      ...J2.rules,
      ...J2.moral_principles,
    ]);

    const intersection = new Set(
      Array.from(set1).filter(x => set2.has(x))
    );

    const union = new Set([...set1, ...set2]);

    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  /**
   * Check if a justification invokes a core moral principle
   */
  static hasCoreMoralPrinciple(J: Justification, corePrinciples: Set<string>): boolean {
    return J.moral_principles.some(mp => corePrinciples.has(mp));
  }
}
