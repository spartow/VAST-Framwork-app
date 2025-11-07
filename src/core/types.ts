/**
 * Core type definitions for VAST Framework
 * Maps directly to thesis terminology and structures
 */

// ============================================================================
// Belief System Types
// ============================================================================

export interface Credence {
  [outcome: string]: number; // Probability distribution over outcomes, must sum to 1.0
}

export interface Justification {
  facts: string[];              // Observed evidence
  rules: string[];              // Applicable principles/rules
  moral_principles: string[];   // Ethical frameworks invoked
  context: string;              // Domain context
  chain?: string[];             // Full justification chain for traceability
}

export interface Belief {
  proposition: string;          // Action/hypothesis identifier
  pi: Credence;                 // π: Credence (probability distribution)
  kappa: number;                // κ: Confidence [0,1] in evidence strength
  J: Justification;             // J: Justification structure
  timestamp: number;            // When belief was formed/updated
  source?: 'initial' | 'revised' | 'external'; // Belief provenance
}

export interface BeliefDelta {
  proposition: string;
  pi_before: Credence;
  pi_after: Credence;
  kappa_before: number;
  kappa_after: number;
  moral_weight: number;         // JWMC calculated weight
  stability_factor: number;     // How much belief changed
}

// ============================================================================
// Constraint System Types
// ============================================================================

export interface Constraint {
  id: string;                   // Unique constraint identifier
  title: string;                // Human-readable name
  principle: string;            // Moral principle (e.g., "preserve_life")
  priority: number;             // Priority level (1 = highest)
  threshold: number;            // Violation threshold [0,1]
  weight: number;               // Constraint weight in penalty calculation
  propagation?: number;         // Cascade propagation factor
  description?: string;         // Explanation for humans
}

export interface ConstraintViolation {
  constraint_id: string;
  violation_amount: number;     // How much threshold was exceeded [0,1]
  penalty: number;              // Calculated penalty contribution
  explanation: string;          // Why this was violated
}

// ============================================================================
// Action & Decision Types
// ============================================================================

export interface Action {
  id: string;
  label: string;
  description?: string;
  initial_belief?: Belief;      // Pre-configured belief for this action
}

export interface EUBreakdown {
  action_id: string;
  eu_base: number;              // Base expected utility
  constraints: ConstraintViolation[];
  eeu_total: number;            // Final EEU after penalties
  justification_chain: string[]; // Why this action was selected/rejected
}

export interface DecisionResult {
  timestamp: number;
  selected_action: string;
  all_breakdowns: EUBreakdown[];
  beliefs_used: Belief[];
  context: ActionContext;
}

export interface ActionContext {
  scenario: string;
  moral_stakes?: number;
  time_pressure?: string;
  stakes?: string;
  [key: string]: any;           // Extensible for domain-specific context
}

// ============================================================================
// Gauge System Types
// ============================================================================

export interface GaugeScores {
  calibration: number;          // Confidence vs accuracy alignment [0,1]
  normative_alignment: number;  // Moral principle consistency [0,1]
  coherence: number;            // Internal belief consistency [0,1]
  reasoning: number;            // Justification quality & depth [0,1]
  overall_vast_score: number;   // Weighted aggregate [0,1]
  timestamp: number;
}

export interface GaugeThresholds {
  excellent: number;            // ≥ this is excellent (default 0.75)
  good: number;                 // ≥ this is good (default 0.60)
  fair: number;                 // ≥ this is fair (default 0.40)
  // < fair is "needs improvement"
}

export interface GaugeAlert {
  gauge: 'calibration' | 'normative_alignment' | 'coherence' | 'reasoning' | 'overall';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  explanation: string;          // Plain English explanation
  score: number;
  threshold: number;
  timestamp: number;
  recommendation?: string;      // Suggested action
}

export interface GaugeTrend {
  gauge: string;
  direction: 'improving' | 'declining' | 'stable';
  magnitude: number;            // Rate of change
  window_size: number;          // Number of samples in trend
}

// ============================================================================
// Log & Audit Types
// ============================================================================

export interface LogEntry {
  tick: number;
  timestamp: number;
  
  // Perception phase
  perception?: {
    event: string;
    evidence?: any;
    source?: string;
  };
  
