/**
 * VAST-Blockchain Mock Ledger
 * 
 * In-memory implementation of the blockchain ledger for testing/demo.
 * Supports rule governance and STH anchoring.
 */

import { SignedTreeHead, verifyTreeHead } from './merkle';
import { canonicalJson, sha256 } from './crypto';

// ============================================================================
// Rule Registry Types
// ============================================================================

export type RuleState = 'Draft' | 'Active' | 'Deprecated';

export interface RuleFlags {
  /** If true, rule cannot be modified without governance */
  locked: boolean;
  /** If true, rule can still be updated via governance */
  mutable: boolean;
}

export interface GovernanceRecord {
  /** Unique proposal ID */
  proposalId: string;
  
  /** Who proposed the update */
  proposer: string;
  
  /** Addresses that have approved */
  approvals: string[];
  
  /** Required approvals to finalize */
  approvalThreshold: number;
  
  /** When the proposal can be finalized (epoch ms, 0 = no timelock) */
  timelockUntil: number;
  
  /** Current state */
  state: 'Pending' | 'Approved' | 'Finalized' | 'Rejected';
  
  /** Hash of the proposed rule */
  newRuleHash: string;
  
  /** When the proposal was created */
  createdAt: number;
}

export interface RuleVersion {
  /** Rule hash */
  hash: string;
  
  /** When this version became active */
  activatedAt: number;
  
  /** Governance record that authorized this version (if applicable) */
  governanceRecord?: string;
  
  /** State of this version */
  state: RuleState;
}

export interface RuleEntry {
  /** Rule ID */
  rid: string;
  
  /** Current active version */
  currentVersion: RuleVersion;
  
  /** Version history (oldest first) */
  history: RuleVersion[];
  
  /** Governance flags */
  flags: RuleFlags;
  
  /** Pending proposals */
  proposals: Map<string, GovernanceRecord>;
  
  /** Default approval threshold */
  defaultThreshold: number;
}

// ============================================================================
// Rule Registry
// ============================================================================

export class RuleRegistry {
  private rules: Map<string, RuleEntry> = new Map();

  /**
   * Register a new rule set.
   */
  async registerRule(
    rid: string,
    ruleHash: string,
    flags: RuleFlags,
    proposer = 'system'
  ): Promise<RuleEntry> {
    if (this.rules.has(rid)) {
      throw new Error(`Rule ${rid} already exists`);
    }

    const now = Date.now();
    const version: RuleVersion = {
      hash: ruleHash,
      activatedAt: now,
      state: 'Active',
    };

    const entry: RuleEntry = {
      rid,
      currentVersion: version,
      history: [version],
      flags,
      proposals: new Map(),
      defaultThreshold: 2, // Default: need 2 approvals
    };

    this.rules.set(rid, entry);
    
    console.log(`[RuleRegistry] Registered rule ${rid} with hash ${ruleHash.substring(0, 16)}...`);
    
    return entry;
  }

  /**
   * Get the active rule hash for a given RID.
   */
  getRuleHash(rid: string): string | undefined {
    const entry = this.rules.get(rid);
    return entry?.currentVersion.hash;
  }

  /**
   * Get full rule entry.
   */
  getRule(rid: string): RuleEntry | undefined {
    return this.rules.get(rid);
  }

  /**
   * Get all registered rules.
   */
  getAllRules(): RuleEntry[] {
    return Array.from(this.rules.values());
  }

  /**
   * Propose an update to a rule.
   */
  async proposeUpdate(
    rid: string,
    newHash: string,
    proposer: string
  ): Promise<GovernanceRecord> {
    const entry = this.rules.get(rid);
    if (!entry) {
      throw new Error(`Rule ${rid} not found`);
    }

    // Check if rule is locked
    if (entry.flags.locked && !entry.flags.mutable) {
      throw new Error(`Rule ${rid} is locked and cannot be updated`);
    }

    // Check if same hash
    if (entry.currentVersion.hash === newHash) {
      throw new Error(`New hash is identical to current hash`);
    }

    const proposalId = await this.generateProposalId(rid, newHash, proposer);
    
    const proposal: GovernanceRecord = {
      proposalId,
      proposer,
      approvals: [proposer], // Proposer auto-approves
      approvalThreshold: entry.defaultThreshold,
      timelockUntil: 0, // No timelock by default
      state: 'Pending',
      newRuleHash: newHash,
      createdAt: Date.now(),
    };

    entry.proposals.set(proposalId, proposal);

    console.log(`[RuleRegistry] Proposed update for ${rid}: ${proposalId}`);

    return proposal;
  }

  /**
   * Approve a pending proposal.
   */
  approveUpdate(rid: string, proposalId: string, approver: string): GovernanceRecord {
    const entry = this.rules.get(rid);
    if (!entry) {
      throw new Error(`Rule ${rid} not found`);
    }

    const proposal = entry.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    if (proposal.state !== 'Pending') {
      throw new Error(`Proposal is not in Pending state: ${proposal.state}`);
    }

    if (proposal.approvals.includes(approver)) {
      throw new Error(`${approver} has already approved`);
    }

    proposal.approvals.push(approver);

    // Auto-approve if threshold reached
    if (proposal.approvals.length >= proposal.approvalThreshold) {
      proposal.state = 'Approved';
      console.log(`[RuleRegistry] Proposal ${proposalId} approved by ${approver} (threshold reached)`);
    } else {
      console.log(`[RuleRegistry] Proposal ${proposalId} approved by ${approver} (${proposal.approvals.length}/${proposal.approvalThreshold})`);
    }

    return proposal;
  }

