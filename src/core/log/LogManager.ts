/**
 * LogManager - Append-only, indexed, exportable audit trail
 * Maintains complete decision history with filtering and export capabilities
 */

import {
  LogEntry,
  AuditTrail,
  GaugeScores,
  ExportOptions,
} from '../types';
import { anchoringHub } from '../blockchain/anchoringHub';
import { toDecisionRecord, signDecisionRecord } from '../blockchain/decisionRecord';
import { getOrCreateAgentKeypair } from '../blockchain/crypto';
import { getBlockchainConfig } from '../blockchain/config';
import { mockLedger, initializeMockLedger } from '../blockchain/ledger.mock';

export class LogManager {
  private logs: LogEntry[];
  private scenarioId: string;
  private startTime: number;
  private tickCounter: number;

  constructor(scenarioId: string) {
    this.logs = [];
    this.scenarioId = scenarioId;
    this.startTime = Date.now();
    this.tickCounter = 0;
    
    // Initialize blockchain components
    this.initializeBlockchain();
  }
  
  /**
   * Initialize blockchain anchoring hub and mock ledger
   */
  private async initializeBlockchain(): Promise<void> {
    try {
      // Ensure agent keypair exists
      await getOrCreateAgentKeypair();
      
      // Initialize mock ledger with default rules
      await initializeMockLedger();
      
      // Start the anchoring hub
      anchoringHub.start();
      
      // Load any stored state
      anchoringHub.loadFromStorage();
      
      console.log('[LogManager] Blockchain integration initialized');
    } catch (error) {
      console.warn('[LogManager] Failed to initialize blockchain:', error);
    }
  }

  /**
   * Append a new log entry (immutable, append-only)
   * Also creates blockchain decision record and submits to anchoring hub
   */
  async append(
    entry: Omit<LogEntry, 'tick' | 'timestamp' | 'scenario_id'>
  ): Promise<LogEntry> {
    const fullEntry: LogEntry = {
      ...entry,
      tick: this.tickCounter++,
      timestamp: Date.now(),
      scenario_id: this.scenarioId,
    };

    // Create blockchain decision record
    try {
      const config = getBlockchainConfig();
      const agentKeypair = await getOrCreateAgentKeypair();
      const rid = config.defaultRuleSetId;
      
      // Compute model hash (framework version)
      const modelHash = await import('../blockchain/decisionRecord').then(m => 
        m.computeModelHash('vast-framework-v1.0.0', {})
      );
      
      // Convert to decision record
      const dtUnsigned = await toDecisionRecord(
        fullEntry,
        rid,
        modelHash,
        undefined, // salts
        JSON.stringify(agentKeypair.publicKey)
      );
      
      // Sign the decision record
      const dt = await signDecisionRecord(dtUnsigned, agentKeypair.privateKey);
      
      // Submit to anchoring hub
      const { index, leafHash } = await anchoringHub.appendDecision(dt);
      
      // Store initial blockchain metadata (will be updated when batch closes)
      fullEntry.blockchain = {
        rid,
        decision_id: dt.id,
        dt,
        leaf_hash: leafHash,
        sth: {
          root: '',
          size: 0,
          t: 0,
          hub_pubkey: '',
          hub_signature: '',
        },
        inclusion_proof: {
          siblings: [],
          directions: [],
          index,
        },
      };
      
      // Schedule update when batch closes (async, non-blocking)
      this.scheduleBlockchainUpdate(fullEntry, dt.id);
      
    } catch (error) {
      console.warn('[LogManager] Failed to create blockchain record:', error);
      // Continue without blockchain metadata - decision is still valid
    }

    this.logs.push(fullEntry);
    return fullEntry;
  }
  
