/**
 * VAST Framework Configuration
 * Maps directly to thesis parameters
 * 
 * TODO: Update these values with actual thesis numbers when available
 */

import { VASTConfig } from './types';

/**
 * Default configuration based on thesis specifications
 * 
 * JWMC Parameters (Section X.X of thesis):
 * - α (alpha): Credence blending weight [0,1]
 * - β (beta): Confidence decay factor [0,1]
 * - γ (gamma): Justification similarity bonus [0,1]
 * 
 * EEUCC Parameters (Section Y.Y of thesis):
 * - λ (lambda): Cascade decay factor (0,1)
 *   - Priority 1: λ^0 = 1.0 (full penalty)
 *   - Priority 2: λ^1 = λ (reduced)
 *   - Priority 3: λ^2 = λ² (further reduced)
 * 
 * Gauge Thresholds (Section Z.Z of thesis):
 * - Excellent: ≥ 0.75
 * - Good: ≥ 0.60
 * - Fair: ≥ 0.40
 * - Needs Improvement: < 0.40
 */
export const DEFAULT_CONFIG: VASTConfig = {
  // ========================================
  // JWMC Parameters
  // ========================================
  jwmc: {
    alpha: 0.7,           // TODO: Set from thesis Section X.X
    beta: 0.8,            // TODO: Set from thesis Section X.X
    gamma: 0.5,           // TODO: Set from thesis Section X.X
    moral_core_bonus: 0.1, // Bonus for core moral principles
  },

  // ========================================
  // EEUCC Parameters
  // ========================================
  eeucc: {
    lambda: 0.6,          // TODO: Set from thesis Section Y.Y
    // base_utility_fn can be customized per scenario
  },

  // ========================================
  // Gauge System
  // ========================================
  gauges: {
    thresholds: {
      excellent: 0.75,    // ≥ 75% is excellent
      good: 0.60,         // ≥ 60% is good
      fair: 0.40,         // ≥ 40% is fair
    },
    window_size: 10,      // Number of ticks for trend detection
    alert_cooldown_ms: 5000, // 5 seconds between repeated alerts
  },

  // ========================================
  // Main Loop
  // ========================================
  loop: {
    max_ticks: 100,       // Maximum ticks before auto-stop
    tick_delay_ms: 0,     // Delay between ticks (0 = as fast as possible)
  },

  // ========================================
  // Logging & Auditing
  // ========================================
  logging: {
    enabled: true,
    verbose: false,       // Set to true for detailed console output
    golden_logs_path: '__golden__/logs',
  },
};

/**
 * Core moral principles (from thesis Section W.W)
 * These get special treatment in JWMC (moral_core_bonus)
 */
export const CORE_MORAL_PRINCIPLES = [
  'preserve_life',
  'respect_dignity',
  'fairness',
  'non_maleficence',
];

/**
 * Gauge weight configuration (for overall VAST score)
 * TODO: Verify these match thesis Section Z.Z
 */
export const GAUGE_WEIGHTS = {
  calibration: 0.25,
  normative_alignment: 0.35,  // Highest weight - moral alignment is key
  coherence: 0.20,
  reasoning: 0.20,
};

/**
 * Create a custom configuration by merging with defaults
 */
export function createConfig(overrides: Partial<VASTConfig>): VASTConfig {
  return {
    jwmc: { ...DEFAULT_CONFIG.jwmc, ...overrides.jwmc },
    eeucc: { ...DEFAULT_CONFIG.eeucc, ...overrides.eeucc },
    gauges: {
      thresholds: {
        ...DEFAULT_CONFIG.gauges.thresholds,
        ...overrides.gauges?.thresholds,
      },
      window_size: overrides.gauges?.window_size || DEFAULT_CONFIG.gauges.window_size,
      alert_cooldown_ms:
        overrides.gauges?.alert_cooldown_ms || DEFAULT_CONFIG.gauges.alert_cooldown_ms,
    },
    loop: { ...DEFAULT_CONFIG.loop, ...overrides.loop },
    logging: { ...DEFAULT_CONFIG.logging, ...overrides.logging },
  };
}

/**
 * Validation helper to ensure config parameters are in valid ranges
 */
export function validateConfig(config: VASTConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate JWMC params
  if (config.jwmc.alpha < 0 || config.jwmc.alpha > 1) {
    errors.push(`JWMC α must be in [0,1], got ${config.jwmc.alpha}`);
  }
  if (config.jwmc.beta < 0 || config.jwmc.beta > 1) {
    errors.push(`JWMC β must be in [0,1], got ${config.jwmc.beta}`);
  }
  if (config.jwmc.gamma < 0 || config.jwmc.gamma > 1) {
    errors.push(`JWMC γ must be in [0,1], got ${config.jwmc.gamma}`);
  }

  // Validate EEUCC params
  if (config.eeucc.lambda <= 0 || config.eeucc.lambda >= 1) {
    errors.push(`EEUCC λ must be in (0,1), got ${config.eeucc.lambda}`);
  }

  // Validate gauge thresholds
  const t = config.gauges.thresholds;
  if (t.excellent <= t.good || t.good <= t.fair) {
    errors.push('Gauge thresholds must be: excellent > good > fair');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
