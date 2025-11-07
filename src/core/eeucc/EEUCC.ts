/**
 * EEUCC - Expected Epistemic Utility with Cascading Constraints
 * Implements: EU - Σ_priority [λ^(p-1) * Σ(violation_penalty)]
 * where p=1 is highest priority, penalties cascade with exponential decay
 */

import {
  Belief,
  Constraint,
  ConstraintViolation,
  EUBreakdown,
  ActionContext,
  EEUCCParams,
} from '../types';
import { BeliefManager } from '../belief/BeliefManager';

export class EEUCC {
  private params: EEUCCParams;
  private constraints: Constraint[];

  constructor(params: EEUCCParams, constraints: Constraint[]) {
    this.validateParams(params);
    this.params = params;
    this.constraints = this.sortConstraintsByPriority(constraints);
  }

  /**
   * Calculate EEU for all actions and return breakdown
   * Returns: Array of EUBreakdown sorted by eeu_total (descending)
   */
  decide(
    actions: string[],
    beliefs: Map<string, Belief>,
    context: ActionContext
  ): EUBreakdown[] {
    const breakdowns: EUBreakdown[] = [];

    for (const action of actions) {
      const belief = beliefs.get(action);
      if (!belief) {
        console.warn(`No belief found for action: ${action}`);
        continue;
      }

      const breakdown = this.calculateEUBreakdown(action, belief, context);
      breakdowns.push(breakdown);
    }

    // Sort by eeu_total descending (best first)
    return breakdowns.sort((a, b) => b.eeu_total - a.eeu_total);
  }

  /**
   * Calculate complete EU breakdown for a single action
   */
  private calculateEUBreakdown(
    action: string,
    belief: Belief,
    context: ActionContext
  ): EUBreakdown {
    // Step 1: Calculate base expected utility
    const eu_base = this.calculateBaseEU(action, belief, context);

    // Step 2: Assess constraint violations
    const violations = this.assessConstraintViolations(action, belief, context);

    // Step 3: Calculate cascading penalties
    const totalPenalty = this.calculateCascadingPenalty(violations);

    // Step 4: Final EEU
    const eeu_total = eu_base - totalPenalty;

    // Step 5: Build justification chain
    const justification_chain = this.buildJustificationChain(
      action,
      belief,
      eu_base,
      violations,
      totalPenalty,
      eeu_total
    );

    return {
      action_id: action,
      eu_base,
      constraints: violations,
      eeu_total,
      justification_chain,
    };
  }

  // ============================================================================
  // Base Expected Utility Calculation
  // ============================================================================

  /**
   * Calculate base EU using credence-weighted outcomes
   * EU = Σ π(outcome) * U(outcome | context)
   */
  private calculateBaseEU(
    action: string,
    belief: Belief,
    context: ActionContext
  ): number {
    let eu = 0;

    for (const [outcome, probability] of Object.entries(belief.pi)) {
      const utility = this.getOutcomeUtility(action, outcome, context);
      eu += probability * utility;
    }

    // Weight by confidence (κ acts as reliability factor)
    return eu * belief.kappa;
  }

  /**
   * Get utility for a specific outcome
   * Can be customized via params.base_utility_fn or uses default heuristics
   */
  private getOutcomeUtility(
    action: string,
    outcome: string,
    context: ActionContext
  ): number {
    // Use custom utility function if provided
    if (this.params.base_utility_fn) {
      return this.params.base_utility_fn(action, context);
    }

    // Default heuristic based on outcome names and context
    return this.defaultUtilityHeuristic(action, outcome, context);
  }

  /**
   * Default utility heuristic based on outcome semantics
   */
  private defaultUtilityHeuristic(
    action: string,
    outcome: string,
    context: ActionContext
  ): number {
    const outcomeLower = outcome.toLowerCase();
    const actionLower = action.toLowerCase();

    // Positive outcomes
    if (
      outcomeLower.includes('success') ||
      outcomeLower.includes('effective') ||
      outcomeLower.includes('saves') ||
      outcomeLower.includes('accurate')
    ) {
      return 1.0;
    }

    // Negative outcomes
    if (
      outcomeLower.includes('fail') ||
      outcomeLower.includes('ineffective') ||
      outcomeLower.includes('error') ||
      outcomeLower.includes('false_positive')
    ) {
      return 0.0;
    }

    // Partial outcomes
    if (outcomeLower.includes('partial')) {
      return 0.5;
    }

    // Context-based adjustments
    const moralStakes = context.moral_stakes || 0.5;
    
    // Actions with high moral stakes get boosted
    if (actionLower.includes('life') || actionLower.includes('preserve')) {
      return 0.8 * moralStakes + 0.2;
    }

    // Default neutral utility
    return 0.5;
  }