  /**
   * Schedule update of blockchain metadata when batch closes
   */
  private scheduleBlockchainUpdate(entry: LogEntry, decisionId: string): void {
    const config = getBlockchainConfig();
    const maxWaitTime = (config.batchIntervalSeconds + 5) * 1000; // Batch interval + buffer
    const checkInterval = 1000; // Check every second
    let elapsed = 0;
    
    const checkAndUpdate = () => {
      const anchored = anchoringHub.getAnchoredDecision(decisionId);
      
      if (anchored) {
        // Batch closed, update entry with full proof and STH
        entry.blockchain = {
          ...entry.blockchain!,
          dt: anchored.dt,
          leaf_hash: anchored.leafHash,
          sth: {
            root: anchored.sthRef,
            size: 0, // Will be populated from batch
            t: 0,
            hub_pubkey: '',
            hub_signature: '',
          },
          inclusion_proof: anchored.inclusionProof,
        };
        
        // Get full STH from batch
        const batchSTH = anchoringHub.getSTH(anchored.sthRef);
        if (batchSTH) {
          entry.blockchain.sth = {
            root: batchSTH.root,
            size: batchSTH.size,
            t: batchSTH.t,
            hub_pubkey: batchSTH.hub_pubkey,
            hub_signature: batchSTH.hub_signature,
          };
        }
        
        console.log(`[LogManager] Blockchain metadata updated for decision ${decisionId.substring(0, 8)}...`);
      } else if (elapsed < maxWaitTime) {
        // Batch not closed yet, check again
        elapsed += checkInterval;
        setTimeout(checkAndUpdate, checkInterval);
      } else {
        console.warn(`[LogManager] Timeout waiting for batch close for decision ${decisionId.substring(0, 8)}...`);
      }
    };
    
    // Start checking
    setTimeout(checkAndUpdate, checkInterval);
  }

  /**
   * Get all logs (read-only copy)
   */
  getAllLogs(): LogEntry[] {
    return this.logs.map(log => ({ ...log }));
  }

  /**
   * Get logs with filters
   */
  filterLogs(options: ExportOptions['filters'] = {}): LogEntry[] {
    return this.logs.filter(log => {
      // Time range filter
      if (options.start_time && log.timestamp < options.start_time) {
        return false;
      }
      if (options.end_time && log.timestamp > options.end_time) {
        return false;
      }

      // Action filter
      if (options.actions && options.actions.length > 0) {
        if (!options.actions.includes(log.chosen_action)) {
          return false;
        }
      }

      // Constraint ID filter
      if (options.constraint_ids && options.constraint_ids.length > 0) {
        const hasConstraint = log.eeucc_breakdown.some(breakdown =>
          breakdown.constraints.some(v =>
            options.constraint_ids!.includes(v.constraint_id)
          )
        );
        if (!hasConstraint) {
          return false;
        }
      }

      // Priority filter
      if (options.priorities && options.priorities.length > 0) {
        // This requires constraint metadata, skipping for now
        // Can be enhanced when constraints are attached to log
      }

      // Gauge drops filter
      if (options.gauge_drops) {
        const prevLog = this.logs[log.tick - 1];
        if (prevLog) {
          const dropped = this.hasGaugeDrop(prevLog.gauge_scores, log.gauge_scores);
          if (!dropped) {
            return false;
          }
        }
      }

      return true;
    });
  }