  // Belief revision phase (JWMC)
  beliefs_before: Belief[];
  beliefs_after: Belief[];
  jwmc_metrics?: {
    alpha: number;
    beta: number;
    gamma: number;
    deltas: BeliefDelta[];
  };
  
  // Decision phase (EEUCC)
  candidate_actions: string[];
  eeucc_breakdown: EUBreakdown[];
  chosen_action: string;
  justification_chain: string[];
  
  // Monitoring phase
  gauge_scores: GaugeScores;
  alerts: GaugeAlert[];
  
  // Metadata
  scenario_id: string;
  seed?: number;                // For reproducibility
}

export interface AuditTrail {
  scenario_id: string;
  start_time: number;
  end_time?: number;
  total_ticks: number;
  logs: LogEntry[];
  summary?: {
    total_decisions: number;
    action_distribution: { [action: string]: number };
    average_gauges: GaugeScores;
    alerts_by_severity: { [severity: string]: number };
  };
}

// ============================================================================
// Scenario Definition Types
// ============================================================================

export interface ThesisReference {
  section: string;              // e.g., "4.2.1"
  page?: number;                // Page number in thesis
  title?: string;               // Section title
}

export interface Evidence {
  tick: number;                 // When evidence arrives
  type: 'observation' | 'report' | 'update';
  content: {
    proposition?: string;
    pi?: Credence;
    kappa?: number;
    J?: Partial<Justification>;
  };
}

export interface GroundTruth {
  action: string;
  actual_outcome: string;
  utility: number;
}

export interface ScenarioDefinition {
  id: string;
  title: string;
  thesis_ref: ThesisReference;
  summary: string;
  domain: string;               // e.g., "healthcare", "autonomous_vehicles"
  tags: string[];               // For filtering/search
  
  // Initial state
  initial_beliefs: Belief[];
  constraints: Constraint[];
  actions: Action[];
  context: ActionContext;
  
  // Dynamic elements (optional)
  evidence_stream?: Evidence[]; // Time-series evidence for replay
  ground_truth?: GroundTruth[]; // For evaluation
  
  // Reproducibility
  seeds?: {
    rng: number;
    [key: string]: number;
  };
  
  // Metadata
  created_at?: number;
  expected_duration_ticks?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

// ============================================================================
// JWMC Parameters
// ============================================================================

export interface JWMCParams {
  alpha: number;                // Credence blending weight [0,1]
  beta: number;                 // Confidence decay factor [0,1]
  gamma: number;                // Justification similarity bonus [0,1]
  moral_core_bonus?: number;    // Extra stability for core moral beliefs
}

// ============================================================================
// EEUCC Parameters
// ============================================================================

export interface EEUCCParams {
  lambda: number;               // Cascade decay factor (λ^(p-1))
  base_utility_fn?: (action: string, context: ActionContext) => number;
}

// ============================================================================
// Main Loop State
// ============================================================================

export interface LoopState {
  tick: number;
  beliefs: Map<string, Belief>;
  constraints: Constraint[];
  actions: Action[];
  context: ActionContext;
  last_decision?: DecisionResult;
  gauge_history: GaugeScores[];
  alert_history: GaugeAlert[];
}

// ============================================================================
// Config & Settings
// ============================================================================

export interface VASTConfig {
  jwmc: JWMCParams;
  eeucc: EEUCCParams;
  gauges: {
    thresholds: GaugeThresholds;
    window_size: number;        // For trend detection
    alert_cooldown_ms: number;  // Prevent alert spam
  };
  loop: {
    max_ticks?: number;
    tick_delay_ms?: number;
  };
  logging: {
    enabled: boolean;
    verbose: boolean;
    golden_logs_path?: string;
  };
}

// ============================================================================
// Utility Types
// ============================================================================

export type GaugeName = 'calibration' | 'normative_alignment' | 'coherence' | 'reasoning' | 'overall';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type BeliefSource = 'initial' | 'revised' | 'external';

// ============================================================================
// Export Formats
// ============================================================================

export interface ExportOptions {
  format: 'json' | 'csv' | 'pdf';
  filters?: {
    start_time?: number;
    end_time?: number;
    actions?: string[];
    constraint_ids?: string[];
    priorities?: number[];
    gauge_drops?: boolean;      // Only include ticks where gauges dropped
  };
}