  // ============================================================================
  // Constraint Violation Assessment
  // ============================================================================

  /**
   * Assess all constraint violations for an action
   * Returns violations sorted by priority (highest first)
   */
  private assessConstraintViolations(
    action: string,
    belief: Belief,
    context: ActionContext
  ): ConstraintViolation[] {
    const violations: ConstraintViolation[] = [];

    for (const constraint of this.constraints) {
      const violation = this.checkConstraintViolation(
        action,
        belief,
        constraint,
        context
      );

      if (violation) {
        violations.push(violation);
      }
    }

    return violations;
  }

  /**
   * Check if a single constraint is violated
   */
  private checkConstraintViolation(
    action: string,
    belief: Belief,
    constraint: Constraint,
    context: ActionContext
  ): ConstraintViolation | null {
    const actionLower = action.toLowerCase();
    const principle = constraint.principle.toLowerCase();

    let violationAmount = 0;
    let explanation = '';

    // Check principle-specific violations
    switch (principle) {
      case 'preserve_life':
        if (
          actionLower.includes('deny') ||
          actionLower.includes('abort') ||
          actionLower.includes('reject')
        ) {
          violationAmount = 0.8;
          explanation = `Action "${action}" may threaten life preservation`;
        } else if (actionLower.includes('delay')) {
          violationAmount = 0.3;
          explanation = `Action "${action}" involves delay that may risk life`;
        }
        break;

      case 'fairness':
        if (
          actionLower.includes('prioritize') &&
          (actionLower.includes('younger') || actionLower.includes('elderly'))
        ) {
          violationAmount = 0.5;
          explanation = `Action "${action}" may violate procedural fairness`;
        } else if (actionLower.includes('discriminate')) {
          violationAmount = 0.9;
          explanation = `Action "${action}" involves discrimination`;
        }
        break;

      case 'respect_dignity':
        if (
          actionLower.includes('coerce') ||
          actionLower.includes('deceive') ||
          actionLower.includes('manipulate')
        ) {
          violationAmount = 0.7;
          explanation = `Action "${action}" may violate human dignity`;
        }
        break;

      case 'transparency':
        // Check if justification is sparse
        const totalJustifications =
          belief.J.facts.length +
          belief.J.rules.length +
          belief.J.moral_principles.length;

        if (totalJustifications < 3) {
          violationAmount = 0.4;
          explanation = `Action "${action}" lacks sufficient justification`;
        }
        break;

      case 'non_maleficence':
        if (
          actionLower.includes('harm') ||
          actionLower.includes('damage') ||
          actionLower.includes('hurt')
        ) {
          violationAmount = 0.8;
          explanation = `Action "${action}" may cause harm`;
        }
        break;

      default:
        // Generic check: see if action conflicts with constraint title
        if (actionLower.includes('not_' + principle)) {
          violationAmount = 0.5;
          explanation = `Action "${action}" conflicts with ${constraint.title}`;
        }
    }

    // Check if violation exceeds threshold
    if (violationAmount > constraint.threshold) {
      const penalty = this.calculateViolationPenalty(
        violationAmount,
        constraint
      );

      return {
        constraint_id: constraint.id,
        violation_amount: violationAmount,
        penalty,
        explanation,
      };
    }

    return null;
  }

  /**
   * Calculate penalty for a single violation
   * Penalty = weight * (violation_amount - threshold)^2
   */
  private calculateViolationPenalty(
    violationAmount: number,
    constraint: Constraint
  ): number {
    const excess = Math.max(0, violationAmount - constraint.threshold);
    return constraint.weight * Math.pow(excess, 2);
  }

  // ============================================================================
  // Cascading Penalty Calculation
  // ============================================================================