  /**
   * Export audit trail in specified format
   */
  export(options: ExportOptions): string | Blob {
    const filteredLogs = this.filterLogs(options.filters);
    const auditTrail = this.buildAuditTrail(filteredLogs);

    switch (options.format) {
      case 'json':
        return this.exportJSON(auditTrail);
      case 'csv':
        return this.exportCSV(filteredLogs);
      case 'pdf':
        // PDF export would require a library like jsPDF
        // For now, return JSON and let UI handle PDF rendering
        return this.exportJSON(auditTrail);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Build complete audit trail with summary
   */
  private buildAuditTrail(logs: LogEntry[]): AuditTrail {
    const actionDistribution: { [action: string]: number } = {};
    const alertsBySeverity: { [severity: string]: number } = {};
    let totalCalibration = 0;
    let totalNormative = 0;
    let totalCoherence = 0;
    let totalReasoning = 0;
    let totalOverall = 0;

    for (const log of logs) {
      // Count actions
      actionDistribution[log.chosen_action] =
        (actionDistribution[log.chosen_action] || 0) + 1;

      // Count alerts
      for (const alert of log.alerts || []) {
        alertsBySeverity[alert.severity] =
          (alertsBySeverity[alert.severity] || 0) + 1;
      }

      // Accumulate gauge scores
      totalCalibration += log.gauge_scores.calibration;
      totalNormative += log.gauge_scores.normative_alignment;
      totalCoherence += log.gauge_scores.coherence;
      totalReasoning += log.gauge_scores.reasoning;
      totalOverall += log.gauge_scores.overall_vast_score;
    }

    const count = logs.length || 1;

    return {
      scenario_id: this.scenarioId,
      start_time: this.startTime,
      end_time: Date.now(),
      total_ticks: this.tickCounter,
      logs,
      summary: {
        total_decisions: logs.length,
        action_distribution: actionDistribution,
        average_gauges: {
          calibration: totalCalibration / count,
          normative_alignment: totalNormative / count,
          coherence: totalCoherence / count,
          reasoning: totalReasoning / count,
          overall_vast_score: totalOverall / count,
          timestamp: Date.now(),
        },
        alerts_by_severity: alertsBySeverity,
      },
    };
  }

  /**
   * Export as JSON
   */
  private exportJSON(auditTrail: AuditTrail): string {
    return JSON.stringify(auditTrail, null, 2);
  }

  /**
   * Export as CSV
   */
  private exportCSV(logs: LogEntry[]): string {
    const headers = [
      'Tick',
      'Timestamp',
      'Chosen Action',
      'Base EU',
      'Total Penalty',
      'Final EEU',
      'Calibration',
      'Normative',
      'Coherence',
      'Reasoning',
      'Overall VAST',
      'Alerts',
      'Violations',
    ];

    const rows = logs.map(log => {
      const chosen = log.eeucc_breakdown.find(
        b => b.action_id === log.chosen_action
      );

      const baseEU = chosen?.eu_base.toFixed(4) || '0';
      const totalPenalty = chosen?.constraints
        .reduce((sum, v) => sum + v.penalty, 0)
        .toFixed(4) || '0';
      const finalEEU = chosen?.eeu_total.toFixed(4) || '0';

      const alertCount = log.alerts?.length || 0;
      const violationCount = chosen?.constraints.length || 0;

      return [
        log.tick,
        new Date(log.timestamp).toISOString(),
        log.chosen_action,
        baseEU,
        totalPenalty,
        finalEEU,
        log.gauge_scores.calibration.toFixed(3),
        log.gauge_scores.normative_alignment.toFixed(3),
        log.gauge_scores.coherence.toFixed(3),
        log.gauge_scores.reasoning.toFixed(3),
        log.gauge_scores.overall_vast_score.toFixed(3),
        alertCount,
        violationCount,
      ];
    });

    // Build CSV string
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  }

  /**
   * Check if gauges dropped between two ticks
   */
  private hasGaugeDrop(prev: GaugeScores, current: GaugeScores): boolean {
    const threshold = 0.05; // 5% drop is significant

    return (
      current.calibration < prev.calibration - threshold ||
      current.normative_alignment < prev.normative_alignment - threshold ||
      current.coherence < prev.coherence - threshold ||
      current.reasoning < prev.reasoning - threshold ||
      current.overall_vast_score < prev.overall_vast_score - threshold
    );
  }

  /**
   * Get log by tick number
   */
  getLogByTick(tick: number): LogEntry | undefined {
    return this.logs.find(log => log.tick === tick);
  }

  /**
   * Get latest log
   */
  getLatestLog(): LogEntry | undefined {
    return this.logs.length > 0 ? this.logs[this.logs.length - 1] : undefined;
  }

  /**
   * Get logs in time range
   */
  getLogsByTimeRange(startTime: number, endTime: number): LogEntry[] {
    return this.logs.filter(
      log => log.timestamp >= startTime && log.timestamp <= endTime
    );
  }

  /**
   * Search logs by action
   */
  getLogsByAction(action: string): LogEntry[] {
    return this.logs.filter(log => log.chosen_action === action);
  }

  /**
   * Get statistics
   */
  getStats(): {
    total_logs: number;
    time_span_ms: number;
    unique_actions: Set<string>;
    total_alerts: number;
    avg_eeu: number;
  } {
    const uniqueActions = new Set(this.logs.map(log => log.chosen_action));
    const totalAlerts = this.logs.reduce(
      (sum, log) => sum + (log.alerts?.length || 0),
      0
    );

    let totalEEU = 0;
    for (const log of this.logs) {
      const chosen = log.eeucc_breakdown.find(
        b => b.action_id === log.chosen_action
      );
      if (chosen) {
        totalEEU += chosen.eeu_total;
      }
    }

    return {
      total_logs: this.logs.length,
      time_span_ms: this.logs.length > 0
        ? this.logs[this.logs.length - 1].timestamp - this.startTime
        : 0,
      unique_actions: uniqueActions,
      total_alerts: totalAlerts,
      avg_eeu: this.logs.length > 0 ? totalEEU / this.logs.length : 0,
    };
  }

  /**
   * Clear all logs (use with caution - breaks immutability contract)
   */
  clear(): void {
    this.logs = [];
    this.tickCounter = 0;
    this.startTime = Date.now();
  }

  /**
   * Get log count
   */
  size(): number {
    return this.logs.length;
  }

  /**
   * Save golden logs to file system (for testing/CI)
   * Returns JSON string that can be written to __golden__/logs/<scenarioId>.json
   */
  exportGoldenLog(): string {
    const auditTrail = this.buildAuditTrail(this.logs);
    
    // Add metadata for golden log validation
    const goldenLog = {
      ...auditTrail,
      golden_metadata: {
        created_at: new Date().toISOString(),
        version: '1.0.0',
        total_ticks: this.tickCounter,
        integrity_hash: this.calculateIntegrityHash(),
      },
    };

    return JSON.stringify(goldenLog, null, 2);
  }

  /**
   * Calculate simple integrity hash for golden log validation
   */
  private calculateIntegrityHash(): string {
    // Simple hash based on key log properties
    const keyData = this.logs.map(log => ({
      tick: log.tick,
      action: log.chosen_action,
      eeu: log.eeucc_breakdown.find(b => b.action_id === log.chosen_action)?.eeu_total,
    }));

    const hashInput = JSON.stringify(keyData);
    
    // Simple hash function (for demo - use crypto.subtle in production)
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash).toString(16);
  }

  /**
   * Load and validate against golden log
   */
  static validateAgainstGolden(
    actualLog: LogManager,
    goldenLogJSON: string
  ): { valid: boolean; differences: string[] } {
    const differences: string[] = [];
    
    try {
      const goldenData = JSON.parse(goldenLogJSON);
      const actualData = JSON.parse(actualLog.exportGoldenLog());

      // Compare total ticks
      if (goldenData.total_ticks !== actualData.total_ticks) {
        differences.push(
          `Tick count mismatch: expected ${goldenData.total_ticks}, got ${actualData.total_ticks}`
        );
      }

      // Compare actions
      const goldenActions = goldenData.logs.map((l: any) => l.chosen_action);
      const actualActions = actualData.logs.map((l: any) => l.chosen_action);

      for (let i = 0; i < Math.min(goldenActions.length, actualActions.length); i++) {
        if (goldenActions[i] !== actualActions[i]) {
          differences.push(
            `Action mismatch at tick ${i}: expected ${goldenActions[i]}, got ${actualActions[i]}`
          );
        }
      }

      // Compare EEU values (with tolerance for floating point)
      for (let i = 0; i < Math.min(goldenData.logs.length, actualData.logs.length); i++) {
        const goldenLog = goldenData.logs[i];
        const actualLog = actualData.logs[i];

        const goldenBreakdown = goldenLog.eeucc_breakdown.find(
          (b: any) => b.action_id === goldenLog.chosen_action
        );
        const actualBreakdown = actualLog.eeucc_breakdown.find(
          (b: any) => b.action_id === actualLog.chosen_action
        );

        if (goldenBreakdown && actualBreakdown) {
          const eeuDiff = Math.abs(goldenBreakdown.eeu_total - actualBreakdown.eeu_total);
          if (eeuDiff > 0.001) {
            differences.push(
              `EEU mismatch at tick ${i}: expected ${goldenBreakdown.eeu_total}, got ${actualBreakdown.eeu_total}`
            );
          }
        }
      }
    } catch (error) {
      differences.push(`Failed to parse golden log: ${error}`);
    }

    return {
      valid: differences.length === 0,
      differences,
    };
  }
}