  /**
   * Finalize an approved proposal.
   */
  async finalizeUpdate(rid: string, proposalId: string): Promise<RuleVersion> {
    const entry = this.rules.get(rid);
    if (!entry) {
      throw new Error(`Rule ${rid} not found`);
    }

    const proposal = entry.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    if (proposal.state !== 'Approved') {
      throw new Error(`Proposal must be in Approved state, got: ${proposal.state}`);
    }

    // Check timelock
    if (proposal.timelockUntil > 0 && Date.now() < proposal.timelockUntil) {
      throw new Error(`Timelock not expired. Wait until ${new Date(proposal.timelockUntil).toISOString()}`);
    }

    // Create new version
    const now = Date.now();
    const newVersion: RuleVersion = {
      hash: proposal.newRuleHash,
      activatedAt: now,
      governanceRecord: proposalId,
      state: 'Active',
    };

    // Deprecate old version
    entry.currentVersion.state = 'Deprecated';

    // Update entry
    entry.currentVersion = newVersion;
    entry.history.push(newVersion);
    proposal.state = 'Finalized';

    console.log(`[RuleRegistry] Finalized ${rid} -> ${newVersion.hash.substring(0, 16)}...`);

    return newVersion;
  }

  /**
   * Get pending proposals for a rule.
   */
  getPendingProposals(rid: string): GovernanceRecord[] {
    const entry = this.rules.get(rid);
    if (!entry) return [];
    
    return Array.from(entry.proposals.values()).filter(
      p => p.state === 'Pending' || p.state === 'Approved'
    );
  }

  /**
   * Get all proposals for a rule.
   */
  getAllProposals(rid: string): GovernanceRecord[] {
    const entry = this.rules.get(rid);
    if (!entry) return [];
    
    return Array.from(entry.proposals.values());
  }

  private async generateProposalId(rid: string, newHash: string, proposer: string): Promise<string> {
    const data = `${rid}:${newHash}:${proposer}:${Date.now()}`;
    const hash = await sha256(data);
    return `prop-${hash.substring(0, 16)}`;
  }
}

// ============================================================================
// Anchor Registry
// ============================================================================

export interface AnchorEntry {
  /** STH that was anchored */
  sth: SignedTreeHead;
  
  /** When it was anchored */
  anchoredAt: number;
  
  /** Transaction hash (if on-chain) */
  txHash?: string;
  
  /** Block number (if on-chain) */
  blockNumber?: number;
  
  /** Verification status */
  verified: boolean;
}

export class AnchorRegistry {
  private anchors: Map<string, AnchorEntry> = new Map();
  private anchorList: AnchorEntry[] = [];

  /**
   * Anchor an STH to the registry.
   */
  async anchorSTH(sth: SignedTreeHead, txHash?: string): Promise<AnchorEntry> {
    // Verify the STH signature first
    const valid = await verifyTreeHead(sth);
    if (!valid) {
      throw new Error('Invalid STH signature');
    }

    const entry: AnchorEntry = {
      sth,
      anchoredAt: Date.now(),
      txHash,
      verified: true,
    };

    this.anchors.set(sth.root, entry);
    this.anchorList.push(entry);

    console.log(`[AnchorRegistry] Anchored STH ${sth.root.substring(0, 16)}... ` +
      `(size=${sth.size}, tx=${txHash || 'n/a'})`);

    return entry;
  }

  /**
   * Check if an STH root is anchored.
   */
  isAnchored(root: string): boolean {
    return this.anchors.has(root);
  }

  /**
   * Get anchor entry by root.
   */
  getAnchor(root: string): AnchorEntry | undefined {
    return this.anchors.get(root);
  }

  /**
   * List all anchors.
   */
  listAnchors(): AnchorEntry[] {
    return [...this.anchorList];
  }

  /**
   * Get anchor count.
   */
  getAnchorCount(): number {
    return this.anchorList.length;
  }

  /**
   * Clear all anchors.
   */
  clear(): void {
    this.anchors.clear();
    this.anchorList = [];
  }
}

// ============================================================================
// Mock Ledger Singleton
// ============================================================================

export interface MockLedger {
  rules: RuleRegistry;
  anchors: AnchorRegistry;
}

// Create singleton instances
const ruleRegistry = new RuleRegistry();
const anchorRegistry = new AnchorRegistry();

export const mockLedger: MockLedger = {
  rules: ruleRegistry,
  anchors: anchorRegistry,
};

/**
 * Initialize the mock ledger with default rules.
 */
export async function initializeMockLedger(): Promise<void> {
  const config = await import('./config');
  const defaultRid = config.getBlockchainConfig().defaultRuleSetId;
  
  // Register default rule
  const defaultHash = await sha256(canonicalJson({
    name: 'vast-default-rules',
    version: 'v1',
    description: 'Default VAST governance rules',
    createdAt: Date.now(),
  }));
  
  try {
    await mockLedger.rules.registerRule(
      defaultRid,
      defaultHash,
      { locked: false, mutable: true },
      'system'
    );
    console.log('[MockLedger] Initialized with default rule:', defaultRid);
  } catch (e) {
    // Already initialized
    console.log('[MockLedger] Already initialized');
  }
}

/**
 * Reset the mock ledger (for testing).
 */
export function resetMockLedger(): void {
  mockLedger.rules.getAllRules().forEach(r => {
    // Note: This is a hack for testing - in production, rules are immutable
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockLedger.rules as any).rules.delete(r.rid);
  });
  mockLedger.anchors.clear();
  console.log('[MockLedger] Reset');
}