  /**
   * Calculate total cascading penalty
   * Formula: Σ_priority [λ^(p-1) * Σ(violation_penalty)]
   * where p=1 is highest priority
   */
  private calculateCascadingPenalty(violations: ConstraintViolation[]): number {
    if (violations.length === 0) {
      return 0;
    }

    // Group violations by priority
    const violationsByPriority = this.groupViolationsByPriority(violations);

    let totalPenalty = 0;
    const lambda = this.params.lambda;

    for (const [priority, violationList] of violationsByPriority.entries()) {
      // Calculate sum of penalties at this priority level
      const levelPenalty = violationList.reduce(
        (sum, v) => sum + v.penalty,
        0
      );

      // Apply cascade factor: λ^(p-1)
      // Priority 1 (highest): λ^0 = 1 (full penalty)
      // Priority 2: λ^1 = λ (reduced)
      // Priority 3: λ^2 = λ² (further reduced)
      const cascadeFactor = Math.pow(lambda, priority - 1);

      totalPenalty += cascadeFactor * levelPenalty;
    }

    return totalPenalty;
  }

  /**
   * Group violations by constraint priority
   */
  private groupViolationsByPriority(
    violations: ConstraintViolation[]
  ): Map<number, ConstraintViolation[]> {
    const groups = new Map<number, ConstraintViolation[]>();

    for (const violation of violations) {
      const constraint = this.constraints.find(
        c => c.id === violation.constraint_id
      );

      if (constraint) {
        const priority = constraint.priority;
        if (!groups.has(priority)) {
          groups.set(priority, []);
        }
        groups.get(priority)!.push(violation);
      }
    }

    return groups;
  }

  // ============================================================================
  // Justification Chain Building
  // ============================================================================

  /**
   * Build human-readable justification chain for decision
   */
  private buildJustificationChain(
    action: string,
    belief: Belief,
    eu_base: number,
    violations: ConstraintViolation[],
    totalPenalty: number,
    eeu_total: number
  ): string[] {
    const chain: string[] = [];

    // Step 1: Base utility
    chain.push(`Action: ${action}`);
    chain.push(`Base Expected Utility: ${eu_base.toFixed(4)}`);
    chain.push(`  Confidence (κ): ${belief.kappa.toFixed(3)}`);
    chain.push(`  Credence outcomes: ${Object.keys(belief.pi).length}`);

    // Step 2: Constraint analysis
    if (violations.length === 0) {
      chain.push('No constraint violations detected');
    } else {
      chain.push(`Constraint Violations: ${violations.length}`);
      for (const v of violations) {
        const constraint = this.constraints.find(c => c.id === v.constraint_id);
        if (constraint) {
          chain.push(
            `  • ${constraint.title} (priority ${constraint.priority}): ` +
            `violation=${v.violation_amount.toFixed(3)}, penalty=${v.penalty.toFixed(4)}`
          );
          chain.push(`    Reason: ${v.explanation}`);
        }
      }
      chain.push(`Total Cascading Penalty: ${totalPenalty.toFixed(4)}`);
    }

    // Step 3: Final EEU
    chain.push(`Final EEU: ${eeu_total.toFixed(4)}`);

    // Step 4: Justification components
    chain.push('Justification:');
    if (belief.J.chain) {
      chain.push(...belief.J.chain.map(line => `  ${line}`));
    }

    return chain;
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  /**
   * Sort constraints by priority (1 = highest)
   */
  private sortConstraintsByPriority(constraints: Constraint[]): Constraint[] {
    return [...constraints].sort((a, b) => a.priority - b.priority);
  }

  private validateParams(params: EEUCCParams): void {
    if (params.lambda <= 0 || params.lambda >= 1) {
      throw new Error(
        `EEUCC parameter λ must be in (0,1), got ${params.lambda}`
      );
    }
  }

  // ============================================================================
  // Getters/Setters
  // ============================================================================

  getParams(): EEUCCParams {
    return { ...this.params };
  }

  updateParams(newParams: Partial<EEUCCParams>): void {
    this.params = { ...this.params, ...newParams };
    this.validateParams(this.params);
  }

  getConstraints(): Constraint[] {
    return [...this.constraints];
  }

  updateConstraints(newConstraints: Constraint[]): void {
    this.constraints = this.sortConstraintsByPriority(newConstraints);
  }

  addConstraint(constraint: Constraint): void {
    this.constraints.push(constraint);
    this.constraints = this.sortConstraintsByPriority(this.constraints);
  }

  removeConstraint(constraintId: string): void {
    this.constraints = this.constraints.filter(c => c.id !== constraintId);
  }
}
